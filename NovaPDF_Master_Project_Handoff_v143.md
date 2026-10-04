# NovaPDF Master Project Handoff v0.14.3

## Authoritative Build Step 14.3 Addendum

**Current source/app version:** 0.14.3  
**Current milestone:** PDF to Word converter startup/proxy corrective  
**PDF to Word:** service-backed working implementation candidate  
**Request Signatures:** disabled, not Working, deferred until the final major feature

This addendum supersedes v0.14.2 wording where the browser is described as calling port 4010 directly or where converter-offline state disables all recovery actions.

## Reported defect and root cause

The Windows screenshot showed a correctly uploaded PDF but `Converter offline` at the lower right and four Next.js development issues at the lower left. The four logs were one chain:

- health polling called an unavailable local service;
- recurring health polling repeated the same network failure;
- uploaded-file analysis called the same unavailable service;
- React development cleanup aborted an instrumented request.

The conversion engine itself was not reached.

## Current architecture

- Browser client calls only same-origin `/api/pdf-to-word/*` endpoints.
- Next.js server routes proxy health, analysis, and conversion to `PDF_CONVERTER_INTERNAL_URL` or `http://127.0.0.1:4010`.
- Offline service becomes controlled HTTP 503 JSON, not a browser-level failed fetch.
- Health polling uses a stopped flag and interval cleanup; it does not abort a request during React Strict Mode cleanup.
- PDF analysis starts only while the converter is online and uses an in-flight ID set to avoid duplicates.
- `START_PDF_CONVERTER.cmd` repairs only the converter.
- `npm run dev` attempts converter startup; `RUN_NOVAPDF_ALL.cmd` explicitly builds it and prints logs on failure.
- PDFium, python-docx, Tesseract OCR, DOCX validation, output modes, ranges, and conversion limits remain from v0.14.2.

## Validation completed

- 25 dependency-free source contracts passed.
- Step 14.3 corrective contract passed 15 checks.
- 41 frontend/server TypeScript/TSX files passed isolated syntax transpilation.
- 5/5 conversion-service tests passed.
- Direct health/analyze/convert integration passed.
- Generated DOCX reopened and contained required OOXML parts.
- Proxy helper returned 200 online and controlled 503 offline.

## Mandatory Windows acceptance

Run `RUN_NOVAPDF_ALL.cmd` and complete `WINDOWS_VALIDATION_STEP_14_3.md`. Specifically prove that the reported four runtime issues do not return, converter offline/online recovery works without reload, conversion downloads open in Microsoft Word, and the viewer zero/one/zero lifecycle remains.

## Locked boundaries

- Build regular tools as complete functional tools.
- Request Signatures is the final major feature.
- Preserve all 32 tools, 33 public routes, existing engines, NovaPDF design, panels, previews, file transfer, resets, and viewer modes.
- Preserve exact allowed development origins.
- Public npm registry URLs only.
- Never delete Docker volumes through supplied runners.
- Never run automatic npm audit fixes.
- Do not modify or promote the Step 12.8 Request Signatures backend during this milestone.
