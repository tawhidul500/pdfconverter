import { RecipientStatus, SignatureRequestStatus } from "../common/enums";

const terminal = new Set([SignatureRequestStatus.COMPLETED, SignatureRequestStatus.DECLINED, SignatureRequestStatus.EXPIRED, SignatureRequestStatus.CANCELLED]);

export function aggregateRequestStatus(current: SignatureRequestStatus, recipientStatuses: RecipientStatus[]): SignatureRequestStatus {
  if (terminal.has(current)) return current;
  if (recipientStatuses.some((status) => status === RecipientStatus.DECLINED)) return SignatureRequestStatus.DECLINED;
  if (recipientStatuses.length > 0 && recipientStatuses.every((status) => status === RecipientStatus.COMPLETED)) return SignatureRequestStatus.PARTIALLY_SIGNED;
  if (recipientStatuses.some((status) => status === RecipientStatus.COMPLETED)) return SignatureRequestStatus.PARTIALLY_SIGNED;
  if (recipientStatuses.some((status) => status === RecipientStatus.VIEWED)) return SignatureRequestStatus.VIEWED;
  if (recipientStatuses.some((status) => status === RecipientStatus.DELIVERED)) return SignatureRequestStatus.DELIVERED;
  return SignatureRequestStatus.SENT;
}

export function activeRecipientIndexes(mode: "PARALLEL" | "SEQUENTIAL", recipients: Array<{ orderIndex: number; status: RecipientStatus }>): number[] {
  if (mode === "PARALLEL") return recipients.filter((recipient) => recipient.status !== RecipientStatus.COMPLETED).map((recipient) => recipient.orderIndex);
  const next = [...recipients].sort((a, b) => a.orderIndex - b.orderIndex).find((recipient) => recipient.status !== RecipientStatus.COMPLETED);
  return next ? [next.orderIndex] : [];
}
