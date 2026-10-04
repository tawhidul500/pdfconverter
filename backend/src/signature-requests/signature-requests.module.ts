import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditEventEntity, DocumentEntity, EmailDeliveryEntity, RecipientEntity, SignatureFieldEntity, SignatureRequestEntity } from "../database/entities";
import { SignatureRequestsController } from "./signature-requests.controller";
import { SignatureRequestsService } from "./signature-requests.service";

@Module({
  imports: [TypeOrmModule.forFeature([SignatureRequestEntity, RecipientEntity, SignatureFieldEntity, DocumentEntity, EmailDeliveryEntity, AuditEventEntity])],
  controllers: [SignatureRequestsController], providers: [SignatureRequestsService], exports: [SignatureRequestsService],
})
export class SignatureRequestsModule {}
