# Windows Validation — Step 14.5

Use a fresh extraction such as `C:\NovaPDF-v145`. Do not overwrite v0.14.4 and do not delete Docker volumes.

1. Start Docker Desktop and double-click `RUN_NOVAPDF_ALL.cmd`.
2. Confirm converter health and all five converter/OCR tests pass.
3. Confirm Root clean install, audit capture, and Root ESLint pass.
4. Confirm semantic TypeScript passes with zero errors.
5. Confirm all source contracts, PDF-engine tests, production build, backend gates, migration, health, 33 routes, and local E2E pass.
6. In Edit PDF, verify multipage thumbnails, page navigation, zoom previews, tool switching, and Start over without runtime overlays or stale workers.
7. Re-test PDF to Word searchable, preserve-layout, English OCR, Bangla OCR, custom-range, separate, and combined downloads in Microsoft Word.

Do not use `npm audit fix --force`. Do not mark Request Signatures Working.
