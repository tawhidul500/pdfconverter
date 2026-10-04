import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { PDFArray, PDFDocument, PDFName, degrees, rgb } from "pdf-lib";

const require = createRequire(import.meta.url);
const typescriptCompiler = require.resolve("typescript/lib/tsc.js");
const buildDir = path.resolve(".edit-engine-test-build");
await fs.rm(buildDir, { recursive: true, force: true });
execFileSync(process.execPath, [
  typescriptCompiler,
  "src/lib/edit-pdf.ts",
  "src/lib/watermark-pdf.ts",
  "--outDir", buildDir,
  "--module", "commonjs",
  "--target", "es2020",
  "--esModuleInterop",
  "--skipLibCheck",
  "--moduleResolution", "node",
], { stdio: "inherit" });

const { applyPdfEdits } = require(path.join(buildDir, "edit-pdf.js"));

try {
  const sourceDocument = await PDFDocument.create();
  const pageOne = sourceDocument.addPage([612, 792]);
  pageOne.drawText("NovaPDF Edit PDF engine fixture", { x: 48, y: 736, size: 18, color: rgb(0.1, 0.2, 0.3) });
  const pageTwo = sourceDocument.addPage([792, 612]);
  pageTwo.setRotation(degrees(90));
  pageTwo.setCropBox(20, 30, 720, 540);
  const pageThree = sourceDocument.addPage([612, 792]);
  pageThree.setRotation(degrees(270));
  const sourceBytes = await sourceDocument.save({ useObjectStreams: true, addDefaultPage: false });
  const imageBytes = new Uint8Array(await fs.readFile("test-files/sample-image.png"));

  const objects = [
    { id: "text", pageNumber: 1, type: "text", x: 0.5, y: 0.22, width: 0.5, height: 0.13, rotation: -4, opacity: 0.92, zIndex: 1, text: "Editable text box", fontFamily: "helvetica", fontSize: 24, bold: true, italic: false, align: "center", color: "#0f172a", fillColor: "#ffffff", borderColor: "#0f766e", borderWidth: 1 },
    { id: "image", pageNumber: 1, type: "image", x: 0.3, y: 0.52, width: 0.22, height: 0.18, rotation: 8, opacity: 0.88, zIndex: 2, assetId: "asset-1" },
    { id: "rectangle", pageNumber: 1, type: "rectangle", x: 0.72, y: 0.55, width: 0.25, height: 0.15, rotation: 12, opacity: 0.7, zIndex: 3, fillColor: "#dff8f3", borderColor: "#0f766e", borderWidth: 2 },
    { id: "ellipse", pageNumber: 2, type: "ellipse", x: 0.32, y: 0.28, width: 0.22, height: 0.14, rotation: 20, opacity: 0.65, zIndex: 1, fillColor: "#dbeafe", borderColor: "#2563eb", borderWidth: 1.5 },
    { id: "line", pageNumber: 2, type: "line", x: 0.52, y: 0.52, width: 0.42, height: 0.03, rotation: -18, opacity: 1, zIndex: 2, color: "#111827", borderWidth: 3 },
    { id: "link", pageNumber: 2, type: "link", x: 0.55, y: 0.75, width: 0.35, height: 0.08, rotation: 5, opacity: 0.35, zIndex: 3, url: "https://example.com/novapdf", fillColor: "#dbeafe", borderColor: "#2563eb", borderWidth: 1 },
    { id: "highlight", pageNumber: 3, type: "highlight", x: 0.5, y: 0.3, width: 0.48, height: 0.07, rotation: 0, opacity: 0.38, zIndex: 1, fillColor: "#fde047", borderWidth: 0 },
    { id: "underline", pageNumber: 3, type: "underline", x: 0.5, y: 0.52, width: 0.4, height: 0.025, rotation: 6, opacity: 0.95, zIndex: 2, color: "#ef4444", borderWidth: 2.5 },
    { id: "freehand", pageNumber: 3, type: "freehand", x: 0.5, y: 0.72, width: 0.36, height: 0.14, rotation: -9, opacity: 0.9, zIndex: 3, color: "#111827", borderWidth: 2.8, points: [{ x: 0, y: 0.75 }, { x: 0.18, y: 0.3 }, { x: 0.42, y: 0.68 }, { x: 0.66, y: 0.18 }, { x: 1, y: 0.55 }] },
  ];

  const result = await applyPdfEdits(sourceBytes, {
    assets: [{ id: "asset-1", bytes: imageBytes, imageType: "png" }],
    objects,
  });

  assert.equal(result.pageCount, 3);
  assert.equal(result.editedPageCount, 3);
  assert.equal(result.objectCount, objects.length);
  assert.ok(result.bytes.length > sourceBytes.length, "Edited output should contain the source plus flattened edits.");

  const output = await PDFDocument.load(result.bytes);
  assert.equal(output.getPageCount(), 3);
  assert.deepEqual(output.getPages().map((page) => page.getRotation().angle), [0, 90, 270]);
  const crop = output.getPage(1).getCropBox();
  assert.deepEqual(crop, { x: 20, y: 30, width: 720, height: 540 });
  const annots = output.getPage(1).node.lookup(PDFName.of("Annots"), PDFArray);
  assert.ok(annots && annots.size() >= 1, "A valid HTTP link object should create a PDF link annotation.");

  const outputPath = "test-files/sample-edit-pdf-output.pdf";
  await fs.writeFile(outputPath, result.bytes);
  console.log(`Edit PDF engine tests passed. Output: ${outputPath}`);
} finally {
  await fs.rm(buildDir, { recursive: true, force: true });
}
