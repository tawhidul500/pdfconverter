import assert from "node:assert/strict";
import { mkdtemp, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PDFDocument, degrees } from "pdf-lib";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const libraryPath = join(projectRoot, "src", "lib", "page-numbers-pdf.ts");
const temporaryLibraryPath = join(
  dirname(libraryPath),
  `.page-numbers-pdf.engine-test-${process.pid}.ts`,
);
const librarySource = (await readFile(libraryPath, "utf8"))
  .replace('from "./watermark-pdf";', 'from "./watermark-pdf.ts";')
  .replace('from "@/lib/watermark-pdf";', 'from "./watermark-pdf.ts";');
await writeFile(temporaryLibraryPath, librarySource);

try {
  const { applyPageNumbers } = await import(pathToFileURL(temporaryLibraryPath).href);
  const sourcePath = new URL("./sample-six-pages.pdf", import.meta.url);
  const sourceBytes = new Uint8Array(await readFile(sourcePath));
  const source = await PDFDocument.load(sourceBytes);
  source.getPage(0).setRotation(degrees(90));
  source.getPage(1).setRotation(degrees(180));
  source.getPage(2).setRotation(degrees(270));
  const rotatedBytes = await source.save({ useObjectStreams: true, addDefaultPage: false });
  const before = await PDFDocument.load(rotatedBytes);
  const beforeGeometry = before.getPages().map((page) => ({
    size: page.getSize(),
    crop: page.getCropBox(),
    rotation: page.getRotation().angle,
  }));

  const positions = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
  const directory = await mkdtemp(join(tmpdir(), "novapdf-page-number-test-"));
  for (const position of positions) {
    const generated = await applyPageNumbers(rotatedBytes, {
      position,
      rangeStart: 2,
      rangeEnd: 5,
      startingNumber: 10,
      format: "page-number",
      fontSize: 18,
      margin: 36,
      fontWeight: "bold",
      color: [0.059, 0.463, 0.431],
    });
    assert.equal(generated.numberedPageCount, 4);
    const output = await PDFDocument.load(generated.bytes);
    assert.equal(output.getPageCount(), before.getPageCount());
    output.getPages().forEach((page, index) => {
      assert.deepEqual(page.getSize(), beforeGeometry[index].size);
      assert.deepEqual(page.getCropBox(), beforeGeometry[index].crop);
      assert.equal(page.getRotation().angle, beforeGeometry[index].rotation);
    });
    await writeFile(join(directory, `${position}.pdf`), generated.bytes);
  }
  console.log(`Page-number engine parity tests passed for all six positions. Outputs: ${directory}`);
} finally {
  await unlink(temporaryLibraryPath).catch(() => undefined);
}
