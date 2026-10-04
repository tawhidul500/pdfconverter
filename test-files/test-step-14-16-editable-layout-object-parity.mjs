import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");
const lock = require("../package-lock.json");
const read = (path) => readFileSync(path, "utf8");
const converter = read("conversion-service/app/converter.py");
const tests = read("conversion-service/tests/test_converter.py");
const workspace = read("src/components/pdf-to-word-workspace.tsx");
const service = read("conversion-service/app/main.py");
const versionRoute = read("src/app/api/novapdf/version/route.ts");
const runner = read("RUN_NOVAPDF_ALL.cmd");
const home = read("src/components/home-page.tsx");

const checks = [
  [pkg.version === "0.14.16", "package version"],
  [lock.version === "0.14.16" && lock.packages?.[""]?.version === "0.14.16", "lock version"],
  [service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"'), "converter service version"],
  [versionRoute.includes('const VERSION = "0.14.16"') && versionRoute.includes('buildStep: "14.16"'), "web version route"],
  [converter.includes("def _render_residual_artwork"), "cropped residual artwork renderer"],
  [converter.includes("fully reconstructable pages receive no fallback image"), "no full-page native fallback policy"],
  [converter.includes("_font_traits(raw_font_name, weight)"), "font style detection before font mapping"],
  [converter.includes("object_color = _page_object_color(text_object, fill=True)"), "text color fallback"],
  [converter.includes("def _append_native_table"), "real Word table writer"],
  [converter.includes("def _append_native_shape"), "selectable Word shape writer"],
  [converter.includes("def _append_floating_picture"), "independent Word picture writer"],
  [tests.includes("self.assertNotIn('behindDoc=\"1\"', document_xml)"), "native background absence test"],
  [tests.includes('self.assertIn("<w:b", document_xml)'), "bold style parity test"],
  [tests.includes("self.assertIn('w:val=\"9C4A00\"', document_xml)"), "text color parity test"],
  [workspace.includes("does not place the original native PDF page behind them"), "user-facing no-background copy"],
  [workspace.includes("Scanned pages remain image-based"), "scan limitation copy"],
  [runner.includes('set "EXPECTED_WEB_VERSION=0.14.16"'), "runner current-version gate"],
  [runner.includes("WINDOWS_VALIDATION_STEP_14_16.md"), "runner current checklist"],
  [home.includes("Build Step 14.16 · Editable Layout Object Parity Corrective"), "home build stamp"],
  [!runner.includes("docker compose down -v") && !runner.includes("npm audit fix"), "volume and audit safety"],
];
for (const [condition, label] of checks) assert.ok(condition, `Step 14.16 editable-layout object parity failed: ${label}`);
console.log(`Step 14.16 editable-layout object parity contract passed (${checks.length} checks).`);
