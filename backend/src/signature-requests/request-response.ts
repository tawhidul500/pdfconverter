import type { SignatureRequestEntity } from "../database/entities";

export function serializeRequest(request: SignatureRequestEntity) {
  return {
    id: request.id,
    title: request.title,
    message: request.message,
    signingMode: request.signingMode,
    status: request.status,
    expiresAt: request.expiresAt,
    sentAt: request.sentAt,
    completedAt: request.completedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    document: request.document ? { id: request.document.id, originalName: request.document.originalName, size: Number(request.document.size), completed: Boolean(request.document.completedStorageKey) } : undefined,
    recipients: request.recipients?.sort((a, b) => a.orderIndex - b.orderIndex).map((recipient) => ({
      id: recipient.id, name: recipient.name, email: recipient.email, orderIndex: recipient.orderIndex, status: recipient.status,
      sentAt: recipient.sentAt, deliveredAt: recipient.deliveredAt, viewedAt: recipient.viewedAt, completedAt: recipient.completedAt,
      declinedAt: recipient.declinedAt, reminderCount: recipient.reminderCount, lastReminderAt: recipient.lastReminderAt,
    })) ?? [],
    fields: request.fields?.map((field) => ({ id: field.id, recipientId: field.recipientId, pageNumber: field.pageNumber, type: field.type, x: field.x, y: field.y, width: field.width, height: field.height, rotation: field.rotation, required: field.required, label: field.label, defaultValue: field.defaultValue, style: field.style })) ?? [],
  };
}
