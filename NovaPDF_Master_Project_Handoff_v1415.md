# NovaPDF Master Project Handoff v0.14.15

## 1. Current release

NovaPDF v0.14.15 is the **Editable Native Objects Corrective** for PDF to Word. Work was performed directly on the supplied v0.14.14 source; the project was not rebuilt from scratch.

Authoritative runnable folder: `NovaPDF_v0.14.15_Editable_Native_Objects_Corrective`

## 2. Preserved product boundary

- 32 registered tools and 33 public routes (32 tools plus homepage).
- Existing working browser-local PDF engines and their source contracts.
- Three PDF-to-Word modes: `visual`, `hybrid`, and `editable`.
- English, Bangla, and combined OCR.
- Exact Next.js allowed development origins.
- Stable Docker Compose project name `novapdf-local` and volume preservation.
- Step 12.8 backend source: 68 files, byte-identical to the supplied v0.14.14 source.
- No automatic or forced audit remediation.
- Request Signatures remains disabled and deferred until the final major feature.

## 3. Defect addressed

The v0.14.14 Editable layout pipeline made text editable, but native PDF text was removed from a raster page using inpainting. Small glyphs and punctuation could leave dark/black cleanup spots. Tables, shapes, and pictures also remained mostly part of the fallback page image.

## 4. v0.14.15 conversion architecture

### 4.1 Text and clean fallback layer

1. PDFium extracts native text blocks and their coordinates/style.
2. Native text page objects are removed from the PDF page object list.
3. Reconstructable table paths, shapes, and embedded images are also removed from the fallback page.
4. PDFium renders the remaining unsupported artwork.
5. Native text is rebuilt as visible positioned Word VML text boxes.
6. OCR blocks are deduplicated against native text; OCR-only regions still use raster cleanup because scans have no removable text objects.

This object-level removal is the principal black-spot correction.

### 4.2 Native Word tables

Two table detectors are active:

- **Rectangle-cell detector:** recognizes adjacent stroked cell rectangles and transfers dimensions, fills, borders, and cell text.
- **Line-grid detector:** recognizes connected horizontal/vertical line components, validates grid coverage, derives rows/columns, maps aligned fill rectangles, and transfers cell text.

The output is a fixed-layout `w:tbl` positioned relative to the page.

### 4.3 Native shapes and pictures

- Supported rectangle, rounded-rectangle, and thin-line paths are written as independent Word shapes.
- Embedded PDF images below the full-page scan threshold are extracted and written as anchored Word pictures.
- Unsupported complex vectors remain in the fallback artwork.

## 5. Files changed in this release

Primary implementation:

- `conversion-service/app/converter.py`
- `conversion-service/app/main.py`
- `conversion-service/tests/test_converter.py`
- `conversion-service/tests/fixtures/line-grid-layout.pdf`
- `src/components/pdf-to-word-workspace.tsx`
- `src/components/home-page.tsx`
- `src/app/api/novapdf/version/route.ts`
- `RUN_NOVAPDF_ALL.cmd`
- Windows version verification/launch scripts
- package version files and source contracts

Current documentation, handoff, manifests, and checksums were updated for Step 14.15.

## 6. Validation performed

- Python compile: passed.
- Converter functional suite: 11/11 passed.
- Dependency-free source contracts: 37/37 passed.
- Route manifest: 32 tools / 33 public routes passed.
- Backend byte identity: passed, 68/68 files identical.
- DOCX package/open checks: passed.
- Handoff document audit: 278 supplied Markdown/TXT inputs read, 44,365 lines, zero decode errors.
- Canonical/versioned Master Handoff DOCX/PDF publishing QA: passed across three rendered pages.
- LibreOffice render QA: passed for line-grid and complex-layout native samples.
- Clean-background regression: largest fallback image contained 0 dark pixels and 0 non-white pixels for the fully reconstructable line-grid fixture.

Not executed in this Linux delivery environment: dependency-backed npm clean-install/lint/TypeScript/build/PDF-engine suite and full Docker/backend/live E2E. These remain mandatory in `RUN_NOVAPDF_ALL.cmd` and the Windows checklist.

## 7. Known limitations

- A scanned page is an image; it does not expose native table, shape, or picture objects. OCR can reconstruct text but cannot reliably recover the original authoring model.
- Complex charts do not expose original series data, formulas, or Excel/PowerPoint objects.
- Irregular/merged tables, clipping paths, transparency groups, rotated/skewed objects, and complex vector drawings may remain visual fallback artwork.
- Word and LibreOffice render positioned VML/anchored objects differently in edge cases; Microsoft Word acceptance is required.

## 8. Windows release procedure

1. Extract the runnable ZIP to a fresh folder.
2. Start Docker Desktop.
3. Run `RUN_NOVAPDF_ALL.cmd`.
4. Review the converter native-object log and all automated gates.
5. Complete `WINDOWS_VALIDATION_STEP_14_15.md` in Microsoft Word.
6. Promote only after all boxes pass.

## 9. Next work

Do not start the next roadmap feature until v0.14.15 passes Windows/Microsoft Word acceptance. After acceptance, continue the regular tools roadmap with PDF to PowerPoint. Do not start Request Signatures yet.
