import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditActorType } from "./enums";
import { hashNetworkValue } from "./crypto";
import { AuditEventEntity } from "../database/entities";

export type AuditContext = { ip?: string; userAgent?: string };

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditEventEntity) private readonly events: Repository<AuditEventEntity>) {}

  append(input: {
    requestId: string;
    recipientId?: string | null;
    actorType: AuditActorType;
    actorId?: string | null;
    eventType: string;
    metadata?: Record<string, unknown>;
    context?: AuditContext;
  }): Promise<AuditEventEntity> {
    const event = this.events.create({
      requestId: input.requestId,
      recipientId: input.recipientId ?? null,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      eventType: input.eventType,
      ipHash: hashNetworkValue(input.context?.ip),
      userAgent: input.context?.userAgent?.slice(0, 500) ?? null,
      metadata: input.metadata ?? {},
    });
    return this.events.save(event);
  }
}
