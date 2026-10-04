import { BadRequestException } from "@nestjs/common";
import { SignatureFieldType } from "../common/enums";
import type { SignatureFieldEntity } from "../database/entities";

export type SignerFieldSubmission = { fieldId: string; value?: string; checked?: boolean; imageDataUrl?: string };
export type SignerCompletionInput = { consent: true; fields: SignerFieldSubmission[] };

export function parseSignerCompletion(raw: unknown, assignedFields: SignatureFieldEntity[]): SignerCompletionInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new BadRequestException("Completion payload must be an object.");
  const root = raw as Record<string, unknown>;
  if (root.consent !== true) throw new BadRequestException("Consent is required before signing.");
  if (!Array.isArray(root.fields)) throw new BadRequestException("fields must be an array.");
  const assigned = new Map(assignedFields.map((field) => [field.id, field]));
  const seen = new Set<string>();
  const fields = root.fields.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new BadRequestException(`Field ${index + 1} is invalid.`);
    const value = item as Record<string, unknown>;
    if (typeof value.fieldId !== "string" || !assigned.has(value.fieldId)) throw new BadRequestException(`Field ${index + 1} is not assigned to this recipient.`);
    if (seen.has(value.fieldId)) throw new BadRequestException(`Field ${value.fieldId} was submitted more than once.`);
    seen.add(value.fieldId);
    return {
      fieldId: value.fieldId,
      value: typeof value.value === "string" ? value.value.slice(0, 2000) : undefined,
      checked: typeof value.checked === "boolean" ? value.checked : undefined,
      imageDataUrl: typeof value.imageDataUrl === "string" ? value.imageDataUrl : undefined,
    };
  });
  const submitted = new Map(fields.map((field) => [field.fieldId, field]));
  for (const field of assignedFields) {
    const item = submitted.get(field.id);
    const text = item?.value?.trim() || field.defaultValue?.trim() || "";
    const imageRequired = [SignatureFieldType.SIGNATURE, SignatureFieldType.INITIALS, SignatureFieldType.STAMP].includes(field.type);
    if (!field.required) continue;
    if (imageRequired && !item?.imageDataUrl) throw new BadRequestException(`${field.label ?? field.type} is required.`);
    if (field.type === SignatureFieldType.CHECKBOX && item?.checked !== true) throw new BadRequestException(`${field.label ?? "Checkbox"} must be checked.`);
    if ([SignatureFieldType.TEXT, SignatureFieldType.INPUT].includes(field.type) && !text) throw new BadRequestException(`${field.label ?? field.type} is required.`);
  }
  return { consent: true, fields };
}

export function decodeImageDataUrl(dataUrl: string): { bytes: Uint8Array; mimeType: "image/png" | "image/jpeg" } {
  const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new BadRequestException("Signature images must be PNG or JPEG data URLs.");
  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (bytes.length < 20 || bytes.length > 5 * 1024 * 1024) throw new BadRequestException("Each signature image must be between 20 bytes and 5 MB.");
  return { bytes: new Uint8Array(bytes), mimeType: match[1] as "image/png" | "image/jpeg" };
}
