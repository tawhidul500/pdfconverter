# NovaPDF v0.14.15 Editable Native Objects Addendum

This addendum supersedes older PDF-to-Word Editable layout descriptions when they conflict.

- Native PDF text objects are removed before fallback rendering, preventing black/gray cleanup spots on native-text pages.
- Rectangle-cell and independent line-grid tables are reconstructed as actual fixed-layout Word tables when the PDF exposes usable geometry.
- Supported rectangles, rounded rectangles, thin lines, chart bars, and embedded images are reconstructed as separate Word shapes/pictures.
- Complex vectors, chart source data, irregular/merged structures, and scan-only page objects may remain visual fallback artwork.
- Preserve layout, Editable text, English/Bangla OCR, 32 tools, 33 routes, and all release safety boundaries remain preserved.

---

# NovaPDF v0.14.14 Searchable Preserve-Layout OCR Addendum

This addendum is authoritative over older PDF-to-Word status text below. PDF to Word now allows **Preserve layout** and **OCR** simultaneously. The visible page remains a rendered image; scanned pages receive hidden Tesseract OCR text and digital pages receive hidden native PDF text. This makes the DOCX searchable without changing the visible layout. Editable-text OCR remains available. All other tools, routes, Windows stability corrections, frozen backend boundary, stable Docker volumes, and deferred Request Signatures status remain unchanged.

# NovaPDF v0.14.5 PDF.js TypeScript Corrective Addendum

Step 14.5 only replaces the two `PDFDocumentProxy.destroy()` calls that failed semantic TypeScript with the typed `PDFDocumentLoadingTask.destroy()` cleanup path. PDF to Word, OCR, same-origin proxying, all 32 tools, 33 routes, viewer behavior, Step 12.8 backend boundary, public-registry policy, and deferred Request Signatures status remain unchanged.

# NovaPDF v0.14.4 Windows ESLint Corrective Addendum

This addendum is authoritative over older current-status headings. PDF to Word retains the v0.14.3 same-origin service proxy, PDFium/python-docx conversion, and optional English/Bangla OCR. Step 14.4 only removes the four Root ESLint failures reported by the real Windows runner. All 32 tools, 33 routes, viewer behavior, Step 12.8 backend boundary, public-registry policy, and deferred Request Signatures status remain unchanged.

# NovaPDF v0.14.3 Converter Startup/Proxy Corrective Addendum

This addendum is authoritative over the v0.14.2 direct-browser-service wording below.

- Browser requests use same-origin `/api/pdf-to-word/health`, `/analyze`, and `/convert` proxy routes.
- Port 4010 is server-side/local infrastructure; browser code does not call it directly.
- Converter-offline state produces a controlled 503 message, a Retry control, and no repeated Next.js runtime overlay.
- Upload analysis waits until the converter is online and avoids duplicate in-flight requests.
- `START_PDF_CONVERTER.cmd` repairs only the converter; `npm run dev` attempts startup automatically.
- PDFium, python-docx, optional English/Bangla OCR, DOCX validation, output modes, ranges, and limits remain.
- Request Signatures remains disabled and deferred until the final major feature.

# NovaPDF v0.14.2 PDF to Word Service/OCR Addendum

This addendum is authoritative over the v0.14.1 browser-local OOXML wording below.

- PDF to Word uses a stateless local service built with PDFium, python-docx, and optional Tesseract OCR.
- Preserve layout, Editable text, No OCR, OCR, English, Bangla, English + Bangla, page ranges, separate output, and combined output are connected.
- The browser validates required DOCX package parts and XML before exposing downloads.
- Request Signatures remains disabled and deferred until the final major feature.
- All other normal tools must be complete functional tools, not frontend-only views.

# NovaPDF v0.14.1 PDF to Word Working-Engine Addendum

This addendum is authoritative over the v0.14.0 frontend-candidate wording below.

- PDF to Word has a real browser-local DOCX engine and is an **implementation candidate**, pending complete Windows/browser/Microsoft Word acceptance.
- Preserve layout renders selected PDF pages and embeds them into matching Word page sections.
- Editable text extracts and reconstructs editable paragraphs from PDF.js text items.
- All/custom pages, separate/combined output, filenames, progress, errors, and real DOCX downloads are connected.
- OCR remains unavailable. Image-only PDFs must use Preserve layout until the OCR tool is implemented.
- Request Signatures remains disabled and is deferred until the final major feature.
- All future normal tools must be built as complete functional tools, not frontend-only views.

# NovaPDF v0.14.0 PDF to Word Frontend Candidate Addendum

This addendum is authoritative over older milestone wording below. Build Step 14.0 begins the user-approved frontend-first sequence. **PDF to Word** now has a dedicated, high-fidelity frontend workspace, while DOCX generation remains intentionally disconnected and must not be described as Working. Request Signatures is deferred until the final major feature milestone. All 32 tool registrations, 33 routes, existing engines, viewer modes, right-side panels, file transfer, Start over, home reset, public npm registry rules, exact allowed development origins, and the Step 12.8 backend are preserved.

# NovaPDF All Tools and Options

## Current corrective status: v0.13.5

The 32-tool inventory and all tool options remain unchanged from v0.13.4. Version 0.13.5 only corrects the Root ESLint findings from the real Windows one-click run. Shared viewer controls, keyboard behavior, snap guides, alignment rulers, distance measurements, Shift-drag proportional resizing, and the Request Signatures disabled boundary remain authoritative.

# NovaPDF v0.13.4 Shared Interaction Addendum

This addendum supersedes older direct-canvas movement/resize descriptions when they conflict.

- Sign PDF, Edit PDF, Watermark PDF, and Crop PDF use one shared interaction language for applicable canvas movement: page/object edge-center snapping, teal alignment guides, four-side point distances, and live width/height labels.
- Sign PDF and Edit PDF preserve the selected element's current aspect ratio while Shift is held during resize. Existing always-proportional signature/image/checkbox/stamp behavior remains.
- Crop PDF preserves the current crop ratio while Shift is held on any resize handle and keeps the opposite edge/corner anchored.
- Watermark PDF preserves the original pointer grab offset and snaps to page and peer-watermark anchors.
- Measurement overlays remain visible while moving/resizing even when snapping is disabled; disabling Snap only removes magnetic alignment.
- All visible website copy remains US English.
- Request Signatures remains disabled and not Working.

---

# NovaPDF v0.13.3 Shared Workspace Addendum

This addendum supersedes older shared-control descriptions when they conflict.

- All twelve implemented browser workspaces use the bottom-center NovaPDF page/zoom/view bar.
- Continuous, Single-page, and Grid views are available when document/page previews exist.
- Undo/Redo history is retained for the full active session back to the first recorded state after loading.
- Tool-appropriate keyboard controls include Open, Save/Process, Undo/Redo, Delete, Escape, arrow navigation/movement/reorder, and advanced object shortcuts where supported.
- `/` is the homepage; tool routes open only through explicit selection or direct tool URLs.
- Sign PDF checkbox fields support independent check, fill, stroke, border-width, and proportional check-size settings.
- Edit PDF supports Sign-style moving/resizing, snapping, and live alignment guides.
- Request Signatures remains disabled and not Working.

---

# NovaPDF Complete Tools Catalog and Option Inventory

**Release:** 0.13.4  
**Documentation revision:** Complete 32-tool inventory plus Step 13.4 shared interaction guidance, preserved Sign/Edit corrections, and Request Signatures Corrective Package 5 backend-preview boundary  
**Date:** 30 July 2026

This file is a quick standalone reference for every tool currently registered in NovaPDF. It separates proven Working engines, the Step 13 Edit PDF implementation candidate, and planned Coming Soon workspaces.

Shared workspace behaviour preserved in 0.12.8:

- Desktop hover submenus remain open while the pointer moves from a category into its submenu.
- Clicking a category pins its submenu open; clicking outside the rail/submenu, clicking again, closing it, or selecting a tool dismisses it.
- Each desktop/tablet submenu aligns with its corresponding category button and is clamped inside the viewport.
- Mobile and touch devices retain tap-to-open/tap-to-close behaviour.
- Working-tool preview pages use more of their available thumbnail surface without stretching or changing aspect ratio.
- Category buttons no longer expose a blocking native “Click to keep open” tooltip.

- Crop PDF defaults to Original aspect ratio with a true full-page rectangle, so all four Exact margins start at 0; every currently targeted thumbnail shows a green tick.
- Watermark text and object styles are scope-aware: All pages updates every affected object, while This page only changes the active page in preview and output.
- Scope-aware styles include position, rotation, font size, font weight, color, opacity, edge offset, and image width.

Watermark interaction status in 0.11.5:

- The user later confirmed that the v0.9.3 watermark selection, object controls, and Arrow-key movement work in their browser.
- Version 0.10.1 keeps that interaction and adds a large focused single-page editing view, grid-return controls, empty-object recovery, and automatic image-object recovery after replacement.


Sign PDF status in 0.13.1:

- Sign PDF is a real working browser-local self-signing engine with Draw, Type, Upload, saved signatures, company stamps, required fields, snapping guides, input fields, and checkboxes.
- After upload, users choose Only me in a dedicated workflow modal, set signer details in a separate modal, browse pages in a scrollable strip beside the NovaPDF category rail, and edit every page in one continuous centre canvas.
- Signature objects support offset-preserving drag, stable anchored resize, rotation, duplicate, delete, copy, cut, paste, keyboard movement, and Undo/Redo.
- The generated PDF preserves page order, dimensions, crop boxes, existing content, and 0/90/180/270-degree source rotations.
- Initials supports Type, Draw, and Upload; Text and Input create visible editable fields; the page strip and continuous canvas synchronize their scrolling; Ctrl+mouse-wheel uses the shared zoom state.
- This is a visual-signature tool. Several people / Request signatures remains visibly disabled while the Step 12.8 API-first backend preview is validated; certificate-based cryptographic signing remains later scope.
- All field types can shrink past the former large content-aware minimum; the editor and export engine retain tiny practical dimensions.
- Every field has contextual Edit, every field except Company stamp has color access, and every right-panel row has an Edit control.
- Inline editing includes Done; the output filename control is clearly labelled; the old Text or input value control and red required stars are removed.
- Browser-local full name and initials restore on return, and the saved name pre-fills the typed-signature box.
- Typed signature generation measures actual glyph bounds and adds transparent safety padding to avoid left/right clipping.
- Page X of Y navigation is placed at the bottom of Sign PDF and Edit PDF, and Sign PDF dates explicitly use US English formatting.

Crop PDF status in 0.12.2:

- Crop PDF is a real working engine with a large drag editor, exact margins, target modes, target-aware ticks, and browser-local output.
- A4, Letter, Square, and Original aspect presets restart from the original visible page rather than inheriting a previous ratio.
- Optional Free-form crop stores independent crop rectangles and aspect modes for edited pages and keeps those pages targeted while another page is edited.
- Output tests cover shared and page-specific rectangles plus 0, 90, 180, and 270 degree source rotations.

### Complete 32-tool registry

Status meanings:

- **Working:** a real browser-local processing engine is implemented and connected to its dedicated workspace.
- **Implementation candidate:** a real dedicated workspace, browser-local engine, and regression tests exist, but the current package must still pass the dependency-backed Windows clean-install, lint, semantic TypeScript, engine, build, route, and manual acceptance gates before it is promoted to proven Working.
- **Frontend candidate:** a dedicated interactive workspace and source contract exist, but the processing/export engine is intentionally not connected and the tool is not Working.
- **Coming Soon:** the catalog card, category filter, direct route, active category/submenu state, dynamic title, generic upload workspace, and file-compatibility metadata exist, but the real processing engine has not yet been built.

**1. Merge PDF** - `/merge-pdf`  
Category: Organize PDF | Status: **Working** | Input: PDF, JPG/JPEG, PNG, WebP | Upload: Multiple

**2. Split PDF** - `/split-pdf`  
Category: Organize PDF | Status: **Working** | Input: PDF | Upload: Single

**3. Compress PDF** - `/compress-pdf`  
Category: Optimize PDF | Status: **Working** | Input: PDF | Upload: Multiple

**4. PDF to Word** - `/pdf-to-word`  
Category: Convert PDF | Status: **Implementation candidate - service-backed DOCX conversion, OCR, and native table/shape/picture reconstruction connected** | Input: PDF | Upload: Multiple

**5. PDF to PowerPoint** - `/pdf-to-powerpoint`  
Category: Convert PDF | Status: **Coming Soon** | Input: PDF | Upload: Multiple

**6. PDF to Excel** - `/pdf-to-excel`  
Category: Convert PDF | Status: **Coming Soon** | Input: PDF | Upload: Multiple

**7. Word to PDF** - `/word-to-pdf`  
Category: Convert PDF | Status: **Coming Soon** | Input: DOC/DOCX | Upload: Multiple

**8. PowerPoint to PDF** - `/powerpoint-to-pdf`  
Category: Convert PDF | Status: **Coming Soon** | Input: PPT/PPTX | Upload: Multiple

**9. Excel to PDF** - `/excel-to-pdf`  
Category: Convert PDF | Status: **Coming Soon** | Input: XLS/XLSX | Upload: Multiple

**10. Edit PDF** - `/edit-pdf`  
Category: Edit PDF | Status: **Implementation candidate** | Input: PDF | Upload: Single

**11. PDF to JPG** - `/pdf-to-jpg`  
Category: Convert PDF | Status: **Working** | Input: PDF | Upload: Single

**12. JPG to PDF** - `/jpg-to-pdf`  
Category: Convert PDF | Status: **Working** | Input: JPG/JPEG, PNG, WebP | Upload: Multiple

**13. Sign PDF** - `/sign-pdf`  
Category: Edit PDF | Status: **Working** | Input: PDF | Upload: Single

**14. Watermark PDF** - `/watermark-pdf`  
Category: Edit PDF | Status: **Working** | Input: PDF | Upload: Single

**15. Rotate PDF** - `/rotate-pdf`  
Category: Organize PDF | Status: **Working** | Input: PDF | Upload: Multiple

**16. HTML to PDF** - `/html-to-pdf`  
Category: Convert PDF | Status: **Coming Soon** | Input: HTML/HTM; later URL input | Upload: Multiple files

**17. Unlock PDF** - `/unlock-pdf`  
Category: PDF Security | Status: **Coming Soon** | Input: PDF | Upload: Multiple

**18. Protect PDF** - `/protect-pdf`  
Category: PDF Security | Status: **Coming Soon** | Input: PDF | Upload: Multiple

**19. Organize PDF** - `/organize-pdf`  
Category: Organize PDF | Status: **Working** | Input: PDF | Upload: Multiple source PDFs

**20. PDF to PDF/A** - `/pdf-to-pdfa`  
Category: Convert PDF | Status: **Coming Soon** | Input: PDF | Upload: Multiple

**21. Repair PDF** - `/repair-pdf`  
Category: Optimize PDF | Status: **Coming Soon** | Input: PDF | Upload: Multiple

**22. Page Numbers PDF** - `/page-numbers-pdf`  
Category: Edit PDF | Status: **Working** | Input: PDF | Upload: Single

**23. Scan to PDF** - `/scan-to-pdf`  
Category: Convert PDF | Status: **Coming Soon** | Input: JPG/JPEG, PNG, WebP; later camera capture | Upload: Multiple

**24. OCR PDF** - `/ocr-pdf`  
Category: PDF Intelligence | Status: **Coming Soon** | Input: PDF | Upload: Multiple

**25. Compare PDF** - `/compare-pdf`  
Category: PDF Intelligence | Status: **Coming Soon** | Input: PDF | Upload: Normally two PDFs

**26. Redact PDF** - `/redact-pdf`  
Category: PDF Security | Status: **Coming Soon** | Input: PDF | Upload: Single

**27. Crop PDF** - `/crop-pdf`  
Category: Edit PDF | Status: **Working** | Input: PDF | Upload: Single

**28. PDF Forms** - `/pdf-forms`  
Category: Edit PDF | Status: **Coming Soon** | Input: PDF | Upload: Single

**29. AI Summarizer** - `/ai-summarizer`  
Category: PDF Intelligence | Status: **Coming Soon** | Input: PDF | Upload: Single

**30. Translate PDF** - `/translate-pdf`  
Category: PDF Intelligence | Status: **Coming Soon** | Input: PDF | Upload: Single

**31. PDF to Markdown** - `/pdf-to-markdown`  
Category: Convert PDF | Status: **Coming Soon** | Input: PDF | Upload: Single

**32. Create a Workflow** - `/create-workflow`  
Category: Workflows | Status: **Coming Soon** | Input: Tool-dependent | Upload: Multiple

### Catalog category filters

The homepage and All PDF Tools section use these exact category filters:

1. All
2. Workflows
3. Organize PDF
4. Optimize PDF
5. Convert PDF
6. Edit PDF
7. PDF Security
8. PDF Intelligence

Selecting a category filters the cards without changing the registered direct routes. The full-screen workspace rail shows these seven categories. On desktop, hovering a category opens its registered tools in a submenu and moving away collapses it; click remains supported. Mobile and touch devices retain tap behaviour, so the complete catalog remains available without returning to the homepage.

### Shared homepage and workspace navigation rules

- The homepage hero defaults to Edit PDF whenever the user opens `/` without a direct tool route.
- Edit PDF now opens the dedicated Step 13 editing workspace. It remains an implementation candidate until the required Windows acceptance gates pass.
- The top-right initial-upload tool picker is custom, grouped by category, and positioned below its trigger.
- The picker uses internal scrolling rather than allowing the browser to flip the menu upward.
- The desktop/tablet workspace rail shows categories only.
- The mobile workspace dock also shows categories only.
- Desktop hover opens only that category's tools in a submenu; pointer leave collapses it. Click remains supported, and mobile/touch devices use tap.
- Selecting a submenu tool closes the submenu, changes the root-level route, and preserves compatible-file transfer.
- The right-side tool settings panel remains unchanged and separate from the navigation submenu.
- Clicking the NovaPDF logo clears all mounted workspaces and restores Edit PDF on the homepage.

### Detailed option inventory for every catalog tool

The option lists below are the approved product scope. Items marked **implemented** exist in 0.12.0. Items marked **planned** document the first intended workspace scope and must not be described as working until their processing engine and tests are complete.

#### 1. Merge PDF - implemented

- Upload PDF, JPG/JPEG, PNG, and WebP files.
- Accept multiple sources in one job.
- Display first-page or image previews.
- Drag to reorder, use movement buttons, reverse order, add files, and remove files.
- Set a custom output filename.
- Convert images to fitted PDF pages while preserving aspect ratio.
- Merge all ordered inputs into one browser-generated PDF.
- Show file and total-page statistics in the right panel.
- Hide the processing action after a result is created and show the shared full-width result card.

#### 2. Split PDF - implemented

- Upload one PDF and render real page thumbnails.
- Extract selected pages using thumbnail selection or typed syntax such as `1,3-5,8`.
- Create structured Custom Parts with separate From and To controls.
- Add or remove up to 50 range rows.
- Display each custom range as a separate labeled thumbnail group.
- Create separate PDFs for ranges or merge all ranges into one PDF in displayed order.
- Split every page into a separate output and show a tick mark on every selected page.
- Validate page ranges and output naming.

#### 3. Compress PDF - implemented

- Upload one or multiple PDFs.
- Choose Preserve Quality, Balanced, or Strong Compression.
- Preserve Quality performs an object-stream re-save where possible.
- Balanced and Strong rasterize pages at different resolution and JPEG-quality levels.
- Configure output filename or filename prefix.
- Display conversion progress, before/after sizes, and percentage saved.
- Retain the original file automatically when generated output is larger.
- Warn that rasterized modes can remove selectable text, links, forms, annotations, and vector editability.

#### 4. PDF to Word - frontend implemented; DOCX engine pending

- **Implemented frontend:** upload one or multiple PDFs with PDF-header, size, batch, duplicate, page-count, password/damage, and total-page validation.
- **Implemented frontend:** first-page previews, source navigation, shared zoom/view controls, all-pages/custom-range setup, layout priority, separate/combined output choices, naming, file transfer, Start over, and home reset.
- **Truthful boundary:** Review conversion setup summarizes the chosen configuration but does not generate or download a DOCX. OCR remains visibly disabled.
- **Pending engine scope:** document extraction, layout reconstruction, editable text flow, DOCX packaging, combined-document compatibility, progress, warnings, and downloads.
- Upload one or multiple PDFs.
- Choose all pages or a custom page range.
- Select layout priority: preserve visual layout or prioritize editable text flow.
- Offer OCR for scanned pages after the OCR/backend layer exists.
- Preserve headings, paragraphs, lists, tables, and images where technically possible.
- Choose one DOCX per PDF or a combined document when compatible.
- Set an output filename or batch prefix.
- Show conversion progress, warnings, and downloadable DOCX results.

#### 5. PDF to PowerPoint - planned

- Upload one or multiple PDFs.
- Choose all pages or selected page ranges.
- Convert each PDF page to one slide by default.
- Offer visual-fidelity slide mode and later editable-element extraction mode.
- Choose widescreen, standard, or source-page slide sizing when supported.
- Preserve page order and embedded page images.
- Set an output filename or batch prefix.
- Download PPTX results through the shared result area.

#### 6. PDF to Excel - planned

- Upload one or multiple PDFs.
- Choose all pages or custom page ranges.
- Detect tabular regions and preview discovered tables.
- Select tables before export.
- Choose one worksheet per table, one worksheet per page, or combined-sheet output.
- Offer OCR for scanned tables after OCR support exists.
- Export XLSX with values and basic table structure.
- Display warnings when a page has no reliably detected table.

#### 7. Word to PDF - planned

- Upload DOC or DOCX files individually or in a batch.
- Preserve page size, orientation, margins, fonts, images, tables, headers, and footers where the conversion engine allows.
- Select all pages or a page range when the backend converter supports it.
- Choose one PDF per input or merge converted documents in upload order.
- Configure output filename or batch prefix.
- Display conversion progress and font-substitution warnings.

#### 8. PowerPoint to PDF - planned

- Upload PPT or PPTX presentations.
- Select all slides or custom slide ranges.
- Preserve slide size, background, text, shapes, images, notes exclusion, and page order where supported.
- Choose one PDF per presentation or merge converted presentations.
- Set output filename or prefix.
- Display conversion progress and unsupported-font/media warnings.

#### 9. Excel to PDF - planned

- Upload XLS or XLSX workbooks.
- Select worksheets for export.
- Choose portrait, landscape, or automatic orientation.
- Choose paper size, margins, scaling, and fit-to-width options.
- Include or exclude gridlines, headers, and footers when supported.
- Export one PDF per workbook or combine selected sheets in workbook order.
- Preview page-break/scaling behavior before final processing where feasible.

#### 10. Edit PDF - implementation candidate

- Upload one unlocked PDF up to 50 MB and 300 pages.
- Render low-resolution thumbnails for every page and lazy high-resolution active-page-neighbourhood previews with PDF.js.
- Keep the centre document as one continuous vertical canvas with the same one-way active-page controller used by the stabilized Sign PDF workflow.
- Add text, PNG/JPG/JPEG/WebP images, rectangles, ellipses, lines, highlights, underlines, freehand strokes, and HTTP/HTTPS link areas.
- Move objects without pointer jumping using page/object snapping, alignment rulers, and live distance measurements; resize from a stable bottom-right handle and hold Shift to preserve the current aspect ratio; rotate in 15-degree steps or enter an exact angle.
- Duplicate, delete, bring to front, send to back, select by clicking, and nudge by Arrow or Shift+Arrow keys.
- Configure Helvetica, Times, or Courier; regular/bold/italic combinations; font size; alignment; text/stroke/fill colors; opacity; border width; and object-specific values.
- Use full-session Undo/Redo history, Previous/Next page navigation, thumbnail navigation, and the shared 50–200 percent zoom controls.
- Preserve compatible-file transfer, generated-result transfer, Start over, and full home reset.
- Export a separate flattened PDF locally with `pdf-lib` without overwriting the source file, while preserving page count, order, dimensions, crop boxes, existing content, and source rotations.
- Step 13 source/architecture contracts are present. Promotion to proven Working is blocked until the public-registry Windows clean install, lint, semantic TypeScript, all 11 PDF-engine tests, production build, 33-route runtime check, and manual Chrome checklist pass.

#### 11. PDF to JPG - implemented

- Upload one PDF and render real page thumbnails.
- Select or clear individual pages; all pages start selected.
- Choose Smaller, Standard, or High JPG quality.
- Choose Standard, High, or Very High resolution.
- Convert selected pages locally with PDF.js.
- Download individual JPG files or all converted pages as one ZIP.
- Configure output filename prefix and display conversion progress.

#### 12. JPG to PDF - implemented

- Upload JPG/JPEG, PNG, and WebP images.
- Reorder by drag or movement buttons, reverse order, add/remove images, and rotate individual images by 90-degree steps.
- Choose Auto, A4, or Letter page size.
- Choose Auto, Portrait, or Landscape orientation.
- Choose None, Small, or Large margins.
- Choose Fit Entire Image or Fill Page.
- Update page shape, orientation, spacing, fitting, and cropping live in the workspace preview.
- Use defaults: A4, Auto orientation, Small margin, Fit Entire Image.
- Generate one PDF and transfer the generated PDF to compatible PDF tools.

#### 13. Sign PDF - implemented

- Present **Sign it myself** as the active local workflow and a truthful disabled **Request signatures** next-phase card.
- Upload one PDF up to 50 MB and render up to 300 real page thumbnails locally with PDF.js.
- Create signatures by drawing with mouse, pen, or touch; typing a name; or uploading PNG, JPG, JPEG, or WebP.
- Choose Script, Elegant, or Clean typed-signature presentation and select an ink color.
- Preserve transparent uploads or optionally remove a plain white background.
- Save full name and initials in browser storage.
- Save, reuse, or delete up to 12 browser-local signature or company-stamp assets.
- Add signature, initials, date, name, free text, bordered input, checkbox, and company-stamp fields.
- Mark each field required or optional and block output when required content is incomplete.
- Edit field label, content, font size, style, color, checkbox state, rotation, and required status; use Done to close the inline editor.
- Use continuous page editing with bottom Previous/Next navigation, Escape, outside-canvas dismissal, and a one-way active-page controller.
- Move, resize, rotate, duplicate, delete, copy, cut, paste, and use keyboard shortcuts.
- Snap object edges and centers to page/common-position and peer-object anchors with visible guides, point distances, and live dimensions; hold Shift while resizing to preserve the current aspect ratio.
- Create a separate signed PDF locally with `pdf-lib` and transfer it to compatible tools.
- Preserve source page count, order, dimensions, crop boxes, existing content, and 0/90/180/270-degree rotations.
- Browser storage is local convenience only. Request emails, secure signer links, recipients, signing order, status tracking, reminders, audit certificates, identity verification, and certificate-based signatures remain later full-stack scope.


#### 14. Watermark PDF - implemented

**v0.11.3 interaction note:** Watermark scope is explicit. **All pages** selects and edits the linked text/image object across every affected page; **This page only** selects or creates an independent active-page object. Focused text objects include an Edit text action. Undo/Redo is located beside the shared zoom controls.

- Upload one PDF and render real page thumbnails.
- Choose Text or Image watermark mode.
- Text mode supports up to 120 characters, Helvetica regular/bold, font size, preset/custom color, opacity, and rotation.
- Image mode accepts PNG, JPG, JPEG, and WebP; WebP is converted locally to PNG before PDF embedding.
- Configure proportional image width, opacity, rotation, and edge offset.
- Choose one of nine placement presets or drag the visible text/image directly to a free position with offset preservation, page/peer snapping, alignment rulers, and live distance measurements.
- Click a watermark in grid view to open that exact page in a large focused editor. The focused editor provides a larger object toolbar, previous/next page controls, Back to grid, Escape-to-grid, and outside-canvas dismissal.
- Click anywhere inside a full rectangular SVG hitbox around the focused watermark to use pure SVG Rotate, Duplicate, and Delete controls. `foreignObject` is not used.
- Move the selected object through document-level keyboard handling: Arrow keys move 4 PDF points and Shift+Arrow moves 12 points. Delete/Backspace removes it, Ctrl/Cmd+D duplicates it, and Escape returns to grid or deselects it.
- Use **All affected pages** to keep a shared object linked across the range, or **This page only** to fork an independent object for per-page movement, rotation, duplication, and deletion.
- Add multiple global or page-specific watermark objects.
- If every watermark object is deleted, use the visible empty-state action in the page preview or right panel to add a new text/image object.
- If an image watermark was deleted and the user selects or replaces an image while no objects remain, NovaPDF automatically creates a visible image-watermark object.
- Store free positions as normalized visual-page coordinates so placement transfers consistently across page sizes and rotations.
- Apply to all pages or a custom From/To page range.
- Show live text or image overlays using the same page-point, crop-box, rotation, transformed-bounds, and standard-font geometry used by PDF output.
- Configure output filename and create a new watermarked PDF locally with `pdf-lib`.
- Preserve source-page count, dimensions, crop boxes, rotations, existing content, and compatible-file transfer behaviour.
- Output-tested on normal pages and pages rotated 90, 180, and 270 degrees.
- Current limits: one PDF up to 50 MB and 300 pages; watermark image up to 15 MB and 40 million pixels.
- Built-in text supports standard Latin characters; embedded Unicode fonts and tiled/repeated patterns remain planned.

#### 15. Rotate PDF - implemented

- Upload one or multiple PDFs.
- Render real page thumbnails grouped by source document.
- Click thumbnails to select individual pages in Selected mode.
- Apply rotation to selected pages, all pages, odd pages, even pages, or the same custom From/To range inside each source PDF.
- The active tick marks always match the current target mode: manual selection for Selected, every page for All pages, odd/even pages for those modes, and the validated From/To pages for Custom range.
- Manual selections are retained when temporarily switching to another target mode and reappear when Selected is chosen again.
- Rotate targeted pages 90 degrees counter-clockwise, 90 degrees clockwise, or 180 degrees.
- Reset pending rotation changes before output.
- Show live orientation changes and final rotation angles on thumbnails.
- Configure a single output filename or a batch output prefix.
- Create one rotated PDF per source and provide a ZIP download for multi-file jobs.
- Preserve source page order, dimensions, existing rotations, and compatible generated-output transfer.

#### 16. HTML to PDF - planned

- Upload HTML/HTM files; later production architecture may also accept authorized webpage URLs.
- Include linked or uploaded local assets when safely available.
- Choose page size, portrait/landscape orientation, margins, scale, and background printing.
- Add optional header/footer text and page numbers.
- Choose one PDF per HTML input or merge outputs.
- Display warnings for blocked remote assets, unsupported scripts, or authentication-required pages.
- Use a secured server-side browser worker in the production architecture rather than unrestricted browser execution.

#### 17. Unlock PDF - planned

- Upload one or multiple PDFs that the user is authorized to unlock.
- Enter the known document password.
- Detect encryption and supported restriction types.
- Remove supported password restrictions and create unlocked copies.
- Configure output filename or batch prefix.
- Never imply password cracking or bypass without authorization.
- Show a clear failure message for incorrect passwords or unsupported encryption.

#### 18. Protect PDF - planned

- Upload one or multiple PDFs.
- Set and confirm an open password.
- Later support separate owner/permissions password.
- Configure printing, copying, annotation, form-filling, and editing permissions when the chosen engine supports them.
- Choose encryption strength supported by the production worker.
- Configure output filename or batch prefix.
- Warn users to store passwords safely because NovaPDF cannot recover forgotten passwords.

#### 19. Organize PDF - implemented

- Upload one or multiple source PDFs.
- Render every page as a real thumbnail.
- Reorder pages by drag or movement buttons.
- Rotate, duplicate, delete, select, bulk-rotate, bulk-delete, extract, reverse, and restore original order.
- Add or remove source PDFs while keeping one combined page workspace.
- Keep only output page-order numbers on cards; source metadata remains in the right panel.
- Generate one organized PDF or extract selected pages.

#### 20. PDF to PDF/A - planned

- Upload one or multiple PDFs.
- Choose an available archival target profile after the production converter is selected.
- Embed or substitute fonts where legally and technically permitted.
- Normalize color profiles and metadata required by the chosen profile.
- Remove or flatten unsupported interactive features when required.
- Validate the converted result and display conformance warnings.
- Preserve the original and create a separate archival PDF/A output.

#### 21. Repair PDF - planned

- Upload one or multiple damaged or malformed PDFs.
- Run safe structural normalization first.
- Attempt cross-reference, object-stream, page-tree, and metadata recovery where supported.
- Offer Safe, Standard, and Deep repair levels after a reliable worker is available.
- Preview recovered page count before download.
- Never overwrite the original file.
- Report pages or objects that could not be recovered.

#### 22. Page Numbers PDF - implemented

- Upload one PDF and render real page thumbnails.
- Choose top-left, top-center, top-right, bottom-left, bottom-center, or bottom-right placement.
- Apply numbering to all pages or a custom From/To range.
- Choose the starting number.
- Choose `1`, `Page 1`, or `1 / N` format.
- Set font size from 8 to 36 pt and edge margin from 12 to 72 pt.
- Choose regular or bold Helvetica and black, gray, or teal color.
- Show live placement and style changes on affected thumbnails using the same standard-font bounding metrics and PDF-point geometry as the generated output.
- Preserve preview/output placement parity on normal and rotated source pages.
- Generate a numbered PDF and transfer it to compatible tools.

#### 23. Scan to PDF - planned

- Upload multiple scan images; later support camera capture on compatible mobile devices.
- Reorder, rotate, duplicate, and delete scan pages.
- Crop document edges and apply perspective correction where supported.
- Choose original, grayscale, black-and-white, or document-enhancement filters.
- Choose page size, orientation, margins, and fit mode.
- Add more scans before processing.
- Generate one PDF with an output filename; later optionally run OCR.

#### 24. OCR PDF - planned

- Upload one or multiple scanned PDFs.
- Choose document language or automatic language detection when reliable.
- Apply OCR to all pages or a custom page range.
- Choose searchable-PDF output, extracted text, or both.
- Preserve the original page image and add an invisible selectable text layer.
- Offer deskew, rotation detection, and image cleanup in the production worker.
- Show page-level OCR confidence/warnings and allow downloading the processed PDF.

#### 25. Compare PDF - planned

- Upload two PDF documents.
- Render synchronized side-by-side page views.
- Match pages by position initially and later support smarter page matching.
- Choose side-by-side, overlay, blink, or highlighted-difference view when implemented.
- Detect visual additions, removals, movement, and text differences where possible.
- Navigate between differences and filter minor changes.
- Export a comparison report or annotated comparison PDF.

#### 26. Redact PDF - planned

- Upload one PDF and render page canvases.
- Draw redaction rectangles over text or graphics.
- Search for text terms and mark matching occurrences for review.
- Apply marks to one page, selected pages, or all occurrences.
- Add optional redaction reason/label text.
- Preview marked areas before final application.
- Permanently remove underlying content in the final output rather than merely drawing black boxes.
- Require an explicit confirmation because applied redactions cannot be reversed in the output.

#### 27. Crop PDF - implemented

- Upload one PDF and render real page thumbnails.
- Click a thumbnail to open a large focused crop editor; return through Back to grid, Escape, or an outside-gray-area click.
- Move the crop rectangle with page-anchor snapping and live margin/dimension rulers; resize it with eight handles and hold Shift to preserve its current aspect ratio.
- Enter exact top, right, bottom, and left margins in PDF points.
- Choose Full page, Small, Medium, or Large margin presets.
- Choose Free, Original, A4, Letter, or Square aspect-ratio modes. Original/A4/Letter/Square rebuild from the original visible page.
- Apply one shared crop to Current page, Selected pages, All pages, Odd pages, Even pages, or a Custom From/To range.
- Enable Free-form crop to store a different rectangle and aspect ratio for each edited page.
- Keep previously edited Free-form pages targeted when another page is opened and edited.
- Show target-aware tick marks and live shaded crop boundaries.
- Use page-specific normalized rectangles in the output when Free-form crop is active.
- Synchronize MediaBox, CropBox, BleedBox, TrimBox, and ArtBox in the generated PDF.
- Set an output filename and transfer the result to compatible PDF tools.

#### 28. PDF Forms - planned

- Upload one PDF and detect existing AcroForm fields.
- Fill text fields, checkboxes, radio buttons, dropdowns, and list fields.
- Navigate through detected fields and show validation errors.
- Save an editable filled copy or flatten fields into final page content.
- Add basic text/check fields to non-form PDFs in a later editor phase.
- Preserve field appearances and export a separate completed PDF.

#### 29. AI Summarizer - planned

- Upload one PDF.
- Choose all pages or a custom page range.
- Select summary length such as brief, standard, or detailed.
- Select output structure such as overview, bullet points, key findings, action items, or section-by-section summary.
- Show extracted text coverage and warn about scanned pages that require OCR.
- Generate a copyable summary and later downloadable TXT, DOCX, or PDF output.
- Use explicit privacy, retention, token-limit, and AI-disclosure messaging before any cloud processing is introduced.

#### 30. Translate PDF - planned

- Upload one PDF.
- Choose source language or automatic detection and select a target language.
- Choose all pages or a custom page range.
- Offer text-first translation and later layout-preserving translation modes.
- Run OCR first for scanned pages when required.
- Preserve images and page order; clearly report formatting that could not be retained.
- Export translated text or a translated PDF after secure backend translation services exist.

#### 31. PDF to Markdown - planned

- Upload one PDF.
- Choose all pages or a custom range.
- Detect headings, paragraphs, lists, links, code blocks, and tables where possible.
- Choose whether to extract images into a companion folder.
- Configure table conversion and page-break markers.
- Preview and edit generated Markdown before download.
- Download one `.md` file or a ZIP containing Markdown and extracted assets.

#### 32. Create a Workflow - planned

- Start with an empty workflow or a reusable template.
- Add compatible NovaPDF tools as ordered steps.
- Reorder, duplicate, configure, enable, disable, or remove steps.
- Validate whether the output type of one step is accepted by the next step.
- Upload source files once and pass generated outputs between workflow steps.
- Save workflow name and settings for later reuse after accounts/database support exists.
- Display per-step progress, errors, and downloadable final results.

### Catalog display and workspace rules that apply to every tool

- Every tool keeps a lowercase, hyphen-separated root route.
- Every tool appears in the complete All Tools grid and in its corresponding workspace category submenu.
- The active tool controls the URL, browser title, workspace title, right-panel title, active category/submenu state, and primary action label.
- Working tools use dedicated workspaces. Frontend candidates also use dedicated workspaces but remain explicitly non-Working until their engines and tests exist. Unimplemented tools use the generic placeholder and remain marked `Soon`.
- The destination tool replaces stale state with the current compatible file context.
- Thumbnail cards remain visually clean; detailed names, sizes, dimensions, page counts, and tool-specific metadata belong in the right panel.
- Start over clears only the active workspace.
- Clicking the NovaPDF logo returns to the homepage and clears all in-memory workspaces and generated results.
- Existing v0.4.10 zoom behavior must remain unchanged.


## v0.12.8 Sign PDF and Request Signatures note

The working self-signing option inventory is extended by v0.13.1 corrections. High-fidelity lazy page previews, stable one-way scroll synchronization, rotation-aware resizing, inline editing, and fitted input-field export remain. Former large content-aware minimums are removed in favour of tiny practical dimensions; signature rendering now uses measured glyph bounds and safety padding; signer identity may restore from browser-local storage; and Page X of Y navigation is at the bottom.

Step 12.8 adds backend-preview source for sender sessions, request creation, multiple recipients, parallel/sequential order, recipient field assignment, expiring links, statuses, reminders, decline/cancel/expiry, append-only audit events, email jobs, private storage, and final PDF generation. These are backend capabilities under validation, not current frontend Working claims. The Request signatures card remains disabled until the real sender and recipient interfaces, production email delivery, secure-link completion, final output, state tracking, and audit tests pass.

Planned Request signatures UI options for Step 12.9 include:

- sender login/register and request dashboard;
- upload one PDF and add 1-25 recipients;
- parallel or sequential order;
- assign Signature, Initials, Name, Date, Text, Input, Checkbox, and Stamp fields per recipient;
- set title, message, expiration, and reminders;
- preview recipient colors/assignments without copying another product's wording or interface;
- recipient review, consent, completion, decline, and finished pages in original NovaPDF styling;
- sender status timeline, audit view, cancel/remind actions, and completed-PDF download;
- truthful disabled/error states whenever a production provider or backend service is unavailable.

Certificate-backed digital signatures, identity checks, qualified signatures, and legal-jurisdiction claims remain separate later scope.


## Handoff execution standard added in v0.13.2

Every future NovaPDF source/handoff package must include an updated project-root `RUN_NOVAPDF_ALL.cmd`. The one-click file must reflect the current tool/route/test counts and automatically run all command-driven local gates, open required persistent service CMD windows, open manual validation pages, and capture logs. It must preserve Docker volumes and existing environment configuration, use public npm registry URLs only, and never run a forced audit fix. Visual browser acceptance and production-provider delivery must remain explicitly manual/credential-dependent.

## v0.13.6 shared viewer and interaction rule

This rule applies to every implemented PDF workspace that exposes shared page/zoom controls:

- Render one NovaPDF bottom-center viewer through `document.body`; never nest it inside a transformed or horizontally scrollable tool toolbar.
- Offer Continuous, Single-page, Two-page, and Three-page views where page layout applies.
- Keep current page, total pages, zoom, view mode, and available Undo/Redo controls together.
- Page and peer-object snapping may affect movement when enabled.
- During resize, alignment guides, rulers, distances, and dimensions are visual feedback only and must not force width or height to a guide.
- `Shift + drag` preserves the current aspect ratio with continuous smooth scaling.
- Multi-page editing tools must maintain an explicit active page. Newly added objects belong to that active page, including additions completed after a file picker closes.
- Right-panel output naming, processing actions, and result/download cards must participate in normal panel scrolling unless a separately approved design explicitly requires a sticky action.

## v0.13.7 shared viewer visibility rule

- A body-portaled viewer must be explicitly active; default visibility is disabled.
- Hidden workspaces must never create `.workspace-bottom-controls` portals.
- Upload screens must not display page, zoom, Undo/Redo, or page-view controls.
- Generic workspaces may display the viewer only when the tool is active and at least one file has been accepted.
- Start over or clearing all files must remove the viewer.
- Exactly one viewer may exist after a document is loaded in the active tool.
- The viewer keeps NovaPDF US English copy, bottom-center positioning, and a restrained shadow without backdrop blur.

