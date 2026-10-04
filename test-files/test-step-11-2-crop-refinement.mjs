import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import {
  applyPdfCrop,
  cropRectFromOriginalPageAspect,
  cropRectToPageBox,
} from "../src/lib/crop-pdf.ts";

const portrait = { width: 612, height: 792 };
const previousSquare = cropRectFromOriginalPageAspect(
  "square",
  portrait.width,
  portrait.height,
  { x: 0.05, y: 0.05, width: 0.9, height: 0.9 },
);
const a4AfterSquare = cropRectFromOriginalPageAspect(
  "a4",
  portrait.width,
  portrait.height,
  previousSquare,
);
const a4FromArbitrary = cropRectFromOriginalPageAspect(
  "a4",
  portrait.width,
  portrait.height,
  { x: 0.31, y: 0.22, width: 0.41, height: 0.37 },
);
assert.deepEqual(a4AfterSquare, a4FromArbitrary, "A4 must restart from the original page, not the prior Square crop.");
const a4PhysicalRatio = (a4AfterSquare.width * portrait.width) / (a4AfterSquare.height * portrait.height);
assert.ok(Math.abs(a4PhysicalRatio - 210 / 297) < 1e-9, "A4 portrait ratio must be exact.");
assert.deepEqual(
  cropRectFromOriginalPageAspect("original", portrait.width, portrait.height, previousSquare),
  { x: 0, y: 0, width: 1, height: 1 },
  "Original must restore the full original visible page.",
);

const source = await PDFDocument.create();
source.addPage([612, 792]);
source.addPage([612, 792]);
const sourceBytes = await source.save();
const pageOneRect = { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
const pageTwoRect = { x: 0.25, y: 0.1, width: 0.5, height: 0.7 };
const before = await PDFDocument.load(sourceBytes);
const expectedOne = cropRectToPageBox(before.getPage(0), pageOneRect);
const expectedTwo = cropRectToPageBox(before.getPage(1), pageTwoRect);
const result = await applyPdfCrop(sourceBytes, {
  rect: pageOneRect,
  rectByPageNumber: { 1: pageOneRect, 2: pageTwoRect },
  targetPageNumbers: [1, 2],
});
const output = await PDFDocument.load(result.bytes);
for (const [pageIndex, expected] of [[0, expectedOne], [1, expectedTwo]]) {
  const actual = output.getPage(pageIndex).getCropBox();
  for (const key of ["x", "y", "width", "height"]) {
    assert.ok(Math.abs(actual[key] - expected[key]) < 0.01, `Page ${pageIndex + 1} ${key} mismatch.`);
  }
}

const workspace = await readFile(new URL("../src/components/crop-pdf-workspace.tsx", import.meta.url), "utf8");
assert.match(workspace, /freeFormCrop/, "Crop workspace must expose free-form per-page mode.");
assert.match(workspace, /pageCropRects/, "Crop workspace must store independent page rectangles.");
assert.match(workspace, /effectiveCropPages/, "Previously edited free-form pages must remain output targets.");
assert.match(workspace, /cropRectFromOriginalPageAspect/, "Aspect presets must rebuild from the original page.");
assert.match(workspace, /className="crop-focus-shell" onClick=\{\(\) => setFocusedPage\(null\)\}/, "Clicking the focus background must return to grid view.");
assert.match(workspace, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/, "The focused page itself must not close when edited.");

console.log("Step 11.2 Crop PDF refinement tests passed.");
