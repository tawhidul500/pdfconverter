import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditActorType, EmailDeliveryStatus, RecipientStatus } from "../common/enums";
import { hmacSha256, secureHexEqual } from "../common/crypto";
import { AuditService } from "../common/audit.service";
import { EmailDeliveryEntity, RecipientEntity, SignatureRequestEntity } from "../database/entities";
import type { EmailWebhookPayload } from "./email.types";
import { aggregateRequestStatus } from "../signature-requests/status-policy";

@Controller("webhooks/email")
export class EmailWebhookController {
  constructor(
    @InjectRepository(EmailDeliveryEntity) private readonly deliveries: Repository<EmailDeliveryEntity>,
    @InjectRepository(RecipientEntity) private readonly recipients: Repository<RecipientEntity>,
    @InjectRepository(SignatureRequestEntity) private readonly requests: Repository<SignatureRequestEntity>,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async handle(@Body() payload: EmailWebhookPayload, @Headers("x-novapdf-webhook-signature") signature = "") {
    const canonical = JSON.stringify(payload);
    const expected = hmacSha256(this.config.getOrThrow<string>("emailWebhookSecret"), canonical);
    if (!secureHexEqual(signature, expected)) throw new UnauthorizedException("Invalid email webhook signature.");
    if (!payload?.providerMessageId || !["delivered", "bounced"].includes(payload.event)) return { accepted: false };
    const delivery = await this.deliveries.findOne({ where: { providerMessageId: payload.providerMessageId } });
    if (!delivery) return { accepted: true };
    if (payload.event === "delivered") {
      delivery.status = EmailDeliveryStatus.DELIVERED; delivery.deliveredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date();
      if (delivery.recipientId) {
        const recipient = await this.recipients.findOneBy({ id: delivery.recipientId });
        if (recipient && [RecipientStatus.SENT, RecipientStatus.READY].includes(recipient.status)) {
          recipient.status = RecipientStatus.DELIVERED; recipient.deliveredAt = delivery.deliveredAt; await this.recipients.save(recipient);
          const request = await this.requests.findOne({ where: { id: delivery.requestId }, relations: { recipients: true } });
          if (request) {
            request.status = aggregateRequestStatus(request.status, request.recipients.map((item) => item.id === recipient.id ? RecipientStatus.DELIVERED : item.status));
            await this.requests.save(request);
          }
        }
      }
    } else { delivery.status = EmailDeliveryStatus.BOUNCED; delivery.lastError = payload.reason?.slice(0, 1000) ?? "Email provider reported a bounce."; }
    await this.deliveries.save(delivery);
    await this.audit.append({ requestId: delivery.requestId, recipientId: delivery.recipientId, actorType: AuditActorType.EMAIL_PROVIDER, actorId: payload.providerMessageId, eventType: `EMAIL_${payload.event.toUpperCase()}`, metadata: { deliveryId: delivery.id, reason: payload.reason ?? null } });
    return { accepted: true };
  }
}
