import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommonModule } from "../common/common.module";
import { DocumentEntity, EmailDeliveryEntity, SignatureRequestEntity } from "../database/entities";
import { EmailModule } from "../email/email.module";
import { StorageModule } from "../storage/storage.module";
import { EmailProcessor } from "./email.processor";
import { PdfFinalizationProcessor } from "./pdf-finalization.processor";
import { RequestLifecycleProcessor } from "./request-lifecycle.processor";

@Module({
  imports: [TypeOrmModule.forFeature([SignatureRequestEntity, DocumentEntity, EmailDeliveryEntity]), CommonModule, EmailModule, StorageModule],
  providers: [EmailProcessor, PdfFinalizationProcessor, RequestLifecycleProcessor],
})
export class WorkerModule {}
