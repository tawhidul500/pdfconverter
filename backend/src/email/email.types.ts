import type { EmailKind } from "../common/enums";

export type EmailJob = {
  deliveryId: string;
  kind: EmailKind;
  to: { email: string; name: string };
  senderName: string;
  requestTitle: string;
  signerUrl?: string;
  completedUrl?: string;
  message?: string | null;
};

export type EmailWebhookPayload = {
  providerMessageId: string;
  event: "delivered" | "bounced";
  occurredAt?: string;
  reason?: string;
};
