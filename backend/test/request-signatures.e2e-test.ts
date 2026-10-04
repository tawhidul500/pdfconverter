import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Client } from "pg";

const enabled = process.env.RUN_BACKEND_E2E === "1";
const api = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
const mailpit = process.env.MAILPIT_BASE_URL ?? "http://localhost:8025";
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://novapdf:novapdf@localhost:5432/novapdf";
const signaturePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZqZ8AAAAASUVORK5CYII=";

type RequestRecipient = { status: string };
type RequestDocument = { completed: boolean };
type RequestResponse = {
  id: string;
  status: string;
  document: RequestDocument;
  recipients: RequestRecipient[];
};
type SignerField = { id: string; type: string };
type SignerReview = {
  recipient: { email: string };
  fields: SignerField[];
};
type CompletedDownload = { url: string };
type AuditEvent = { id: string; eventType: string };

async function json<T>(response: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await response.json() as unknown;
  } catch {
    body = null;
  }
  assert.ok(response.ok, `${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  return body as T;
}

async function waitFor<T>(load: () => Promise<T | null>, timeoutMs = 30_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await load();
    if (value !== null) return value;
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out waiting for the backend workflow.");
}

async function latestSignerToken(): Promise<string | null> {
  const response = await fetch(`${mailpit}/api/v1/message/latest/raw`);
  if (!response.ok) return null;
  const raw = await response.text();
  const match = raw.match(/\/api\/v1\/signer\/([A-Za-z0-9_-]{32,200})/);
  return match?.[1] ?? null;
}

async function samplePdf(): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  const font = await document.embedFont(StandardFonts.Helvetica);
  page.drawText("NovaPDF Step 12.8 end-to-end signature request", { x: 60, y: 720, size: 18, font });
  return new Uint8Array(await document.save());
}

void test("real email, secure signer links, sequential completion, final PDF, status, and append-only audit", { skip: !enabled }, async () => {
  await fetch(`${mailpit}/api/v1/messages`, { method: "DELETE", headers: { "content-type": "application/json" }, body: "{}" });
  const suffix = randomUUID().slice(0, 8);
  const senderEmail = `sender-${suffix}@example.test`;
  const firstEmail = `first-${suffix}@example.test`;
  const secondEmail = `second-${suffix}@example.test`;
  const register = await fetch(`${api}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: senderEmail, displayName: "E2E Sender", password: `Strong-password-${suffix}` }),
  });
  await json<unknown>(register);
  const cookie = register.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "Registration did not return the session cookie.");

  const pdfBytes = await samplePdf();
  const metadata = {
    title: `E2E request ${suffix}`,
    message: "Please complete this automated integration test.",
    signingMode: "SEQUENTIAL",
    expiresInDays: 1,
    recipients: [
      { clientId: "first", name: "First Recipient", email: firstEmail },
      { clientId: "second", name: "Second Recipient", email: secondEmail },
    ],
    fields: [
      { recipientClientId: "first", pageNumber: 1, type: "SIGNATURE", x: 0.45, y: 0.45, width: 0.25, height: 0.08, required: true },
      { recipientClientId: "first", pageNumber: 1, type: "NAME", x: 0.45, y: 0.56, width: 0.3, height: 0.06, required: true },
      { recipientClientId: "second", pageNumber: 1, type: "INPUT", x: 0.45, y: 0.68, width: 0.36, height: 0.06, required: true, label: "Approval" },
    ],
  };
  const form = new FormData();
  const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfArrayBuffer).set(pdfBytes);
  form.set("file", new Blob([pdfArrayBuffer], { type: "application/pdf" }), "e2e-request.pdf");
  form.set("metadata", JSON.stringify(metadata));
  const created = await json<RequestResponse>(await fetch(`${api}/signature-requests`, { method: "POST", headers: { cookie }, body: form }));
  assert.equal(created.status, "DRAFT");
  await json<RequestResponse>(await fetch(`${api}/signature-requests/${created.id}/send`, { method: "POST", headers: { cookie } }));

  const firstToken = await waitFor(latestSignerToken);
  const firstReview = await json<SignerReview>(await fetch(`${api}/signer/${firstToken}`));
  assert.equal(firstReview.recipient.email, firstEmail);
  const firstFields = new Map(firstReview.fields.map((field) => [field.type, field.id] as const));
  const signatureFieldId = firstFields.get("SIGNATURE");
  const nameFieldId = firstFields.get("NAME");
  assert.ok(signatureFieldId && nameFieldId, "The first signer did not receive signature and name fields.");
  await json<unknown>(await fetch(`${api}/signer/${firstToken}/complete`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ consent: true, fields: [
      { fieldId: signatureFieldId, imageDataUrl: signaturePng },
      { fieldId: nameFieldId, value: "First Recipient" },
    ] }),
  }));

  const secondToken = await waitFor(async () => {
    const token = await latestSignerToken();
    return token && token !== firstToken ? token : null;
  });
  const secondReview = await json<SignerReview>(await fetch(`${api}/signer/${secondToken}`));
  assert.equal(secondReview.recipient.email, secondEmail);
  const inputField = secondReview.fields.find((field) => field.type === "INPUT");
  assert.ok(inputField, "The second signer did not receive the input field.");
  await json<unknown>(await fetch(`${api}/signer/${secondToken}/complete`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ consent: true, fields: [{ fieldId: inputField.id, value: "Approved by integration test" }] }),
  }));

  const completed = await waitFor(async () => {
    const current = await json<RequestResponse>(await fetch(`${api}/signature-requests/${created.id}`, { headers: { cookie } }));
    return current.status === "COMPLETED" ? current : null;
  }, 45_000);
  assert.equal(completed.document.completed, true);
  assert.ok(completed.recipients.every((recipient) => recipient.status === "COMPLETED"));

  const download = await json<CompletedDownload>(await fetch(`${api}/signature-requests/${created.id}/completed-download`, { headers: { cookie } }));
  const completedPdf = await fetch(download.url);
  assert.ok(completedPdf.ok);
  assert.match(completedPdf.headers.get("content-type") ?? "", /application\/pdf/);
  assert.ok((await completedPdf.arrayBuffer()).byteLength > pdfBytes.byteLength);

  const audit = await json<AuditEvent[]>(await fetch(`${api}/signature-requests/${created.id}/audit`, { headers: { cookie } }));
  const eventTypes = audit.map((event) => event.eventType);
  for (const required of ["REQUEST_CREATED", "REQUEST_SENT", "SIGNER_VIEWED", "RECIPIENT_COMPLETED", "REQUEST_COMPLETED"]) {
    assert.ok(eventTypes.includes(required));
  }
  const firstAuditEvent = audit[0];
  assert.ok(firstAuditEvent, "The audit timeline was empty.");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await assert.rejects(
      () => client.query("UPDATE signature_request_audit_events SET event_type = 'MUTATED' WHERE id = $1", [firstAuditEvent.id]),
      /append-only/,
    );
  } finally {
    await client.end();
  }

  const completionMail = await waitFor(async () => {
    const response = await fetch(`${mailpit}/api/v1/message/latest/raw`);
    if (!response.ok) return null;
    const raw = await response.text();
    return raw.includes(`Completed: E2E request ${suffix}`) ? raw : null;
  });
  assert.match(completionMail, /completed PDF/i);
});
