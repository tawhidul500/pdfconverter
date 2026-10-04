# Running NovaPDF v0.14.16 on Windows

## Requirements

- Windows 10/11
- Docker Desktop running
- Node.js and npm available in PATH
- Windows PowerShell
- Microsoft Word for final DOCX acceptance

## One-click run

1. Extract the runnable source ZIP to a fresh path such as `C:\NovaPDF-v1416`.
2. Start Docker Desktop and wait for the engine to become ready.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Confirm the first heading is `NovaPDF v0.14.16 consolidated one-click runner`.
5. Wait for converter tests, source contracts, PDF-engine tests, build, backend, migration, live routes, and E2E gates.
6. Open PDF to Word and select **Editable layout (Beta)**.
7. Test a native digital PDF and a scanned PDF separately.
8. Complete `WINDOWS_VALIDATION_STEP_14_16.md` before promotion.

## Expected Editable layout behavior

For a native digital PDF:

- no full-page source PDF should be selectable or visible behind the Word objects;
- text should be editable and retain exposed font family, size, bold/italic, and color;
- reconstructable tables should be real Word tables;
- supported paths should be selectable shapes;
- embedded images should be independent pictures;
- only unsupported artwork may remain as small cropped residual pictures.

For a scanned PDF, the scan remains the page artwork and OCR text is overlaid as editable text. A scan does not contain recoverable native table/shape authoring objects.

The runner does not delete Docker volumes and does not run automatic audit remediation.
