# Windows Validation — Step 14.9

Use a fresh extraction such as `C:\NovaPDF-v149`. Do not overwrite an older package and do not delete Docker volumes.

## Complete automated sequence

1. Start Docker Desktop and double-click `RUN_NOVAPDF_ALL.cmd`.
2. Confirm converter health and all five converter/OCR tests pass.
3. Confirm root clean install, audit capture, ESLint, semantic TypeScript, all 31 source contracts, all 12 PDF-engine tests, and production build pass.
4. Confirm migration apply/show/idempotency passes and `[X] 1 CreateSignatureRequestBackend1721800000000` is accepted.
5. Confirm Web, API, and Worker launch, health, all 33 routes, and local backend E2E pass.

## Development hydration check

1. Close all old NovaPDF tabs and stop any previous dev server.
2. From the Step 14.9 project root run:

```bat
npm.cmd run dev
```

3. Confirm the terminal contains:

```text
[NovaPDF] Starting the Webpack development server with a clean .next-dev cache.
▲ Next.js 16.2.10 (webpack)
```

4. Open `http://localhost:3000` in a new private/incognito window.
5. Confirm there is no hydration mismatch overlay.
6. Confirm the footer settles on `Build Step 14.9 · PDF to Word + OCR`.
7. Confirm `.next` still exists after production build and manual dev uses `.next-dev`.
8. Stop and restart `npm.cmd run dev`; confirm `.next-dev` is rebuilt cleanly.

## PDF to Word acceptance

1. Convert a searchable PDF in Editable text mode and open the DOCX in Microsoft Word.
2. Convert the same PDF in Preserve layout mode.
3. Convert English and Bangla scanned PDFs with OCR.
4. Test custom page range, separate/combined output, Unicode filename, and Start over.
5. Confirm no runtime overlay, dead Convert button, corrupted DOCX, stale toolbar, or duplicate viewer portal.

Do not run `npm audit fix --force`. Do not mark Request Signatures Working.
