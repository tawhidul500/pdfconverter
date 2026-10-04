import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyTextWatermark } from "../src/lib/watermark-pdf.ts";

const cropSource = await readFile(new URL("../src/components/crop-pdf-workspace.tsx", import.meta.url), "utf8");
const watermarkSource = await readFile(new URL("../src/components/watermark-pdf-workspace.tsx", import.meta.url), "utf8");
const watermarkEngine = await readFile(new URL("../src/lib/watermark-pdf.ts", import.meta.url), "utf8");

assert.match(
  cropSource,
  /const DEFAULT_RECT: NormalizedCropRect = \{ x: 0, y: 0, width: 1, height: 1 \};/,
  "Crop PDF must start with a full-page rectangle so all exact margins are zero.",
);

assert.match(watermarkEngine, /fontSize\?: number;/, "Watermark instances must support per-object font size.");
assert.match(watermarkEngine, /fontWeight\?: WatermarkFontWeight;/, "Watermark instances must support per-object font weight.");
assert.match(watermarkEngine, /color\?: string;/, "Watermark instances must support per-object color.");
assert.match(watermarkEngine, /opacity\?: number;/, "Watermark instances must support per-object opacity.");
assert.match(watermarkEngine, /margin\?: number;/, "Watermark instances must support per-object edge offset.");
assert.match(watermarkEngine, /scalePercent\?: number;/, "Watermark instances must support per-object image width.");
assert.match(watermarkSource, /function updateScopedStyle\(/, "Watermark style controls must use a shared scope-aware updater.");
assert.match(watermarkSource, /editScopeRef\.current === "all"/, "All-pages styles must branch separately from page-only styles.");
assert.match(watermarkSource, /commitObjects\(objectsRef\.current\.map\(updater\)\)/, "All-pages styles must update all affected objects.");
assert.match(watermarkSource, /updateObject\(actionId, updater\)/, "This-page-only styles must update only the active object.");
assert.match(watermarkSource, /selectedOpacity/, "The right panel must display the selected object's opacity.");
assert.match(watermarkSource, /selectedImageScale/, "The right panel must display the selected image object's width.");

const sourceBytes = new Uint8Array(await readFile(new URL("./sample-six-pages.pdf", import.meta.url)));
const generated = await applyTextWatermark(sourceBytes, {
  text: "DEFAULT",
  fontSize: 22,
  fontWeight: "regular",
  color: "#111827",
  opacity: 0.4,
  margin: 20,
  rangeStart: 1,
  rangeEnd: 2,
  instances: [
    {
      id: "page-one",
      scope: "page",
      pageNumber: 1,
      placement: "top-left",
      rotation: 0,
      text: "SMALL PAGE",
      fontSize: 18,
      fontWeight: "regular",
      color: "#b91c1c",
      opacity: 0.25,
      margin: 12,
    },
    {
      id: "page-two",
      scope: "page",
      pageNumber: 2,
      placement: "bottom-right",
      rotation: 0,
      text: "LARGE PAGE",
      fontSize: 48,
      fontWeight: "bold",
      color: "#0f766e",
      opacity: 0.8,
      margin: 60,
    },
  ],
});

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const task = pdfjs.getDocument({ data: generated.bytes, disableWorker: true });
const document = await task.promise;
const first = await (await document.getPage(1)).getTextContent();
const second = await (await document.getPage(2)).getTextContent();
const firstItem = first.items.find((item) => item.str === "SMALL PAGE");
const secondItem = second.items.find((item) => item.str === "LARGE PAGE");
assert.ok(firstItem, "Page 1 must contain its page-specific watermark text.");
assert.ok(secondItem, "Page 2 must contain its page-specific watermark text.");
assert.ok(secondItem.height > firstItem.height * 2, "Page-specific font sizes must be embedded independently.");
await task.destroy();

console.log("Step 11.5 zero Crop margins and scope-aware Watermark style tests passed.");
