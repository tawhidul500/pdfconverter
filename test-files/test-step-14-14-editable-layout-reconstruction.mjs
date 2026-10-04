import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");
const lock = require("../package-lock.json");
const read = (path) => readFileSync(path, "utf8");
const workspace = read("src/components/pdf-to-word-workspace.tsx");
const client = read("src/lib/pdf-to-word-service.ts");
const converter = read("conversion-service/app/converter.py");
const service = read("conversion-service/app/main.py");
const requirements = read("conversion-service/requirements.txt");
const tests = read("conversion-service/tests/test_converter.py");
const runner = read("RUN_NOVAPDF_ALL.cmd");
const home = read("src/components/home-page.tsx");

const checks = [
  [pkg.version === "0.14.16", "package version"],
  [lock.version === "0.14.16" && lock.packages?.[""]?.version === "0.14.16", "lock version"],
  [workspace.includes('type LayoutPriority = "visual" | "hybrid" | "editable"'), "three layout modes"],
  [workspace.includes("Editable layout (Beta)"), "hybrid UI option"],
  [workspace.includes("Editable text, tables, shapes + pictures"), "hybrid UI description"],
  [workspace.includes("Scanned pages remain image-based"), "honest reconstruction limitation"],
  [workspace.includes("editable layout + smart OCR"), "hybrid review summary"],
  [client.includes('layoutMode: "visual" | "editable" | "hybrid"'), "client hybrid type"],
  [service.includes('layout_mode in {"visual", "editable", "hybrid"}'), "API hybrid mapping"],
  [converter.includes('LayoutMode = Literal["editable", "visual", "hybrid"]'), "converter hybrid type"],
  [converter.includes("def _native_positioned_blocks"), "native positioned text extraction"],
  [converter.includes("def _ocr_positioned_blocks"), "OCR positioned text extraction"],
  [converter.includes("def _deduplicate_ocr_blocks"), "native/OCR deduplication"],
  [converter.includes("def _render_residual_artwork"), "hybrid visual background"],
  [converter.includes("cv2.inpaint"), "recognized text removal"],
  [converter.includes("def _append_positioned_textbox"), "editable textbox construction"],
  [converter.includes('shape.set("id", f"NovaPDFEditableText{shape_id}")'), "named editable VML textboxes"],
  [converter.includes('qn("w:txbxContent")'), "Word textbox content"],
  [requirements.includes("numpy==2.3.5"), "NumPy pin"],
  [requirements.includes("opencv-python-headless==4.13.0.92"), "OpenCV pin"],
  [tests.includes("test_hybrid_native_layout_uses_editable_positioned_text"), "native hybrid test"],
  [tests.includes("test_hybrid_scanned_layout_uses_visible_ocr_textboxes"), "scanned hybrid test"],
  [tests.includes('self.assertNotIn("<w:vanish", document_xml)'), "visible text assertion"],
  [service.includes('version="0.14.16"') && service.includes("pdfium-python-docx-tesseract-opencv"), "service version and engine"],
  [home.includes("Build Step 14.16 · Editable Layout Object Parity Corrective") && runner.includes("WINDOWS_VALIDATION_STEP_14_16.md") && !runner.includes("docker compose down -v") && !runner.includes("npm audit fix"), "release stamp, checklist, and safety"],
];
for (const [condition, label] of checks) assert.ok(condition, `Step 14.14 editable-layout reconstruction failed: ${label}`);
console.log(`Step 14.14 editable-layout reconstruction contract passed (${checks.length} checks).`);
