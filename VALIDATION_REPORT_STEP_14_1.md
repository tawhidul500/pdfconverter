# NovaPDF Validation Report — Build Step 14.1

## Scope

Corrected the Step 14.0 scope misunderstanding by connecting a real browser-local PDF-to-DOCX engine to the dedicated `/pdf-to-word` workspace. Request Signatures remains deferred; no backend implementation was started or changed.

## Functional implementation completed

### Preserve layout

- Selected PDF pages are rendered with PDF.js to high-quality JPEG images.
- Each rendered page is embedded through valid OOXML image relationships.
- Word page dimensions and portrait/landscape orientation follow the source PDF page.
- Images fit restrained margins without aspect-ratio distortion.
- Mixed portrait and landscape sections are supported.

### Editable text

- PDF.js text items are grouped into editable lines and Word paragraphs.
- Font size is approximated from the PDF transform.
- Basic bold and italic style inference is retained where font names expose it.
- Larger vertical gaps produce paragraph spacing.
- Page boundaries are retained through Word sections.
- A fully scanned selection returns a truthful instruction to use Preserve layout or OCR first; no fake empty success file is shown.

### Workspace/output

- All-pages and custom-range conversion.
- Separate DOCX per source PDF or one combined DOCX in source/page order.
- Real DOCX Blob downloads with correct MIME type and sanitized filenames.
- Progress, processing phases, result metadata, and actionable errors.
- Existing results and partial failed-batch URLs are revoked to prevent browser resource leaks.
- File transfer, Start over, home reset, right panel, previews, zoom, and page-view modes remain connected.

## Completed in the packaging environment

- 23/23 dependency-free source contracts passed.
- Step 14.1 working-engine contract passed 24 checks.
- Dedicated PDF to Word OOXML regression test passed.
- Editable fixture: valid DOCX, 2 paragraphs, 1 section.
- Preserve-layout fixture: valid DOCX, 2 embedded images, 2 sections, mixed portrait/landscape.
- `python-docx` opened both generated DOCX files.
- LibreOffice opened and rendered both generated DOCX files to PDF:
  - editable fixture: 1 page;
  - preserve-layout fixture: 2 pages.
- 40 MJS files passed `node --check`.
- 90 TypeScript/TSX project files passed syntax transpilation with zero failures.
- 7 project JSON files parsed successfully.
- Root lockfile contains 464 resolved package URLs; all are public `https://registry.npmjs.org/` URLs.
- Root and backend `.npmrc` files point to the public npm registry.
- Exact development origins remain unchanged.
- Runner contains no executable Docker-volume deletion or automatic audit-fix command.
- All 32 tools and all 33 routes remain.
- The Step 12.8 backend remains byte-for-byte identical across all 68 files compared with the original Step 14.0 package.

## Dependency-backed gates not completed here

A clean public-registry `npm ci` could not finish in this sandbox because registry access returned `EAI_AGAIN`. An offline retry also failed because `zod-validation-error-4.0.2.tgz` was not present in the npm cache. Therefore these gates remain mandatory on Windows:

- clean root install and audit capture;
- ESLint;
- full semantic TypeScript;
- all 12 PDF-engine tests as one suite;
- Next.js production build;
- live browser conversion;
- unchanged backend install/lint/typecheck/build/unit/metadata gates;
- migration, health, 33 live routes, and local backend E2E;
- Microsoft Word desktop acceptance.

The standalone PDF to Word engine regression test passed; the full 12-test suite could not be executed only because the incomplete dependency tree lacked the pre-existing `pdf-lib` package entry point.

## Release classification

**PDF to Word is a real, connected implementation candidate—not a frontend-only view.** Promote it to proven Working only after every item in `WINDOWS_VALIDATION_STEP_14_1.md` passes and evidence is retained.

Request Signatures remains disabled, not Working, and reserved for the final major feature milestone.
