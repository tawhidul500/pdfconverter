import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
  [converter.includes("def _render_residual_artwork"), "native-page residual artwork isolation"],
  [converter.includes("def _detect_rectangle_cell_tables"), "rectangle-cell table reconstruction"],
  [converter.includes("def _detect_line_grid_tables"), "line-grid table reconstruction"],
  [converter.includes("def _append_native_table"), "native Word table writer"],
  [converter.includes("def _append_native_shape"), "native Word shape writer"],
  [converter.includes("def _append_floating_picture"), "independent Word picture writer"],
  [tests.includes("test_hybrid_line_grid_tables_are_native_and_background_is_clean"), "line-grid and black-spot regression test"],
  [tests.includes("self.assertNotIn('behindDoc=\"1\"', document_xml)"), "no native page-background regression assertion"],
  [existsSync("conversion-service/tests/fixtures/line-grid-layout.pdf"), "line-grid regression fixture"],
  [workspace.includes("independent Word objects"), "native-object UI copy"],
  [runner.includes('set "EXPECTED_WEB_VERSION=0.14.16"'), "runner current-version gate"],
  [runner.includes("WINDOWS_VALIDATION_STEP_14_16.md"), "runner current checklist"],
  [runner.includes("converter-native-objects-!RUN_ID!.txt"), "runner converter regression log"],
  [home.includes("Build Step 14.16"), "home build stamp"],
  [!runner.includes("docker compose down -v") && !runner.includes("npm audit fix"), "volume and audit safety"],
];
for (const [condition, label] of checks) assert.ok(condition, `Step 14.16 editable native-object corrective failed: ${label}`);
console.log(`Step 14.16 editable native-object corrective contract passed (${checks.length} checks).`);
