# Windows Validation — NovaPDF Build Step 14.2

Use a fresh short extraction path. Do not delete Docker volumes. Do not run `npm audit fix` or `npm audit fix --force`.

## A. Automated one-click gate

1. Double-click `RUN_NOVAPDF_ALL.cmd`.
2. Confirm Docker Desktop starts or is reused.
3. Confirm PostgreSQL, Redis, MinIO, Mailpit, and `pdf-converter` start without deleting volumes.
4. Confirm converter health passes at `http://localhost:4010/health`.
5. Confirm all five converter tests pass: native editable, mixed orientation, preserve layout, English OCR, and Bangla OCR.
6. Confirm root clean install uses `https://registry.npmjs.org/`.
7. Confirm root audit is captured without an automatic fix.
8. Confirm ESLint and semantic TypeScript pass.
9. Confirm all 24 source contracts pass.
10. Confirm all dependency-backed PDF-engine tests pass.
11. Confirm the production build passes.
12. Confirm the unchanged backend lint, typecheck, build, tests, metadata, migration, live/ready health, 33 routes, and local E2E pass.

## B. PDF to Word service status

1. Open `/pdf-to-word`.
2. Confirm the bottom status says `Converter online`.
3. Stop the `pdf-converter` Docker service and confirm the status changes to `Converter offline` and conversion is disabled.
4. Restart the service and confirm the status returns to `Converter online` without reloading the page.

## C. Normal editable PDF

1. Upload a selectable-text PDF.
2. Confirm scanned-page analysis completes and does not incorrectly flag normal pages.
3. Choose `Editable text` and `No OCR`.
4. Convert and download.
5. Open the DOCX in Microsoft Word without any repair, unreadable-content, or corruption warning.
6. Edit text and save the document.
7. Confirm selected pages and page order are correct.

## D. Preserve layout

1. Upload a PDF containing portrait and landscape pages.
2. Choose `Preserve layout`.
3. Convert and open in Microsoft Word.
4. Confirm every selected PDF page appears once.
5. Confirm portrait/landscape orientation and visual page content are preserved.
6. Confirm the page image is not stretched.

## E. OCR

1. Upload an image-only scanned PDF.
2. Confirm the workspace reports scanned pages.
3. Choose `Editable text`, `OCR`, and `English`.
4. Convert and open in Microsoft Word.
5. Confirm recognized text is editable.
6. Repeat with a Bangla scan using `Bangla`.
7. Repeat with a mixed English/Bangla scan using `English + Bangla`.
8. Confirm OCR is not offered as necessary in Preserve layout mode.

## F. Batch, ranges, and downloads

1. Test separate DOCX output with at least two PDFs.
2. Open every downloaded DOCX in Microsoft Word.
3. Test combined DOCX output.
4. Test custom ranges such as `1-3,5,8`.
5. Confirm filenames end in `.docx` and Windows identifies them as Microsoft Word documents.
6. Confirm no zero-byte, HTML, JSON, or ZIP-with-wrong-extension file is downloaded.
7. Confirm conversion errors do not leave stale successful downloads.

## G. Viewer lifecycle regression

In Chrome DevTools run:

```js
// Before upload
 document.querySelectorAll('.workspace-bottom-controls').length
// Expected: 0
```

```js
// After accepted upload in active tool
 document.querySelectorAll('.workspace-bottom-controls').length
// Expected: 1
```

```js
// After Start over
 document.querySelectorAll('.workspace-bottom-controls').length
// Expected: 0
```

Also confirm no duplicate shadow spot and no stale toolbar after switching tools.

## H. Locked boundaries

- All 32 tools and 33 routes remain.
- Existing working tools still process files.
- File transfer, Start over, Home reset, Continuous, Single-page, Two-page, and Three-page modes remain.
- Exact `allowedDevOrigins` remain unchanged.
- Docker volumes remain.
- Request Signatures remains disabled and is not Working.
