# NovaPDF Project Status

## v0.14.16 - Editable Layout Object Parity Corrective

**Release basis:** actual NovaPDF v0.14.15 source; no project rebuild.

### Completed

- Removed the page-sized native-PDF screenshot from Editable layout output.
- Added explicit residual-artwork extraction: erase reconstructed text/tables/shapes/pictures, remove the page background, filter specks, and retain only cropped unsupported artwork.
- Fixed bold/italic loss caused by mapping PDF font names before reading style suffixes.
- Added text-object fill-color fallback and broader Word run font/style properties.
- Retuned positioned text-box metrics and exact line spacing for closer PDF typography/coordinate parity.
- Preserved native Word table reconstruction for rectangle-cell and line-grid tables.
- Preserved selectable Word shapes and independent anchored pictures.
- Updated Web/converter identity to v0.14.16 / Build Step 14.16.
- Updated `RUN_NOVAPDF_ALL.cmd` and the current Windows checklist.

### Verified in this delivery environment

- Python compile passed.
- Converter functional tests: 11/11 passed.
- Dependency-free source contracts: 38/38 passed.
- Route manifest: 32 tools plus homepage = 33 public routes.
- Backend: 68/68 files byte-identical to v0.14.15.
- Line-grid sample: two real Word tables (4x2 and 4x4), independent picture, supported shapes, editable text, one page, no `behindDoc=1` anchor.
- Complex sample: one real Word table (4x3), chart paths as shapes, independent picture, editable styled text, one page, no `behindDoc=1` anchor.
- Both native samples contain one media file only: the actual extracted embedded picture, not a PDF-page raster.
- LibreOffice visual rendering showed no duplicate page, ghost text, or black cleanup spots.

### Pending promotion gates

- Complete `RUN_NOVAPDF_ALL.cmd` on Windows with Docker Desktop.
- Complete Microsoft Word manual object-selection and layout acceptance using `WINDOWS_VALIDATION_STEP_14_16.md`.
- Dependency-backed npm clean install, ESLint, TypeScript, 12 PDF-engine tests, production build, live routes, backend/migration, and E2E remain Windows-runner gates.

### Preserved boundaries

- 32 tools / 33 public routes.
- Existing working PDF engines and all three PDF-to-Word modes.
- English, Bangla, and combined OCR.
- Exact allowed development origins.
- Stable `novapdf-local` Docker project and volume preservation.
- No forced audit remediation.
- Request Signatures remains disabled and deferred as the final major feature.
