import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const workspace = read("src/components/pdf-to-word-workspace.tsx");
const client = read("src/lib/pdf-to-word-service.ts");
const proxy = read("src/lib/server/pdf-converter-proxy.ts");
const healthRoute = read("src/app/api/pdf-to-word/health/route.ts");
const analyzeRoute = read("src/app/api/pdf-to-word/analyze/route.ts");
const convertRoute = read("src/app/api/pdf-to-word/convert/route.ts");
const devLauncher = read("scripts/start-novapdf-dev.mjs");
const repairRunner = read("START_PDF_CONVERTER.cmd");
const mainRunner = read("RUN_NOVAPDF_ALL.cmd");
const css = read("src/app/globals.css");

const checks = [
  ["Step 14.3 release version", ["0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["browser calls same-origin proxy instead of port 4010", client.includes('const PROXY_BASE = "/api/pdf-to-word"') && !client.includes('DEFAULT_CONVERTER_URL = "http://localhost:4010"')],
  ["server proxy owns the converter address", proxy.includes('DEFAULT_CONVERTER_URL = "http://127.0.0.1:4010"') && proxy.includes("PDF_CONVERTER_INTERNAL_URL")],
  ["health proxy returns controlled 503 responses", proxy.includes('code: "CONVERTER_OFFLINE"') && proxy.includes("status: 503")],
  ["all converter proxy routes exist", healthRoute.includes('proxyPdfConverter("/health"') && analyzeRoute.includes('/api/v1/pdf-to-word/analyze') && convertRoute.includes('/api/v1/pdf-to-word/convert')],
  ["React cleanup no longer aborts the health probe", !workspace.includes("controller.abort();") && workspace.includes("window.clearInterval(timer)")],
  ["analysis waits for online converter", workspace.includes('converterState !== "online"') && workspace.includes("analysisInFlightRef")],
  ["network failure remains pending instead of generating repeated unhandled calls", workspace.includes("isPdfConverterUnavailableError") && workspace.includes('setConverterState("offline")')],
  ["offline primary action is clickable retry", workspace.includes('Retry converter') && !workspace.includes('status === "processing" || converterState !== "online"')],
  ["service status provides a retry control and diagnostic message", workspace.includes("converterMessage") && workspace.includes("pdf-word-service-actions") && css.includes(".pdf-word-service-actions button")],
  ["npm dev attempts to start converter before Next", pkg.scripts.dev === "node scripts/start-novapdf-dev.mjs" && devLauncher.includes('docker') && devLauncher.includes('pdf-converter') && devLauncher.includes('next')],
  ["dedicated converter repair runner exists", repairRunner.includes("--force-recreate pdf-converter") && repairRunner.includes("http://127.0.0.1:4010/health")],
  ["main runner explicitly builds converter and emits logs on failure", mainRunner.includes("docker compose up -d --build pdf-converter") && mainRunner.includes("docker compose logs --tail 200 pdf-converter")],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(repairRunner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(repairRunner) && !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(mainRunner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(repairRunner) && !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(mainRunner)],
];

for (const [name, passed] of checks) assert.ok(passed, `Step 14.3 converter startup/proxy contract failed: ${name}`);
console.log(`Step 14.3 PDF to Word converter startup/proxy contract passed (${checks.length} checks).`);
