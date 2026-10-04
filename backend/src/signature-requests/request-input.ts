import { BadRequestException } from "@nestjs/common";
import { SigningMode, SignatureFieldType } from "../common/enums";

export type RecipientInput = { clientId: string; name: string; email: string; orderIndex: number };
export type FieldInput = {
  recipientClientId: string; pageNumber: number; type: SignatureFieldType;
  x: number; y: number; width: number; height: number; rotation: number;
  required: boolean; label: string | null; defaultValue: string | null; style: Record<string, unknown>;
};
export type CreateRequestInput = {
  title: string; message: string | null; signingMode: SigningMode; expiresInDays: number;
  recipients: RecipientInput[]; fields: FieldInput[];
};

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BadRequestException(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function string(value: unknown, label: string, max: number, min = 1): string {
  if (typeof value !== "string") throw new BadRequestException(`${label} must be text.`);
  const result = value.trim();
  if (result.length < min || result.length > max) throw new BadRequestException(`${label} must be ${min}-${max} characters.`);
  return result;
}
function number(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new BadRequestException(`${label} must be between ${min} and ${max}.`);
  return value;
}
function email(value: unknown): string {
  const result = string(value, "Recipient email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new BadRequestException(`Invalid recipient email: ${result}`);
  return result;
}

export function parseCreateRequestInput(rawMetadata: string): CreateRequestInput {
  let parsed: unknown;
  try { parsed = JSON.parse(rawMetadata); } catch { throw new BadRequestException("metadata must be valid JSON."); }
  const root = object(parsed, "metadata");
  const signingMode = root.signingMode;
  if (signingMode !== SigningMode.PARALLEL && signingMode !== SigningMode.SEQUENTIAL) throw new BadRequestException("signingMode must be PARALLEL or SEQUENTIAL.");
  if (!Array.isArray(root.recipients) || root.recipients.length < 1 || root.recipients.length > 25) throw new BadRequestException("Add between 1 and 25 recipients.");
  const recipients = root.recipients.map((item, index) => {
    const value = object(item, `Recipient ${index + 1}`);
    return { clientId: string(value.clientId, `Recipient ${index + 1} clientId`, 80), name: string(value.name, `Recipient ${index + 1} name`, 120), email: email(value.email), orderIndex: index };
  });
  if (new Set(recipients.map((item) => item.clientId)).size !== recipients.length) throw new BadRequestException("Recipient clientId values must be unique.");
  if (new Set(recipients.map((item) => item.email)).size !== recipients.length) throw new BadRequestException("Recipient emails must be unique.");
  if (!Array.isArray(root.fields) || root.fields.length < 1 || root.fields.length > 500) throw new BadRequestException("Add between 1 and 500 assigned fields.");
  const recipientIds = new Set(recipients.map((item) => item.clientId));
  const fields = root.fields.map((item, index) => {
    const value = object(item, `Field ${index + 1}`);
    const recipientClientId = string(value.recipientClientId, `Field ${index + 1} recipientClientId`, 80);
    if (!recipientIds.has(recipientClientId)) throw new BadRequestException(`Field ${index + 1} is assigned to an unknown recipient.`);
    if (!Object.values(SignatureFieldType).includes(value.type as SignatureFieldType)) throw new BadRequestException(`Field ${index + 1} has an invalid type.`);
    const style = value.style === undefined ? {} : object(value.style, `Field ${index + 1} style`);
    return {
      recipientClientId,
      pageNumber: Math.trunc(number(value.pageNumber, `Field ${index + 1} pageNumber`, 1, 10000)),
      type: value.type as SignatureFieldType,
      x: number(value.x, `Field ${index + 1} x`, 0, 1), y: number(value.y, `Field ${index + 1} y`, 0, 1),
      width: number(value.width, `Field ${index + 1} width`, 0.005, 1), height: number(value.height, `Field ${index + 1} height`, 0.005, 1),
      rotation: value.rotation === undefined ? 0 : number(value.rotation, `Field ${index + 1} rotation`, -180, 180),
      required: value.required === true,
      label: typeof value.label === "string" && value.label.trim() ? value.label.trim().slice(0, 120) : null,
      defaultValue: typeof value.defaultValue === "string" ? value.defaultValue.slice(0, 1000) : null,
      style,
    };
  });
  for (const recipient of recipients) {
    if (!fields.some((field) => field.recipientClientId === recipient.clientId)) throw new BadRequestException(`${recipient.name} has no assigned fields.`);
  }
  return {
    title: string(root.title, "Request title", 180),
    message: typeof root.message === "string" && root.message.trim() ? root.message.trim().slice(0, 3000) : null,
    signingMode,
    expiresInDays: root.expiresInDays === undefined ? 7 : Math.trunc(number(root.expiresInDays, "expiresInDays", 1, 30)),
    recipients,
    fields,
  };
}
