import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailDeliveryEntity, RecipientEntity, SignatureFieldEntity, SignatureRequestEntity } from "../database/entities";
import { SignerController } from "./signer.controller";
import { SignerService } from "./signer.service";

@Module({ imports: [TypeOrmModule.forFeature([RecipientEntity, SignatureRequestEntity, SignatureFieldEntity, EmailDeliveryEntity])], controllers: [SignerController], providers: [SignerService] })
export class SignerModule {}
