import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Job } from "bullmq";
import { DataSource, In } from "typeorm";
import { AuditActorType, RecipientStatus, SignatureRequestStatus } from "../common/enums";
import { AuditEventEntity, RecipientEntity, SignatureRequestEntity } from "../database/entities";
import { REQUEST_LIFECYCLE_QUEUE } from "../queues/names";

const ACTIVE_RECIPIENTS = [RecipientStatus.WAITING, RecipientStatus.READY, RecipientStatus.SENT, RecipientStatus.DELIVERED, RecipientStatus.VIEWED];

@Injectable()
@Processor(REQUEST_LIFECYCLE_QUEUE, { concurrency: 3 })
export class RequestLifecycleProcessor extends WorkerHost {
  constructor(private readonly dataSource: DataSource) { super(); }

  override async process(job: Job<{ requestId: string }>): Promise<{ expired: boolean }> {
    if (job.name !== "expire-request") return { expired: false };
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(SignatureRequestEntity, { where: { id: job.data.requestId }, lock: { mode: "pessimistic_write" } });
      if (!request || request.expiresAt.getTime() > Date.now()) return { expired: false };
      if ([SignatureRequestStatus.COMPLETED, SignatureRequestStatus.DECLINED, SignatureRequestStatus.EXPIRED, SignatureRequestStatus.CANCELLED].includes(request.status)) return { expired: request.status === SignatureRequestStatus.EXPIRED };
      request.status = SignatureRequestStatus.EXPIRED;
      await manager.save(request);
      await manager.update(RecipientEntity, { requestId: request.id, status: In(ACTIVE_RECIPIENTS) }, { status: RecipientStatus.EXPIRED, tokenHash: null, tokenExpiresAt: null });
      await manager.save(AuditEventEntity, manager.create(AuditEventEntity, {
        requestId: request.id,
        recipientId: null,
        actorType: AuditActorType.SYSTEM,
        actorId: "lifecycle-worker",
        eventType: "REQUEST_EXPIRED",
        ipHash: null,
        userAgent: null,
        metadata: {},
      }));
      return { expired: true };
    });
  }
}
