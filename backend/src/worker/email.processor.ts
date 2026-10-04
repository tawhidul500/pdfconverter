import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Job } from "bullmq";
import { Repository } from "typeorm";
import { AuditActorType, EmailDeliveryStatus } from "../common/enums";
import { AuditService } from "../common/audit.service";
import { EmailDeliveryEntity } from "../database/entities";
import { EmailService } from "../email/email.service";
import type { EmailJob } from "../email/email.types";
import { EMAIL_QUEUE } from "../queues/names";

@Injectable()
@Processor(EMAIL_QUEUE, { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  constructor(
    @InjectRepository(EmailDeliveryEntity) private readonly deliveries: Repository<EmailDeliveryEntity>,
    private readonly email: EmailService,
    private readonly audit: AuditService,
  ) { super(); }

  override async process(job: Job<EmailJob>): Promise<{ messageId: string; skipped?: boolean }> {
    const delivery = await this.deliveries.findOneBy({ id: job.data.deliveryId });
    if (!delivery) throw new Error(`Email delivery ${job.data.deliveryId} no longer exists.`);
    if ([EmailDeliveryStatus.SENT, EmailDeliveryStatus.DELIVERED].includes(delivery.status) && delivery.providerMessageId) {
      return { messageId: delivery.providerMessageId, skipped: true };
    }
    try {
      const result = await this.email.send(job.data);
      delivery.status = EmailDeliveryStatus.SENT;
      delivery.providerMessageId = result.messageId;
      delivery.sentAt = new Date();
      delivery.lastError = null;
      await this.deliveries.save(delivery);
      await this.audit.append({
        requestId: delivery.requestId,
        recipientId: delivery.recipientId,
        actorType: AuditActorType.SYSTEM,
        actorId: "email-worker",
        eventType: "EMAIL_SENT",
        metadata: { deliveryId: delivery.id, kind: delivery.kind, providerMessageId: result.messageId },
      });
      return result;
    } catch (error) {
      delivery.status = EmailDeliveryStatus.FAILED;
      delivery.lastError = error instanceof Error ? error.message.slice(0, 2000) : "Unknown SMTP error";
      await this.deliveries.save(delivery);
      throw error;
    }
  }
}
