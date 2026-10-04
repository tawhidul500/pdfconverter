# Windows Validation — NovaPDF v0.14.12

## Automated runner

1. Extract to a fresh directory, for example `C:\NovaPDF-v1412`.
2. Double-click `RUN_NOVAPDF_ALL.cmd`.
3. Confirm the heading says `NovaPDF v0.14.12 consolidated one-click runner`.
4. Confirm three service windows open without `The system cannot find the path specified`:
   - NovaPDF Web 0.14.12
   - NovaPDF API 0.12.8
   - NovaPDF Worker 0.12.8
5. Confirm the main runner reports current Web version, API live/ready health, 33 routes, and local E2E.

## PDF to Word acceptance

- Converter status is online.
- Convert a selectable-text PDF to editable DOCX and open it in Microsoft Word.
- Convert a scanned English PDF with OCR and open it.
- Convert a scanned Bangla PDF with Bangla OCR and open it.
- Test Preserve layout, custom range, separate outputs, combined output, and Start over.
- Confirm no viewer portal before upload, exactly one after upload, and zero after Start over.

## Safety

- Do not delete Docker volumes.
- Do not run `npm audit fix --force`.
- Request Signatures remains disabled.
