# Windows Validation — NovaPDF Build Step 14.3

Use a fresh short extraction path. Do not copy `node_modules` or `.next` from v0.14.2. Do not delete Docker volumes. Do not run `npm audit fix` or `npm audit fix --force`.

## A. Fast converter repair check

1. Start Docker Desktop and wait until its engine is ready.
2. Double-click `START_PDF_CONVERTER.cmd`.
3. Confirm it builds/recreates only `pdf-converter` and preserves all volumes.
4. Confirm the browser opens `http://localhost:4010/health` and returns JSON containing `"status":"ok"` and `"version":"0.14.3"`.
5. Keep the converter running.

## B. Complete one-click gate

1. Double-click `RUN_NOVAPDF_ALL.cmd`.
2. Confirm PostgreSQL, Redis, MinIO, Mailpit, and the converter start.
3. Confirm converter unit tests pass 5/5.
4. Confirm root public-registry clean install and audit capture.
5. Confirm ESLint, semantic TypeScript, all 25 source contracts, PDF-engine tests, and production build pass.
6. Confirm unchanged backend gates, migration, live/ready health, 33 public routes, and local E2E pass.
7. Confirm both URLs return healthy responses:
   - `http://localhost:3000/api/pdf-to-word/health`
   - `http://localhost:4010/health`

## C. Reported four-issue regression

1. Open `http://localhost:3000/pdf-to-word` in Chrome.
2. Open DevTools and clear existing Issues/Console entries.
3. Upload the same searchable PDF used in the report.
4. Confirm the status becomes `Converter online`.
5. Confirm no `AbortError` points to `controller.abort()`.
6. Confirm no direct browser `Failed to fetch` points to `localhost:4010`.
7. Confirm analysis completes and the card no longer remains at `Waiting for converter`.
8. Confirm the primary button reads `Convert to Word` and is clickable.

## D. Offline/recovery behavior

1. Run `docker compose stop pdf-converter`.
2. Within approximately five seconds, confirm the UI shows `Converter offline` without a Next.js runtime overlay.
3. Confirm an uploaded file remains visible and shows `Waiting for converter` rather than repeated issue entries.
4. Confirm the primary action changes to `Retry converter` and remains clickable.
5. Double-click `START_PDF_CONVERTER.cmd`.
6. Click Retry or wait for polling.
7. Confirm the status returns to Online without reloading or uploading the PDF again.
8. Confirm analysis resumes once and does not create duplicate requests.

## E. Conversion and Microsoft Word

1. Test searchable PDF → Editable text → No OCR.
2. Test mixed portrait/landscape PDF → Preserve layout.
3. Test scanned English PDF → Editable text → OCR English.
4. Test scanned Bangla PDF → Editable text → OCR Bangla.
5. Test English + Bangla OCR.
6. Test separate and combined DOCX output.
7. Test a custom page range.
8. Open every result in Microsoft Word without repair/unreadable-content warnings.
9. Confirm editable text can be changed and saved.

## F. Viewer and project regressions

Confirm portal counts:

```js
// Before upload: 0
document.querySelectorAll('.workspace-bottom-controls').length
```

```js
// After accepted upload: 1
document.querySelectorAll('.workspace-bottom-controls').length
```

```js
// After Start over: 0
document.querySelectorAll('.workspace-bottom-controls').length
```

Also confirm no duplicate shadow, no stale toolbar after tool switching, all viewer modes remain, all 32 tools/33 routes remain, exact allowed development origins remain, and Request Signatures remains disabled/not Working.
