# Windows Validation — Step 14.10

Use a fresh extraction such as `C:\NovaPDF-v1410`. Do not overwrite an older package and do not delete Docker volumes.

## CMD byte-format/preflight gate

1. Double-click `RUN_NOVAPDF_ALL.cmd`.
2. Confirm the banner says `NovaPDF v0.14.10 one-click runner`.
3. Confirm all four lines appear:

```text
[OK] Node.js found.
[OK] npm found.
[OK] Windows PowerShell found.
[OK] Docker Desktop / Docker CLI found.
```

4. Confirm there is no `The system cannot find the batch label specified` error.
5. Separately double-click `START_PDF_CONVERTER.cmd` once and confirm its labels work; close it after converter health succeeds.

## Complete automated sequence

1. Confirm converter health and all five converter/OCR tests pass.
2. Confirm root clean install, audit capture, ESLint, semantic TypeScript, all source contracts, all 12 PDF-engine tests, and production build pass.
3. Confirm migration apply/show/idempotency passes and `[X] 1 CreateSignatureRequestBackend1721800000000` is accepted.
4. Confirm Web, API, and Worker launch, health, all 33 routes, and local backend E2E pass.

## Development and hydration check

Run `npm.cmd run dev`, confirm Next.js reports `(webpack)`, open a private window, and confirm no hydration mismatch overlay. Confirm the footer settles on `Build Step 14.10 · PDF to Word + OCR`.

## PDF to Word acceptance

Convert searchable and scanned English/Bangla PDFs in Editable text and Preserve layout modes. Open each DOCX in Microsoft Word. Test custom ranges, separate/combined output, Unicode filenames, file transfer, Start over, and viewer portal lifecycle.

Do not run `npm audit fix --force`. Do not mark Request Signatures Working.
