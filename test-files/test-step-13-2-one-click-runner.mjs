import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const runner = readFileSync(resolve(root, "RUN_NOVAPDF_ALL.cmd"), "utf8");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const windowsGuide = readFileSync(resolve(root, "WINDOWS_VALIDATION_STEP_13_2.md"), "utf8");

let checks = 0;
function has(value, message) {
  assert.ok(runner.includes(value), message);
  checks += 1;
}
function lacksCommand(pattern, message) {
  assert.ok(!pattern.test(runner), message);
  checks += 1;
}

assert.ok(["0.13.2", "0.13.3", "0.13.4", "0.13.5", "0.13.6", "0.13.7", "0.14.0", "0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)); checks += 1;
has("https://registry.npmjs.org/", "runner must enforce the public npm registry");
has("docker compose up -d postgres redis minio mailpit", "runner must start preserved local infrastructure");
has("docker compose run --rm minio-init", "runner must initialize the private MinIO bucket");
has("npm.cmd ci --registry=", "runner must perform a root clean install");
has("npm.cmd run lint", "runner must run root/backend lint gates");
assert.ok(runner.includes("npx.cmd tsc --noEmit") || runner.includes("node_modules\\typescript\\bin\\tsc"), "runner must run root semantic TypeScript"); checks += 1;
has("npm.cmd run test:contracts", "runner must run all source contracts");
has("npm.cmd run test:pdf-engines", "runner must run PDF-engine tests");
has("npm.cmd run build", "runner must run production builds");
has("npm.cmd install --package-lock-only", "runner must generate a fresh backend lock");
has("npm.cmd run typecheck", "runner must run backend semantic TypeScript");
has("npm.cmd run test:metadata", "runner must run the metadata regression test");
has("migration:show", "runner must inspect migration state");
assert.ok(runner.includes("[X] CreateSignatureRequestBackend1721800000000") || runner.includes("verify-migration-show.mjs"), "runner must verify the committed migration"); checks += 1;
has("No migrations are pending", "runner must require no pending migration");
assert.ok(runner.includes("start-production-windows.ps1") || runner.includes("start \"NovaPDF Web\" cmd.exe /k"), "runner must launch a dedicated Web window"); checks += 1;
assert.ok(runner.includes("start-production-windows.ps1") || runner.includes("start \"NovaPDF API\" cmd.exe /k"), "runner must launch a dedicated API window"); checks += 1;
assert.ok(runner.includes("start-production-windows.ps1") || runner.includes("start \"NovaPDF Worker\" cmd.exe /k"), "runner must launch a dedicated Worker window"); checks += 1;
has("/api/v1/health/live", "runner must verify API liveness");
has("/api/v1/health/ready", "runner must verify API readiness");
has("npm.cmd run test:http-routes", "runner must run all 33 route checks");
has("RUN_BACKEND_E2E=1", "runner must opt into the real local backend E2E");
has("npm.cmd run test:e2e", "runner must execute the backend E2E");
has("http://localhost:3000/sign-pdf", "runner must open Sign PDF for manual verification");
has("http://localhost:3000/edit-pdf", "runner must open Edit PDF for manual verification");
has("validation-logs", "runner must capture validation artifacts");
has("if not exist \"%BACKEND%\\.env\"", "runner must preserve an existing backend environment file");
lacksCommand(/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im, "runner must never delete Docker volumes");
lacksCommand(/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im, "runner must never apply an automatic audit fix");
assert.match(windowsGuide, /double-click `RUN_NOVAPDF_ALL\.cmd`/i); checks += 1;
assert.match(windowsGuide, /production-provider/i); checks += 1;

console.log(`Step 13.2 one-click Windows runner contract passed (${checks} checks).`);
