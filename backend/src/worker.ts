import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WorkerAppModule } from "./worker-app.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerAppModule, { bufferLogs: true });
  app.useLogger(new Logger("NovaPDF Worker"));
  app.enableShutdownHooks();
  Logger.log("NovaPDF email, lifecycle, and PDF workers are ready.", "WorkerBootstrap");
}

void bootstrap();
