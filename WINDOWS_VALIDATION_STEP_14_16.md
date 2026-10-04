# NovaPDF v0.14.16 Windows Validation

Complete this checklist after `RUN_NOVAPDF_ALL.cmd` finishes successfully.

## 1. Release identity

- [ ] Runner heading shows `NovaPDF v0.14.16 consolidated one-click runner`.
- [ ] `http://localhost:3000/api/novapdf/version` reports version `0.14.16` and Build Step `14.16`.
- [ ] Homepage footer shows `Build Step 14.16 - Editable Layout Object Parity Corrective` (the UI may use a centered dot separator).
- [ ] Converter health at `http://localhost:4010/health` reports version `0.14.16`.

## 2. Automated log review

- [ ] Root dependency-free source contracts passed: 38.
- [ ] Dependency-backed PDF-engine tests passed: 12.
- [ ] Converter tests passed: 11.
- [ ] Converter regression log includes native no-background, style, table, shape, and picture checks.
- [ ] Root lint, TypeScript, and production build passed.
- [ ] Backend lint, typecheck, build, tests, migration apply/show/idempotency, live routes, and E2E passed.
- [ ] No Docker volume deletion or automatic `npm audit fix` occurred.

## 3. Native digital PDF - no duplicate background

Use `conversion-service\tests\fixtures\line-grid-layout.pdf`.

- [ ] Press Ctrl+A or open Selection Pane: there is no page-sized picture behind the content.
- [ ] Moving a text box, table, shape, or picture does not reveal duplicate original content underneath.
- [ ] No ghost text, double text, black dots, or gray cleanup spots are visible.
- [ ] The output remains one page and visually follows the PDF.

## 4. Text style and coordinates

- [ ] `OCR TEST DOCUMENT` is bold and uses the expected size.
- [ ] Colored text retains its PDF color (including the orange/brown callout text).
- [ ] Bold and italic runs remain bold/italic.
- [ ] Text is not duplicated, vertically colliding, or clipped.
- [ ] Font substitutions, when the original font is unavailable in Word, remain metrically close and are documented.

## 5. Real tables, shapes, and pictures

- [ ] Document Details is a real 4-row x 2-column Word table.
- [ ] Item Table is a real 4-row x 4-column Word table.
- [ ] Table cells, borders, fills, text, rows, and columns can be edited independently.
- [ ] Rounded callout and supported simple paths are selectable Word shapes.
- [ ] Embedded image is a separate Word picture that can be moved, resized, cropped, rotated, replaced, and formatted.
- [ ] The image's internal pixels are not falsely presented as editable vector objects.

## 6. Complex native PDF

Use `conversion-service\tests\fixtures\complex-layout.pdf`.

- [ ] Quarterly performance table is a real 4-row x 3-column Word table.
- [ ] Chart bars/axis and supported callout paths are separate shapes.
- [ ] Embedded picture is selectable independently.
- [ ] White title, red footer, brown callout text, sizes, and bold weights are preserved closely.
- [ ] There is no page-sized PDF background and no hidden duplicate content.
- [ ] Unsupported complex artwork, if present, is limited to cropped residual objects.

## 7. Scanned/OCR PDF

Use `conversion-service\tests\fixtures\complex-layout-scan.pdf` with OCR enabled.

- [ ] OCR text is visible and editable.
- [ ] The scan remains the visual page source.
- [ ] Confirm the limitation: scan-only tables/shapes/pictures cannot be guaranteed as native Word authoring objects.

## 8. Regression checks

- [ ] Preserve layout with OCR remains searchable and visually unchanged.
- [ ] Editable text mode still produces reading-flow paragraphs.
- [ ] English, Bangla, and English + Bangla OCR choices work.
- [ ] Sign PDF, Edit PDF, existing working engines, 32 tools, and 33 routes remain available.
- [ ] Request Signatures remains disabled/deferred.

Record Microsoft Word version, Windows version, source PDF, and screenshots for any failed item before promotion.
