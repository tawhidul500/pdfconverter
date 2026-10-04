import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";
import { HealthController } from "../src/health/health.controller";
import { SignatureRequestsController } from "../src/signature-requests/signature-requests.controller";
import { SignatureRequestsService } from "../src/signature-requests/signature-requests.service";
import { SignerController } from "../src/signer/signer.controller";
import { SignerService } from "../src/signer/signer.service";
import { StorageService } from "../src/storage/storage.service";
import { AuditEventEntity, AuthSessionEntity, DocumentEntity, EmailDeliveryEntity, RecipientEntity, SignatureFieldEntity, SignatureRequestEntity, UserEntity } from "../src/database/entities";

void test("ts-node runtime emits Nest constructor metadata and loads every TypeORM entity", () => {
  for (const target of [AuthController, AuthService, HealthController, SignatureRequestsController, SignatureRequestsService, SignerController, SignerService, StorageService]) {
    const parameters = Reflect.getMetadata("design:paramtypes", target) as unknown[] | undefined;
    assert.ok(parameters && parameters.length > 0, `${target.name} is missing design:paramtypes metadata`);
  }
  const entities = [UserEntity, AuthSessionEntity, DocumentEntity, SignatureRequestEntity, RecipientEntity, SignatureFieldEntity, AuditEventEntity, EmailDeliveryEntity];
  assert.equal(entities.length, 8);
  assert.ok(entities.every((entity) => typeof entity === "function"));
});
