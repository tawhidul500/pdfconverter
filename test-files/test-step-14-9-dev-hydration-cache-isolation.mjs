import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const launcher = read("scripts/start-novapdf-dev.mjs");
const config = read("next.config.ts");
const home = read("src/components/home-page.tsx");
const layout = read("src/app/layout.tsx");
const runner = read("RUN_NOVAPDF_ALL.cmd");
const service = read("conversion-service/app/main.py");

const checks = [
  ["Step 14.9 release version", ["0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["package lock matches release", ["0.14.9", "0.14.10", "0.14.16"].includes(lock.version) && lock.packages?.[""]?.version === lock.version],
  ["runner identifies Step 14.9", (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16")))],
  ["converter health identifies Step 14.9", (service.includes('version="0.14.9"') && service.includes('"version": "0.14.9"')) || ((service.includes('version="0.14.10"') && service.includes('"version": "0.14.10"')) || (service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"')))],
  ["development launcher uses Webpack", launcher.includes('[nextCliPath, "dev", "--webpack"]') && pkg.scripts["dev:web"] === "next dev --webpack"],
  ["development cache is isolated", launcher.includes('const devDistDirName = ".next-dev"') && launcher.includes("NOVAPDF_NEXT_DIST_DIR: devDistDirName")],
  ["stale development cache is removed", launcher.includes("rmSync(devDistDirPath, { recursive: true, force: true })")],
  ["production output remains default", config.includes('distDir: process.env.NOVAPDF_NEXT_DIST_DIR || ".next"')],
  ["allowed origins remain exact", config.includes('allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]')],
  ["build stamp remains hydration deterministic", (home.includes("useSyncExternalStore") && home.includes('HYDRATION_SAFE_BUILD_STAMP = "NovaPDF local workspace"')) || (!home.includes("useSyncExternalStore") && home.includes("function BuildStamp()"))],
  ["build stamp updates to current release", home.includes('CURRENT_BUILD_STAMP = "Build Step 14.10 · PDF to Word + OCR"') || home.includes('CURRENT_BUILD_STAMP = "Build Step 14.13 · Searchable Layout OCR"') || home.includes('CURRENT_BUILD_STAMP = "Build Step 14.16 · Editable Layout Object Parity Corrective"')],
  ["build stamp mismatch is scoped or eliminated", home.includes("<p suppressHydrationWarning>{label}</p>") || home.includes("return <p>{CURRENT_BUILD_STAMP}</p>")],
  ["stale Step 14.2 footer literal removed", !home.includes("<p>Build Step 14.2 · PDF to Word + OCR</p>")],
  ["SVG favicon is explicit", layout.includes('icons: { icon: "/icon.svg", shortcut: "/icon.svg" }')],
  ["current Windows checklist opens", (runner.includes("WINDOWS_VALIDATION_STEP_14_9.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md")))],
  ["migration parser correction remains", runner.includes("verify-migration-show.mjs")],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(runner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner)],
];
for (const [name, passed] of checks) assert.ok(passed, `Step 14.9 hydration/cache corrective failed: ${name}`);
console.log(`Step 14.9 development hydration/cache isolation contract passed (${checks.length} checks).`);
