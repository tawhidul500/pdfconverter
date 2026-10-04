import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument, degrees } from "pdf-lib";
import { applyImageWatermark, applyTextWatermark } from "../src/lib/watermark-pdf.ts";

const sourcePath = new URL("./sample-six-pages.pdf", import.meta.url);
const imagePath = new URL("./sample-image.png", import.meta.url);
const outputPath = new URL("./sample-watermark-output.pdf", import.meta.url);
const imageOutputPath = new URL("./sample-image-watermark-output.pdf", import.meta.url);
const temporaryDirectory = await mkdtemp(join(tmpdir(), "novapdf-watermark-test-"));
const rotatedSourcePath = join(temporaryDirectory, "rotated-source.pdf");
const rotatedOutputPath = join(temporaryDirectory, "rotated-output.pdf");

const sourceBytes = new Uint8Array(await readFile(sourcePath));
const source = await PDFDocument.load(sourceBytes);
const sourceSizes = source.getPages().map((page) => ({
  width: page.getSize().width,
  height: page.getSize().height,
  rotation: page.getRotation().angle,
}));

const generated = await applyTextWatermark(sourceBytes, {
  text: "CONFIDENTIAL",
  fontSize: 44,
  fontWeight: "bold",
  color: "#b91c1c",
  opacity: 0.32,
  rotation: -45,
  placement: "center",
  margin: 36,
  rangeStart: 2,
  rangeEnd: 5,
  customPosition: { x: 0.68, y: 0.3 },
});
await writeFile(outputPath, generated.bytes);

const output = await PDFDocument.load(generated.bytes);
assert.equal(output.getPageCount(), source.getPageCount());
assert.equal(generated.watermarkedPageCount, 4);
output.getPages().forEach((page, index) => {
  assert.equal(page.getSize().width, sourceSizes[index].width);
  assert.equal(page.getSize().height, sourceSizes[index].height);
  assert.equal(page.getRotation().angle, sourceSizes[index].rotation);
});

const imageBytes = new Uint8Array(await readFile(imagePath));
const imageGenerated = await applyImageWatermark(sourceBytes, {
  imageBytes,
  imageType: "png",
  scalePercent: 26,
  opacity: 0.42,
  rotation: 18,
  placement: "bottom-right",
  margin: 24,
  rangeStart: 1,
  rangeEnd: 6,
  customPosition: { x: 0.74, y: 0.28 },
});
await writeFile(imageOutputPath, imageGenerated.bytes);
const imageOutput = await PDFDocument.load(imageGenerated.bytes);
assert.equal(imageOutput.getPageCount(), source.getPageCount());
assert.equal(imageGenerated.watermarkedPageCount, 6);
assert.ok(imageGenerated.bytes.length > sourceBytes.length);

const rotatedSource = await PDFDocument.load(sourceBytes);
rotatedSource.getPage(0).setRotation(degrees(90));
rotatedSource.getPage(1).setRotation(degrees(180));
rotatedSource.getPage(2).setRotation(degrees(270));
const rotatedSourceBytes = await rotatedSource.save({ useObjectStreams: true, addDefaultPage: false });
await writeFile(rotatedSourcePath, rotatedSourceBytes);

const rotatedGenerated = await applyImageWatermark(rotatedSourceBytes, {
  imageBytes,
  imageType: "png",
  scalePercent: 22,
  opacity: 0.55,
  rotation: -25,
  placement: "bottom-right",
  margin: 30,
  rangeStart: 1,
  rangeEnd: 3,
});
await writeFile(rotatedOutputPath, rotatedGenerated.bytes);

const rotatedOutput = await PDFDocument.load(rotatedGenerated.bytes);
assert.deepEqual(
  rotatedOutput.getPages().slice(0, 3).map((page) => page.getRotation().angle),
  [90, 180, 270],
);
assert.equal(rotatedOutput.getPageCount(), 6);

const multiGenerated = await applyTextWatermark(sourceBytes, {
  text: "DRAFT",
  fontSize: 32,
  fontWeight: "regular",
  color: "#0f766e",
  opacity: 0.4,
  margin: 28,
  rangeStart: 1,
  rangeEnd: 6,
  instances: [
    {
      id: "global",
      scope: "all",
      placement: "top-left",
      customPosition: { x: 0.22, y: 0.18 },
      rotation: 10,
      hiddenPages: [3],
    },
    {
      id: "page-three",
      scope: "page",
      pageNumber: 3,
      placement: "bottom-right",
      customPosition: { x: 0.78, y: 0.76 },
      rotation: -20,
      hiddenPages: [],
    },
    {
      id: "page-four-copy",
      scope: "page",
      pageNumber: 4,
      placement: "center",
      customPosition: { x: 0.58, y: 0.52 },
      rotation: 30,
      hiddenPages: [],
    },
  ],
});
assert.equal(multiGenerated.watermarkedPageCount, 6);
const multiOutput = await PDFDocument.load(multiGenerated.bytes);
assert.equal(multiOutput.getPageCount(), 6);
assert.ok(multiGenerated.bytes.length > sourceBytes.length);

console.log("Text, image, custom-position, multi-instance, page-specific, and rotated-page watermark engine tests passed.");
