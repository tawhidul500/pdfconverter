# Windows Validation — Step 14.7

Use a fresh extraction such as `C:\NovaPDF-v147`. Do not overwrite an older package and do not delete Docker volumes.

## Automated runner

1. Start Docker Desktop and double-click `RUN_NOVAPDF_ALL.cmd`.
2. Confirm converter health and all five converter/OCR tests pass.
3. Confirm root clean install, audit capture, ESLint, semantic TypeScript, all source contracts, all 12 PDF-engine tests, and production build pass.
4. Confirm migration apply, `[X]` verification, and `No migrations are pending` idempotency confirmation.
5. Confirm Web, API, and Worker windows open without `spawn EINVAL`.
6. Confirm live/ready health, all 33 routes, and the real local backend E2E pass.

## Direct development-launch regression

From the project root, run:

```bat
npm.cmd run dev
```

Confirm:

- `PDF converter is already online` or the converter is started automatically.
- Next.js starts and prints its local URL.
- No `spawn EINVAL` error appears.
- `http://localhost:3000/pdf-to-word` opens.

## PDF to Word acceptance

1. Convert a searchable PDF in Editable text mode and open the DOCX in Microsoft Word.
2. Convert the same PDF in Preserve layout mode.
3. Convert English and Bangla scanned PDFs with OCR.
4. Test custom page range, separate/combined output, Unicode filename, and Start over.
5. Confirm no runtime overlay, dead Convert button, corrupted DOCX, stale toolbar, or duplicate viewer portal.

Do not use `npm audit fix --force`. Do not mark Request Signatures Working.
