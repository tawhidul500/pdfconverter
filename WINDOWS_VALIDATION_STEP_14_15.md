# NovaPDF v0.14.15 Windows Validation

Complete this checklist after `RUN_NOVAPDF_ALL.cmd` finishes successfully.

## 1. Release identity

- [ ] Runner heading shows `NovaPDF v0.14.15 consolidated one-click runner`.
- [ ] `http://localhost:3000/api/novapdf/version` reports version `0.14.15` and Build Step `14.15`.
- [ ] Homepage footer shows `Build Step 14.15 - Editable Native Objects Corrective` (the UI may use a centered dot separator).
- [ ] Converter health at `http://localhost:4010/health` reports version `0.14.15`.

## 2. Automated log review

- [ ] Root source contracts passed: 37.
- [ ] Dependency-backed PDF-engine tests passed: 12.
- [ ] Converter tests passed: 11.
- [ ] `validation-logs\converter-native-objects-<run-id>.txt` contains the line-grid and clean-background test.
- [ ] Root lint, TypeScript, and production build passed.
- [ ] Backend lint, typecheck, build, tests, migration apply/show/idempotency, live routes, and E2E passed.
- [ ] No Docker volume deletion or automatic `npm audit fix` occurred.

## 3. Editable layout - native digital PDF

Use `conversion-service\tests\fixtures\line-grid-layout.pdf` or an equivalent business document.

- [ ] No black/gray spots appear around text or punctuation.
- [ ] Text can be selected and edited.
- [ ] Document Details is a real 4-row x 2-column Word table.
- [ ] Item Table is a real 4-row x 4-column Word table.
- [ ] Table cells can be selected individually; borders/fills are editable in Word.
- [ ] The embedded picture is a separate selectable picture.
- [ ] The rounded callout is a separate selectable shape.
- [ ] Layout is visually close to the PDF and stays on one page.

## 4. Editable layout - complex native PDF

Use `conversion-service\tests\fixtures\complex-layout.pdf`.

- [ ] Quarterly performance table is a real Word table.
- [ ] Chart bars/line and supported callout paths are separate Word shapes.
- [ ] Embedded picture is selectable independently.
- [ ] Text is editable and no dark cleanup artifacts appear.
- [ ] Unsupported complex artwork remains visible without duplication.

## 5. Scanned/OCR PDF

Use `conversion-service\tests\fixtures\complex-layout-scan.pdf` with OCR enabled.

- [ ] OCR text is visible and editable.
- [ ] The page remains visually usable.
- [ ] Confirm the limitation: scan-only tables/pictures may remain page artwork because the scan contains no native PDF objects.

## 6. Regression checks

- [ ] Preserve layout with OCR remains searchable and visually unchanged.
- [ ] Editable text mode still produces reading-flow paragraphs.
- [ ] English, Bangla, and English + Bangla OCR choices work.
- [ ] Sign PDF, Edit PDF, existing working engines, 32 tools, and 33 routes remain available.
- [ ] Request Signatures remains disabled/deferred.

Record Microsoft Word version, Windows version, and any failed PDF sample before promoting the release.
