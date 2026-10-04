import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument, degrees } from "pdf-lib";
import { SignatureFieldType } from "../src/common/enums";
import { renderCompletedPdf } from "../src/worker/pdf-renderer";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZqZ8AAAAASUVORK5CYII=", "base64");

void test("renders text, input, checkbox, and image fields on a rotated PDF", async () => {
  const source = await PDFDocument.create();
  const page = source.addPage([612, 792]);
  page.setRotation(degrees(90));
  const sourceBytes = new Uint8Array(await source.save());
  const result = await renderCompletedPdf(sourceBytes, [
    { id: "sig", pageNumber: 1, type: SignatureFieldType.SIGNATURE, x: 0.4, y: 0.25, width: 0.25, height: 0.08, rotation: 0, defaultValue: null, style: {} },
    { id: "name", pageNumber: 1, type: SignatureFieldType.NAME, x: 0.5, y: 0.45, width: 0.3, height: 0.07, rotation: 4, defaultValue: null, style: { fontSize: 18, textStyle: "bold" } },
    { id: "input", pageNumber: 1, type: SignatureFieldType.INPUT, x: 0.5, y: 0.62, width: 0.38, height: 0.07, rotation: 0, defaultValue: null, style: { fontSize: 15 } },
    { id: "check", pageNumber: 1, type: SignatureFieldType.CHECKBOX, x: 0.8, y: 0.8, width: 0.04, height: 0.04, rotation: 0, defaultValue: null, style: {} },
  ], {
    sig: { assetKey: "sig.png", mimeType: "image/png" },
    name: { value: "Ada Lovelace" },
    input: { value: "Approved" },
    check: { checked: true },
  }, (key) => {
    assert.equal(key, "sig.png");
    return Promise.resolve(new Uint8Array(png));
  });
  assert.equal(result.pageCount, 1);
  assert.equal(result.renderedFieldCount, 4);
  assert.ok(result.bytes.byteLength > sourceBytes.byteLength);
  assert.equal((await PDFDocument.load(result.bytes)).getPageCount(), 1);
});
