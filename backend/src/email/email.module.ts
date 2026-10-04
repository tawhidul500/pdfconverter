import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailDeliveryEntity, RecipientEntity, SignatureRequestEntity } from "../database/entities";
import { EmailWebhookController } from "./email-webhook.controller";
import { EmailService } from "./email.service";

@Global()
@Module({ imports: [TypeOrmModule.forFeature([EmailDeliveryEntity, RecipientEntity, SignatureRequestEntity])], controllers: [EmailWebhookController], providers: [EmailService], exports: [EmailService] })
export class EmailModule {}
