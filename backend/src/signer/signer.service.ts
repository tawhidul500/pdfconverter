import { BadRequestException, ConflictException, GoneException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import type { Queue } from "bullmq";
import { DataSource, Repository } from "typeorm";
import { AuditService, type AuditContext } from "../common/audit.service";
import { createOpaqueToken, sha256 } from "../common/crypto";
import { AuditActorType, EmailDeliveryStatus, EmailKind, RecipientStatus, SignatureFieldType, SignatureRequestStatus, SigningMode } from "../common/enums";
import { EmailDeliveryEntity, RecipientEntity, SignatureRequestEntity } from "../database/entities";
import type { EmailJob } from "../email/email.types";
import { EMAIL_QUEUE, PDF_FINALIZATION_QUEUE } from "../queues/names";
import { StorageService } from "../storage/storage.service";
import { aggregateRequestStatus } from "../signature-requests/status-policy";
import { decodeImageDataUrl, parseSignerCompletion } from "./signer-input";

const CLOSED = new Set([SignatureRequestStatus.COMPLETED, SignatureRequestStatus.DECLINED, SignatureRequestStatus.EXPIRED, SignatureRequestStatus.CANCELLED]);

@Injectable()
export class SignerService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(RecipientEntity) private readonly recipients: Repository<RecipientEntity>,
    @InjectRepository(SignatureRequestEntity) private readonly requests: Repository<SignatureRequestEntity>,
    @InjectRepository(EmailDeliveryEntity) private readonly deliveries: Repository<EmailDeliveryEntity>,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<EmailJob>,
    @InjectQueue(PDF_FINALIZATION_QUEUE) private readonly pdfQueue: Queue,
  ) {}

  async review(rawToken: string, context: AuditContext) {
    const recipient = await this.findByToken(rawToken);
    const request = recipient.request;
    if (!recipient.viewedAt) {
      recipient.viewedAt = new Date();
      if ([RecipientStatus.SENT, RecipientStatus.DELIVERED].includes(recipient.status)) recipient.status = RecipientStatus.VIEWED;
      await this.recipients.save(recipient);
      request.status = aggregateRequestStatus(request.status, request.recipients.map((item) => item.id === recipient.id ? recipient.status : item.status));
      await this.requests.save(request);
      await this.audit.append({ requestId: request.id, recipientId: recipient.id, actorType: AuditActorType.RECIPIENT, actorId: recipient.id, eventType: "SIGNER_VIEWED", context });
    }
    return {
      request: { id: request.id, title: request.title, message: request.message, senderName: request.sender.displayName, expiresAt: request.expiresAt, status: request.status },
      recipient: { id: recipient.id, name: recipient.name, email: recipient.email, status: recipient.status },
      document: { originalName: request.document.originalName, url: await this.storage.createViewUrl(request.document.storageKey) },
      fields: request.fields.filter((field) => field.recipientId === recipient.id).map((field) => ({ id: field.id, pageNumber: field.pageNumber, type: field.type, x: field.x, y: field.y, width: field.width, height: field.height, rotation: field.rotation, required: field.required, label: field.label, defaultValue: field.defaultValue, style: field.style })),
    };
  }

  async complete(rawToken: string, rawInput: unknown, context: AuditContext) {
    const recipient = await this.findByToken(rawToken);
    const request = recipient.request;
    const assignedFields = request.fields.filter((field) => field.recipientId === recipient.id);
    const input = parseSignerCompletion(rawInput, assignedFields);
    const fieldMap = new Map(assignedFields.map((field) => [field.id, field]));
    const completionData: Record<string, unknown> = {};
    const storedKeys: string[] = [];
    try {
      for (const item of input.fields) {
        const field = fieldMap.get(item.fieldId);
        if (!field) continue;
        const record: Record<string, unknown> = {};
        if (item.value !== undefined) record.value = item.value;
        if (item.checked !== undefined) record.checked = item.checked;
        if (item.imageDataUrl) {
          if (![SignatureFieldType.SIGNATURE, SignatureFieldType.INITIALS, SignatureFieldType.STAMP].includes(field.type)) throw new BadRequestException("Only image fields accept imageDataUrl.");
          const image = decodeImageDataUrl(item.imageDataUrl);
          const extension = image.mimeType === "image/png" ? "png" : "jpg";
          const assetKey = `signature-requests/${request.id}/responses/${recipient.id}/${field.id}.${extension}`;
          await this.storage.putPrivateObject(assetKey, image.bytes, image.mimeType, { requestId: request.id, recipientId: recipient.id, fieldId: field.id });
          storedKeys.push(assetKey); record.assetKey = assetKey; record.mimeType = image.mimeType;
        }
        completionData[item.fieldId] = record;
      }
      for (const field of assignedFields) {
        const record = (completionData[field.id] as Record<string, unknown> | undefined) ?? {};
        if (field.type === SignatureFieldType.NAME && !record.value) record.value = recipient.name;
        if (field.type === SignatureFieldType.DATE && !record.value) record.value = new Date().toISOString().slice(0, 10);
        if ((field.type === SignatureFieldType.TEXT || field.type === SignatureFieldType.INPUT) && !record.value && field.defaultValue) record.value = field.defaultValue;
        completionData[field.id] = record;
      }

      const outcome = await this.dataSource.transaction(async (manager) => {
        let nextInvitation: { recipient: RecipientEntity; delivery: EmailDeliveryEntity; token: string } | null = null;
        const lockedRecipient = await manager.findOne(RecipientEntity, { where: { id: recipient.id }, lock: { mode: "pessimistic_write" } });
        if (!lockedRecipient || lockedRecipient.status === RecipientStatus.COMPLETED) throw new ConflictException("This recipient already completed the request.");
        lockedRecipient.completionData = completionData; lockedRecipient.completedAt = new Date(); lockedRecipient.status = RecipientStatus.COMPLETED; lockedRecipient.tokenHash = null; lockedRecipient.tokenExpiresAt = null;
        await manager.save(lockedRecipient);
        const allRecipients = await manager.find(RecipientEntity, { where: { requestId: request.id }, order: { orderIndex: "ASC" } });
        const completedCount = allRecipients.filter((item) => item.id === lockedRecipient.id || item.status === RecipientStatus.COMPLETED).length;
        if (request.signingMode === SigningMode.SEQUENTIAL && completedCount < allRecipients.length) {
          const next = allRecipients.find((item) => item.status === RecipientStatus.WAITING);
          if (next) {
            const token = createOpaqueToken(); next.status = RecipientStatus.SENT; next.sentAt = new Date(); next.tokenHash = sha256(token); next.tokenExpiresAt = this.signerTokenExpiry(request.expiresAt); await manager.save(next);
            const delivery = await manager.save(EmailDeliveryEntity, manager.create(EmailDeliveryEntity, { requestId: request.id, recipientId: next.id, kind: EmailKind.INVITATION, status: EmailDeliveryStatus.QUEUED, providerMessageId: null, lastError: null, sentAt: null, deliveredAt: null }));
            nextInvitation = { recipient: next, delivery, token };
          }
        }
        request.status = SignatureRequestStatus.PARTIALLY_SIGNED;
        await manager.save(request);
        return { nextInvitation, shouldFinalize: completedCount === allRecipients.length };
      });
      await this.audit.append({ requestId: request.id, recipientId: recipient.id, actorType: AuditActorType.RECIPIENT, actorId: recipient.id, eventType: "RECIPIENT_COMPLETED", metadata: { fieldCount: assignedFields.length }, context });
      if (outcome.nextInvitation) await this.enqueueInvitation(request, outcome.nextInvitation.recipient, outcome.nextInvitation.delivery, outcome.nextInvitation.token);
      if (outcome.shouldFinalize) await this.pdfQueue.add("finalize-request", { requestId: request.id }, { jobId: `finalize:${request.id}` });
      return { completed: true, requestStatus: SignatureRequestStatus.PARTIALLY_SIGNED, finalizationQueued: outcome.shouldFinalize };
    } catch (error) {
      await Promise.all(storedKeys.map((key) => this.storage.deletePrivateObject(key).catch(() => undefined)));
      throw error;
    }
  }

  async decline(rawToken: string, reason: string | undefined, context: AuditContext) {
    const recipient = await this.findByToken(rawToken);
    const request = recipient.request;
    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      recipient.status = RecipientStatus.DECLINED; recipient.declinedAt = now; recipient.declineReason = reason?.trim().slice(0, 1000) || null; recipient.tokenHash = null; recipient.tokenExpiresAt = null;
      await manager.save(recipient);
      request.status = SignatureRequestStatus.DECLINED; request.declinedAt = now; await manager.save(request);
      const others = request.recipients.filter((item) => item.id !== recipient.id && ![RecipientStatus.COMPLETED, RecipientStatus.DECLINED].includes(item.status));
      for (const other of others) { other.status = RecipientStatus.CANCELLED; other.tokenHash = null; other.tokenExpiresAt = null; await manager.save(other); }
    });
    await this.audit.append({ requestId: request.id, recipientId: recipient.id, actorType: AuditActorType.RECIPIENT, actorId: recipient.id, eventType: "RECIPIENT_DECLINED", metadata: { reason: recipient.declineReason }, context });
    const delivery = await this.deliveries.save(this.deliveries.create({ requestId: request.id, recipientId: recipient.id, kind: EmailKind.DECLINED, status: EmailDeliveryStatus.QUEUED, providerMessageId: null, lastError: null, sentAt: null, deliveredAt: null }));
    await this.emailQueue.add("send-email", { deliveryId: delivery.id, kind: EmailKind.DECLINED, to: { email: request.sender.email, name: request.sender.displayName }, senderName: recipient.name, requestTitle: request.title }, { jobId: `email:${delivery.id}` });
    return { declined: true };
  }

  private async findByToken(rawToken: string) {
    if (!rawToken || rawToken.length < 32 || rawToken.length > 200) throw new NotFoundException("Signer link not found.");
    const recipient = await this.recipients.findOne({ where: { tokenHash: sha256(rawToken) }, relations: { request: { sender: true, document: true, recipients: true, fields: true } } });
    if (!recipient) throw new NotFoundException("Signer link not found.");
    if (!recipient.tokenExpiresAt || recipient.tokenExpiresAt.getTime() <= Date.now() || recipient.request.expiresAt.getTime() <= Date.now()) throw new GoneException("This signer link has expired.");
    if (CLOSED.has(recipient.request.status)) throw new GoneException(`This request is ${recipient.request.status.toLowerCase()}.`);
    if (![RecipientStatus.SENT, RecipientStatus.DELIVERED, RecipientStatus.VIEWED].includes(recipient.status)) throw new ConflictException("This signer is not currently active.");
    return recipient;
  }

  private signerTokenExpiry(requestExpiry: Date): Date {
    const ttlMs = this.config.getOrThrow<number>("signerTokenTtlHours") * 60 * 60 * 1000;
    return new Date(Math.min(requestExpiry.getTime(), Date.now() + ttlMs));
  }

  private async enqueueInvitation(request: SignatureRequestEntity, recipient: RecipientEntity, delivery: EmailDeliveryEntity, token: string) {
    const signerUrl = `${this.config.getOrThrow<string>("signerPublicUrl").replace(/\/$/, "")}/${encodeURIComponent(token)}`;
    await this.emailQueue.add("send-email", { deliveryId: delivery.id, kind: EmailKind.INVITATION, to: { email: recipient.email, name: recipient.name }, senderName: request.sender.displayName, requestTitle: request.title, signerUrl, message: request.message }, { jobId: `email:${delivery.id}` });
  }
}
