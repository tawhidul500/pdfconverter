import { Injectable, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";
import type { EmailJob } from "./email.types";
import { renderEmail } from "./email.templates";

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly transport: Transporter;
  constructor(private readonly config: ConfigService) {
    const user = config.get<string>("smtpUser");
    const password = config.get<string>("smtpPassword");
    this.transport = nodemailer.createTransport({
      host: config.getOrThrow<string>("smtpHost"),
      port: config.getOrThrow<number>("smtpPort"),
      secure: config.getOrThrow<boolean>("smtpSecure"),
      auth: user && password ? { user, pass: password } : undefined,
      pool: true,
      maxConnections: 5,
    });
  }
  async onModuleInit(): Promise<void> { await this.verify(); }
  async verify(): Promise<void> { await this.transport.verify(); }
  async send(job: EmailJob): Promise<{ messageId: string }> {
    const content = renderEmail(job);
    const result: unknown = await this.transport.sendMail({
      from: this.config.getOrThrow<string>("emailFrom"),
      to: { address: job.to.email, name: job.to.name },
      disableFileAccess: true,
      disableUrlAccess: true,
      ...content,
    });
    if (!result || typeof result !== "object" || !("messageId" in result) || typeof result.messageId !== "string" || !result.messageId) {
      throw new Error("The email provider did not return a message ID.");
    }
    return { messageId: result.messageId };
  }
}
