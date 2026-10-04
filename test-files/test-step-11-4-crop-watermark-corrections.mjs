import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyTextWatermark } from "../src/lib/watermark-pdf.ts";

const cropSource = await readFile(new URL("../src/components/crop-pdf-workspace.tsx", import.meta.url), "utf8");
const watermarkSource = await readFile(new URL("../src/components/watermark-pdf-workspace.tsx", import.meta.url), "utf8");
const watermarkEngine = await readFile(new URL("../src/lib/watermark-pdf.ts", import.meta.url), "utf8");

assert.match(cropSource, /useState<AspectMode>\("original"\)/, "Crop PDF must default to Original aspect ratio.");
assert.doesNotMatch(cropSource, /useState<AspectMode>\("free"\)/, "Crop PDF must not default to Free aspect ratio.");
assert.match(cropSource, /setAspectMode\("original"\)/, "Crop reset/load must restore Original aspect ratio.");
assert.match(cropSource, /crop-editor-page-targeted rotate-editor-page-selected/, "Targeted Crop pages must receive the selected visual class.");
assert.match(cropSource, /aria-pressed=\{targeted\}/, "Crop page selection controls must expose the visible targeted state.");

assert.match(watermarkEngine, /text\?: string;/, "Watermark instances must support page-specific text.");
assert.match(watermarkSource, /function changeWatermarkText\(nextText: string\)/, "Watermark text changes must use a scope-aware handler.");
assert.match(watermarkSource, /editScopeRef\.current === "page"/, "This-page-only text edits must branch from all-page edits.");
assert.match(watermarkSource, /updateObject\(objectId, \(object\) => \(\{ \.\.\.object, text: nextText \}\)\)/, "This-page-only edits must update the selected page object.");
assert.match(watermarkSource, /commitObjects\(objectsRef\.current\.map\(\(object\) => \(\{ \.\.\.object, text: nextText \}\)\)\)/, "All-pages edits must update every affected watermark object.");
assert.match(watermarkSource, /value=\{editorText\}/, "The text editor must display the active scope's text.");
assert.match(watermarkSource, /\{textForObject\(object\)\}/, "Thumbnail previews must render per-object text.");

const sourceBytes = new Uint8Array(await readFile(new URL("./sample-six-pages.pdf", import.meta.url)));
const generated = await applyTextWatermark(sourceBytes, {
  text: "ALL PAGES",
  fontSize: 30,
  fontWeight: "bold",
  color: "#111827",
  opacity: 0.5,
  margin: 24,
  rangeStart: 1,
  rangeEnd: 6,
  instances: [
    { id: "global", scope: "all", placement: "center", rotation: 0, hiddenPages: [2] },
    { id: "page-two", scope: "page", pageNumber: 2, placement: "center", rotation: 0, hiddenPages: [], text: "PAGE TWO ONLY" },
  ],
});

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const loadingTask = pdfjs.getDocument({ data: generated.bytes, disableWorker: true });
const document = await loadingTask.promise;
async function pageText(pageNumber) {
  const page = await document.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((item) => item.str ?? "").join(" ");
}
const pageOneText = await pageText(1);
const pageTwoText = await pageText(2);
assert.match(pageOneText, /ALL PAGES/, "Global watermark text must remain on other pages.");
assert.doesNotMatch(pageOneText, /PAGE TWO ONLY/, "Page-specific text must not leak to page 1.");
assert.match(pageTwoText, /PAGE TWO ONLY/, "This-page-only text must be embedded on page 2.");
assert.doesNotMatch(pageTwoText, /ALL PAGES/, "The hidden global text must not replace page 2's specific text.");
await loadingTask.destroy();

console.log("Step 11.4 Crop defaults/ticks and page-specific Watermark text tests passed.");
