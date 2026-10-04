import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const workspace = read("src/components/pdf-to-word-workspace.tsx");
const serviceClient = read("src/lib/pdf-to-word-service.ts");
const converter = read("conversion-service/app/converter.py");
const api = read("conversion-service/app/main.py");
const dockerfile = read("conversion-service/Dockerfile");
const compose = read("docker-compose.yml");
const runner = read("RUN_NOVAPDF_ALL.cmd");
const nextConfig = read("next.config.ts");
const sign = read("src/components/sign-pdf-workspace.tsx");

const checks = [
  ["Step 14.2 or successor release version", ["0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)],
  ["workspace uses the conversion service", workspace.includes("convertPdfToWordWithService") && !workspace.includes("convertPdfSourcesToDocx")],
  ["service health is visible and conversion is disabled while offline", workspace.includes("converterState") && workspace.includes("Converter online") && workspace.includes('converterState !== "online"')],
  ["server-generated DOCX is validated before download", serviceClient.includes("validateDocxBytes") && serviceClient.includes("word/document.xml") && serviceClient.includes("DOMParser")],
  ["DOCX response MIME is enforced", serviceClient.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")],
  ["Unicode output names use RFC 5987 content disposition", api.includes("filename*=UTF-8") && api.includes("_content_disposition")],
  ["service creates Word files through python-docx", converter.includes("from docx import Document") && converter.includes("document.save(output)")],
  ["PDF renderer uses permissive PDFium binding instead of PyMuPDF", converter.includes("import pypdfium2 as pdfium") && !converter.includes("import fitz")],
  ["invalid XML controls are removed", converter.includes("_clean_xml_text") && converter.includes("0xD800")],
  ["preserve-layout mode renders actual PDF pages", converter.includes("_append_visual_page") && converter.includes("page.render(scale=scale)")],
  ["editable mode extracts positioned native lines", converter.includes("_native_lines") && converter.includes("get_text_range") && converter.includes("get_charbox")],
  ["OCR is connected through Tesseract", converter.includes("pytesseract.image_to_data") && workspace.includes("English + Bangla")],
  ["scanned page analysis is connected", api.includes("/api/v1/pdf-to-word/analyze") && workspace.includes("analyzePdfForWord")],
  ["conversion endpoint accepts page maps and multiple files", api.includes("page_map") && api.includes("list[UploadFile]")],
  ["service is stateless and limits files/pages", converter.includes("MAX_FILE_BYTES") && converter.includes("MAX_TOTAL_PAGES")],
  ["Docker image installs English and Bangla OCR", dockerfile.includes("tesseract-ocr-eng") && dockerfile.includes("tesseract-ocr-ben")],
  ["Docker compose exposes converter only on 4010", compose.includes("pdf-converter:") && compose.includes('"4010:4010"')],
  ["one-click runner starts, tests, and health-checks converter", runner.includes("pdf-converter") && runner.includes("http://localhost:4010/health") && runner.includes("unittest discover")],
  ["Docker volumes remain protected", !/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner) && !/^\s*(?:call\s+)?docker\s+volume\s+rm(?:\s|$)/im.test(runner)],
  ["forced audit fixes remain forbidden", !/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner)],
  ["Request Signatures remains disabled", /<button type="button" disabled>/.test(sign)],
  ["exact development origins remain", nextConfig.includes('allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]')],
];

for (const [name, passed] of checks) assert.ok(passed, `Step 14.2 service/OCR contract failed: ${name}`);
console.log(`Step 14.2 PDF to Word service/OCR source contract passed (${checks.length} checks).`);
