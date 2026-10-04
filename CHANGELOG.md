# NovaPDF Changelog

## 0.14.15 - Editable Native Objects Corrective

- Removed native text objects before fallback rendering to eliminate black/gray cleanup spots on native PDFs.
- Added real Word table reconstruction for rectangle-cell and independent line-grid PDFs.
- Added independent Word shapes and anchored pictures for supported PDF objects.
- Added the line-grid/clean-background regression fixture and increased converter tests to 11 and source contracts to 37.
- Updated the Windows all-in-one runner, current handoff, validation, manifests, and checksums.
- Preserved 32 tools, 33 routes, existing modes/engines, Docker volumes, exact origins, and the byte-identical Step 12.8 backend.

## 0.14.14 — Editable Layout Reconstruction (Beta)

- Added hybrid positioned-text PDF-to-Word conversion.
- Added native geometry/style extraction and smart OCR for image-only regions.
- Added OpenCV text inpainting and visible editable Word text boxes.
- Preserved charts, images, colors, table/form artwork, and existing conversion modes.
- Added 10 converter tests and Step 14.14 source contract.

# Changelog

## 0.14.14

- Added Preserve layout + OCR combined mode.
- Added hidden searchable OCR/native-text layers without altering rendered page layout.
- Added visual parity and searchable-layer regression tests.
- Preserved v0.14.12 Windows service launch and stable Docker volume behavior.

## 0.14.12

- Restored Windows CRLF line endings for `RUN_NOVAPDF_ALL.cmd` and `START_PDF_CONVERTER.cmd`.
- Replaced the startup `call :require_command` chain with inline dependency checks.
- Added byte-level regression coverage for CRLF-only, BOM-free Windows batch files and required labels.
- Preserved the complete Step 14.9 application, converter/OCR, migration, route, backend, and safety boundaries.

## 0.14.9

- Changed manual development from default Turbopack to `next dev --webpack`, matching the validated production bundler.
- Isolated development output in `.next-dev` and clears only that cache before each manual dev launch.
- Added a hydration-safe footer build stamp using a stable server snapshot and current client snapshot.
- Declared the SVG favicon explicitly.
- Preserved PDF-to-Word/OCR, migration parsing, all tools/routes, backend source, and safety boundaries.


## 0.14.8

- Fixed the migration-show false negative for TypeORM output containing the numeric migration order (`[X] 1 ...`).
- Added a dedicated ANSI-tolerant parser with applied/pending functional fixtures.
- Preserved the Step 14.7 launcher, Step 14.6 migration sequence, and PDF-to-Word/OCR implementation.


## 0.14.7

- Fixed Windows Node.js `spawn EINVAL` during `npm run dev` by executing the local Next.js CLI with `process.execPath` instead of directly spawning `npx.cmd`.
- Preserved the Step 14.6 migration sequence correction and all PDF-to-Word/OCR functionality.

# NovaPDF Changelog

## 0.14.6 - PostgreSQL Migration Apply/Verify Sequence Corrective

- Reordered the one-click runner migration gate to apply before verifying `[X]`.
- Added a second idempotency run requiring `No migrations are pending`.
- Added separate apply/show/confirmation logs and the current Step 14.6 checklist.
- Preserved all application engines, tools/routes, backend source, volumes, and deferred Request Signatures boundary.

## 0.14.4 - PDF to Word Windows ESLint Gate Corrective

### Fixed

- Removed synchronous state updates from the converter-health effect.
- Escaped three JSX apostrophes reported by Root ESLint.
- Preserved retry behavior, service proxying, OCR, DOCX generation, and all release boundaries.

# Changelog

## 0.14.5 - PDF.js Document Cleanup TypeScript Corrective

- Replaced two `PDFDocumentProxy.destroy()` calls with `PDFDocumentLoadingTask.destroy()` in Edit PDF preview effects.
- Preserved PDF-to-Word/OCR behavior and all locked boundaries.
- Added a Step 14.5 regression contract.

## 0.14.3 - PDF to Word Converter Startup and Proxy Corrective

- Replaced direct browser-to-port-4010 requests with same-origin Next.js proxy routes.
- Converted converter-unavailable failures into controlled HTTP 503 JSON responses.
- Removed the health-probe AbortController cleanup that surfaced in React development mode.
- Gated and deduplicated uploaded-file analysis until the converter is online.
- Added diagnostic/retry UI, `START_PDF_CONVERTER.cmd`, converter-aware `npm run dev`, and explicit converter build/log handling in the one-click runner.
- Preserved the v0.14.2 conversion/OCR engine, all tools/routes, exact development origins, unchanged backend, Docker volumes, and Request Signatures boundary.

## 0.14.2 - PDF to Word Service and OCR Candidate

- Replaced the hand-built browser OOXML path with a stateless FastAPI conversion service.
- Added Microsoft Word-valid DOCX generation through python-docx.
- Added native editable conversion, preserve-layout conversion, scanned-page detection, and optional English/Bangla OCR.
- Added client-side DOCX package/XML validation before download.
- Added Docker Compose and one-click runner converter health/tests.
- Preserved all tools/routes/engines, exact development origins, backend source, Docker volumes, and the Request Signatures final-feature boundary.

## 0.14.1 - Working PDF to Word Implementation Candidate

- Replaced the Step 14.0 frontend-only review flow with a real browser-local PDF-to-DOCX engine.
- Added Preserve layout conversion using rendered PDF pages embedded in matching Word sections.
- Added Editable text conversion using PDF.js extraction and editable OOXML paragraphs.
- Added all/custom page selection, separate/combined DOCX output, real downloads, progress, explicit errors, and object-URL cleanup.
- Added the PDF to Word engine regression test and increased the PDF-engine suite to 12 tests.
- Independently opened generated DOCX packages with python-docx and LibreOffice, including mixed portrait/landscape output.
- Preserved all 32 tools, 33 routes, existing engines, viewer lifecycle, exact development origins, runner safety, and the byte-identical 68-file Step 12.8 backend.
- Kept Request Signatures disabled and deferred until the final major feature.

## 0.14.0 - PDF to Word Frontend Candidate

- Added the dedicated PDF to Word frontend workspace, validation, previews, range/layout/output setup, truthful engine-pending state, viewer integration, and Step 14 source contract.
- Preserved all current engines, tools, routes, backend source, registry restrictions, and viewer lifecycle.
- Deferred Request Signatures until the final major feature milestone.

## 0.13.7 - Viewer visibility and duplicate portal corrective

- Made the body-portaled shared viewer explicitly opt-in.
- Prevented hidden generic workspaces from stacking viewer portals and shadows.
- Hid the viewer on upload screens and until the active generic tool accepts a file.
- Removed backdrop blur and reduced the remaining single viewer shadow.
- Added the 16-check Step 13.7 contract and increased source contracts from 21 to 22.
- Updated the one-click runner, Windows checklist, validation report, and full handoff.

## 0.13.6 - Unified viewer, active page, and smooth resize

- Portaled the shared bottom viewer to `document.body` so parent transforms and horizontal scrolling cannot clip it.
- Added Continuous, Single-page, Two-page, and Three-page view modes.
- Made resize guides visual-only in Edit PDF and Sign PDF and prevented Crop PDF resize dimensions from snapping.
- Replaced dominant-axis aspect locking with continuous proportional scaling.
- Added explicit Edit PDF active-page insertion, including image file-picker retention.
- Stabilized selected-object pointer listeners and enlarged the highlight resize hit target.
- Returned Sign PDF output naming, action, and result controls to normal right-panel scroll flow.
- Added the 32-check Step 13.6 source contract and updated the one-click runner and handoff.

## 0.13.5 - Windows runner ESLint corrective 1

- Corrected the two synchronous React effect state updates reported by the real Windows Root ESLint gate.
- Reordered Split PDF effects below the functions they invoke.
- Removed one unused Sign PDF helper warning.
- Added the Step 13.5 corrective contract and updated the one-click runner and handoff.
- Preserved all v0.13.4 application behavior and the unchanged backend.

## 0.13.4 - 2026-07-30

- Added a shared geometry layer for page/object edge-center snapping and proportional resize constraints.
- Added reusable alignment guides, left/right/top/bottom distance rulers, and live width/height labels.
- Applied the overlay to Sign PDF, Edit PDF, Watermark PDF, and Crop PDF.
- Added Shift-drag aspect-ratio preservation to every Sign PDF field, every Edit PDF object, and all Crop PDF resize handles.
- Added offset-preserving Watermark PDF dragging with page and peer-watermark snapping.
- Added Crop PDF page-anchor snapping during movement.
- Added the 57-check Step 13.4 contract and increased dependency-free source contracts to 19.
- Updated the one-click Windows runner and v0.13.4 validation/handoff files.
- Preserved the Step 12.8 backend and kept Request Signatures disabled/not Working.

## 0.13.3 - 2026-07-30

- Added a NovaPDF-styled bottom-center page, zoom, and page-view bar across implemented PDF tools.
- Made session history unbounded so Undo can return to the first recorded post-load state.
- Expanded tool-appropriate keyboard shortcuts across implemented tools.
- Corrected `/` and Home navigation so the homepage no longer opens Edit PDF automatically.
- Added configurable Sign PDF checkbox tick, fill, stroke, stroke width, and proportional tick-size controls with matching export.
- Added Sign-style Edit PDF move/resize behavior with page/object snapping and live alignment guides.
- Added the 91-check Step 13.3 contract and updated the one-click Windows runner.
- Preserved the Step 12.8 backend and kept Request Signatures disabled/not Working.

## 0.13.2 - July 30, 2026

- Added `RUN_NOVAPDF_ALL.cmd`, the standard one-click Windows setup, validation, service launch, health, route, and local E2E runner.
- Added automatic Docker Desktop readiness and preserved PostgreSQL, Redis, MinIO, and Mailpit startup.
- Added root/backend public-registry install and validation automation, migration verification, separate Web/API/Worker CMD windows, browser opening, and timestamped logs.
- Added the Step 13.2 runner contract and increased source contracts from 16 to 17.
- Preserved all v0.13.1 application behavior and the disabled Request signatures boundary.
- Established the runner as a mandatory invariant for every future handoff.

## 0.13.1 - Step 13.1 Sign PDF corrective release - 30 July 2026

### Fixed

- Removed former large resize floors for all Sign PDF field types in both the editor and export engine.
- Added Edit to every selected field and every right-panel field row.
- Added colour access to every selected field except Company stamp.
- Added a Done action to inline field editing.
- Redesigned the output filename control and removed the old Text or input value control.
- Removed red required stars while preserving required-field validation.
- Prevented first-two-style typed signature clipping with measured glyph bounds and transparent padding.
- Restored browser-local signer name and initials and pre-filled the typed-signature box.
- Moved Page X of Y navigation to the bottom of Sign PDF and Edit PDF.
- Made date-field formatting explicitly US English.

### Validation

- Added a 22-check corrective contract and increased source contracts from 15 to 16.
- All 16 source contracts, all 90 TypeScript/TSX syntax parses, and CSS delimiter validation passed in the recovery sandbox.
- Full dependency-backed Windows/browser acceptance remains pending because the sandbox npm proxy returned a missing-tarball 404.

### Preserved

- All 32 tools, 33 routes, existing backend files, Docker volumes, public registry files, exact allowed development origins, disabled Request signatures status, and the Step 13 Edit PDF implementation-candidate boundary.

## 0.13.0 - Step 13 Edit PDF implementation candidate - 30 July 2026

### Added

- Dedicated browser-local Edit PDF workspace and flattened `pdf-lib` export engine.
- Text, image, rectangle, ellipse, line, highlight, underline, freehand, and HTTP/HTTPS link objects.
- Move, resize, rotate, duplicate, delete, layer ordering, selection, keyboard nudging, Undo/Redo, page navigation, and 50–200% zoom.
- Continuous document canvas with low-resolution thumbnails and lazy high-resolution active-page ±1 previews.
- Step 13 43-check architecture contract and dependency-backed Edit PDF engine regression test.
- Step 13 Windows acceptance guide and validation report.

### Changed

- `/edit-pdf` now uses a dedicated workspace instead of the generic Coming Soon workspace.
- Root source contracts increase from 14 to 15; dependency-backed PDF-engine tests increase from 10 to 11.
- Root package version is 0.13.0.

### Preserved

- All 32 tools and 33 routes.
- Eleven previously proven PDF engines and existing NovaPDF design/interaction invariants.
- Step 12.8 Corrective Package 5 backend byte-for-byte.
- Request signatures remains disabled and not Working.
- Public npm registry URLs only; no forced audit fix.

### Validation boundary

- Dependency-free source contracts and static syntax/invariant checks passed in the recovery sandbox.
- Dependency-backed clean install, lint, semantic TypeScript, engine tests, build, routes, and Chrome acceptance remain pending on Windows because the sandbox package mirror did not provide the complete dependency tree.

# Changelog

## 0.12.8 Windows Corrective Package 5 - 2026-07-25

- Replaced backend API/worker `tsx watch` launchers with metadata-capable `ts-node/register` watch processes.
- Moved unit and real E2E TypeScript tests to the same metadata-capable runtime.
- Added explicit PostgreSQL types for all entity primitives that previously relied on emitted decorator metadata.
- Added a runtime regression test for Nest constructor metadata and all eight TypeORM entities.
- Expanded the Step 12.8 architecture/corrective source contract to 36 checks.
- Recorded the successful committed PostgreSQL migration; no replacement migration or database reset is required.
- Preserved the frontend, all 32 routes, all eleven working engines, Sign PDF behavior, root lockfile, and disabled Request signatures claim.

## 0.12.8 Windows Corrective Package 4 - 2026-07-25

- Added explicit PostgreSQL `varchar` metadata for all nullable bounded-string backend entity columns.
- Prevented TypeORM from reflecting `string | null` columns as unsupported `Object` types during migration startup.
- Expanded the Step 12.8 architecture/corrective source contract to 32 checks.
- Preserved the frontend, all 32 routes, all eleven working engines, Sign PDF behavior, root lockfile, and disabled Request signatures claim.

## 0.12.8 - Windows Corrective Package 3 (2026-07-25)

- Recorded the successful Windows root gate: clean install, audit reporting, lint, semantic TypeScript, all 14 source contracts, all 10 PDF-engine tests, production build, and all 33 HTTP routes.
- Corrected the backend TypeORM logout query with `IsNull()` for nullable session revocation.
- Added direct `.env` loading for the standalone TypeORM migration CLI.
- Added `@types/pg` and strict types for the real request-signatures E2E test.
- Made Node test registration lint-safe and removed the PDF-renderer assertion/async lint defects.
- Runtime-validated Nodemailer results and disabled file/URL content access.
- Updated Nodemailer to 9.0.3, its type package to 8.0.1, `@nestjs/swagger` to 11.4.6, and overrode `js-yaml` to patched 5.2.2.
- Expanded the Step 12.8 architecture/corrective source contract to 31 checks.
- Preserved the frontend `src` tree, Next.js configuration, root lockfile, all 32 routes, and all eleven working engines unchanged.


## 0.12.8 - Windows Corrective Package 2 (2026-07-25)

- Replaced the Sign PDF engine test's Windows `npx.cmd` child-process launch with the local TypeScript compiler executed through `node.exe`.
- Corrected the self-signing engine test so `createRequire()` is initialized before resolving the local TypeScript compiler.
- Standardized both signing tests on `typescript/lib/tsc.js`, avoiding Node.js 24 `spawnSync ... EINVAL` and the next latent `require is not defined` failure.
- Expanded the Step 12.8 architecture/corrective source contract to 23 checks.
- Preserved the frontend source tree, Next.js configuration, root lockfile, 32 routes, and all eleven working engines unchanged.


## 0.12.8 - Windows Corrective Package 1 (2026-07-25)

- Separated root Next.js TypeScript/ESLint scope from the independently installed NestJS backend.
- Fixed the Page Numbers test `C:\C:\...` Windows path error with `fileURLToPath`.
- Declared Express and Multer directly in the backend package.
- Fixed Node 24 Blob typing in the backend E2E upload.
- Expanded Step 12.8 source contracts to cover the corrective boundaries.
- Preserved the complete frontend and all eleven working engines unchanged.


## 0.12.8 - 2026-07-24

- Added the API-first NestJS/PostgreSQL/BullMQ/private-storage/SMTP/PDF-worker Request Signatures backend preview.
- Added signed-in sender sessions, multiple recipients, parallel/sequential order, assigned fields, expiring links, statuses, reminders, decline/cancel, append-only audit, and completed-PDF generation.
- Added Docker Compose local infrastructure, unit tests, source contracts, and an opt-in end-to-end test.
- Preserved all 32 routes, eleven working engines, current NovaPDF design, and disabled Request signatures product status.
- Recorded npm DNS/503 validation blockage and the untested Next.js 16.2.11 security-update gate; no forced audit fix was applied.

## 0.12.7 - Sign PDF Core Stabilization

- Added lazy high-resolution lossless main-page previews and lossless preview snapshots across PDF workspaces.
- Prevented Sign PDF page skipping by making the main canvas the authoritative scroll controller.
- Added signature safety padding, content-aware text boxes, and rotation-aware stable resizing.
- Replaced the Selected Text sidebar card with a compact inline canvas editor.
- Added Edit/Colour/Rotate/Duplicate/Delete object actions and reliable Text/Input drop handling.
- Improved input-field PDF export with fitted text and a persistent border.
- Reworked palette rows into valid separate Add and Edit controls.
- Replaced the Windows-incompatible `npx.cmd` test spawn with the local TypeScript CLI executed through Node.


## 0.12.4 - Simplified Sign PDF entry flow

- Removed the duplicate pre-upload **Sign it myself / Request signatures** chooser from the compact upload card.
- Removed the same duplicate chooser from the full-screen empty Sign PDF workspace.
- Kept the post-upload **Who will sign this document?** modal as the single workflow decision point.
- Preserved the upload card, signer-details modal, signature/initials styles, self-signing engine, 32 routes, and all project binding rules.

## 0.12.3 - Signature and initials style refinement

- Expanded typed signatures to eight original NovaPDF style presets.
- Added the same complete scrollable style list to Initials.
- Added automatic full-name-to-initials generation with manual override protection.
- Removed the duplicate Signature name input; typed signature previews now use Full name as the single source of truth.
- Made Apply create the selected typed signature automatically when needed.
- Preserved the Sign PDF engine, existing UI system, 32 routes, 11 working engines, and all project binding rules.

## 0.11.2 - Crop aspect and per-page free-form correction

- Rebuilt A4, Letter, Square, and Original crop presets from the original visible page instead of the prior aspect rectangle.
- Added optional Free-form crop mode with independent crop rectangles and aspect modes for each edited page.
- Kept previously edited free-form pages in the output target set when another page is opened.
- Added page-specific rectangle support to the real crop engine.
- Made outside clicks around the large crop page return to grid view while preserving interactions inside the page and toolbar.
- Added Step 11.2 crop geometry, per-page output, and interaction-contract regression tests.
- Preserved ten working engines, 32 routes, existing design, v0.4.10 zoom, transfer/reset rules, public registry URLs, and allowed development origins.

## 0.11.1 - Watermark recovery and shared keyboard history

- Fixed page-specific Watermark recovery after deleting a watermark in focused editing.
- Made image re-selection retain the intended page and immediately restore its preview object.
- Made all nine Watermark placement presets usable without a preselected object.
- Added bounded Ctrl+Z/Ctrl+Y history and visible Undo/Redo controls to Watermark, Organize, Rotate, Crop, Merge, and JPG to PDF.
- Added Watermark copy, cut, paste, duplicate, delete, open, save, selection, movement, Escape, and zoom keyboard shortcuts.
- Added Step 11.1 interaction-contract regression coverage.
- Preserved ten working engines, 32 routes, existing design, v0.4.10 zoom, transfer/reset rules, public registry URLs, and allowed development origins.


## 0.11.0 - Build Step 11

- Implemented the real Crop PDF engine and dedicated workspace.
- Added draggable crop movement, eight resize handles, exact margin controls, crop presets, aspect-ratio modes, and target modes.
- Added target-aware grid ticks, large page editing, live crop shading, and compatible output transfer.
- Added crop engine tests for rotated pages and synchronized PDF page boxes.
- Preserved all previous tools, routes, design rules, public registry URLs, allowed development origins, and v0.4.10 zoom behavior.

## 0.10.1 - Rotate targeting and focused Watermark editing

### Added

- Target-aware Rotate PDF tick marks for Selected, All pages, Odd pages, Even pages, and Custom range modes.
- Large focused single-page Watermark editor opened from the grid.
- Back to grid, previous/next page, Escape, and outside-canvas exit paths.
- Empty-object recovery actions and automatic image-object creation after selecting/replacing an image when no objects remain.

### Fixed

- Rotate thumbnails no longer keep showing only manual ticks after another target mode is selected.
- Watermark object controls are no longer confined to tiny grid thumbnails during editing.
- Deleting every watermark no longer leaves the user without a path to add another object.
- Replacing a deleted image watermark now produces a visible preview object.
- Removed the blocking native “Click to keep open” category tooltip.
- Corrected duplicate action so it creates one object per action.

### Preserved

- Existing design, all 32 routes, nine working engines, output/transfer/reset rules, clean thumbnails, v0.4.10 zoom, public npm registry, and approved development origins.

### Verified

- Clean install, ESLint, TypeScript, production build, 33 route checks, npm audit, Rotate engine/targeting tests, Watermark engine/contract tests, and Page Numbers parity tests passed.

## 0.10.0 - Real Rotate PDF

### Added

- Real `/rotate-pdf` browser-local processing workspace.
- Multiple PDF upload, grouped real thumbnails, individual page selection, all/odd/even/custom targeting, left/right/180-degree rotation, reset, live orientation previews, batch naming, individual output downloads, and ZIP download.
- Rotate engine regression test covering existing source rotations, page count, dimensions, order, and 90/180/270-degree changes.

### Preserved

- Existing design, all 32 routes, nine working engines, transfer/reset rules, clean-thumbnail policy, v0.4.10 zoom, public npm registry, and approved development origins.

### Known issue

- The user confirmed that Watermark object selection, on-object actions, and Arrow-key movement remain unreliable in their Windows browser. This is not considered fixed and is deferred to Build Step 10.1.

## 0.9.2 - 20 July 2026

### Added

- Outside-click dismissal for click-pinned category submenus
- Selectable watermark objects with on-canvas rotate, duplicate, and delete controls
- Arrow-key movement and Shift+Arrow accelerated movement
- Shared all-pages and independent page-only edit scopes
- Multiple global/page-specific text or image watermark objects

### Fixed

- Watermark preview and PDF output now share exact page-point, crop-box, rotation, and font-metric geometry
- Page Numbers PDF preview and PDF output now share the same six-position font geometry
- Page-only watermark edits no longer move or delete watermarks on unrelated pages

### Preserved

- Existing design, eight working engines, 32 root routes, hover/touch navigation, transfer/reset rules, v0.4.10 zoom, and allowed development origins

### Verified

- ESLint, TypeScript, production build, 32-route checks, npm audit, multi-object watermark tests, page-number position tests, and rendered-output checks passed


## 0.9.1 - 20 July 2026

### Added

- Click-to-pin category submenus and category-relative desktop/tablet positioning
- Real PNG/JPG/JPEG/WebP image watermark support
- Pointer/touch drag positioning for text and image watermarks
- Normalized free positions across affected pages

### Fixed

- Hover submenu handoff no longer closes before the pointer reaches the submenu
- Submenus align with their respective category instead of opening from one fixed top position
- Working-tool preview pages use more of the available thumbnail surface without distortion

### Preserved

- Existing design, eight working engines, 32 root routes, mobile tap behaviour, transfer/reset rules, v0.4.10 zoom, and allowed development origins

### Verified

- ESLint, TypeScript, production build, 32-route checks, and npm audit passed
- Text/image watermark engine tests and rendered-output checks passed


## 0.9.0 - 20 July 2026

### Added

- Real browser-local Watermark PDF workspace at `/watermark-pdf`
- Text, standard Helvetica regular/bold, font size, preset/custom colour, opacity, rotation, nine placement presets, edge offset, all-pages/custom range, and output filename controls
- Live watermark overlays on real PDF.js thumbnails
- Rotation-aware output placement for 0, 90, 180, and 270 degree source pages
- Automated watermark engine and render-difference tests

### Changed

- Watermark PDF status advanced from `Soon` to working/New
- Working browser-local engine count advanced from seven to eight
- Project version advanced to 0.9.0

### Verified

- Untouched v0.8.3 baseline passed npm clean install, lint, TypeScript, production build, route checks, and npm audit
- Final lint, TypeScript, production build, route checks, and npm audit passed
- Page count, page dimensions, crop boxes, rotations, custom page ranges, and generated output were tested


## 0.6.2 - 19 July 2026

### Changed

- Removed file names, dimensions, and file sizes from visible workspace thumbnails/cards.
- Removed JPG to PDF rotation-degree and page-size/orientation text labels from canvas thumbnails.
- Kept detailed metadata in right-side panels.
- Kept Organize output page numbers and Split page numbers/tick marks.

### Verified

- Clean npm install passed
- ESLint passed
- TypeScript passed
- Next.js production build passed
- Direct JPG to PDF and Merge routes returned HTTP 200
- npm audit reported 0 vulnerabilities

## 0.6.1 - 2026-07-19

- Added live JPG to PDF page preview for page size, orientation, margin, and image fit.
- Added clear Portrait and Landscape preview behaviour while retaining Auto orientation.
- Kept A4, Auto orientation, Small margin, and Fit Entire Image as defaults.

## 0.6.0 - 19 July 2026

### Added

- Real JPG to PDF workspace at `/jpg-to-pdf`
- JPG, JPEG, PNG, and WebP upload support
- Image drag ordering, movement buttons, reverse order, rotation, and removal
- A4, Letter, and Auto page sizes
- Auto, Portrait, and Landscape orientation
- None, Small, and Large margins
- Fit Entire Image and Fill Page modes
- Browser-local output filename, progress, and shared download card
- Compatible image transfer between workspace tools
- JPG/PDF test fixtures and two-page conversion verification

### Verified

- ESLint and TypeScript passed
- Next.js production build passed
- `/jpg-to-pdf` returned HTTP 200
- Generated PDF reopened with the expected two pages
- Rendered output pages passed visual inspection
- npm audit reported 0 known vulnerabilities

## 0.4.9 - 19 July 2026

### Added

- Clean direct routes for all current and planned tools
- Dynamic tool-specific browser titles and server metadata
- Browser Back and Forward route synchronization
- Shared 50%-200% workspace zoom range

### Changed

- Tool selection now updates the URL without a page reload
- Current compatible files replace destination workspace files
- Single-file tools receive the most recently added compatible PDF
- Merge is named Merge PDF & Images while retaining `/merge-pdf`
- Workspace logo returns to `/` and clears all in-memory workspace data

### Verified

- ESLint, TypeScript, and Next.js production build passed
- All direct tool routes were statically generated
- Representative route and page-title HTTP checks passed

## 0.4.8 - 19 July 2026

### Added

- Shared zoom controls across built and placeholder workspaces
- Tool-specific workspace, result, and action naming

### Changed

- Current files always replace destination files during tool switching
- New files uploaded in the active tool become the next cross-tool handoff source
- Workspace logo now clears all in-memory sessions before returning home
- Empty or incompatible handoffs clear stale destination state

### Verified

- ESLint passed
- TypeScript passed
- Production build and static generation passed


## 0.4.7 - 19 July 2026

### Added

- Shared `WorkspaceResultCard` for current and upcoming PDF tools
- Full-width consistent Split PDF download buttons
- Horizontal visual divider below the workspace logo

### Changed

- Workspace logo now reliably exits to and scrolls to the homepage without clearing the session
- Merge, Split, and Organize now share one result-card pattern
- Project version advanced to 0.4.7

## 0.4.6 - 19 July 2026

### Added

- Full-height desktop and tablet workspace rail
- Clickable compact NovaPDF logo at the top of the rail
- Header-level Start over control placed before each tool name
- Browser-memory file handoff between compatible tools when the destination is empty
- File compatibility filtering for PDF-only and image-capable tools

### Changed

- Removed the old workspace back arrow
- Removed workspace source/page subtitle text from the top header
- Removed the duplicate Start over item from the left rail
- Removed duplicate side-panel Start over links where applicable
- Existing destination sessions take priority over transferred files
- Split accepts only the first transferred PDF
- Project version advanced to 0.4.6

### Verified

- ESLint passed with no warnings
- TypeScript passed
- Next.js production compilation, type checking, and static-page generation passed
- Development server returned HTTP 200
- npm audit reported 0 known vulnerabilities
- Lockfile scan confirmed no private registry URLs

## 0.4.5 - 19 July 2026

### Added

- Per-tool in-memory workspace sessions for Merge, Split, Organize, and placeholder tools
- Uploaded files, page selections, ordering, output names, and generated results remain attached to their respective tool while switching through the left rail

### Changed

- Disabled the Next.js development indicator so the floating `N` icon no longer appears
- Right-panel primary action buttons now use the full available panel width
- Only the active workspace controls document body scrolling; hidden retained workspaces no longer affect homepage scrolling
- Project version advanced to 0.4.5

### Verified

- ESLint passed
- TypeScript passed
- Next.js production compilation and static page generation passed
- Local development server returned HTTP 200
- npm audit reported 0 known vulnerabilities
- Source scan confirmed `devIndicators: false` and full-width action styles

## 0.4.4 - 19 July 2026

### Added

- Persistent NovaPDF tool rail in full-screen workspaces
- All current tools listed in the workspace rail
- Same-screen `Start over` workflow with centered upload state
- Generic full-screen workspace shells for not-yet-built tools
- JPG, JPEG, PNG, and WebP input support in Merge PDF
- Image-to-PDF page conversion with aspect-ratio preservation
- Included PNG test image and PDF-plus-image merged output fixture

### Changed

- Removed duplicate top-right privacy, add-file, and close controls
- Removed duplicate right-panel close controls
- Primary process actions hide after successful results appear
- Desktop workspace now uses left rail, canvas, and right control panel
- Mobile tool navigation becomes a bottom dock
- Project version advanced to 0.4.4

### Verified

- ESLint passed
- TypeScript passed
- Next.js production build passed
- Homepage and PDF.js worker returned HTTP 200
- npm audit reported 0 known vulnerabilities
- PDF and PNG merge test produced the expected page count
- Private registry scan passed

## 0.4.3 - 19 July 2026

### Added

- Dedicated full-screen Merge PDF workspace after upload
- First-page PDF previews for Merge cards
- Drag-and-drop file ordering in the Merge canvas
- Dedicated full-screen Split PDF workspace after upload
- Real page-thumbnail canvas for Split PDF
- Click-to-select page thumbnails in Split Extract mode
- Unified compact right-panel actions for Merge, Split, and Organize

### Changed

- Removed the large fixed/floating Organize PDF action entirely
- Merge and Split are no longer confined to the homepage workspace card
- PDF preview surfaces use solid white backgrounds
- Project version advanced to 0.4.3

### Verified

- TSX syntax transpilation passed for all three working tool components
- Static scan confirmed the old mobile/floating Organize action is absent
- Static scan confirmed all three tools use the full-screen editor shell
- Full production build remains to be confirmed locally because package installation was unavailable in the packaging environment

## 0.4.1 - 19 July 2026

### Added

- Dedicated full-screen Organize PDF editor after upload
- Real PDF page thumbnails using `pdfjs-dist` 6.1.200
- Large scrollable page canvas and fixed desktop control panel
- Responsive slide-in controls and persistent mobile action button
- Multiple source PDFs in one organize workspace
- Add/remove source-file controls
- Bulk page rotation, deletion, and extraction
- Original-order, reverse-order, and thumbnail-size controls
- Page-card hover actions and accessible movement buttons

### Changed

- Organize PDF is no longer confined to the homepage workspace card
- The organize workflow now prioritises page visibility and editing space
- Project version advanced to 0.4.1

### Verified

- ESLint and TypeScript passed
- Production build passed
- Homepage and PDF.js worker returned HTTP 200
- Multi-source PDF output test passed
- Generated output re-opened with expected page count and rotations
- npm audit reported 0 known production vulnerabilities

## 0.4.0 - 19 July 2026

### Added

- Real Organize PDF workspace using `pdf-lib`
- Page-card view with source and output numbering
- Drag-and-drop and button-based page reordering
- Page rotation in 90-degree steps
- Page duplication and removal
- Bulk selection and removal safeguards
- Selected-page extraction
- Output filename, progress, reset, close, and download states
- 200-page browser safety limit
- Organized output test fixture

### Changed

- Organize PDF no longer displays a placeholder message
- Project version advanced to 0.4.0

### Verified

- Lint and TypeScript passed
- Production build passed
- Homepage HTTP smoke test passed
- Reorder, duplicate, and rotation engine test passed
- Generated output re-opened with expected page count and rotations
- npm audit reported 0 known vulnerabilities

## 0.3.0 - 19 July 2026

### Added

- Real Split PDF processing using `pdf-lib`
- One-PDF upload and page-count reading
- Selected-page extraction syntax such as `1,3-5,8`
- Custom part groups separated by semicolons
- Every-page split mode
- Page-selection validation and friendly range errors
- Progress indicator
- Multiple downloadable result cards
- Output filename control
- Six-page sample PDF

### Changed

- Split PDF no longer shows a placeholder message
- Project description and status updated to Build Step 3

### Verified

- Lint passed
- TypeScript passed
- Production build passed
- Homepage HTTP smoke test passed
- Extract and every-page split engine tests passed
- Lockfile contains no private package-registry address

## 0.2.0 - 18 July 2026

### Added

- Real Merge PDF processing using bundled `pdf-lib`
- Multiple PDF selection and drag-and-drop
- PDF signature/header validation
- Duplicate-file prevention
- File-count and file-size limits
- Up/down file ordering controls
- Output filename setting
- Processing progress UI
- Friendly encrypted/damaged-file errors
- Downloadable merged result
- Reset workflow
- Sample PDFs for testing

## 0.4.10 - 19 July 2026

### Added

- Visual custom range groups in Split PDF
- Separate From page and To page controls for each range
- Add Range and Remove Range actions
- Optional merge-all-ranges output
- Active tick marks for all pages in Every Page mode
- Active tick marks inside range preview groups

### Changed

- Replaced the primary semicolon textarea workflow with structured range controls
- Custom range downloads now use range-based filenames
- Every Page mode now clearly shows that all pages are selected

### Verified

- ESLint passed
- TypeScript and production build passed
- Split direct route returned HTTP 200
- Separate range output test passed
- Merged range output test passed
- npm audit reported 0 vulnerabilities

## 0.5.0 - 19 July 2026

### Base

- Continued from v0.4.10
- Excluded the reverted v0.4.11 vertical-only zoom experiment

### Added

- Real browser-based Compress PDF workspace
- Preserve Quality, Balanced, and Strong compression levels
- Multi-file compression batches
- PDF validation, page counting, and first-page previews
- Output filename/prefix controls
- Compression progress and friendly errors
- Input/output size and saved-percentage results
- Automatic original-file fallback when generated output is larger
- Shared full-width download cards
- Direct `/compress-pdf` route integration
- Compress-to-other-tool active-file handoff
- `sample-compress-image-heavy.pdf` test fixture

### Verified

- Clean npm install passed
- ESLint passed
- TypeScript and Next.js production build passed
- Direct routes generated successfully
- npm audit reported 0 vulnerabilities

## 0.7.0 - Build Step 7

- Added real PDF to JPG conversion.
- Added page selection, JPG quality, resolution, individual downloads, and ZIP download.
- Added JSZip dependency.
- Added tool-aware JPG/PDF file handoff.
- Added custom result download labels.
- Allowed local development origins `172.24.48.1` and `172.21.32.1`.

## 0.8.0 - Build Step 8

- Added real Page Numbers PDF processing.
- Added six placement positions and live thumbnail overlays.
- Added all/custom page ranges, starting number, three number formats, font size, margin, weight, and color controls.
- Added numbered-PDF result download and compatible tool handoff.
- Added `/page-numbers-pdf` direct route and sample output fixture.
- Retained Next.js `allowedDevOrigins` configuration and v0.4.10 zoom behaviour.

## 0.8.1 - All-Tools Catalog Update

### Added

- Added the complete 32-item tools catalog from the approved reference.
- Added direct static routes for every catalog tool.
- Added all catalog tools to the persistent workspace rail.
- Added Workflows, Organize PDF, Optimize PDF, Convert PDF, Edit PDF, PDF Security, and PDF Intelligence filters.

### Fixed

- Made Page Numbers PDF explicitly visible in the homepage tools grid and workspace rail.

### Retained

- All seven completed browser-local processing engines.
- Existing side panels, file transfer behavior, dev-origin configuration, and v0.4.10 zoom behavior.

### Verified

- ESLint passed.
- TypeScript and Next.js production build passed.
- All 32 direct tool routes returned HTTP 200.
- Required catalog comparison passed with 32 of 32 tool names present.

## 0.8.2 - Homepage and Workspace Navigation Update

### Changed

- Made Edit PDF the default homepage hero upload tool.
- Replaced native tool selects with a custom grouped picker that opens downward.
- Changed the workspace rail from a flat 32-tool list to seven category buttons.
- Added category-specific tool submenus for desktop, tablet, and mobile.
- Kept direct routes, active tool state, file transfer, right-side panels, and processing engines unchanged.

### Verified

- npm audit reported 0 vulnerabilities.
- ESLint passed.
- TypeScript compilation and static route generation completed.
- Homepage prerender contains Edit PDF in the hero upload card.
- Core production routes returned HTTP 200.

## 0.8.3 - Navigation Interaction Fix

### Fixed

- Fixed the homepage upload-card tool picker by rendering its existing grouped menu outside the clipped hero workspace container.
- Added reliable outside-click and Escape-key closing for the document-level picker.

### Changed

- Added desktop hover-to-open and pointer-leave-to-close behaviour to workspace category submenus.
- Added a short submenu entry/exit animation without changing the existing visual design.
- Preserved mobile and touch click behaviour.

### Retained

- Existing UI design, dimensions, colours, spacing, routes, PDF engines, file transfer, reset behaviour, and zoom behaviour.

### Verified

- npm audit reported 0 vulnerabilities.
- ESLint passed.
- TypeScript passed.
- Next.js production build passed and generated all 36 static pages.

## 0.9.3 - Watermark Selection and Keyboard Reliability Fix

### Fixed

- Replaced the unreliable watermark `foreignObject` toolbar with pure SVG Rotate, Duplicate, and Delete controls.
- Added a full rectangular pointer hitbox around text and image watermarks.
- Added document-level keyboard handling after selection instead of depending only on SVG focus.
- Increased Arrow movement to 4 PDF points and Shift+Arrow to 12 PDF points for visible thumbnail movement.
- Made newly loaded documents start unselected so click-selection feedback is explicit.

### Verified

- Interaction-contract source test passed.
- Pure SVG selection/actions and document-level keyboard movement passed an isolated Chromium smoke test.
- Watermark and page-number engine tests, ESLint, TypeScript, production build, and npm audit passed.

## 0.11.3 - Watermark Scope and Shared Toolbar Correction

### Fixed

- Made **All pages** select and edit the linked text/image watermark across every affected page.
- Made **This page only** select or create an independent active-page watermark.
- Made position presets, drag, Arrow movement, rotation, duplication, and deletion obey the active scope.
- Added a focused **Edit text** action beside Rotate, Duplicate, and Delete.

### Changed

- Moved Undo/Redo beside the shared zoom controls and rendered the same toolbar in every workspace using shared zoom.
- Expanded Watermark history snapshots to cover scope, mode, text/image source, range, style, and placement settings.

### Retained

- All ten working engines, all 32 routes, Crop PDF v0.11.2 behavior, public registry URLs, approved local origins, and v0.4.10 zoom behavior.

## 0.11.4 - Crop Defaults and Page-Specific Watermark Text

### Fixed

- Made Original the default Crop PDF aspect ratio after upload, reset, and Start over.
- Made targeted Crop PDF thumbnails use the visible selected/tick state.
- Made Watermark Edit text obey All-pages versus This-page-only scope.
- Added per-object text overrides to the Watermark preview and PDF engine.

### Retained

- All ten working engines, all 32 routes, image-watermark scope, Crop free-form behavior, public registry URLs, approved local origins, and v0.4.10 zoom behavior.

## 0.11.5 - Zero Crop Margins and Scope-Aware Watermark Styles

### Fixed

- Made Crop PDF start from the complete original page rectangle so all Exact margin fields show 0 after upload, replacement, reset, and Start over.
- Made Watermark position, rotation, font size, font weight, colour, opacity, edge offset, and image width obey All pages versus This page only.
- Added per-object style overrides to the Watermark preview and PDF engine.

### Retained

- All ten working engines, all 32 routes, page-specific Watermark text, Crop Free-form mode, public registry URLs, approved local origins, and v0.4.10 zoom behavior.

## 0.12.0 - Real Sign PDF

### Added

- Added a dedicated browser-local Sign PDF workspace at `/sign-pdf`.
- Added real PDF thumbnails and a large focused page editor.
- Added Draw, Type, and Upload signature creation modes.
- Added Script, Elegant, and Clean typed-signature presentation styles.
- Added optional plain-white-background removal for uploaded signature images.
- Added signature, initials, date, signer name, and optional text fields.
- Added drag, resize, rotate, duplicate, delete, copy, cut, paste, and keyboard movement for signing objects.
- Added active-object text, font-size, style, colour, and rotation controls.
- Added Undo/Redo beside the shared zoom controls.
- Added browser-local PDF export through `pdf-lib` with generated-output transfer to compatible tools.
- Added Sign PDF engine and source-contract tests.

### Verified

- ESLint passed.
- TypeScript passed.
- Next.js production build passed and generated 36 static pages.
- Homepage and all 32 root tool routes returned HTTP 200.
- Normal and 90/180/270-degree rotated PDF output tests passed.
- Page count, page order, dimensions, crop boxes, and original rotations were preserved.
- Existing Crop, Rotate, Watermark, and Page Numbers regression tests passed.
- Offline npm audit reported 0 vulnerabilities; package dependencies were unchanged.

### Clarified

- This release creates visual signatures and signing fields. It is not certificate-based cryptographic digital signing and does not provide signer identity verification, remote requests, or audit trails.

## 0.12.1 - Complete Self-Signing System

### Added

- Added the Sign it myself workflow entry and a truthful disabled Request signatures next-phase card.
- Added browser-local saved signer details and reusable signature/stamp assets.
- Added company stamp, bordered input, and checkbox fields.
- Added required/optional field validation and editable field labels.
- Added snapping to common page positions and other object centres with alignment guides.
- Added company-stamp, input-border, and checkbox drawing to the real PDF engine.

### Improved

- Preserved field rotation parity for image signatures, stamps, inputs, and checkboxes.
- Kept focused page editing, keyboard controls, Undo/Redo, zoom, file transfer, Start over, and home reset behaviour.

### Verified

- npm audit reported 0 vulnerabilities.
- ESLint, TypeScript, production build, all 33 routes, existing regression tests, and new self-signing tests passed.
- Generated signature, stamp, input, and checkbox output was rendered and visually inspected.


## 0.12.2 - Sign PDF Workflow and Workspace UX Redesign

### Added

- Added a post-upload Only me / Several people workflow modal.
- Added a dedicated signer-details and signature-creation modal.
- Added a page-thumbnail strip beside the existing NovaPDF category rail.
- Added a single large active-page document canvas.
- Added a simplified right-side signing palette with click and drag placement.

### Improved

- Reorganized the complete self-signing controls into a clearer setup and editing sequence.
- Preserved all real signing output, required validation, reusable assets, keyboard controls, Undo/Redo, zoom, transfer, and responsive behaviour.

### Clarified

- Several people and certificate-backed digital signatures remain future backend scope and are not presented as working.


## 0.12.5 - Streamlined Signature Setup

### Improved

- Made Signature and Type the default active setup choices.
- Removed the redundant **Use selected typed signature** button.
- Removed the large native colour input row and selected-signature preview/save card from the Signature tab.
- Added compact black, red, blue, and green colour palettes to both Signature and Initials style lists.
- Made the final Apply action generate the currently selected typed signature directly.

### Retained

- All eight Signature and Initials styles, automatic initials, Draw/Upload modes, company stamp, saved browser assets, real PDF output, all eleven working engines, all 32 routes, approved origins, public registry URLs, and v0.4.10 zoom behaviour.


## 0.12.6 - Continuous Sign PDF Canvas and Interaction Refinement

### Added

- Added Type, Draw, and Upload modes to Initials.
- Added a continuous all-page Sign PDF document canvas.
- Added two-way synchronized scrolling between page thumbnails and the main document canvas.
- Added Ctrl + mouse-wheel zoom using the shared 50–200% zoom state.
- Added editable visible Text and Input fields with object-level controls.

### Fixed

- Hid Zoom and Undo/Redo controls before PDF upload.
- Made Full name and Initials empty for each new job.
- Derived initials from the first two name words while preserving manual edits.
- Stabilized drag movement by preserving pointer offset.
- Stabilized resizing with a fixed top-left anchor and proportional image-field scaling.
- Made empty input borders visible in previews and generated PDFs.
- Removed the extra white outer page-card background from the continuous document canvas.

### Retained

- All eleven working engines, all 32 routes, public npm registry URLs, approved local origins, file transfer, Start over, home reset, and v0.4.10 zoom limits.
