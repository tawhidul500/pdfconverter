# NovaPDF Windows Validation - Build Step 14.1

Use a fresh extraction. Do not delete Docker volumes. Double-click `RUN_NOVAPDF_ALL.cmd` and retain every generated log.

## A. Automated one-click gate

Confirm the runner completes all of the following:

- Root public-registry `npm ci`
- Root audit capture without automatic fixes
- ESLint
- Semantic TypeScript
- 23 dependency-free source contracts
- 12 PDF-engine tests, including `test-pdf-to-word-engine.mjs`
- Production build
- Step 12.8 backend install, audit capture, lint, TypeScript, build, unit tests, metadata test
- Existing migration shown as applied and no pending migration
- API live and ready health
- All 33 routes
- Real local two-recipient backend E2E

## B. Viewer portal lifecycle

Open `/pdf-to-word` in Chrome and use DevTools Console.

Before upload:

```js
document.querySelectorAll(".workspace-bottom-controls").length
```

Expected: `0`

After a valid PDF is accepted:

```js
document.querySelectorAll(".workspace-bottom-controls").length
```

Expected: `1`

After **Start over**:

```js
document.querySelectorAll(".workspace-bottom-controls").length
```

Expected: `0`

Also confirm there is no shadow spot, duplicate toolbar, stale toolbar after tool switching, or toolbar on a generic upload screen.

## C. Preserve-layout conversion

1. Upload `test-files/sample-six-pages.pdf`.
2. Select **All pages**.
3. Select **Preserve layout**.
4. Select **Separate DOCX**.
5. Convert and download the DOCX.
6. Open it in Microsoft Word desktop.
7. Confirm six Word pages exist.
8. Confirm each PDF page is visible, correctly oriented, not stretched, and contained within the page.
9. Confirm page images are sharp enough to read at 100% zoom.
10. Repeat with custom range `1-3,5`; confirm only four pages are exported.

## D. Editable-text conversion

1. Use a text-based PDF.
2. Select **Editable text** and convert.
3. Open the DOCX in Microsoft Word.
4. Confirm text can be selected, edited, copied, deleted, and reformatted.
5. Confirm line order is reasonable and pages remain separated.
6. Confirm headings or larger text retain a reasonable size difference.
7. Confirm the source PDF itself is not modified.

## E. Scanned PDF behavior

1. Upload an image-only/scanned PDF.
2. Convert with **Preserve layout**; confirm a valid DOCX is generated.
3. Convert the same selected pages with **Editable text**.
4. Confirm NovaPDF reports that no editable text was found and directs the user to Preserve layout or OCR.
5. Confirm no fake or empty success download is shown.

## F. Multiple files and output modes

1. Upload at least two PDFs.
2. Select **Separate DOCX** and convert.
3. Confirm one downloadable DOCX appears for each source and filenames are unique.
4. Select **Combined DOCX** and convert.
5. Confirm exactly one DOCX appears and source/page order matches the workspace order.
6. Test custom ranges where source PDFs have different page counts; out-of-range pages must be ignored while each PDF retains at least one selected page.

## G. Workspace behavior

- Add/remove files.
- Duplicate upload warning.
- Invalid, damaged, empty, non-PDF, password-protected, over-size, over-count, and over-page-limit handling.
- Continuous, Single-page, Two-page, and Three-page modes.
- Zoom and source navigation.
- File transfer to another compatible tool.
- Start over clears files, progress, messages, downloads, thumbnails, and portal.
- Home reset exits cleanly.
- Switching tools while a result exists leaves no stale toolbar or download state in the next tool.

## H. Regression boundary

- All 32 tools remain visible.
- All existing Working tools still process and download correctly.
- Edit PDF remains unchanged.
- Request Signatures remains disabled and is not marked Working.
- Exact `allowedDevOrigins` remains unchanged.
- No private npm registry URLs are introduced.
- Docker volumes remain preserved.
- No `npm audit fix` command is run automatically.

Record screenshots of the successful automated summary, portal counts, preserve-layout DOCX, editable DOCX, scanned-PDF error, separate outputs, and combined output.
