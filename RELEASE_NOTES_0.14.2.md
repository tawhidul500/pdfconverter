# NovaPDF v0.14.2 Release Notes

## Build Step 14.2 — Reliable PDF to Word Service and OCR Candidate

Version 0.14.2 replaces the hand-built browser OOXML download path from v0.14.1. Real-world files could contain control characters or Word-specific package combinations that LibreOffice accepted but Microsoft Word reported as unreadable. PDF to Word now uses a dedicated stateless local conversion service and validates every returned DOCX before exposing a download.

## Implemented

- Added `conversion-service`, isolated from the unchanged Step 12.8 Request Signatures backend.
- Added Microsoft Word-valid DOCX generation through `python-docx`.
- Added Preserve layout conversion using rendered PDF pages in matching portrait/landscape Word sections.
- Added Editable text conversion using positioned PDFium text lines with approximate font size, bold, italic, spacing, and indentation.
- Added scanned-page analysis after upload.
- Added optional Tesseract OCR for image-only pages.
- Added English, Bangla, and English + Bangla OCR choices.
- Added No OCR / OCR workflow matching the current iLovePDF interaction pattern.
- Added server health status, explicit offline errors, conversion limits, no-store responses, and in-memory request processing.
- Added client-side DOCX ZIP, required-part, content-type, and XML validation before download.
- Added RFC 5987-safe Unicode/Bangla output filenames with an ASCII fallback.
- Added Docker Compose and one-click runner startup, health, and functional tests for the converter.
- Added service tests for native editable conversion, mixed page orientation, preserve-layout output, English OCR, Bangla OCR, DOCX reopening, and package integrity.

## Preserved

- All 32 tools and 33 routes.
- Existing engines, workspaces, right-side panels, previews, file transfer, Start over, Home reset, and all page-view modes.
- Step 13.7 zero/one/zero viewer portal lifecycle.
- Exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Public npm registry URLs only.
- Docker volumes; the runner never deletes volumes.
- No automatic `npm audit fix` or `npm audit fix --force`.
- Request Signatures remains disabled and deferred until the final major feature.
- The Step 12.8 backend source remains byte-for-byte unchanged.

## Accuracy boundary

iLovePDF currently states that its PDF to Word converter is powered by Solid Documents. NovaPDF cannot include that proprietary engine. Version 0.14.2 follows the same user workflow and creates openable/editable Word files, but complex tables, unusual embedded fonts, vector drawings, and multi-column layouts may not match iLovePDF's commercial conversion accuracy.
