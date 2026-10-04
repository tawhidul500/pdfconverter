# NovaPDF Windows Validation - Build Step 14.0

Complete every item. Record Pass/Fail and keep screenshots/logs for any failure.

## A. One-click automated gate

1. Extract the package to a fresh folder. Do not delete or recreate Docker volumes.
2. Double-click `RUN_NOVAPDF_ALL.cmd`.
3. Confirm the runner uses `https://registry.npmjs.org/` only.
4. Confirm root clean install completes.
5. Confirm root audit is captured and no automatic audit fix runs.
6. Confirm ESLint passes.
7. Confirm semantic TypeScript passes.
8. Confirm all 23 source contracts pass.
9. Confirm all 11 PDF-engine tests pass.
10. Confirm the production build passes.
11. Confirm backend lint, typecheck, build, unit tests, and metadata tests pass.
12. Confirm the committed migration is applied and no migration is pending.
13. Confirm API live and ready health endpoints pass.
14. Confirm all 33 HTTP routes pass.
15. Confirm the local two-recipient E2E passes.
16. Save the complete `validation-logs` folder.

## B. PDF to Word entry and upload

1. Open `http://localhost:3000/pdf-to-word` in Chrome.
2. Confirm the dedicated PDF to Word workspace opens instead of the generic placeholder.
3. Before upload, run in DevTools Console:

```js
document.querySelectorAll(".workspace-bottom-controls").length
```

Expected: `0`.

4. Upload one valid PDF. Confirm a first-page preview, filename, size, and page count appear.
5. Confirm the bottom viewer appears exactly once. Console expected: `1`.
6. Add multiple valid PDFs and confirm each source appears once.
7. Try a non-PDF, empty file, duplicate PDF, password-protected PDF, damaged PDF, file over 50 MB, batch over 150 MB, more than 10 PDFs, and batch over 250 pages. Confirm truthful validation messages and no crash.

## C. PDF to Word frontend controls

1. Select All pages. Confirm every source card reports its full selected-page count.
2. Select Custom range and enter `1-3,5,8`. Confirm each source reports the pages available within its own page count.
3. Enter invalid syntax such as `3-1`, `a-b`, or a range that selects zero pages. Confirm Review conversion setup is blocked with a clear message.
4. Switch between Preserve layout and Editable text. Confirm source-card labels update.
5. With one PDF, confirm Combined DOCX is disabled.
6. With at least two PDFs, select Combined DOCX and confirm it becomes active.
7. Switch back to Separate DOCX.
8. Edit the output filename/batch prefix and confirm `.docx` remains shown separately.
9. Confirm OCR scanned pages is visibly disabled and labelled as later scope.
10. Click Review conversion setup. Confirm a frontend-ready summary appears and no fake DOCX download is created.

## D. Viewer and source-card modes

1. Test zoom out, zoom percentage selection, and zoom in.
2. Test Continuous view.
3. Test Single-page view and confirm only the active source card remains visible.
4. Test Two-page view.
5. Test Three-page view.
6. Use the page/source selector in the bottom viewer and confirm the correct PDF card is activated and scrolled into view.
7. Confirm only one `.workspace-bottom-controls` portal exists throughout.
8. Confirm no duplicate shadow/blur spot appears behind the viewer.

## E. Tool switching, transfer, and reset

1. With PDFs loaded, switch to another compatible PDF tool from the left rail.
2. Confirm compatible files transfer once and no stale PDF to Word toolbar remains.
3. Return to PDF to Word and confirm hidden workspaces have not created extra portals.
4. Click Start over. Confirm all PDF to Word state clears.
5. After Start over, Console expected portal count: `0`.
6. Upload again and confirm portal count returns to exactly `1`.
7. Click the NovaPDF logo. Confirm the homepage opens and all in-memory workspace state resets.
8. Use browser Back/Forward and confirm route/title/workspace state remains correct.

## F. Responsive and accessibility checks

1. Test desktop, tablet, and mobile widths.
2. Confirm the right panel opens/closes correctly on smaller widths.
3. Confirm cards, buttons, inputs, labels, and bottom controls are not clipped.
4. Keyboard-test upload, source selection, range input, option cards, Review conversion setup, Start over, and tool navigation.
5. Confirm visible focus indicators and meaningful accessible labels.

## G. Regression checks

1. Recheck Merge, Split, Compress, PDF to JPG, JPG to PDF, Organize, Rotate, Crop, Watermark, Page Numbers, Sign, and Edit workspaces.
2. Confirm existing viewer modes and portal lifecycle remain correct.
3. Confirm all 32 tools remain in the catalog and all 33 routes load.
4. Confirm Request Signatures remains disabled and is not labelled Working.

## Final classification

- PDF to Word may be called **Frontend candidate** only.
- It must not be called Working until the DOCX engine and complete validation sequence exist and pass.
- Request Signatures remains deferred until the final major feature milestone.
