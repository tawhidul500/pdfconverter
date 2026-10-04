# NovaPDF Master Project Handoff v0.14.2

## Authoritative Build Step 14.2 Addendum

**Current source/app version:** 0.14.2  
**Current milestone:** service-backed PDF to Word with optional OCR  
**Request Signatures:** disabled, not Working, and deferred until the final major feature

This addendum supersedes v0.14.1 wording where that version describes PDF to Word as a hand-built browser-local OOXML engine.

## Why v0.14.2 exists

A user reported that downloaded v0.14.1 DOCX files could not be opened. The v0.14.1 fixtures passed ZIP checks, python-docx, and LibreOffice, but the implementation manually assembled OOXML and could produce Microsoft Word-unreadable packages when real PDF text contained invalid XML controls or unsupported package combinations.

## Current PDF to Word architecture

- `src/components/pdf-to-word-workspace.tsx`: upload, range, layout, separate/combined output, scanned-page state, OCR settings, service health, progress, errors, and downloads.
- `src/lib/pdf-to-word-service.ts`: service calls and strict DOCX validation before any Blob URL is created.
- `conversion-service/app/main.py`: stateless FastAPI endpoints.
- `conversion-service/app/converter.py`: PDFium extraction/rendering, python-docx output, Tesseract OCR, limits, and XML-safe text cleanup.
- `conversion-service/Dockerfile`: English and Bangla Tesseract language packs.
- `docker-compose.yml`: `pdf-converter` on port 4010.
- `RUN_NOVAPDF_ALL.cmd`: converter build/start/health/tests plus all preserved root/backend gates.

## Supported workflows

- Preserve layout: page image placed in a matching Word section.
- Editable text: native selectable text reconstructed into editable paragraphs.
- OCR: image-only pages recognized using English, Bangla, or English + Bangla.
- All pages or custom ranges.
- Separate or combined DOCX output.
- Multiple PDF upload within the existing 10-file, 150 MB, and 250-page workspace limits.

## Validation completed in the sandbox

- 24 dependency-free source contracts passed.
- Step 14.2 contract passed 22 checks.
- 5 conversion-service tests passed, including English and Bangla OCR.
- Health/analyze/convert API integration passed.
- Generated DOCX files reopened with python-docx.
- LibreOffice opened and rendered editable and preserve-layout mixed-orientation documents.
- 97 TypeScript/TSX and 42 MJS syntax checks passed; Python compilation passed.

## Mandatory next gate

Run `RUN_NOVAPDF_ALL.cmd` from a fresh Windows extraction and complete every item in `WINDOWS_VALIDATION_STEP_14_2.md`, especially Microsoft Word opening without repair warnings, OCR English/Bangla checks, combined/separate downloads, and the zero/one/zero viewer portal lifecycle.

## Locked project rules

- Build every regular tool as a complete functional tool, not a frontend-only view.
- Keep Request Signatures as the final major feature.
- Preserve 32 tools, 33 routes, existing engines, design, panels, previews, file transfer, resets, and viewer modes.
- Preserve exact allowed development origins.
- Use public npm registry URLs only.
- Never delete Docker volumes through the runner.
- Never run automatic npm audit fixes.
- Do not modify or promote the Step 12.8 Request Signatures backend during normal-tool milestones.
