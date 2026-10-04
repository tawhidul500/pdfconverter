import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const edit = read("src/components/edit-pdf-workspace.tsx");
const runner = read("RUN_NOVAPDF_ALL.cmd");
const service = read("conversion-service/app/main.py");
const checks = [
  ["Step 14.5 release version", ["0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["package lock matches release", ["0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(lock.version) && lock.packages?.[""]?.version === lock.version],
  ["legacy PDFDocumentProxy destroy calls removed", !edit.includes("await pdf.destroy();")],
  ["both Edit PDF preview effects destroy their loading tasks", (edit.match(/await task\.destroy\(\);/g) ?? []).length >= 2],
  ["runner identifies Step 14.5", runner.includes("NovaPDF v0.14.5") || runner.includes("NovaPDF v0.14.6") || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16")))) || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16"))))],
  ["converter health identifies Step 14.5", (service.includes('version="0.14.5"') && service.includes('"version": "0.14.5"')) || ((service.includes('version="0.14.6"') && service.includes('"version": "0.14.6"')) || ((service.includes('version="0.14.7"') && service.includes('"version": "0.14.7"')) || (service.includes('version="0.14.8"') && service.includes('"version": "0.14.8"')) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"')))))) || ((service.includes('version="0.14.7"') && service.includes('"version": "0.14.7"')) || (service.includes('version="0.14.8"') && service.includes('"version": "0.14.8"')) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"')))))],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(runner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner)],
];
for (const [name, passed] of checks) assert.ok(passed, `Step 14.5 TypeScript corrective contract failed: ${name}`);
console.log(`Step 14.5 TypeScript corrective contract passed (${checks.length} checks).`);
