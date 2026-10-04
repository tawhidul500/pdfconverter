import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import JSZip from "jszip";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const buildDir = path.resolve(".pdf-to-word-engine-test-build");
await fs.rm(buildDir, { recursive: true, force: true });
await fs.mkdir(buildDir, { recursive: true });
const sourcePath = path.resolve("src/lib/pdf-to-word.ts");
const sourceText = await fs.readFile(sourcePath, "utf8");
const transpiled = ts.transpileModule(sourceText, {
  fileName: sourcePath,
  reportDiagnostics: true,
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
  },
});
const errors = (transpiled.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
assert.equal(errors.length, 0, errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("\n"));
await fs.writeFile(path.join(buildDir, "pdf-to-word.js"), transpiled.outputText);

const { buildPdfToWordDocx, pdfTextItemsToEditableParagraphs } = require(path.join(buildDir, "pdf-to-word.js"));

try {
  const paragraphs = pdfTextItemsToEditableParagraphs([
    { str: "NovaPDF", width: 54, height: 18, transform: [18, 0, 0, 18, 48, 730], fontName: "Helvetica-Bold" },
    { str: "PDF to Word", width: 90, height: 18, transform: [18, 0, 0, 18, 108, 730], fontName: "Helvetica-Bold", hasEOL: true },
    { str: "Editable", width: 48, height: 11, transform: [11, 0, 0, 11, 48, 690], fontName: "Helvetica" },
    { str: "text", width: 20, height: 11, transform: [11, 0, 0, 11, 102, 690], fontName: "Helvetica" },
    { str: "flow", width: 24, height: 11, transform: [11, 0, 0, 11, 128, 690], fontName: "Helvetica-Oblique" },
  ]);
  assert.equal(paragraphs.length, 2);
  assert.equal(paragraphs[0].text, "NovaPDF PDF to Word");
  assert.equal(paragraphs[0].bold, true);
  assert.match(paragraphs[1].text, /Editable text flow/);

  const editableBytes = await buildPdfToWordDocx([
    {
      kind: "editable",
      widthPoints: 612,
      heightPoints: 792,
      paragraphs,
    },
  ], "NovaPDF editable test");
  const editableZip = await JSZip.loadAsync(editableBytes);
  assert.ok(editableZip.file("[Content_Types].xml"));
  assert.ok(editableZip.file("word/document.xml"));
  assert.ok(editableZip.file("word/styles.xml"));
  const editableXml = await editableZip.file("word/document.xml").async("string");
  assert.match(editableXml, /NovaPDF PDF to Word/);
  assert.match(editableXml, /Editable text flow/);
  assert.match(editableXml, /<w:sectPr>/);

  const jpegBytes = new Uint8Array(await fs.readFile("test-files/sample-photo.jpg"));
  const visualBytes = await buildPdfToWordDocx([
    { kind: "visual", widthPoints: 612, heightPoints: 792, imageBytes: jpegBytes, imageType: "jpeg" },
    { kind: "visual", widthPoints: 792, heightPoints: 612, imageBytes: jpegBytes, imageType: "jpeg" },
  ], "NovaPDF visual test");
  const visualZip = await JSZip.loadAsync(visualBytes);
  assert.ok(visualZip.file("word/media/page-1.jpg"));
  assert.ok(visualZip.file("word/media/page-2.jpg"));
  const relationships = await visualZip.file("word/_rels/document.xml.rels").async("string");
  assert.match(relationships, /rIdImage1/);
  assert.match(relationships, /rIdImage2/);
  const visualXml = await visualZip.file("word/document.xml").async("string");
  assert.equal((visualXml.match(/<w:drawing>/g) ?? []).length, 2);
  assert.match(visualXml, /w:type w:val="nextPage"/);

  await fs.writeFile("test-files/sample-pdf-to-word-editable.docx", editableBytes);
  await fs.writeFile("test-files/sample-pdf-to-word-visual.docx", visualBytes);
  console.log("PDF to Word engine tests passed. Editable and preserve-layout DOCX fixtures created.");
} finally {
  await fs.rm(buildDir, { recursive: true, force: true });
}
