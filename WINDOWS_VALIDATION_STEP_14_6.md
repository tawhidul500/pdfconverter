# Windows Validation — Step 14.6

Use a fresh extraction such as `C:\NovaPDF-v146`. Do not overwrite v0.14.5 and do not delete Docker volumes.

## Automated runner

1. Start Docker Desktop and double-click `RUN_NOVAPDF_ALL.cmd`.
2. Confirm converter health and all five converter/OCR tests pass.
3. Confirm root clean install, audit capture, ESLint, semantic TypeScript, all source contracts, all 12 PDF-engine tests, and production build pass.
4. Confirm backend clean install, audit capture, ESLint, TypeScript, build, unit tests, and metadata test pass.
5. In the migration section, confirm the order is:
   - `Applying the committed PostgreSQL migration`
   - `Verifying the committed PostgreSQL migration is applied`
   - `[X] CreateSignatureRequestBackend1721800000000`
   - `Confirming the PostgreSQL migration is idempotent`
   - `No migrations are pending`
6. Confirm the API and worker windows open, live/ready health pass, all 33 routes pass, and the real local backend E2E passes.
7. Confirm `validation-logs` contains migration apply, show, confirmation, audit, and run-summary files.

## PDF to Word acceptance

1. Converter status shows online.
2. Convert a searchable PDF in Editable text mode and open the DOCX in Microsoft Word.
3. Convert the same PDF in Preserve layout mode and open it in Microsoft Word.
4. Convert an English scanned PDF with OCR.
5. Convert a Bangla scanned PDF with Bangla OCR.
6. Test custom page range, separate outputs, combined output, Unicode filename, and Start over.
7. Confirm no runtime overlay, dead Convert button, corrupted DOCX, stale toolbar, or duplicate viewer portal.

## Viewer lifecycle

- Before upload: `.workspace-bottom-controls` count is `0`.
- After accepted upload in the active tool: count is exactly `1`.
- After Start over: count returns to `0`.
- Switching tools leaves no stale toolbar or shadow spot.

Do not use `npm audit fix --force`. Audit findings must remain captured for a separate controlled dependency-update step. Do not mark Request Signatures Working.
