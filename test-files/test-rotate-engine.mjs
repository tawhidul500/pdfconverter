import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument, degrees } from "pdf-lib";
import { applyPdfRotations, normalizePdfRotation } from "../src/lib/rotate-pdf.ts";

assert.equal(normalizePdfRotation(-90), 270);
assert.equal(normalizePdfRotation(450), 90);

const sourceDocument = await PDFDocument.create();
const sizes = [
  [612, 792],
  [792, 612],
  [500, 700],
  [700, 500],
];
const initialRotations = [0, 90, 180, 270];
for (let index = 0; index < sizes.length; index += 1) {
  const page = sourceDocument.addPage(sizes[index]);
  page.setRotation(degrees(initialRotations[index]));
  page.drawText(`Rotate test ${index + 1}`, { x: 40, y: 50, size: 18 });
}
const sourceBytes = await sourceDocument.save();
const outputBytes = await applyPdfRotations(sourceBytes, [
  { pageIndex: 0, rotationDelta: 90 },
  { pageIndex: 1, rotationDelta: 180 },
  { pageIndex: 2, rotationDelta: 270 },
  { pageIndex: 3, rotationDelta: 90 },
]);
await writeFile("test-files/sample-rotate-output.pdf", outputBytes);

const outputDocument = await PDFDocument.load(outputBytes);
assert.equal(outputDocument.getPageCount(), 4);
const expectedRotations = [90, 270, 90, 0];
outputDocument.getPages().forEach((page, index) => {
  assert.equal(page.getRotation().angle, expectedRotations[index]);
  const size = page.getSize();
  assert.equal(size.width, sizes[index][0]);
  assert.equal(size.height, sizes[index][1]);
});

const realInput = await readFile("test-files/sample-six-pages.pdf");
const realOutput = await applyPdfRotations(realInput, [
  { pageIndex: 0, rotationDelta: 90 },
  { pageIndex: 2, rotationDelta: 180 },
  { pageIndex: 5, rotationDelta: 270 },
]);
const realDocument = await PDFDocument.load(realOutput);
assert.equal(realDocument.getPageCount(), 6);
assert.deepEqual(realDocument.getPages().map((page) => page.getRotation().angle), [90, 0, 180, 0, 0, 270]);
console.log("Rotate PDF engine tests passed.");
