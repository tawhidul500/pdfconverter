# NovaPDF v0.14.1 Release Notes

## Build Step 14.1 - Working PDF to Word Implementation Candidate

Version 0.14.1 corrects the Step 14.0 scope misunderstanding. PDF to Word is no longer a frontend-only mock. A real browser-local DOCX conversion engine is connected to the dedicated workspace. Request Signatures remains deferred until the final major feature milestone.

## Implemented

- Real PDF-to-DOCX export from the `/pdf-to-word` workspace.
- **Preserve layout** mode renders each selected PDF page to a high-quality JPEG and places it on a matching Word page.
- **Editable text** mode uses PDF.js text extraction, line reconstruction, font-size approximation, basic bold/italic inference, page sections, and editable Word paragraphs.
- All-pages and custom-range conversion.
- Separate DOCX output for each source PDF.
- Combined DOCX output for multiple source PDFs.
- Real DOCX Blob downloads with correct MIME type and filenames.
- Progress, processing labels, result cards, download metadata, and actionable conversion errors.
- Temporary result URLs are revoked on replacement, Start over, unmount, and partial batch failure.
- Explicit scanned-document behavior: Preserve layout works without OCR; Editable text reports when no extractable text exists.
- Browser-local processing; no upload server is required.
- New dependency-backed PDF to Word engine test, bringing the PDF-engine suite to 12 tests.
- Step 14.1 working-engine source contract.

## OOXML output

Generated DOCX packages include the required content-types, root relationships, Word document, styles, settings, document relationships, core/app properties, page sections, and embedded image media where applicable.

## Preserved

- All 32 tools and all 33 root routes.
- Existing 11 PDF engines and dedicated workspaces.
- Edit PDF implementation candidate.
- NovaPDF design, right-side panels, viewer modes, page previews, file transfer, Start over, and home reset.
- Step 13.7 zero/one/zero viewer portal lifecycle corrective.
- Exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Public npm registry project references only.
- One-click runner without Docker volume deletion or automatic audit fixes.
- Step 12.8 backend source unchanged.

## Current classification

PDF to Word is an **implementation candidate with a connected real engine**. Packaging-level engine tests and independent LibreOffice opening/rendering validation passed. Promotion to proven Working still requires the complete clean Windows automated and manual acceptance sequence in `WINDOWS_VALIDATION_STEP_14_1.md`.

Request Signatures remains disabled and not Working. It is intentionally deferred until the final major feature milestone.
