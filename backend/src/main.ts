import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  app.useLogger(new Logger("NovaPDF API"));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.enableCors({ origin: config.getOrThrow<string>("webOrigin"), credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix("api/v1", { exclude: [] });
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("NovaPDF Request Signatures API")
    .setDescription("Step 12.8 backend preview. Request signatures remains a non-working product claim until the complete end-to-end gate passes.")
    .setVersion("0.12.8")
    .addCookieAuth(config.getOrThrow<string>("sessionCookieName"))
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swaggerConfig), { customSiteTitle: "NovaPDF API" });

  const port = config.getOrThrow<number>("port");
  await app.listen(port, "0.0.0.0");
  Logger.log(`NovaPDF API listening on ${config.getOrThrow<string>("apiPublicUrl")}`, "Bootstrap");
}

void bootstrap();
