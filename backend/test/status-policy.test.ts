import assert from "node:assert/strict";
import test from "node:test";
import { RecipientStatus, SignatureRequestStatus } from "../src/common/enums";
import { activeRecipientIndexes, aggregateRequestStatus } from "../src/signature-requests/status-policy";

void test("parallel mode activates every incomplete recipient", () => {
  assert.deepEqual(activeRecipientIndexes("PARALLEL", [
    { orderIndex: 0, status: RecipientStatus.SENT },
    { orderIndex: 1, status: RecipientStatus.COMPLETED },
    { orderIndex: 2, status: RecipientStatus.WAITING },
  ]), [0, 2]);
});

void test("sequential mode activates only the first incomplete recipient", () => {
  assert.deepEqual(activeRecipientIndexes("SEQUENTIAL", [
    { orderIndex: 0, status: RecipientStatus.COMPLETED },
    { orderIndex: 1, status: RecipientStatus.WAITING },
    { orderIndex: 2, status: RecipientStatus.WAITING },
  ]), [1]);
});

void test("status aggregation tracks delivery, view, and partial completion", () => {
  assert.equal(aggregateRequestStatus(SignatureRequestStatus.SENT, [RecipientStatus.DELIVERED]), SignatureRequestStatus.DELIVERED);
  assert.equal(aggregateRequestStatus(SignatureRequestStatus.DELIVERED, [RecipientStatus.VIEWED]), SignatureRequestStatus.VIEWED);
  assert.equal(aggregateRequestStatus(SignatureRequestStatus.VIEWED, [RecipientStatus.COMPLETED, RecipientStatus.WAITING]), SignatureRequestStatus.PARTIALLY_SIGNED);
});
