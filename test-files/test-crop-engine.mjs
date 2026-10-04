import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import { applyPdfCrop, cropRectToPageBox } from "../src/lib/crop-pdf.ts";

const source = await PDFDocument.create();
const sizes = [[612, 792], [792, 612], [500, 700], [700, 500]];
const rotations = [0, 90, 180, 270];
for (let index = 0; index < sizes.length; index += 1) {
  const page = source.addPage(sizes[index]);
  page.setRotation(degrees(rotations[index]));
  page.drawRectangle({ x: 0, y: 0, width: sizes[index][0], height: sizes[index][1], color: rgb(0.95, 0.97, 1) });
  page.drawText(`Crop test ${index + 1}`, { x: 45, y: 50, size: 22 });
}
const sourceBytes = await source.save();
const before = await PDFDocument.load(sourceBytes);
const rect = { x: 0.1, y: 0.15, width: 0.72, height: 0.66 };
const expected = before.getPages().map((page) => cropRectToPageBox(page, rect));
const untouched = before.getPages().map((page) => ({ media: page.getMediaBox(), crop: page.getCropBox(), rotation: page.getRotation().angle }));

const generated = await applyPdfCrop(sourceBytes, { rect, targetPageNumbers: [1, 3] });
assert.equal(generated.pageCount, 4);
assert.equal(generated.croppedPageCount, 2);
await writeFile("test-files/sample-crop-output.pdf", generated.bytes);

const output = await PDFDocument.load(generated.bytes);
assert.equal(output.getPageCount(), 4);
output.getPages().forEach((page, index) => {
  assert.equal(page.getRotation().angle, rotations[index]);
  if (index === 0 || index === 2) {
    const media = page.getMediaBox();
    const crop = page.getCropBox();
    for (const key of ["x", "y", "width", "height"]) {
      assert.ok(Math.abs(media[key] - expected[index][key]) < 0.01, `media ${key} mismatch on page ${index + 1}`);
      assert.ok(Math.abs(crop[key] - expected[index][key]) < 0.01, `crop ${key} mismatch on page ${index + 1}`);
    }
  } else {
    assert.deepEqual(page.getMediaBox(), untouched[index].media);
    assert.deepEqual(page.getCropBox(), untouched[index].crop);
  }
});
console.log("Crop PDF engine tests passed.");
