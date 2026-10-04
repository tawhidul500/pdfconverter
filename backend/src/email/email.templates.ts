import { EmailKind } from "../common/enums";
import type { EmailJob } from "./email.types";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function renderEmail(job: EmailJob): { subject: string; text: string; html: string } {
  const title = escapeHtml(job.requestTitle);
  const sender = escapeHtml(job.senderName);
  const greeting = `Hello ${escapeHtml(job.to.name)},`;
  if (job.kind === EmailKind.INVITATION || job.kind === EmailKind.REMINDER) {
    const action = job.kind === EmailKind.REMINDER ? "Reminder: review and sign" : "Review and sign";
    const subject = `${job.kind === EmailKind.REMINDER ? "Reminder: " : ""}${job.senderName} sent ${job.requestTitle} for signature`;
    const text = `${greeting}\n\n${job.senderName} asked you to review and sign “${job.requestTitle}”.${job.message ? `\n\n${job.message}` : ""}\n\n${action}: ${job.signerUrl}\n\nThis secure link expires and is only for this signing request.`;
    const html = `<p>${greeting}</p><p><strong>${sender}</strong> asked you to review and sign <strong>${title}</strong>.</p>${job.message ? `<p>${escapeHtml(job.message)}</p>` : ""}<p><a href="${escapeHtml(job.signerUrl ?? "")}" style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">${action}</a></p><p>This secure link expires and is only for this signing request.</p>`;
    return { subject, text, html };
  }
  if (job.kind === EmailKind.COMPLETED) {
    return {
      subject: `Completed: ${job.requestTitle}`,
      text: `${greeting}\n\nAll required recipients completed “${job.requestTitle}”.\n\nDownload: ${job.completedUrl ?? "Open NovaPDF to download the completed PDF."}`,
      html: `<p>${greeting}</p><p>All required recipients completed <strong>${title}</strong>.</p>${job.completedUrl ? `<p><a href="${escapeHtml(job.completedUrl)}">Download the completed PDF</a></p>` : ""}`,
    };
  }
  const verb = job.kind === EmailKind.DECLINED ? "declined" : "was cancelled";
  return { subject: `${job.requestTitle} ${verb}`, text: `${greeting}\n\nThe signature request “${job.requestTitle}” ${verb}.`, html: `<p>${greeting}</p><p>The signature request <strong>${title}</strong> ${verb}.</p>` };
}
