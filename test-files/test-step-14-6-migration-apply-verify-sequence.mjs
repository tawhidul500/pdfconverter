import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const runner = read("RUN_NOVAPDF_ALL.cmd");
const service = read("conversion-service/app/main.py");

const applyLabel = 'set "FAILED_STEP=Applying the committed PostgreSQL migration"';
const showLabel = 'set "FAILED_STEP=Verifying the committed PostgreSQL migration is applied"';
const confirmLabel = 'set "FAILED_STEP=Confirming the PostgreSQL migration is idempotent"';
const applyIndex = runner.indexOf(applyLabel);
const showIndex = runner.indexOf(showLabel);
const confirmIndex = runner.indexOf(confirmLabel);

const checks = [
  ["Step 14.6 release version", ["0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["package lock matches release", ["0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(lock.version) && lock.packages?.[""]?.version === lock.version],
  ["runner identifies Step 14.6", runner.includes("NovaPDF v0.14.6") || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16")))) || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16"))))],
  ["converter health identifies Step 14.6", ((service.includes('version="0.14.6"') && service.includes('"version": "0.14.6"')) || ((service.includes('version="0.14.7"') && service.includes('"version": "0.14.7"')) || (service.includes('version="0.14.8"') && service.includes('"version": "0.14.8"')) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"')))))) || ((service.includes('version="0.14.7"') && service.includes('"version": "0.14.7"')) || (service.includes('version="0.14.8"') && service.includes('"version": "0.14.8"')) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"')))))],
  ["migration apply occurs before migration show", applyIndex >= 0 && showIndex > applyIndex],
  ["migration idempotency confirmation occurs after migration show", confirmIndex > showIndex],
  ["first migration run is captured", runner.includes('migration:run > "%MIGRATION_APPLY_LOG%"')],
  ["applied migration is verified", runner.includes('[X] CreateSignatureRequestBackend1721800000000') || runner.includes("verify-migration-show.mjs")],
  ["second migration run requires no pending migrations", runner.includes('migration:run > "%MIGRATION_CONFIRM_LOG%"') && runner.includes('No migrations are pending')],
  ["current Windows checklist opens", runner.includes('WINDOWS_VALIDATION_STEP_14_6.md') || (runner.includes('WINDOWS_VALIDATION_STEP_14_7.md') || runner.includes('WINDOWS_VALIDATION_STEP_14_8.md') || (runner.includes('WINDOWS_VALIDATION_STEP_14_9.md') || (runner.includes('WINDOWS_VALIDATION_STEP_14_10.md') || runner.includes('WINDOWS_VALIDATION_STEP_14_16.md')))) || (runner.includes('WINDOWS_VALIDATION_STEP_14_7.md') || runner.includes('WINDOWS_VALIDATION_STEP_14_8.md') || (runner.includes('WINDOWS_VALIDATION_STEP_14_9.md') || (runner.includes('WINDOWS_VALIDATION_STEP_14_10.md') || runner.includes('WINDOWS_VALIDATION_STEP_14_16.md'))))],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(runner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner)],
];
for (const [name, passed] of checks) assert.ok(passed, `Step 14.6 migration corrective contract failed: ${name}`);
console.log(`Step 14.6 migration apply/verify sequence contract passed (${checks.length} checks).`);
