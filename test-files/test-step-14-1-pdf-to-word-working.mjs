import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const workspace = read("src/components/pdf-to-word-workspace.tsx");
const engine = read("src/lib/pdf-to-word.ts");
const home = read("src/components/home-page.tsx");
const tools = read("src/data/tools.ts");
const css = read("src/app/globals.css");
const sign = read("src/components/sign-pdf-workspace.tsx");
const nextConfig = read("next.config.ts");
const engineRunner = read("test-files/run-pdf-engine-tests.mjs");

const checks = [
  ["Step 14.1 release version", ["0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["dedicated PDF to Word workspace remains mounted", workspace.includes("export function PdfToWordWorkspace") && home.includes("<PdfToWordWorkspace")],
  ["real PDF to Word engine exists", engine.includes("export async function convertPdfSourcesToDocx") && engine.includes("export async function buildPdfToWordDocx")],
  ["DOCX packaging uses the existing public JSZip dependency", engine.includes('import JSZip from "jszip"') && engine.includes('[Content_Types].xml') && engine.includes('word/document.xml')],
  ["preserve-layout mode renders PDF pages to JPEG", engine.includes("renderVisualPage") && engine.includes('canvas.toBlob') && engine.includes('image/jpeg')],
  ["editable mode extracts PDF text", engine.includes("getTextContent") && engine.includes("pdfTextItemsToEditableParagraphs")],
  ["scanned editable-text failure is explicit", engine.includes("No editable text was found") && engine.includes("Use Preserve layout")],
  ["workspace invokes a real conversion engine", (workspace.includes("convertPdfSourcesToDocx") || workspace.includes("convertPdfToWordWithService")) && workspace.includes("convertToWord")],
  ["separate and combined DOCX paths are connected", workspace.includes('outputMode === "combined"') && workspace.includes('prepared.length === 1')],
  ["real Blob downloads use the DOCX MIME type", workspace.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") && workspace.includes("URL.createObjectURL")],
  ["result card provides DOCX downloads", workspace.includes("WorkspaceResultCard") && workspace.includes("Download DOCX")],
  ["failed batches revoke temporary result URLs", workspace.includes("createdResultUrls.forEach((url) => URL.revokeObjectURL(url))")],
  ["conversion progress and failures are visible", workspace.includes('status === "processing"') && workspace.includes("organize-progress-box") && workspace.includes("PDF to Word conversion failed")],
  ["frontend-only claims are removed", !workspace.includes("frontend-only milestone") && !workspace.includes("DOCX engine intentionally pending")],
  ["catalog no longer labels PDF to Word as UI-only", /slug:\s*"pdf-to-word"[\s\S]{0,280}badge:\s*"New"/.test(tools)],
  ["all 32 registered tools remain", [...tools.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].length === 32],
  ["multi-PDF validation and page-range selection remain", workspace.includes("accept={PDF_ACCEPT} multiple") && workspace.includes("hasPdfHeader") && workspace.includes("parsePageRange")],
  ["OCR state remains truthful", (workspace.includes("OCR is not included yet") || workspace.includes("convertPdfToWordWithService")) && workspace.includes("scanned")],
  ["viewer portal lifecycle remains opt-in", workspace.includes("active={isActive && items.length > 0}")],
  ["shared page-view modes remain wired", workspace.includes("data-novapdf-view-page={index + 1}") && css.includes(".pdf-word-grid")],
  ["file transfer, Start over, and home reset remain", workspace.includes("transferWorkspaceFiles") && workspace.includes('aria-label="Start over"') && workspace.includes("onExitWorkspace")],
  ["PDF to Word engine regression test is in the engine suite", engineRunner.includes("test-pdf-to-word-engine.mjs")],
  ["Request Signatures remains disabled", /<button type="button" disabled>/.test(sign)],
  ["exact development origins remain", nextConfig.includes('allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]')],
];

for (const [name, passed] of checks) assert.ok(passed, `Step 14.1 PDF to Word working contract failed: ${name}`);
console.log(`Step 14.1 PDF to Word working source contract passed (${checks.length} checks).`);
