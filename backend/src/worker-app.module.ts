import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CommonModule } from "./common/common.module";
import { loadEnvironment } from "./config/env";
import { DatabaseModule } from "./database/database.module";
import { QueuesModule } from "./queues/queues.module";
import { StorageModule } from "./storage/storage.module";
import { WorkerModule } from "./worker/worker.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"], load: [loadEnvironment], cache: true }),
    DatabaseModule,
    QueuesModule,
    CommonModule,
    StorageModule,
    WorkerModule,
  ],
})
export class WorkerAppModule {}
