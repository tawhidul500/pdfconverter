# Windows Validation — NovaPDF v0.14.14

## Automated runner

1. Run `RUN_NOVAPDF_ALL.cmd` from a fresh extraction.
2. Confirm the heading says `NovaPDF v0.14.14 consolidated one-click runner`.
3. Confirm converter tests, root lint/typecheck/build, source contracts, PDF engines, backend tests, migration, routes, and E2E pass.

## Preserve layout + OCR acceptance

1. Upload a scanned English PDF.
2. Select `Preserve layout`, then select `OCR` and `English`.
3. Convert and open in Microsoft Word.
4. Confirm page appearance matches the PDF.
5. Use Ctrl+F to search for a visible word from the scan.
6. Repeat with a Bangla scan using `Bangla`.
7. Test a digital PDF: visible layout must remain image-based, while Ctrl+F must find native text.
8. Confirm Preserve layout without OCR remains image-only.

## Safety

- Do not run `npm audit fix --force`.
- Do not delete Docker volumes.
- Request Signatures remains disabled.
