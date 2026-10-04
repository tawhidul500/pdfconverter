import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");
const lock = require("../package-lock.json");
const read = (path) => readFileSync(path, "utf8");
const workspace = read("src/components/pdf-to-word-workspace.tsx");
const converter = read("conversion-service/app/converter.py");
const converterTests = read("conversion-service/tests/test_converter.py");
const service = read("conversion-service/app/main.py");
const runner = read("RUN_NOVAPDF_ALL.cmd");
const versionRoute = read("src/app/api/novapdf/version/route.ts");
const home = read("src/components/home-page.tsx");

const checks = [
  [pkg.version === "0.14.16", "package version"],
  [lock.version === "0.14.16" && lock.packages?.[""]?.version === "0.14.16", "package lock version"],
  [workspace.includes('setLayoutPriority("visual");') && !workspace.includes('setLayoutPriority("visual");\n                    setUseOcr(false);'), "visual layout no longer disables OCR"],
  [!workspace.includes('disabled={layoutPriority !== "editable"}'), "OCR controls enabled in preserve-layout mode"],
  [workspace.includes('useOcr,') && !workspace.includes('useOcr: useOcr && layoutPriority === "editable"'), "service receives OCR in every layout mode"],
  [workspace.includes('layout preserved + searchable OCR'), "review summary identifies combined mode"],
  [workspace.includes('Keep the page image and add searchable text'), "combined mode user explanation"],
  [converter.includes("def _append_hidden_search_layer"), "hidden searchable layer helper"],
  [converter.includes("run.font.hidden = True") && converter.includes('OxmlElement("w:noProof")'), "hidden Word run implementation"],
  [converter.includes("lines = _native_lines(page) if native_text else _ocr_lines(page, language)"), "native text preferred over OCR"],
  [converter.includes("used_ocr, native = _append_visual_page"), "visual conversion reports OCR/native page counts"],
  [converterTests.includes("test_preserve_layout_with_scanned_ocr_search_layer"), "scanned searchable-layout test"],
  [converterTests.includes("test_preserve_layout_with_native_search_layer"), "digital searchable-layout test"],
  [converterTests.includes("test_preserve_layout_with_bangla_ocr_search_layer"), "Bangla searchable-layout test"],
  [converterTests.includes('self.assertIn("<w:vanish", document_xml)'), "OOXML hidden layer assertion"],
  [service.includes('version="0.14.16"') && service.includes('"version": "0.14.16"'), "converter service version"],
  [runner.includes("NovaPDF v0.14.16") && runner.includes("WINDOWS_VALIDATION_STEP_14_16.md"), "current Windows runner"],
  [versionRoute.includes('const VERSION = "0.14.16"'), "web version endpoint"],
  [(home.includes("Build Step 14.13 · Searchable Layout OCR") || home.includes("Build Step 14.16 · Editable Layout Object Parity Corrective")), "current build stamp"],
  [!runner.includes("docker compose down -v") && !runner.includes("npm audit fix"), "volume and audit safety"],
];
for (const [condition, label] of checks) assert.ok(condition, label);
console.log(`Step 14.13 preserve-layout searchable OCR contract passed (${checks.length} checks).`);
