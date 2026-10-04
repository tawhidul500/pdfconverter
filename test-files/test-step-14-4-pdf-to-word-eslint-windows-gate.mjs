import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const workspace = read("src/components/pdf-to-word-workspace.tsx");
const runner = read("RUN_NOVAPDF_ALL.cmd");
const service = read("conversion-service/app/main.py");

const healthEffect = workspace.slice(
  workspace.indexOf('useEffect(() => {\n    if (!editorOpen || !isActive) return;\n    let stopped = false;'),
  workspace.indexOf('  }, [converterProbeToken, editorOpen, isActive]);') + 55,
);

const checks = [
  ["Step 14.4 release version", ["0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["package lock matches release", ["0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(lock.version) && lock.packages?.[""]?.version === lock.version],
  ["health effect no longer performs synchronous state writes", !healthEffect.includes('setConverterState("checking")') && !healthEffect.includes('setConverterMessage("Checking the local converter…")')],
  ["explicit retry still enters checking state", workspace.includes('function retryConverter()') && workspace.includes('setConverterState("checking")') && workspace.includes('setConverterProbeToken((value) => value + 1)')],
  ["NovaPDF service apostrophe is escaped", workspace.includes("NovaPDF&apos;s local Word service") && !workspace.includes("NovaPDF's local Word service")],
  ["document length apostrophe is escaped", workspace.includes("document&apos;s length") && !workspace.includes("document's length")],
  ["PDF selectable-text apostrophe is escaped", workspace.includes("PDF&apos;s existing selectable text") && !workspace.includes("PDF's existing selectable text")],
  ["runner identifies Step 14.4", runner.includes("NovaPDF v0.14.4") || runner.includes("NovaPDF v0.14.5") || runner.includes("NovaPDF v0.14.6") || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16")))) || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16"))))],
  ["converter health identifies Step 14.4", (service.includes('version="0.14.4"') && service.includes('"version": "0.14.4"')) || (service.includes('version="0.14.5"') && service.includes('"version": "0.14.5"')) || ((service.includes('version="0.14.6"') && service.includes('"version": "0.14.6"')) || ((service.includes('version="0.14.7"') && service.includes('"version": "0.14.7"')) || (service.includes('version="0.14.8"') && service.includes('"version": "0.14.8"')) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"')))))) || ((service.includes('version="0.14.7"') && service.includes('"version": "0.14.7"')) || (service.includes('version="0.14.8"') && service.includes('"version": "0.14.8"')) || ((service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"')))))],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(runner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner)],
];

for (const [name, passed] of checks) assert.ok(passed, `Step 14.4 Windows ESLint corrective contract failed: ${name}`);
console.log(`Step 14.4 Windows ESLint corrective contract passed (${checks.length} checks).`);
