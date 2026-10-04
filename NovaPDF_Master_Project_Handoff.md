# NovaPDF Master Project Handoff v0.14.16

## 1. Current release

NovaPDF v0.14.16 is the **Editable Layout Object Parity Corrective** for PDF to Word. Work was performed directly on the actual v0.14.15 source; the project was not rebuilt.

Authoritative runnable folder: `NovaPDF_v0.14.16_Editable_Layout_Object_Parity_Corrective`

## 2. Preserved product boundary

- 32 registered tools and 33 public routes (32 tools plus homepage).
- Existing working browser-local PDF engines and their source contracts.
- Three PDF-to-Word modes: `visual`, `hybrid`, and `editable`.
- English, Bangla, and combined OCR.
- Exact Next.js allowed development origins.
- Stable Docker Compose project name `novapdf-local` and volume preservation.
- Step 12.8 backend: 68 files, byte-identical to v0.14.15.
- No automatic or forced audit remediation.
- Request Signatures remains disabled and deferred until the final major feature.

## 3. User-reported defects

The v0.14.15 candidate improved native tables/shapes/pictures, but Microsoft Word still displayed doubled text and the original PDF page behind the editable layer. Text color, bold weight, size, and vertical placement also did not consistently match the PDF. Moving objects could reveal duplicate source content, making tables and shapes appear to be only page artwork.

## 4. Root causes

### 4.1 Duplicate native page

The converter recursively enumerated PDFium page objects, attempted to remove reconstructed objects, then rendered the page as one full-size fallback picture. Objects nested inside Form XObjects cannot always be detached from the page through the child object handle. Those original objects survived in the fallback image.

### 4.2 Font style loss

The converter mapped names such as `Helvetica-Bold` to `Arial` before detecting bold/italic traits. When the PDF font weight metadata was zero, the `-Bold` / `-Oblique` suffix had already been discarded.

### 4.3 Text style and coordinate drift

Character color was not always exposed, Word complex-script properties were incomplete, and the text-box ascent/width/line-height compensation was too aggressive for some glyph boxes.

## 5. v0.14.16 conversion architecture

### 5.1 Native pages: no page-sized background

1. Extract native positioned text and style metadata.
2. Reconstruct rectangle-cell and line-grid tables as Word tables.
3. Reconstruct supported paths as Word shapes.
4. Extract embedded images as independent Word pictures.
5. Render the original PDF page only into a temporary RGBA analysis surface.
6. Estimate and remove the uniform paper/background color.
7. Explicitly erase every reconstructed text/table/shape/picture region from the raster.
8. Dilate text masks to remove antialiased ghost edges.
9. Filter isolated compression/speck components.
10. Crop any remaining unsupported artwork to its own bounding boxes and anchor only those crops.
11. If no unsupported residue remains, insert no fallback picture.

This avoids reliance on PDFium child-object deletion and prevents the original native page from remaining behind the Word objects.

### 5.2 Scanned pages

A scanned page is itself a raster image. OCR text can be placed as editable text, but the full scan remains visual artwork until semantic scan reconstruction is implemented. This is intentionally different from native digital pages.

### 5.3 Typography parity

- Detect bold/italic from the raw PDF font name before mapping to installed Word families.
- Use PDF text-object fill color as a fallback.
- Preserve exposed font size with a broader safe range.
- Emit Word fonts for ASCII, high ANSI, East Asian, and complex scripts.
- Emit normal and complex-script bold/italic flags.
- Retune text-box top, width, height, and exact line spacing.

### 5.4 Native objects

- Rectangle-cell detector and line-grid detector write actual fixed-layout `w:tbl` tables.
- Supported rectangles, rounded rectangles, thin lines, chart bars, and similar paths are independent Word shapes.
- Embedded raster images are independent anchored Word pictures.
- Pictures are editable as Word picture objects (move, resize, crop, rotate, replace, format); their internal pixels are not vector-editable.
- Unsupported complex vectors, clipping/transparency groups, irregular/merged grids, and chart datasets may remain cropped residual artwork.

## 6. Primary files changed

- `conversion-service/app/converter.py`
- `conversion-service/app/main.py`
- `conversion-service/tests/test_converter.py`
- `src/components/pdf-to-word-workspace.tsx`
- `src/components/home-page.tsx`
- `src/app/api/novapdf/version/route.ts`
- `RUN_NOVAPDF_ALL.cmd`
- `START_NOVAPDF_WEB.cmd`
- Windows launch/version scripts
- package version files
- source contracts, including `test-step-14-16-editable-layout-object-parity.mjs`
- current release/handoff/validation documents

## 7. Validation performed

- Python compile: passed.
- Converter functional suite: 11/11 passed.
- Dependency-free source contracts: 38/38 passed.
- Route manifest: 32 tools / 33 public routes passed.
- Backend byte identity: 68/68 files identical.
- Line-grid DOCX: two real tables (4x2, 4x4), nine positioned text boxes, independent supported shapes, one 181x80 embedded picture, zero hidden text, zero `behindDoc=1` anchors.
- Complex DOCX: one real table (4x3), 22 positioned text boxes, independent chart/callout shapes, one 261x121 embedded picture, zero hidden text, zero `behindDoc=1` anchors.
- LibreOffice render QA: both native samples render as one clean page; no duplicated PDF background, ghost text, or black cleanup spots.
- Master Handoff DOCX/PDF publishing QA: rendered and visually inspected.

Not executed in this Linux delivery environment: dependency-backed npm clean install, ESLint, semantic TypeScript, 12 PDF-engine tests, production build, Docker/backend/migration/live-route/E2E gates, and Microsoft Word interaction acceptance. These remain mandatory in the Windows runner/checklist.

## 8. Handoff/document discipline

Every formal update must provide:

- complete runnable source ZIP;
- complete updated handoff package ZIP;
- patch ZIP when useful;
- updated canonical and versioned Master Handoff MD/DOCX/PDF;
- current Project Status, Release Notes, Continue Prompt, running guide, Windows checklist, validation report, defect ledger, source change summary, manifests, and SHA-256 checksums;
- sample output and validation logs when the feature produces artifacts.

Historical versioned documents remain immutable release history. Current unversioned files and the current versioned copies must agree with the actual source and test evidence.

## 9. Known limitations

- Scanned PDFs have no native table, shape, picture, or text authoring objects; OCR cannot guarantee semantic reconstruction.
- Complex charts do not expose original series data, formulas, or Office chart objects.
- Irregular/merged tables, clipping paths, transparency groups, rotated/skewed objects, and complex vector drawings may remain cropped visual residue.
- A raster picture is independently editable as a Word picture object, but its pixels are not editable vector elements.
- Font substitution occurs when the exact PDF font is unavailable in Microsoft Word.
- Word and LibreOffice can render VML/anchored objects differently; Microsoft Word acceptance is required.

## 10. Windows release procedure

1. Extract the runnable ZIP to a fresh folder.
2. Start Docker Desktop.
3. Run `RUN_NOVAPDF_ALL.cmd`.
4. Review all automated logs.
5. Open both provided sample DOCX files in Microsoft Word and use the Selection Pane to confirm no page-sized background.
6. Complete `WINDOWS_VALIDATION_STEP_14_16.md`.
7. Promote only after every required item passes.

## 11. Next work

Do not start the next roadmap feature until v0.14.16 passes Windows/Microsoft Word acceptance. After acceptance, continue with PDF to PowerPoint. Do not start Request Signatures yet.
