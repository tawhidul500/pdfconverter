import { Global, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { EMAIL_QUEUE, PDF_FINALIZATION_QUEUE, REQUEST_LIFECYCLE_QUEUE } from "./names";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ connection: {
        host: config.getOrThrow<string>("redisHost"),
        port: config.getOrThrow<number>("redisPort"),
        password: config.get<string>("redisPassword") || undefined,
        maxRetriesPerRequest: null,
      } }),
    }),
    BullModule.registerQueue(
      { name: EMAIL_QUEUE, defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 1000, removeOnFail: 5000 } },
      { name: PDF_FINALIZATION_QUEUE, defaultJobOptions: { attempts: 4, backoff: { type: "exponential", delay: 10000 }, removeOnComplete: 500, removeOnFail: 2000 } },
      { name: REQUEST_LIFECYCLE_QUEUE, defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 10000 }, removeOnComplete: 1000, removeOnFail: 2000 } },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
