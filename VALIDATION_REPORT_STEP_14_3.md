# NovaPDF Validation Report — Build Step 14.3

## Scope

Correct the converter-offline failure chain reported from the Windows PDF to Word workspace without changing the conversion engine or the frozen Request Signatures backend.

## Reported evidence analyzed

The four uploaded issue logs showed:

1. React effect cleanup surfacing `controller.abort()` as `AbortError`.
2. Initial converter health request failing at `checkPdfConverterHealth`.
3. Recurring health polling failing at the same endpoint.
4. Uploaded-file analysis failing at `analyzePdfForWord`.

The screenshot independently showed `Converter offline` and an unavailable conversion action. These are one converter-reachability failure chain, not four separate DOCX-engine failures.

## Completed sandbox validation

- 25/25 dependency-free source contracts passed.
- Step 14.3 corrective contract passed 15 checks.
- 41 frontend/server TypeScript/TSX files passed isolated syntax transpilation.
- Conversion-service unit tests passed 5/5:
  - native editable conversion;
  - mixed portrait/landscape sections;
  - preserve-layout output;
  - English OCR;
  - Bangla OCR.
- Direct converter integration passed:
  - health returned version 0.14.3;
  - PDF analysis returned selectable/scanned-page metadata;
  - conversion returned the Microsoft Word DOCX MIME and NovaPDF metadata headers;
  - the returned package contained required OOXML parts and reopened with `python-docx`.
- Same-origin proxy helper passed in both states:
  - online upstream returned HTTP 200 and converter health JSON;
  - offline upstream returned controlled HTTP 503 with `CONVERTER_OFFLINE` JSON.
- Browser client no longer contains the direct `http://localhost:4010` base URL.
- Recurring health cleanup contains no `controller.abort()`.
- Upload analysis is gated by converter-online state and deduplicated through an in-flight set.
- `START_PDF_CONVERTER.cmd` and the updated main runner contain no Docker-volume deletion and no automatic npm audit fix.
- Public npm registry URLs remain the required packaging boundary.
- Step 12.8 backend source is preserved unchanged.

## Environment limitation

Docker and a complete root dependency tree were not available in this sandbox. Windows must still execute the actual Docker build, clean npm install, ESLint, semantic TypeScript, production build, route checks, browser acceptance, and Microsoft Word opening checks.

## Classification

PDF to Word remains a **working implementation candidate**. The reported runtime-error path is corrected at source and service-integration level. Promotion requires the complete Windows checklist.
