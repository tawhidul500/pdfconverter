# NovaPDF Validation Report — Build Step 14.2

## Scope

Replace the v0.14.1 hand-built OOXML output with a reliable service-generated DOCX path, add optional OCR, preserve the complete NovaPDF project boundary, and keep Request Signatures deferred.

## Root/source validation completed in the packaging sandbox

- 24/24 dependency-free source contracts passed.
- Step 14.2 service/OCR contract passed 22 checks.
- 97/97 TypeScript/TSX files passed syntax parsing across frontend and unchanged backend.
- 42/42 MJS configuration/test files passed Node syntax checks.
- Python service modules passed `compileall`.
- Conversion-service unit tests passed 5/5:
  - native editable PDF to DOCX;
  - mixed portrait/landscape Word sections;
  - preserve-layout PDF to DOCX;
  - English scanned PDF to editable DOCX using Tesseract OCR;
  - Bangla scanned PDF to editable DOCX using Tesseract OCR.
- FastAPI health, analyze, convert, RFC 5987 Unicode filename, and DOCX response-header integration tests passed.
- Generated DOCX packages reopened with `python-docx`; English and Bangla OCR text was present and editable.
- Generated DOCX ZIPs contained `[Content_Types].xml`, `_rels/.rels`, and `word/document.xml`, with no corrupt ZIP entry.
- LibreOffice opened and rendered mixed portrait/landscape editable and preserve-layout DOCX results.
- Rendered output retained exactly two pages and the original page orientations.
- All 32 registered tools and 33 routes remain.
- Exact allowed development origins remain.
- The runner contains no Docker volume-delete command and no automatic npm audit fix.

## Root dependency-backed gates pending on Windows

The sandbox could not reach the public npm registry, so these must run through `RUN_NOVAPDF_ALL.cmd` on Windows:

- root `npm ci`;
- root audit capture;
- ESLint;
- semantic TypeScript;
- complete dependency-backed PDF-engine suite;
- Next.js production build;
- unchanged backend install/build/tests/migration/health/33 routes/local E2E;
- Docker build and runtime of the conversion service in the user's environment;
- Chrome workflow and Microsoft Word opening/editing checks.

## Classification

PDF to Word is a **service-backed working implementation candidate**. The corruption path has been removed and functional service tests pass. Promote it to proven Working only after every item in `WINDOWS_VALIDATION_STEP_14_2.md` passes and evidence is retained.
