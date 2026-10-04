import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AuditEventEntity,
  AuthSessionEntity,
  DocumentEntity,
  EmailDeliveryEntity,
  RecipientEntity,
  SignatureFieldEntity,
  SignatureRequestEntity,
  UserEntity,
} from "./entities";

export const DATABASE_ENTITIES = [
  UserEntity,
  AuthSessionEntity,
  DocumentEntity,
  SignatureRequestEntity,
  RecipientEntity,
  SignatureFieldEntity,
  AuditEventEntity,
  EmailDeliveryEntity,
];

@Global()
@Module({
  imports: [TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      type: "postgres" as const,
      url: config.getOrThrow<string>("databaseUrl"),
      entities: DATABASE_ENTITIES,
      synchronize: false,
      migrationsRun: false,
      logging: config.get<string>("nodeEnv") === "development" ? ["error", "warn"] : ["error"],
      ssl: config.get<string>("nodeEnv") === "production" ? { rejectUnauthorized: true } : false,
    }),
  })],
})
export class DatabaseModule {}
