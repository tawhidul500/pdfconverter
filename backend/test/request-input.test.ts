import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { SignatureFieldType, SigningMode } from "../src/common/enums";
import { parseCreateRequestInput } from "../src/signature-requests/request-input";

const valid = {
  title: "Quarterly approval",
  signingMode: SigningMode.SEQUENTIAL,
  recipients: [
    { clientId: "first", name: "First Signer", email: "first@example.test" },
    { clientId: "second", name: "Second Signer", email: "second@example.test" },
  ],
  fields: [
    { recipientClientId: "first", pageNumber: 1, type: SignatureFieldType.SIGNATURE, x: 0.5, y: 0.5, width: 0.25, height: 0.08, required: true },
    { recipientClientId: "second", pageNumber: 1, type: SignatureFieldType.INPUT, x: 0.5, y: 0.7, width: 0.3, height: 0.06, required: true },
  ],
};

void test("normalizes recipients and preserves recipient-specific fields", () => {
  const parsed = parseCreateRequestInput(JSON.stringify(valid));
  assert.equal(parsed.recipients.length, 2);
  assert.deepEqual(parsed.recipients.map((item) => item.orderIndex), [0, 1]);
  assert.equal(parsed.fields[1].recipientClientId, "second");
  assert.equal(parsed.expiresInDays, 7);
});

void test("rejects a recipient without assigned fields", () => {
  const input = structuredClone(valid);
  input.fields = input.fields.slice(0, 1);
  assert.throws(() => parseCreateRequestInput(JSON.stringify(input)), BadRequestException);
});

void test("rejects duplicate recipient emails", () => {
  const input = structuredClone(valid);
  input.recipients[1].email = input.recipients[0].email;
  assert.throws(() => parseCreateRequestInput(JSON.stringify(input)), BadRequestException);
});
