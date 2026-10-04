import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const runner = read("RUN_NOVAPDF_ALL.cmd");
const parser = resolve(root, "scripts/verify-migration-show.mjs");
const service = read("conversion-service/app/main.py");
const migration = "CreateSignatureRequestBackend1721800000000";

const checks = [
  ["Step 14.8 release version", ["0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["package lock matches release", ["0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(lock.version) && lock.packages?.[""]?.version === lock.version],
  ["runner identifies Step 14.8", (runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16"))))],
  ["converter health identifies Step 14.8", (service.includes('version="0.14.8"') && service.includes('"version": "0.14.8"')) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"'))))],
  ["runner invokes the dedicated migration parser", runner.includes('node.exe "%ROOT%\\scripts\\verify-migration-show.mjs" "%MIGRATION_SHOW_LOG%"')],
  ["brittle exact findstr check removed", !runner.includes('findstr /L /C:"[X] CreateSignatureRequestBackend1721800000000"')],
  ["migration apply remains before show verification", runner.indexOf("Applying the committed PostgreSQL migration") < runner.indexOf("Verifying the committed PostgreSQL migration is applied")],
  ["idempotency confirmation remains after verification", runner.indexOf("Confirming the PostgreSQL migration is idempotent") > runner.indexOf("Verifying the committed PostgreSQL migration is applied")],
  ["current Windows checklist opens", (runner.includes("WINDOWS_VALIDATION_STEP_14_8.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_9.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md"))))],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(runner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner)],
];
for (const [name, passed] of checks) assert.ok(passed, `Step 14.8 migration parser corrective failed: ${name}`);

const dir = mkdtempSync(join(tmpdir(), "novapdf-migration-parser-"));
try {
  const cases = [
    ["typeorm-counter.log", `[X] 1 ${migration}\n`, 0],
    ["legacy-no-counter.log", `[X] ${migration}\n`, 0],
    ["ansi.log", `\u001b[32m[X] 12 ${migration}\u001b[0m\n`, 0],
    ["pending.log", `[ ] 1 ${migration}\n`, 1],
    ["wrong.log", `[X] 1 OtherMigration123\n`, 1],
  ];
  for (const [name, content, expected] of cases) {
    const file = join(dir, name);
    writeFileSync(file, content);
    const result = spawnSync(process.execPath, [parser, file], { encoding: "utf8" });
    assert.equal(result.status, expected, `${name} expected exit ${expected}, got ${result.status}: ${result.stderr}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`Step 14.8 migration-show output parser contract passed (${checks.length} source checks plus 5 functional fixtures).`);
