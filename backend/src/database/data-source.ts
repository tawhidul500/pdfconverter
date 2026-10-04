import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { loadEnvironment } from "../config/env";
import { AuditEventEntity, AuthSessionEntity, DocumentEntity, EmailDeliveryEntity, RecipientEntity, SignatureFieldEntity, SignatureRequestEntity, UserEntity } from "./entities";
import { CreateSignatureRequestBackend1721800000000 } from "./migrations/1721800000000-CreateSignatureRequestBackend";

const env = loadEnvironment();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  entities: [UserEntity, AuthSessionEntity, DocumentEntity, SignatureRequestEntity, RecipientEntity, SignatureFieldEntity, AuditEventEntity, EmailDeliveryEntity],
  migrations: [CreateSignatureRequestBackend1721800000000],
  synchronize: false,
  logging: env.nodeEnv === "development" ? ["error", "warn"] : ["error"],
});
