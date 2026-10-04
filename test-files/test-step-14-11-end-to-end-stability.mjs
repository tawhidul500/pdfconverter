import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const runnerBytes = readFileSync("RUN_NOVAPDF_ALL.cmd");
const runner = runnerBytes.toString("utf8");
const compose = read("docker-compose.yml");
const launcher = read("scripts/start-novapdf-dev.mjs");
const home = read("src/components/home-page.tsx");
const versionRoute = read("src/app/api/novapdf/version/route.ts");
const preflight = read("scripts/prepare-windows-runtime.ps1");
const converterHelper = read("START_PDF_CONVERTER.cmd");
const converterPreflight = read("scripts/prepare-converter-runtime.ps1");

const checks = [
  [compose.startsWith("name: novapdf-local"), "stable Compose project name"],
  [runner.includes("set \"COMPOSE_PROJECT_NAME=novapdf-local\""), "runner stable Compose project"],
  [runner.includes("prepare-windows-runtime.ps1"), "runtime preflight"],
  [runner.includes("verify-web-version.ps1"), "exact Web version verification"],
  [runner.includes("npm.cmd run start:worker") || runner.includes("start-production-windows.ps1"), "production worker launch"],
  [runner.includes("node.exe \"%ROOT%\\node_modules\\typescript\\bin\\tsc\" --noEmit"), "local semantic TypeScript CLI"],
  [!runner.includes("call :url_once"), "no stale web reuse"],
  [!runner.includes("docker compose down -v"), "no Docker volume deletion"],
  [!runner.includes("npm audit fix"), "no automatic audit fix"],
  [versionRoute.includes('version: VERSION') && versionRoute.includes('const VERSION = "0.14.16"'), "version endpoint"],
  [launcher.includes("checkExistingWeb") && launcher.includes("expectedWebVersion = \"0.14.16\""), "dev stale-port guard"],
  [(home.includes('Build Step 14.13 · Searchable Layout OCR') || home.includes('Build Step 14.16 · Editable Layout Object Parity Corrective')) && !home.includes("suppressHydrationWarning"), "deterministic footer stamp"],
  [preflight.includes("Stop-NovaPdfListener") && preflight.includes("Stop-LegacyNovaPdfContainers"), "safe legacy cleanup"],
  [preflight.includes("docker.exe stop") && !preflight.includes("docker.exe rm") && !preflight.includes("volume rm"), "containers stopped, volumes preserved"],
  [converterHelper.includes("COMPOSE_PROJECT_NAME=novapdf-local"), "converter helper stable Compose project"],
  [converterPreflight.includes("pdf-converter") && !converterPreflight.includes("volume rm"), "converter helper stops only legacy converter containers"],
  [runnerBytes.includes(Buffer.from("\r\n")) && !runnerBytes.includes(Buffer.from([0xef, 0xbb, 0xbf])), "CRLF runner without BOM"],
];
for (const [condition, label] of checks) assert.ok(condition, label);
console.log(`Step 14.12 end-to-end stability contract passed (${checks.length} checks).`);
