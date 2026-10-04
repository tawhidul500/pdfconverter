import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { loadEnvironment } from "./config/env";
import { DatabaseModule } from "./database/database.module";
import { EmailModule } from "./email/email.module";
import { HealthModule } from "./health/health.module";
import { QueuesModule } from "./queues/queues.module";
import { SignatureRequestsModule } from "./signature-requests/signature-requests.module";
import { SignerModule } from "./signer/signer.module";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"], load: [loadEnvironment], cache: true }),
    DatabaseModule,
    QueuesModule,
    CommonModule,
    StorageModule,
    EmailModule,
    AuthModule,
    SignatureRequestsModule,
    SignerModule,
    HealthModule,
  ],
})
export class AppModule {}
