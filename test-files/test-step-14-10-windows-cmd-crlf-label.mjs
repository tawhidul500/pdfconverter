import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const bytes = (file) => readFileSync(resolve(root, file));
const text = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(text("package.json"));
const lock = JSON.parse(text("package-lock.json"));
const runnerBytes = bytes("RUN_NOVAPDF_ALL.cmd");
const repairBytes = bytes("START_PDF_CONVERTER.cmd");
const runner = runnerBytes.toString("utf8");
const service = text("conversion-service/app/main.py");

function hasOnlyCrLf(buffer) {
  let lf = 0;
  let crlf = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] === 0x0a) {
      lf += 1;
      if (index > 0 && buffer[index - 1] === 0x0d) crlf += 1;
    }
  }
  return lf > 0 && lf === crlf;
}

const checks = [
  ["Step 14.10 release version", ["0.14.10", "0.14.16"].includes(pkg.version)],
  ["package lock matches release", ["0.14.10", "0.14.16"].includes(lock.version) && lock.packages?.[""]?.version === lock.version],
  ["runner identifies Step 14.10", (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16"))],
  ["converter health identifies Step 14.10", (service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"'))],
  ["main Windows runner uses CRLF only", hasOnlyCrLf(runnerBytes)],
  ["converter repair runner uses CRLF only", hasOnlyCrLf(repairBytes)],
  ["batch files contain no UTF-8 BOM", !runnerBytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])) && !repairBytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))],
  ["startup preflight is inline", runner.includes("where powershell.exe >nul 2>&1") && !runner.includes("call :require_command")],
  ["required labels remain line anchored", /^:heading\r?$/m.test(runner) && /^:wait_for_docker\r?$/m.test(runner) && /^:failed\r?$/m.test(runner)],
  ["current Windows checklist opens", (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md"))],
  ["migration parser remains", runner.includes("verify-migration-show.mjs")],
  ["Webpack development correction remains", text("scripts/start-novapdf-dev.mjs").includes('[nextCliPath, "dev", "--webpack"]')],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(runner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner)],
];
for (const [name, passed] of checks) assert.ok(passed, `Step 14.10 Windows CMD corrective failed: ${name}`);
console.log(`Step 14.10 Windows CMD CRLF/label contract passed (${checks.length} checks).`);
