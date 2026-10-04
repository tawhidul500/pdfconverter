import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const launcher = read("scripts/start-novapdf-dev.mjs");
const runner = read("RUN_NOVAPDF_ALL.cmd");
const service = read("conversion-service/app/main.py");

const checks = [
  ["Step 14.7 release version", ["0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["package lock matches release", ["0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(lock.version) && lock.packages?.[""]?.version === lock.version],
  ["runner identifies Step 14.7", (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16"))))],
  ["converter health identifies Step 14.7", (service.includes('version="0.14.7"') && service.includes('"version": "0.14.7"')) || (service.includes('version="0.14.8"') && service.includes('"version": "0.14.8"')) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"')))) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"'))))],
  ["launcher uses current Node executable", launcher.includes('spawn(process.execPath, [nextCliPath, "dev"')],
  ["launcher resolves the local Next CLI", launcher.includes('"node_modules", "next", "dist", "bin", "next"')],
  ["launcher does not spawn npx.cmd", !launcher.includes("nextCommand") && !/spawn\([^\n]*npx\.cmd/i.test(launcher)],
  ["launcher avoids shell execution", !/shell\s*:\s*true/.test(launcher)],
  ["launcher sets project cwd", launcher.includes("cwd: projectRoot")],
  ["launcher handles spawn errors", launcher.includes('child.on("error"')],
  ["missing install has controlled guidance", launcher.includes("Run npm.cmd ci")],
  ["current Windows checklist opens", (runner.includes("WINDOWS_VALIDATION_STEP_14_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_8.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_9.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md"))))],
  ["migration apply/verify correction remains", runner.indexOf("Applying the committed PostgreSQL migration") < runner.indexOf("Verifying the committed PostgreSQL migration is applied")],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(runner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner)],
];
for (const [name, passed] of checks) assert.ok(passed, `Step 14.7 launcher corrective contract failed: ${name}`);
console.log(`Step 14.7 Windows Node 24 development launcher contract passed (${checks.length} checks).`);
