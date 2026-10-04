import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { PDFDocument } from "pdf-lib";
import { randomUUID } from "node:crypto";
import type { Queue } from "bullmq";
import { DataSource, In, Repository } from "typeorm";
import { AuditActorType, EmailDeliveryStatus, EmailKind, RecipientStatus, SignatureRequestStatus, SigningMode } from "../common/enums";
import { createOpaqueToken, sha256 } from "../common/crypto";
import { AuditService, type AuditContext } from "../common/audit.service";
import { AuditEventEntity, DocumentEntity, EmailDeliveryEntity, RecipientEntity, SignatureFieldEntity, SignatureRequestEntity, UserEntity } from "../database/entities";
import { EMAIL_QUEUE, REQUEST_LIFECYCLE_QUEUE } from "../queues/names";
import type { EmailJob } from "../email/email.types";
import { StorageService } from "../storage/storage.service";
import { parseCreateRequestInput } from "./request-input";
import { serializeRequest } from "./request-response";

const TERMINAL = new Set([SignatureRequestStatus.COMPLETED, SignatureRequestStatus.DECLINED, SignatureRequestStatus.EXPIRED, SignatureRequestStatus.CANCELLED]);

@Injectable()
export class SignatureRequestsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SignatureRequestEntity) private readonly requests: Repository<SignatureRequestEntity>,
    @InjectRepository(RecipientEntity) private readonly recipients: Repository<RecipientEntity>,
    @InjectRepository(EmailDeliveryEntity) private readonly deliveries: Repository<EmailDeliveryEntity>,
    @InjectRepository(AuditEventEntity) private readonly events: Repository<AuditEventEntity>,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<EmailJob>,
    @InjectQueue(REQUEST_LIFECYCLE_QUEUE) private readonly lifecycleQueue: Queue,
  ) {}

  async create(sender: UserEntity, file: Express.Multer.File | undefined, rawMetadata: string | undefined, context: AuditContext) {
    if (!file) throw new BadRequestException("Upload one PDF in the file field.");
    if (!rawMetadata) throw new BadRequestException("Add the request metadata JSON.");
    const maxBytes = this.config.getOrThrow<number>("maxPdfBytes");
    if (file.size < 5 || file.size > maxBytes) throw new BadRequestException(`The PDF must be between 5 bytes and ${maxBytes} bytes.`);
    if (!(file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) || !file.buffer.subarray(0, 1024).toString("latin1").includes("%PDF-")) throw new BadRequestException("Choose a valid PDF file.");
    const input = parseCreateRequestInput(rawMetadata);
    let pageCount: number;
    try { pageCount = (await PDFDocument.load(file.buffer, { updateMetadata: false, throwOnInvalidObject: true })).getPageCount(); }
    catch { throw new BadRequestException("The PDF could not be opened. Unlock password-protected PDFs first."); }
    if (pageCount < 1 || pageCount > 300) throw new BadRequestException("Request signatures currently supports PDFs with 1-300 pages.");
    if (input.fields.some((field) => field.pageNumber > pageCount)) throw new BadRequestException(`A field targets a page beyond the PDF's ${pageCount} pages.`);

    const storageKey = `signature-requests/${sender.id}/${randomUUID()}/original.pdf`;
    await this.storage.putPrivateObject(storageKey, file.buffer, "application/pdf", { ownerId: sender.id, originalName: encodeURIComponent(file.originalname).slice(0, 255) });
    try {
      const requestId = await this.dataSource.transaction(async (manager) => {
        const document = await manager.save(DocumentEntity, manager.create(DocumentEntity, {
          ownerId: sender.id, originalName: file.originalname.slice(0, 255), mimeType: "application/pdf", size: String(file.size), sha256: sha256(file.buffer), storageKey,
          completedStorageKey: null, completedSha256: null, completedSize: null,
        }));
        const request = await manager.save(SignatureRequestEntity, manager.create(SignatureRequestEntity, {
          senderId: sender.id, documentId: document.id, title: input.title, message: input.message, signingMode: input.signingMode,
          status: SignatureRequestStatus.DRAFT, expiresAt: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000),
          sentAt: null, completedAt: null, declinedAt: null, cancelledAt: null,
        }));
        const recipientMap = new Map<string, RecipientEntity>();
        for (const recipientInput of input.recipients) {
          const recipient = await manager.save(RecipientEntity, manager.create(RecipientEntity, {
            requestId: request.id, name: recipientInput.name, email: recipientInput.email, orderIndex: recipientInput.orderIndex,
            status: input.signingMode === SigningMode.PARALLEL || recipientInput.orderIndex === 0 ? RecipientStatus.READY : RecipientStatus.WAITING,
            tokenHash: null, tokenExpiresAt: null, sentAt: null, deliveredAt: null, viewedAt: null, completedAt: null, declinedAt: null,
            declineReason: null, reminderCount: 0, lastReminderAt: null, completionData: null,
          }));
          recipientMap.set(recipientInput.clientId, recipient);
        }
        for (const fieldInput of input.fields) {
          const recipient = recipientMap.get(fieldInput.recipientClientId);
          if (!recipient) throw new BadRequestException("A field recipient could not be resolved.");
          await manager.save(SignatureFieldEntity, manager.create(SignatureFieldEntity, {
            requestId: request.id, recipientId: recipient.id, pageNumber: fieldInput.pageNumber, type: fieldInput.type,
            x: fieldInput.x, y: fieldInput.y, width: fieldInput.width, height: fieldInput.height, rotation: fieldInput.rotation,
            required: fieldInput.required, label: fieldInput.label, defaultValue: fieldInput.defaultValue, style: fieldInput.style,
          }));
        }
        await manager.save(AuditEventEntity, manager.create(AuditEventEntity, {
          requestId: request.id, recipientId: null, actorType: AuditActorType.SENDER, actorId: sender.id, eventType: "REQUEST_CREATED",
          ipHash: context.ip ? sha256(context.ip).slice(0, 32) : null, userAgent: context.userAgent?.slice(0, 500) ?? null,
          metadata: { pageCount, recipientCount: input.recipients.length, fieldCount: input.fields.length, signingMode: input.signingMode },
        }));
        return request.id;
      });
      return serializeRequest(await this.findOwnedOrThrow(requestId, sender.id));
    } catch (error) {
      await this.storage.deletePrivateObject(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async list(senderId: string) {
    const items = await this.requests.find({ where: { senderId }, relations: { document: true, recipients: true }, order: { createdAt: "DESC" }, take: 100 });
    return items.map(serializeRequest);
  }

  async get(id: string, senderId: string) { return serializeRequest(await this.findOwnedOrThrow(id, senderId)); }

  async send(id: string, sender: UserEntity, context: AuditContext) {
    const request = await this.findOwnedOrThrow(id, sender.id);
    if (request.status !== SignatureRequestStatus.DRAFT) throw new ConflictException("Only a draft request can be sent.");
    if (request.expiresAt.getTime() <= Date.now()) throw new ConflictException("Choose a future expiration before sending.");
    const now = new Date();
    const active = request.signingMode === SigningMode.PARALLEL ? request.recipients : request.recipients.filter((recipient) => recipient.orderIndex === 0);
    const queued: Array<{ delivery: EmailDeliveryEntity; recipient: RecipientEntity; rawToken: string }> = [];
    await this.dataSource.transaction(async (manager) => {
      request.status = SignatureRequestStatus.SENT; request.sentAt = now;
      await manager.save(request);
      for (const recipient of request.recipients) {
        if (!active.some((item) => item.id === recipient.id)) { recipient.status = RecipientStatus.WAITING; await manager.save(recipient); continue; }
        const rawToken = createOpaqueToken();
        recipient.status = RecipientStatus.SENT; recipient.sentAt = now; recipient.tokenHash = sha256(rawToken); recipient.tokenExpiresAt = this.signerTokenExpiry(request.expiresAt);
        await manager.save(recipient);
        const delivery = await manager.save(EmailDeliveryEntity, manager.create(EmailDeliveryEntity, {
          requestId: request.id, recipientId: recipient.id, kind: EmailKind.INVITATION, status: EmailDeliveryStatus.QUEUED,
          providerMessageId: null, lastError: null, sentAt: null, deliveredAt: null,
        }));
        queued.push({ delivery, recipient, rawToken });
      }
      await manager.save(AuditEventEntity, manager.create(AuditEventEntity, {
        requestId: request.id, recipientId: null, actorType: AuditActorType.SENDER, actorId: sender.id, eventType: "REQUEST_SENT",
        ipHash: context.ip ? sha256(context.ip).slice(0, 32) : null, userAgent: context.userAgent?.slice(0, 500) ?? null,
        metadata: { activeRecipients: active.map((item) => item.id), signingMode: request.signingMode },
      }));
    });
    for (const item of queued) await this.enqueueInvitation(item.delivery, item.recipient, item.rawToken, sender.displayName, request);
    await this.lifecycleQueue.add("expire-request", { requestId: request.id }, { jobId: `expire:${request.id}`, delay: Math.max(1000, request.expiresAt.getTime() - Date.now()) });
    return serializeRequest(await this.findOwnedOrThrow(id, sender.id));
  }

  async remind(id: string, sender: UserEntity, recipientId: string | undefined, context: AuditContext) {
    const request = await this.findOwnedOrThrow(id, sender.id);
    if (TERMINAL.has(request.status) || request.status === SignatureRequestStatus.DRAFT) throw new ConflictException("This request cannot send reminders.");
    const candidates = request.recipients.filter((recipient) => (!recipientId || recipient.id === recipientId) && [RecipientStatus.SENT, RecipientStatus.DELIVERED, RecipientStatus.VIEWED].includes(recipient.status));
    if (recipientId && candidates.length === 0) throw new NotFoundException("That active recipient was not found.");
    const now = new Date();
    const queued: Array<{ delivery: EmailDeliveryEntity; recipient: RecipientEntity; rawToken: string }> = [];
    for (const recipient of candidates) {
      if (recipient.lastReminderAt && now.getTime() - recipient.lastReminderAt.getTime() < 24 * 60 * 60 * 1000) throw new ConflictException(`A reminder was already sent to ${recipient.email} in the last 24 hours.`);
      const rawToken = createOpaqueToken(); recipient.tokenHash = sha256(rawToken); recipient.tokenExpiresAt = this.signerTokenExpiry(request.expiresAt); recipient.lastReminderAt = now; recipient.reminderCount += 1;
      await this.recipients.save(recipient);
      const delivery = await this.deliveries.save(this.deliveries.create({ requestId: request.id, recipientId: recipient.id, kind: EmailKind.REMINDER, status: EmailDeliveryStatus.QUEUED, providerMessageId: null, lastError: null, sentAt: null, deliveredAt: null }));
      queued.push({ delivery, recipient, rawToken });
    }
    await this.audit.append({ requestId: request.id, actorType: AuditActorType.SENDER, actorId: sender.id, eventType: "REMINDER_QUEUED", metadata: { recipientIds: candidates.map((item) => item.id) }, context });
    for (const item of queued) await this.enqueueInvitation(item.delivery, item.recipient, item.rawToken, sender.displayName, request);
    return { queued: queued.length };
  }

  async cancel(id: string, sender: UserEntity, context: AuditContext) {
    const request = await this.findOwnedOrThrow(id, sender.id);
    if (TERMINAL.has(request.status)) throw new ConflictException("This request is already closed.");
    const notifyRecipients = request.recipients.filter((recipient) => [RecipientStatus.SENT, RecipientStatus.DELIVERED, RecipientStatus.VIEWED].includes(recipient.status));
    const deliveries: Array<{ delivery: EmailDeliveryEntity; recipient: RecipientEntity }> = [];
    await this.dataSource.transaction(async (manager) => {
      request.status = SignatureRequestStatus.CANCELLED; request.cancelledAt = new Date();
      await manager.save(request);
      await manager.update(RecipientEntity, { requestId: request.id, status: In([RecipientStatus.WAITING, RecipientStatus.READY, RecipientStatus.SENT, RecipientStatus.DELIVERED, RecipientStatus.VIEWED]) }, { status: RecipientStatus.CANCELLED, tokenHash: null, tokenExpiresAt: null });
      for (const recipient of notifyRecipients) {
        const delivery = await manager.save(EmailDeliveryEntity, manager.create(EmailDeliveryEntity, {
          requestId: request.id, recipientId: recipient.id, kind: EmailKind.CANCELLED, status: EmailDeliveryStatus.QUEUED,
          providerMessageId: null, lastError: null, sentAt: null, deliveredAt: null,
        }));
        deliveries.push({ delivery, recipient });
      }
      await manager.save(AuditEventEntity, manager.create(AuditEventEntity, {
        requestId: request.id, recipientId: null, actorType: AuditActorType.SENDER, actorId: sender.id, eventType: "REQUEST_CANCELLED",
        ipHash: context.ip ? sha256(context.ip).slice(0, 32) : null, userAgent: context.userAgent?.slice(0, 500) ?? null,
        metadata: { notifiedRecipientIds: notifyRecipients.map((recipient) => recipient.id) },
      }));
    });
    for (const { delivery, recipient } of deliveries) {
      await this.emailQueue.add("send-email", {
        deliveryId: delivery.id, kind: EmailKind.CANCELLED, to: { email: recipient.email, name: recipient.name }, senderName: sender.displayName, requestTitle: request.title,
      }, { jobId: `email:${delivery.id}` });
    }
    return serializeRequest(await this.findOwnedOrThrow(id, sender.id));
  }

  async auditTimeline(id: string, senderId: string) {
    await this.findOwnedOrThrow(id, senderId);
    return this.events.find({ where: { requestId: id }, order: { createdAt: "ASC" } });
  }

  async completedDownload(id: string, senderId: string) {
    const request = await this.findOwnedOrThrow(id, senderId);
    if (request.status !== SignatureRequestStatus.COMPLETED || !request.document.completedStorageKey) throw new ConflictException("The completed PDF is not ready.");
    const filename = request.document.originalName.replace(/\.pdf$/i, "") + "-completed.pdf";
    return { url: await this.storage.createDownloadUrl(request.document.completedStorageKey, filename), expiresInSeconds: this.config.getOrThrow<number>("objectStorageDownloadTtlSeconds") };
  }

  private async findOwnedOrThrow(id: string, senderId: string) {
    const request = await this.requests.findOne({ where: { id }, relations: { sender: true, document: true, recipients: true, fields: true } });
    if (!request) throw new NotFoundException("Signature request not found.");
    if (request.senderId !== senderId) throw new ForbiddenException("You do not have access to this signature request.");
    return request;
  }

  private signerTokenExpiry(requestExpiry: Date): Date {
    const ttlMs = this.config.getOrThrow<number>("signerTokenTtlHours") * 60 * 60 * 1000;
    return new Date(Math.min(requestExpiry.getTime(), Date.now() + ttlMs));
  }

  private async enqueueInvitation(delivery: EmailDeliveryEntity, recipient: RecipientEntity, rawToken: string, senderName: string, request: SignatureRequestEntity) {
    const signerUrl = `${this.config.getOrThrow<string>("signerPublicUrl").replace(/\/$/, "")}/${encodeURIComponent(rawToken)}`;
    await this.emailQueue.add("send-email", {
      deliveryId: delivery.id, kind: delivery.kind, to: { email: recipient.email, name: recipient.name }, senderName,
      requestTitle: request.title, signerUrl, message: request.message,
    }, { jobId: `email:${delivery.id}` });
  }
}
