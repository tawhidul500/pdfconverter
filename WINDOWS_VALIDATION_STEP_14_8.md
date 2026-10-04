# Windows Validation — Step 14.8

Use a fresh extraction such as `C:\NovaPDF-v148`. Do not overwrite an older package and do not delete Docker volumes.

## Automated runner

1. Start Docker Desktop and double-click `RUN_NOVAPDF_ALL.cmd`.
2. Confirm converter health and all five converter/OCR tests pass.
3. Confirm root clean install, audit capture, ESLint, semantic TypeScript, all 30 source contracts, all 12 PDF-engine tests, and production build pass.
4. Confirm the first migration run succeeds.
5. Confirm the migration-show output may contain the TypeORM order number and is accepted:

```text
[X] 1 CreateSignatureRequestBackend1721800000000
[OK] Applied migration confirmed: CreateSignatureRequestBackend1721800000000
```

6. Confirm the second migration run reports `No migrations are pending`.
7. Confirm Web, API, and Worker windows open without `spawn EINVAL`.
8. Confirm live/ready health, all 33 routes, and the real local backend E2E pass.

## PDF to Word acceptance

1. Convert a searchable PDF in Editable text mode and open the DOCX in Microsoft Word.
2. Convert the same PDF in Preserve layout mode.
3. Convert English and Bangla scanned PDFs with OCR.
4. Test custom page range, separate/combined output, Unicode filename, and Start over.
5. Confirm no runtime overlay, dead Convert button, corrupted DOCX, stale toolbar, or duplicate viewer portal.

The npm audit findings are captured warnings. Do not run `npm audit fix --force`. Do not mark Request Signatures Working.
