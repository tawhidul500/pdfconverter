# Windows Validation — Step 14.4

Use a fresh extraction in a short path such as `C:\NovaPDF-v144`. Do not overwrite v0.14.3 and do not delete Docker volumes.

## Automated run

1. Start Docker Desktop.
2. Double-click `RUN_NOVAPDF_ALL.cmd`.
3. Confirm Root clean install completes.
4. Confirm `npm audit` is captured only; no automatic fix is applied.
5. Confirm **Root ESLint passes with 0 errors**.
6. Confirm semantic TypeScript passes.
7. Confirm all dependency-free source contracts pass, including Step 14.4.
8. Confirm all PDF-engine tests pass.
9. Confirm production build passes.
10. Confirm backend install/audit/lint/typecheck/build/tests, migration, health, 33 routes, and local E2E pass.

## PDF to Word manual checks

- Converter status becomes online.
- Searchable PDF converts to an openable editable DOCX.
- Preserve-layout DOCX opens in Microsoft Word.
- English OCR, Bangla OCR, and English + Bangla OCR work on scanned pages.
- Custom range, separate output, and combined output work.
- Converter stop produces a controlled offline state without runtime overlays.
- `START_PDF_CONVERTER.cmd` plus Retry restores conversion.
- Start over clears files/results and returns viewer portal count to zero.

## Security boundary

Do not use `npm audit fix --force`. Do not mark Request Signatures Working.
