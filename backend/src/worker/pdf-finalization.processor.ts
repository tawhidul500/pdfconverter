import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import type { Job, Queue } from "bullmq";
import { DataSource, IsNull, Repository } from "typeorm";
import { sha256 } from "../common/crypto";
import { AuditActorType, EmailDeliveryStatus, EmailKind, RecipientStatus, SignatureRequestStatus } from "../common/enums";
import { AuditEventEntity, DocumentEntity, EmailDeliveryEntity, SignatureRequestEntity } from "../database/entities";
import type { EmailJob } from "../email/email.types";
import { EMAIL_QUEUE, PDF_FINALIZATION_QUEUE } from "../queues/names";
import { StorageService } from "../storage/storage.service";
import { renderCompletedPdf, type FinalizationResponse } from "./pdf-renderer";

@Injectable()
@Processor(PDF_FINALIZATION_QUEUE, { concurrency: 2 })
export class PdfFinalizationProcessor extends WorkerHost {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SignatureRequestEntity) private readonly requests: Repository<SignatureRequestEntity>,
    @InjectRepository(EmailDeliveryEntity) private readonly deliveries: Repository<EmailDeliveryEntity>,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<EmailJob>,
  ) { super(); }

  override async process(job: Job<{ requestId: string }>): Promise<{ requestId: string; completed: boolean; renderedFieldCount?: number }> {
    const request = await this.requests.findOne({
      where: { id: job.data.requestId },
      relations: { sender: true, document: true, recipients: true, fields: true },
    });
    if (!request) return { requestId: job.data.requestId, completed: false };
    if (request.status === SignatureRequestStatus.COMPLETED && request.document.completedStorageKey) {
      await this.ensureCompletionEmail(request);
      return { requestId: request.id, completed: true };
    }
    if ([SignatureRequestStatus.DECLINED, SignatureRequestStatus.EXPIRED, SignatureRequestStatus.CANCELLED].includes(request.status)) {
      return { requestId: request.id, completed: false };
    }
    if (!request.recipients.length || request.recipients.some((recipient) => recipient.status !== RecipientStatus.COMPLETED)) {
      throw new Error("The request cannot be finalized until every recipient has completed it.");
    }

    const responses: FinalizationResponse = {};
    for (const recipient of request.recipients) {
      Object.assign(responses, recipient.completionData ?? {});
    }
    const sourceBytes = await this.storage.getPrivateObject(request.document.storageKey);
    const rendered = await renderCompletedPdf(sourceBytes, request.fields, responses, (key) => this.storage.getPrivateObject(key));
    const storageKey = `signature-requests/${request.id}/completed/${request.id}.pdf`;
    await this.storage.putPrivateObject(storageKey, rendered.bytes, "application/pdf", { requestId: request.id, kind: "completed" });

    try {
      await this.dataSource.transaction(async (manager) => {
        const lockedRequest = await manager.findOne(SignatureRequestEntity, { where: { id: request.id }, lock: { mode: "pessimistic_write" } });
        if (!lockedRequest) throw new Error("Signature request disappeared during finalization.");
        if (lockedRequest.status === SignatureRequestStatus.COMPLETED) return;
        if ([SignatureRequestStatus.DECLINED, SignatureRequestStatus.EXPIRED, SignatureRequestStatus.CANCELLED].includes(lockedRequest.status)) {
          throw new Error(`Signature request closed as ${lockedRequest.status}.`);
        }
        await manager.update(DocumentEntity, request.document.id, {
          completedStorageKey: storageKey,
          completedSha256: sha256(rendered.bytes),
          completedSize: String(rendered.bytes.byteLength),
        });
        lockedRequest.status = SignatureRequestStatus.COMPLETED;
        lockedRequest.completedAt = new Date();
        await manager.save(lockedRequest);
        await manager.save(AuditEventEntity, manager.create(AuditEventEntity, {
          requestId: request.id,
          recipientId: null,
          actorType: AuditActorType.SYSTEM,
          actorId: "pdf-worker",
          eventType: "REQUEST_COMPLETED",
          ipHash: null,
          userAgent: null,
          metadata: {
            completedSha256: sha256(rendered.bytes),
            completedSize: rendered.bytes.byteLength,
            renderedFieldCount: rendered.renderedFieldCount,
            pageCount: rendered.pageCount,
          },
        }));
      });
    } catch (error) {
      await this.storage.deletePrivateObject(storageKey).catch(() => undefined);
      throw error;
    }

    request.status = SignatureRequestStatus.COMPLETED;
    request.completedAt = new Date();
    request.document.completedStorageKey = storageKey;
    await this.ensureCompletionEmail(request);
    return { requestId: request.id, completed: true, renderedFieldCount: rendered.renderedFieldCount };
  }

  private async ensureCompletionEmail(request: SignatureRequestEntity): Promise<void> {
    if (!request.document.completedStorageKey) return;
    let delivery = await this.deliveries.findOne({ where: { requestId: request.id, recipientId: IsNull(), kind: EmailKind.COMPLETED } });
    if (!delivery) {
      delivery = await this.deliveries.save(this.deliveries.create({
        requestId: request.id,
        recipientId: null,
        kind: EmailKind.COMPLETED,
        status: EmailDeliveryStatus.QUEUED,
        providerMessageId: null,
        lastError: null,
        sentAt: null,
        deliveredAt: null,
      }));
    }
    if ([EmailDeliveryStatus.SENT, EmailDeliveryStatus.DELIVERED].includes(delivery.status)) return;
    const filename = request.document.originalName.replace(/\.pdf$/i, "") + "-completed.pdf";
    const completedUrl = await this.storage.createDownloadUrl(request.document.completedStorageKey, filename);
    await this.emailQueue.add("send-email", {
      deliveryId: delivery.id,
      kind: EmailKind.COMPLETED,
      to: { email: request.sender.email, name: request.sender.displayName },
      senderName: "NovaPDF",
      requestTitle: request.title,
      completedUrl,
    }, { jobId: `email:${delivery.id}`, removeOnComplete: 1000 });
  }
}
