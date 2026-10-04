# NovaPDF v0.14.3 Release Notes

## Build Step 14.3 — PDF to Word Converter Startup and Proxy Corrective

Version 0.14.3 corrects the Windows/browser failure where the PDF to Word workspace loaded but the local converter was offline, the Convert button remained unavailable, and Next.js development mode displayed repeated `Failed to fetch` and `AbortError` issues.

## Root cause

The v0.14.2 browser called `http://localhost:4010` directly. When the Docker converter was not running, every five-second health request failed, upload analysis also called the unavailable service, and React development cleanup aborted an instrumented request. These appeared as four issues even though they had one shared cause: the converter was not reachable.

## Corrective implementation

- Added same-origin Next.js proxy routes:
  - `/api/pdf-to-word/health`
  - `/api/pdf-to-word/analyze`
  - `/api/pdf-to-word/convert`
- The browser no longer calls port 4010 directly.
- Proxy routes return controlled JSON `503 CONVERTER_OFFLINE` responses instead of browser-level network failures.
- Removed AbortController cleanup from the recurring health probe.
- Analysis waits until the converter is online and prevents duplicate in-flight analysis calls.
- Offline files remain waiting instead of repeatedly failing.
- Added explicit converter diagnostic text, Retry action, and a clickable offline primary action.
- Added `START_PDF_CONVERTER.cmd` to build/start/repair only the converter without deleting Docker volumes.
- Updated `npm run dev` to attempt converter startup before launching Next.js.
- Updated `RUN_NOVAPDF_ALL.cmd` to explicitly build the converter and print converter logs when startup/health fails.
- Preserved the v0.14.2 PDFium, python-docx, English/Bangla Tesseract OCR, DOCX validation, and conversion behavior.

## Preserved boundaries

- 32 tools and 33 public routes.
- Existing engines, design, right-side panels, preview behavior, file transfer, Start over, Home reset, and all page-view modes.
- Exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Step 12.8 backend remains byte-for-byte unchanged.
- Request Signatures remains disabled and deferred until the final major feature.
- No Docker-volume deletion and no automatic npm audit fix.
