# NovaPDF Master Project Handoff v1.37

**Current source version:** 0.13.7  
**Current build:** Step 13.7 Viewer Visibility / Duplicate Portal Corrective  
**Date:** July 30, 2026  
**Current next milestone:** Run the complete Windows gate and manual portal lifecycle checklist. Keep Request Signatures disabled until every automated, security, and production-provider gate passes.

## Authoritative v0.13.7 addendum

### Proven root cause

The application intentionally keeps many workspaces mounted so tool state can survive navigation. The shared viewer renders through `createPortal(..., document.body)` to avoid clipping. Hidden generic workspaces did not pass an explicit `active` value, and the viewer component defaulted to active. Their parent `hidden` class therefore could not hide the body portals. Multiple controls and shadows stacked at the same bottom-center coordinates, creating the large spot seen behind the toolbar and leaving a toolbar visible on upload screens.

### Corrective behavior

- `WorkspaceZoomControls` now defaults to inactive.
- Every generic workspace receives explicit route activity from the workspace host.
- A generic viewer is active only when its tool is active and at least one file has been accepted.
- Start over clears files and removes the viewer.
- The one active document-ready viewer remains portaled and unclipped.
- The remaining viewer uses no backdrop blur and only a restrained shadow.
- Continuous, Single-page, Two-page, and Three-page modes remain preserved.

### Packaging validation

- 22 dependency-free source contracts passed.
- Step 13.7 corrective contract passed 16 checks.
- All 92 TypeScript/TSX source and test files passed syntax transpilation.
- JSON, CSS, resolved public-registry lock URLs, runner CRLF/safety, and archive preparation checks passed.
- The complete backend remains byte-for-byte unchanged across 68 files.

### Windows acceptance requirement

Extract to a fresh folder and double-click `RUN_NOVAPDF_ALL.cmd`. Complete `WINDOWS_VALIDATION_STEP_13_7.md`. Before upload, DevTools must show zero `.workspace-bottom-controls`; after upload in the active tool it must show exactly one; after Start over it must return to zero. Tool switching must never leave a stale portal or shadow.

### Locked boundary

Request Signatures remains disabled and is not Working. Do not begin Step 12.9. Do not delete Docker volumes. Do not run `npm audit fix --force`. Preserve the exact `allowedDevOrigins`, public npm registry URLs, all 32 tools, all 33 routes, and every existing working engine.

---

## Complete preserved v1.36 handoff

# NovaPDF Master Project Handoff

**Project:** NovaPDF - browser-first PDF toolkit and future full-stack SaaS  
**Current source release:** `NovaPDF_Build_Step_13_6_Unified_Viewer_Active_Page_Smooth_Resize`  
**Current version:** 0.13.6  
**Updated:** July 30, 2026  
**Current next milestone:** Run the complete v0.13.6 Windows gate and manual viewer/Edit/Sign checklist, then keep Request Signatures disabled until all security and production-provider gates pass.

## Authoritative v0.13.6 viewer and interaction addendum

This section supersedes older current-status, version, viewer, resize, active-page, and running instructions when they conflict. Historical implementation records remain preserved below.

### Grounded UI findings

The supplied screenshots prove two distinct shared-viewer outcomes. The unusable layout placed the dark viewer inside a transformed and horizontally scrollable parent, which clipped the left side and exposed a separate scrollbar. The desired Edit PDF layout is an independent bottom-center bar with complete page, zoom, Undo/Redo, and view controls. Version 0.13.6 makes that independent layout the shared behavior.

### Source implementation

- `workspace-zoom-controls.tsx` renders its active controls through a `document.body` portal so tool-specific transforms, overflow, and stacking contexts cannot clip it.
- Shared view modes are Continuous, Single-page, Two-page, and Three-page, with responsive fallback for narrow screens.
- `workspace-interaction-guides.ts` uses continuous vector projection for proportional resize instead of selecting one dominant axis.
- Edit PDF and Sign PDF retain alignment lines, rulers, distances, and live dimensions while resize geometry remains unsnapped and follows the pointer.
- Crop PDF applies geometric snapping only to movement; resize guides remain visual.
- Edit PDF records page clicks as an explicit active insertion target. Text, highlight, shape, link, freehand, and image additions belong to that page. The image file picker retains the active page that opened it.
- Edit PDF pointer listeners read live objects through refs and are not torn down on every drag frame. Small highlights and objects receive a larger transparent resize hit area.
- Sign PDF output filename, signing action, and ready/download result return to the normal right-panel scroll flow.

### Preserved state

- 32 registered tools and 33 root routes.
- 12 implemented browser workspaces and all earlier engines.
- Existing homepage behavior, right-side panels, lazy previews, file transfer, Start over, home reset, and 50-200% zoom boundary.
- Complete Step 12.8 backend, migration, Docker topology, and exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Public npm registry URLs only.
- Request Signatures disabled and not Working. Step 12.9 has not started.

### Packaging validation

- 21 dependency-free source contracts passed.
- Step 13.6 contract passed 32 checks.
- All 92 TypeScript/TSX files passed syntax transpilation.
- Backend comparison against v0.13.5 reports zero changed backend files.
- The packaging environment cannot certify dependency-backed gates because its npm configuration is forcibly routed to an incomplete internal mirror. The Windows one-click runner remains the authoritative dependency-backed gate.

### Mandatory Windows acceptance

Extract the new source to a fresh folder and double-click `RUN_NOVAPDF_ALL.cmd`. Complete `WINDOWS_VALIDATION_STEP_13_6.md`, including unclipped shared viewer checks, all four view modes, smooth non-forced resizing, Edit PDF active-page insertion in Three-page view, highlight selection/movement/resize, and normal Sign PDF panel scrolling. Do not promote the release or begin Request Signatures UI work until the full automated, manual, security, and production-provider sequence passes.

## Authoritative v0.13.5 corrective addendum

This section supersedes older current-status, version, gate-count, and running instructions when they conflict. Historical implementation records remain preserved below.

### Grounded failure and corrective scope

The real v0.13.4 Windows one-click runner output proved Docker Desktop, PostgreSQL, Redis, MinIO, Mailpit, private-bucket initialization, root public-registry clean install, and audit capture. The runner then stopped at Root ESLint with five errors and one warning. Version 0.13.5 fixes only those reported source findings and updates the release/runner documentation.

### Source corrections

- `edit-pdf-workspace.tsx`: the activation reset is deferred through a cancellable animation-frame callback instead of synchronously setting state in an effect.
- `workspace-zoom-controls.tsx`: controlled current-page synchronization is deferred through a cancellable animation-frame callback.
- `split-pdf-workspace.tsx`: transfer and keyboard effects are placed after `resetFields`, `loadPdf`, and `splitPdf` declarations.
- `sign-pdf-workspace.tsx`: the unused `focusSelectedTextEditor` helper is removed; all used editor-focus paths remain.

### Preserved state

- 32 tools and 33 root routes.
- 12 implemented browser workspaces.
- Complete v0.13.4 shared snap guides, alignment rulers, live distances/dimensions, Shift-drag proportional resizing, bottom viewer, keyboard coverage, homepage routing, Sign PDF corrections, and Edit PDF implementation.
- Complete Step 12.8 backend, migration, Docker service topology, and exact development origins.
- Request Signatures remains disabled and not Working. Step 12.9 remains blocked.

### Validation completed in packaging

- 20 dependency-free source contracts passed.
- Step 13.5 corrective contract passed 19 checks.
- Step 13.4 passed 57 checks.
- Step 13.3 passed 91 checks.
- Edit PDF passed 43 checks.
- Sign PDF corrective passed 22 checks.
- One-click runner passed 32 checks.
- Step 12.8 backend/corrective passed 36 checks.
- TypeScript/TSX syntax transpilation, JSON parsing, registry hygiene, route manifest, exact origins, and batch safety checks passed.

### Mandatory Windows execution order

1. Extract the v0.13.5 source package to a short local path without deleting Docker volumes.
2. Double-click `RUN_NOVAPDF_ALL.cmd`.
3. Confirm Root ESLint passes with no errors or warnings.
4. Confirm the runner continues through Root TypeScript, 20 source contracts, 11 PDF-engine tests, production build, backend validation, migration checks, health, 33 routes, and local sequential two-recipient E2E.
5. Retain all timestamped `validation-logs`.
6. Complete every item in `WINDOWS_VALIDATION_STEP_13_5.md`.
7. Complete controlled root security regression and production-provider delivery/signed-webhook verification.
8. Do not begin Step 12.9 or mark Request Signatures Working until every gate passes.

### Permanent handoff invariant

Every future NovaPDF handoff must update and include `RUN_NOVAPDF_ALL.cmd`, version-specific running instructions, automated gate counts, honest manual/provider boundaries, and a continuation prompt. The runner must preserve Docker volumes and must never run `npm audit fix` or `npm audit fix --force`.

---

## Preserved v0.13.4 and earlier handoff history

# NovaPDF Master Project Handoff

**Project:** NovaPDF - browser-first PDF toolkit and future full-stack SaaS  
**Current source release:** `NovaPDF_Build_Step_13_4_Shared_Guides_Aspect_Resize`  
**Current version:** 0.13.4  
**Updated:** July 30, 2026  
**Current next milestone:** Execute the v0.13.4 one-click Windows gate, complete shared ruler/distance/Shift-resize browser acceptance, then finish controlled security and production-provider gates. Request Signatures UI integration remains blocked.

## Authoritative v0.13.4 addendum

This section supersedes older current-status, gate-count, direct-canvas interaction, and running instructions below when they conflict. Historical records remain preserved.

### Grounded base and boundaries

Version 0.13.4 continues from the actual v0.13.3 source. The complete v0.13.3 master handoff, complete tools/options inventory, and actual source were inspected before modification. The Step 12.8 backend is preserved unchanged. Docker volumes were not touched. Request Signatures remains disabled and not Working. Step 12.9 was not started.

### Implemented changes

- Added `src/lib/workspace-interaction-guides.ts` as the shared geometry source for edge/center snapping and proportional resize constraints.
- Added `src/components/workspace-interaction-overlay.tsx` as the shared SVG overlay for teal alignment lines, left/right/top/bottom point distances, and live width/height labels.
- Applied shared movement guidance to every implemented direct-canvas editor where it is meaningful: Sign PDF, Edit PDF, Watermark PDF, and Crop PDF.
- Sign PDF now snaps selected-object edges and centers to page/common-position and peer-object anchors. Holding Shift during any resize preserves the current aspect ratio; existing always-proportional signature/image/checkbox/stamp behavior remains.
- Edit PDF now uses the same shared edge/center snapping and measurement overlay. Holding Shift during any resize preserves the current aspect ratio; images remain proportional by default.
- Watermark PDF now preserves the original pointer grab offset, snaps to page and peer-watermark anchors, and displays live alignment rulers and distances while dragging.
- Crop PDF now snaps the movable crop area to page anchors and displays live margins/dimensions. Holding Shift on any of the eight handles preserves the current crop ratio while keeping the opposite edge/corner anchored.
- All new visible website content is US English and follows the current NovaPDF navy/teal design.

### Validation completed here

- 19 dependency-free source contracts passed.
- The Step 13.4 contract passed 57 checks.
- The preserved Step 13.3 contract passed 91 checks.
- The preserved Step 13 Edit PDF contract passed 43 checks.
- The preserved Step 13.1 Sign PDF contract passed 22 checks.
- The preserved Step 13.2 runner contract passed 32 checks.
- The preserved Step 12.8 backend/corrective contract passed 36 checks.
- All 92 TypeScript/TSX files passed syntax transpilation.
- Shared geometry runtime smoke checks passed.
- 32 tools, 33 routes, public registry project files, exact allowed development origins, file transfer, Start over, home reset, and the disabled Request Signatures boundary remain.

### Dependency-backed gate limitation

The packaging environment did not contain the project dependency tree. Previous public-registry traffic was redirected through an internal gateway that did not provide one required tarball. No lockfile or registry policy was weakened. Windows clean install, audit, ESLint, semantic TypeScript, 11 PDF-engine tests, production build, live route checks, backend runtime/E2E, and manual Chrome acceptance remain mandatory.

### Mandatory execution order

1. Extract the v0.13.4 source package without deleting Docker volumes.
2. Double-click `RUN_NOVAPDF_ALL.cmd`.
3. Retain the timestamped `validation-logs`.
4. Complete every item in `WINDOWS_VALIDATION_STEP_13_4.md`.
5. Complete controlled root security regression.
6. Complete real production email/storage provider delivery and signed webhook verification.
7. Do not promote Request Signatures or begin Step 12.9 until every gate passes.

### One-click handoff invariant

Every future NovaPDF handoff must retain and update `RUN_NOVAPDF_ALL.cmd`, version-specific one-click instructions, current automated gate counts, current ports/routes/migration expectations, and honest manual/provider boundaries. The runner must never delete Docker volumes and must never run `npm audit fix` or `npm audit fix --force`.

---

## Preserved v0.13.3 and earlier handoff history

# NovaPDF Master Project Handoff

**Project:** NovaPDF - browser-first PDF toolkit and future full-stack SaaS  
**Current source release:** `NovaPDF_Build_Step_13_3_Shared_Controls_Checkbox_Edit_Alignment`  
**Current version:** 0.13.3  
**Updated:** July 30, 2026  
**Current next milestone:** Execute the v0.13.3 one-click Windows gate, complete shared controls/keyboard/Home/Sign checkbox/Edit alignment browser acceptance, then finish controlled security and production-provider gates. Request Signatures UI integration remains blocked.

## Authoritative v0.13.3 addendum

This section supersedes older current-status, gate-count, and running instructions below when they conflict. Historical records remain preserved.

### Grounded base and boundaries

Version 0.13.3 continues from the actual v0.13.2 source and one-click runner. The Step 12.8 backend is preserved unchanged. Docker volumes were not touched. Request Signatures remains disabled and not Working. Step 12.9 was not started.

### Implemented changes

- Shared session history no longer truncates old checkpoints, allowing Undo to return to the first recorded state after file load.
- All implemented PDF tools use a bottom-center NovaPDF viewer bar with page selection, `current / total`, 50-200% zoom, and Continuous/Single-page/Grid view modes.
- The viewer follows the visible page and supports Ctrl/Cmd+Plus, Ctrl/Cmd+Minus, Ctrl/Cmd+0, Page Up, Page Down, Ctrl/Cmd+Home, and Ctrl/Cmd+End.
- Hidden inactive workspaces do not register viewer keyboard handlers or override the active view mode.
- Tool-appropriate Ctrl/Cmd+O, Ctrl/Cmd+S, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y, Delete/Backspace, Escape, arrow, selection, copy/cut/paste, duplicate, and layer shortcuts were completed across the twelve implemented engines.
- The root URL now shows the homepage. The header brand and workspace Home action return to `/` and reset workspace state.
- Sign PDF checkboxes support tick color, box fill, border color, border width, proportional tick size, square proportional resize, and matching flattened export.
- Edit PDF uses Sign-style dragging and bottom-right resizing with page/object snapping and live teal alignment guides.

### Validation completed here

- 18 dependency-free source contracts passed.
- The Step 13.3 contract passed 91 checks.
- The preserved Step 13 Edit PDF contract passed 43 checks.
- The preserved Step 13.1 Sign PDF contract passed 22 checks.
- The preserved Step 13.2 runner contract passed 32 checks.
- The preserved Step 12.8 backend/corrective contract passed 36 checks.
- All 90 TypeScript/TSX files passed syntax transpilation.
- 32 tools, 33 routes, public registry project files, exact allowed development origins, file transfer, Start over, home reset, and the disabled Request Signatures boundary remain.

### Dependency-backed gate limitation

The packaging environment redirected public npm traffic through an internal package gateway whose cache did not contain `zod-validation-error-4.0.2.tgz`. No lockfile or registry policy was weakened. Consequently Windows clean install, audit, ESLint, semantic TypeScript, 11 PDF-engine tests, production build, live route checks, backend runtime/E2E, and manual Chrome acceptance remain mandatory.

### Mandatory execution order

1. Extract the v0.13.3 source package without deleting Docker volumes.
2. Double-click `RUN_NOVAPDF_ALL.cmd`.
3. Retain the timestamped `validation-logs`.
4. Complete every item in `WINDOWS_VALIDATION_STEP_13_3.md`.
5. Complete controlled root security regression.
6. Complete real production email/storage provider delivery and signed webhook verification.
7. Do not promote Request Signatures or begin Step 12.9 until every gate passes.

### One-click handoff invariant

Every future NovaPDF handoff must retain and update `RUN_NOVAPDF_ALL.cmd`, version-specific one-click instructions, current automated gate counts, current ports/routes/migration expectations, and honest manual/provider boundaries. The runner must never delete Docker volumes and must never run `npm audit fix` or `npm audit fix --force`.

---

## Preserved v0.13.2 and earlier handoff history

# NovaPDF Master Project Handoff

**Project:** NovaPDF - browser-first PDF toolkit and future full-stack SaaS  
**Current source release:** `NovaPDF_Build_Step_13_2_One_Click_Windows_Runner`  
**Current version:** 0.13.2  
**Updated:** July 30, 2026  
**Current next milestone:** Execute the one-click Windows gate, complete Sign PDF and Edit PDF manual acceptance, then finish controlled security and production-provider gates. Request Signatures UI integration remains blocked.

## Authoritative v0.13.2 one-click runner addendum

This section supersedes older current-status and running instructions below when they conflict. Historical implementation and validation records remain preserved.

### Grounded source state

Version 0.13.2 is based on the actual v0.13.1 source. This milestone does not alter Sign PDF, Edit PDF, shared UI, route, or Step 12.8 backend implementation source. It adds a versioned Windows execution and validation layer.

### Mandatory one-click handoff invariant

`RUN_NOVAPDF_ALL.cmd` is now required in the project root of every future NovaPDF source package and full handoff. It must be updated whenever commands, counts, ports, health routes, migrations, services, or acceptance gates change.

With one double-click, the current runner:

- confirms Node.js, npm, PowerShell, Docker CLI, and Docker Desktop;
- starts Docker Desktop when needed;
- preserves Docker volumes and an existing `backend\.env`;
- starts PostgreSQL, Redis, MinIO, and Mailpit and confirms readiness;
- enforces public npm registry project files;
- performs root clean install, audit capture, lint, semantic TypeScript, 17 source contracts, 11 engine tests, and production build;
- generates a fresh backend public-registry lock and performs clean install, audit capture, lint, typecheck, build, unit tests, and metadata test;
- requires `[X] CreateSignatureRequestBackend1721800000000` and no pending migration;
- opens separate persistent Web, API, and Worker CMD windows;
- verifies API live/ready, all 33 HTTP routes, and the real local sequential two-recipient E2E;
- opens Sign PDF, Edit PDF, API docs, Mailpit, MinIO Console, and the version-specific manual checklist;
- records timestamped evidence in `validation-logs`.

It never runs `docker compose down -v`, never deletes a Docker volume, never overwrites an existing backend environment file, and never runs `npm audit fix` or `npm audit fix --force`.

### Honest automation boundary

Visual Chrome acceptance and production-provider delivery/webhook verification cannot be certified by the one-click local runner. They require human review and real provider credentials. They remain mandatory release gates.

### Current classification

- Eleven previously proven browser engines remain unchanged.
- The v0.13.1 Sign PDF corrections remain implemented but pending Windows/Chrome acceptance.
- Edit PDF remains an implementation candidate pending Windows acceptance.
- Request signatures remains disabled and not Working.
- Step 12.9 UI integration remains blocked.

### Exact continuation order

1. Extract the v0.13.2 source package without deleting Docker volumes.
2. Double-click `RUN_NOVAPDF_ALL.cmd` and retain `validation-logs`.
3. Complete every Sign PDF corrective and Edit PDF manual checklist item in `WINDOWS_VALIDATION_STEP_13_2.md`.
4. Review audit findings and complete controlled root security regression.
5. Complete selected production-provider delivery, signed webhook, and storage verification.
6. Only after every gate passes may a later milestone consider status promotion or Request Signatures UI integration.

---

## Preserved v0.13.1 and earlier handoff history

# NovaPDF Master Project Handoff

**Project:** NovaPDF - browser-first PDF toolkit and future full-stack SaaS  
**Current source release:** `NovaPDF_Build_Step_13_1_Sign_PDF_Corrections`  
**Current version:** 0.13.1  
**Updated:** 30 July 2026 (Step 13.1 Sign PDF corrective release on the recovered Step 13 source)
**Current next milestone:** Complete Step 13.1 Windows/Chrome corrective acceptance and Step 13 Edit PDF acceptance, then finish the preserved Corrective Package 5 API/worker/E2E, security-regression, and production-provider gates; Request Signatures UI integration remains blocked


## Authoritative v0.13.1 Sign PDF corrective addendum

This addendum supersedes older current-status statements below when they conflict. Historical release and validation sections remain preserved.

### Provenance and scope

The supplied grounded base for this milestone was `NovaPDF_Build_Step_13_Edit_PDF.zip` with its v1.30 full handoff. The actual Sign PDF workspace, Sign PDF export engine, Edit PDF workspace, CSS, contracts, package metadata, route manifest, and backend boundary were inspected before modification. No backend file and no Docker volume was changed.

Version 0.13.1 implements the user-requested Sign PDF corrective set:

- all field types can shrink past the former large minimum in the editor, and the export engine retains tiny dimensions;
- every selected field has Edit, every field except Company stamp has color access, and every right-side field row has Edit;
- inline field editing has Done;
- the output filename area is clearly labelled and visually separated, while the old Text or input value control is removed;
- red required stars are removed without removing required-field validation;
- typed signature/initials images are generated from actual measured glyph bounds with transparent safety padding to prevent left/right clipping in the first two styles;
- full name and initials restore from browser-local storage, and the restored name pre-fills the typed-signature text;
- Page X of Y navigation is placed at the bottom of Sign PDF and Edit PDF;
- date fields explicitly use US English formatting.

### Validation completed here

- all 16 dependency-free source contracts passed;
- the Step 13.1 corrective contract passed 22 checks;
- the preserved Step 13 Edit PDF contract passed 43 checks;
- the preserved Step 12.8 backend/corrective contract passed 36 checks;
- all 90 TypeScript/TSX files parsed with zero syntax diagnostics;
- the stylesheet passed delimiter validation;
- 32 tools, 33 route definitions, exact allowed development origins, public project registry files, file transfer, Start over, home reset, and the disabled Request signatures boundary remain.

A full dependency install could not complete because the execution environment forced npm through an internal proxy that returned HTTP 404 for a missing mirrored `zod-validation-error-4.0.2.tgz`. The root lockfile itself still contains public `registry.npmjs.org` package URLs only. Therefore lint, full semantic TypeScript, all 11 dependency-backed engine tests, production build, live route checks, and Chrome acceptance remain mandatory on Windows.

### Current classification

- Sign PDF retains its previously proven v0.12.8 baseline. The v0.13.1 corrective changes are implemented but require Windows/Chrome acceptance before promotion.
- Edit PDF remains an implementation candidate.
- Request signatures remains disabled and not Working.
- Step 12.9 UI integration remains blocked.

### Exact continuation order

1. Extract `NovaPDF_Build_Step_13_1_Sign_PDF_Corrections.zip` without deleting Docker volumes.
2. Follow `WINDOWS_VALIDATION_STEP_13_1.md`: public-registry clean install, audit capture, lint, semantic TypeScript, 16 contracts, 11 engine tests, build, 33 routes, and the 15-item Sign PDF corrective Chrome checklist.
3. Complete the existing ten-item Edit PDF checklist in `WINDOWS_VALIDATION_STEP_13.md`.
4. Continue the preserved Corrective Package 5 backend clean-install, metadata, migration, API/worker, and real sequential two-recipient E2E gates.
5. Complete the controlled root security regression and production-provider delivery/webhook gate.
6. Do not begin Request Signatures UI integration or mark Request signatures Working before every gate passes.


## Authoritative v0.13.0 recovery addendum

This addendum supersedes older current-status statements below when they conflict. Historical release notes and validation history remain intentionally preserved.

### Recovery provenance and release boundary

The only supplied grounded project base was:

- `NovaPDF_Project_Handoff_v128_Windows_Corrective_5_Full.zip`;
- `NovaPDF_Build_Step_12_8_Windows_Corrective_5.zip`.

The complete master handoff, complete tools/options file, and actual source were read before coding. The recovered source proved that Edit PDF still used the generic Coming Soon workspace. Step 13 was therefore implemented from the existing NovaPDF architecture rather than reconstructed from assumptions about the lost later package.

Version 0.13.0 is an **Edit PDF implementation candidate**. It includes a real workspace, browser-local export engine, source contract, and dependency-backed engine test. It is not promoted to proven Working until the complete public-registry Windows clean-install, lint, semantic TypeScript, all 15 source contracts, all 11 engine tests, production build, 33-route runtime check, and ten-item Chrome checklist pass.

Request signatures remains disabled and not Working. Step 12.9 UI integration must not begin until the preserved Corrective Package 5 API/worker/E2E, manual Sign PDF, controlled root security-regression, and production-provider delivery/webhook gates all pass.

### Current product classification

- **Previously proven Working engines (11):** Merge PDF, Split PDF, Compress PDF, Organize PDF, JPG to PDF, PDF to JPG, Page Numbers PDF, Watermark PDF, Rotate PDF, Crop PDF, Sign PDF.
- **Implementation candidate (1):** Edit PDF.
- **Coming Soon:** the remaining catalog tools.
- **Backend preview only:** Request signatures.
- **Registered tools/routes:** 32 tools and 33 root URLs remain.

### Step 13 Edit PDF implementation

The dedicated `/edit-pdf` workspace accepts one unlocked PDF up to 50 MB and 300 pages. It renders low-resolution thumbnails for all pages and lazily renders higher-resolution previews for the active page and its immediate neighbours. The centre canvas is a continuous vertical document. Main-canvas scrolling remains authoritative; thumbnail navigation may scroll the canvas, but thumbnail auto-scroll never drives the canvas.

Supported added objects:

- text;
- PNG/JPG/JPEG/WebP images;
- rectangle and ellipse;
- line, highlight, and underline;
- freehand stroke;
- HTTP/HTTPS link area.

Supported editing operations:

- click selection;
- move without pointer jumping;
- stable bottom-right resize;
- 15-degree rotation actions and exact rotation input;
- duplicate and delete;
- bring to front and send to back;
- Arrow and Shift+Arrow nudging;
- bounded Undo/Redo;
- Previous/Next and thumbnail page navigation;
- shared 50–200% zoom;
- file transfer, generated-result transfer, Start over, and full home reset.

Text controls include Helvetica, Times, and Courier; regular/bold/italic combinations; font size; alignment; text color; fill; border; opacity; and rotation. Object-specific controls cover image replacement, shape/stroke properties, URL, and line width.

`src/lib/edit-pdf.ts` writes a separate flattened PDF through `pdf-lib`. The source file is not overwritten. The engine is designed to retain source page count, order, dimensions, crop boxes, existing page content, and 0/90/180/270-degree page rotations. It does not claim native editing of existing PDF text objects.

### Step 13 source changes

- `src/components/edit-pdf-workspace.tsx`
- `src/lib/edit-pdf.ts`
- Step 13 rules in `src/app/globals.css`
- Edit PDF registration in `src/components/home-page.tsx`
- Edit PDF `New` badge in `src/data/tools.ts`
- `test-files/test-step-13-edit-pdf-contract.mjs`
- `test-files/test-edit-pdf-engine.mjs`
- updated source/engine runners and route manifest contract
- `RELEASE_NOTES_0.13.0.md`
- `WINDOWS_VALIDATION_STEP_13.md`
- `VALIDATION_REPORT_STEP_13.md`
- updated README, status, changelog, and tools/options inventory

### Recovery-sandbox validation

Passed:

- all 15 dependency-free source contracts;
- preserved Step 12.8 backend/corrective contract, 36 checks;
- Step 13 Edit PDF contract, 43 checks;
- TypeScript parser/transpile syntax sweep of all 90 TS/TSX files;
- stylesheet delimiter balance;
- byte-for-byte comparison of all 68 backend files against supplied Corrective Package 5;
- preservation of 32 tools, route manifest, exact `allowedDevOrigins`, public root/backend `.npmrc`, file transfer, Start over, and home reset through source contracts/inspection.

Not certified in the recovery sandbox:

- root clean install and audit capture;
- ESLint and semantic TypeScript;
- all 11 dependency-backed PDF-engine tests;
- production build;
- live 33-route test;
- Chrome Edit PDF checklist;
- preserved backend clean-install/runtime/E2E rerun.

The sandbox forced npm through an internal mirror that returned missing-tarball HTTP 404 responses, while direct public-registry network access was unavailable. The project was not rewritten to that mirror. Public `registry.npmjs.org` URLs remain the only accepted project registry URLs.

### Exact continuation order

1. Extract `NovaPDF_Build_Step_13_Edit_PDF.zip` to `C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF` without deleting Docker volumes.
2. Run the root public-registry clean-install, audit capture, lint, semantic TypeScript, 15 contracts, 11 engine tests, and production build.
3. Start production and prove all 33 HTTP routes.
4. Complete the ten-item Edit PDF Chrome checklist in `WINDOWS_VALIDATION_STEP_13.md`.
5. In `backend`, generate a fresh public-registry lock, clean install, capture audit, and run lint, typecheck, build, unit tests, and runtime metadata test.
6. Confirm `[X] CreateSignatureRequestBackend1721800000000`; `migration:run` must report no pending migration.
7. Start API and worker, verify live/ready health, and run the real Mailpit/MinIO/PostgreSQL/Redis sequential two-recipient E2E.
8. Complete the preserved ten-item Sign PDF Chrome checklist.
9. Complete the controlled root security regression and selected production-provider delivery/webhook gate.
10. Only after those gates may a later milestone consider Request Signatures UI integration or status promotion.

### Invariants that remain locked

- 32 tools and 33 root routes;
- eleven existing engine implementations and their output behaviour;
- current NovaPDF design and right-side panels;
- continuous Sign PDF canvas and one-way active-page controller;
- lazy active-neighbourhood previews;
- shared 50–200% zoom;
- compatible file transfer;
- Start over and full home reset;
- `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`;
- public npm registry URLs only;
- no `npm audit fix --force`;
- no Docker volume deletion/reset;
- Request signatures disabled and not Working.

## 1. Read this first

This document is the portable source of truth for continuing NovaPDF in another ChatGPT account or with another developer.

Version 0.13.0 continues from the complete v0.12.8 Corrective Package 5 baseline, preserves its Request Signatures backend preview, and adds the Step 13 browser-local Edit PDF implementation candidate. The `backend` package uses NestJS, PostgreSQL, Redis/BullMQ, private S3-compatible storage, SMTP, and a separate PDF worker. It implements sender sessions, multiple recipients, parallel or sequential order, recipient-assigned fields, hashed expiring signer tokens, reminders, decline/cancel/expiry, delivery records, append-only audit events, and final completed-PDF generation. The existing **Request signatures** option remains disabled and is not a Working product claim.

The Windows root baseline is fully proven: clean install, audit reporting, ESLint, semantic TypeScript, all 14 source contracts, all 10 PDF-engine tests, production build, and all 33 runtime routes passed. Docker Desktop's Linux engine runs, PostgreSQL/Redis/MinIO/Mailpit are healthy, backend lint/typecheck/build and seven unit tests pass, and the complete Step 12.8 PostgreSQL migration executed and committed successfully. The first API development start then failed because `tsx` does not emit TypeScript decorator metadata; TypeORM first reported `AuthSessionEntity.tokenHash`, and Nest constructor injection has the same metadata requirement. Corrective Package 5 replaces API, worker, unit, and E2E TypeScript runtime launchers with metadata-capable `ts-node/register`, explicitly types every previously inferred primitive entity column, adds a Nest/TypeORM runtime metadata regression test, and expands the Step 12.8 corrective contract to 36 checks. API/worker health, real sequential-recipient E2E, the ten-item manual Sign PDF checklist, the controlled root security regression, and the production email-provider gate remain mandatory. All eleven browser engines, 32 tool cards, root routes, current NovaPDF design, right-side panels, preview behaviour, one-way Sign PDF canvas scrolling, file transfer, Start over, home reset, `allowedDevOrigins`, public root lock URLs, and v0.4.10 zoom limits remain unchanged.

The approved workspace remains based on the v0.4.10 zoom behaviour. The reverted v0.4.11 vertical-only zoom experiment must not be reintroduced.

The user is a beginner. Every future response must:

1. Explain actions in simple language.
2. Provide complete updated source packages rather than isolated fragments whenever possible.
3. State exactly which folder to open and which commands to run.
4. Preserve the existing NovaPDF visual language and interaction rules.
5. Test lint, TypeScript, production build, and the real PDF output before calling a build complete.
6. Update this handoff after every meaningful milestone.
7. Never copy iLovePDF, Smallpdf, or another product's branding, source code, assets, or exact interface. Common workflow patterns may inspire an original NovaPDF implementation.

## 2. Current working product

NovaPDF is already a runnable Next.js project. It is not merely a plan.

### Working tools

- Merge PDF and images
- Split PDF
- Organize PDF
- Compress PDF
- JPG to PDF
- PDF to JPG
- Page Numbers PDF
- Watermark PDF
- Rotate PDF
- Crop PDF
- Sign PDF
- Edit PDF (implementation candidate; Windows acceptance pending)

### Split PDF improvements retained from 0.4.10

- Extract Pages keeps click-to-select thumbnails and typed syntax such as `1,3-5,8`.
- Custom Parts uses structured Range rows with separate From page and To page inputs.
- Users can add up to 50 ranges and remove unnecessary ranges.
- The canvas shows each range in a separate bordered group labeled Range 1, Range 2, and so on.
- Custom ranges create separate PDFs by default.
- An optional checkbox merges all ranges into one PDF in the displayed range order.
- Every Page mode automatically selects every page and shows an active tick mark on every thumbnail.

### Existing shared workspace

- Full-screen editor after upload
- Full-height category rail on desktop and tablet
- Compact bottom category dock on mobile
- Category-specific tool submenu: stable hover on desktop, click-to-pin on every device, and existing tap-to-open/tap-to-close behaviour on mobile and touch devices
- NovaPDF logo at the top of the rail
- Divider below the logo
- Logo returns to the homepage and clears all in-memory files and generated results
- Start over icon beside the current tool name
- Start over clears only the active tool and keeps the editor open
- Large document canvas
- Right-side settings and result panel
- Responsive mobile settings panel
- Solid white PDF and image preview backgrounds
- Shared full-width result/download card
- Shared Zoom Out, percentage reset, and Zoom In controls
- Clean direct URLs such as `/merge-pdf`, `/split-pdf`, and `/organize-pdf`
- Tool-specific browser page titles and metadata

## 3. Version 0.12.7 behaviour






### Sign PDF core stabilization in 0.12.7

- The active page and nearby pages render lazily at higher resolution as lossless PNG previews; low-resolution thumbnails remain available as a fallback.
- The main document canvas is the single authoritative active-page controller. Thumbnail clicks navigate directly, while thumbnail auto-scrolling no longer changes the document page or causes page skipping.
- Typed, drawn, and uploaded signature assets receive transparent safety padding so first and last strokes are not clipped.
- Name, Date, Text, Initials, and Input objects calculate content-aware minimum width and height. Resizing cannot collapse the box inside its visible text.
- Resizing a rotated object converts the pointer into the object's local coordinate system, preventing opposite/reverse resizing.
- Field dragging keeps the original pointer offset, preventing an object from jumping when movement starts.
- The old right-side **Selected Text** card is removed. A selected text-like object opens a compact inline editor over the document.
- Text, Input, Name, and Date objects expose Edit and Colour actions. Every placed object exposes Rotate, Duplicate, and Delete.
- Text and Input fields can be clicked or dragged from the right panel to any visible page. Input values can be edited after placement and are exported with a visible border and fitted text.
- Palette Add and Edit actions are separate valid controls rather than nested interactive elements.
- PDF-workspace snapshots use lossless PNG where they are previews. Non-raster PDF tools continue to preserve source PDF content through their existing `pdf-lib` workflows. Compress PDF Balanced/Strong and PDF to JPG remain intentionally raster operations.
- The Windows self-signing test runner executes the local TypeScript CLI through Node and no longer uses the failing `spawnSync npx.cmd` path.

### Continuous Sign PDF document editor

- Zoom and Undo/Redo controls are hidden on the empty upload screen and appear only after a PDF loads.
- Full name and Initials start empty for each new PDF, replacement, Start over, and full workspace reset.
- Initials are derived from the first letters of the first two name words, for example `Tawhidul Islam` becomes `TI`, until the user manually edits the Initials field.
- Initials provides the same Type, Draw, and Upload methods as Signature.
- The centre canvas renders every PDF page in one continuous vertical document instead of showing only one isolated page.
- The main document canvas is the only active-page scroll controller. Its scrolling updates the active thumbnail; clicking a thumbnail navigates the canvas, while thumbnail auto-scrolling never drives the document page.
- The extra outer white preview card is removed; the actual PDF page remains clearly visible with a subtle page shadow.
- Toolbar zoom and Ctrl+mouse-wheel use the same shared 50–200 percent zoom value.
- Text and Input rows create visible editable fields when clicked or dragged onto any page.
- Text and Input objects expose Edit, Rotate, Duplicate, and Delete controls. Other placed fields expose Rotate, Duplicate, and Delete.
- Moving a field preserves the pointer-to-object offset so the field does not jump when dragging starts.
- Resizing uses a stable bottom-right handle anchored to the original top-left corner. Signatures, image initials, stamps, and checkboxes keep their aspect ratio; text and input boxes resize naturally.
- Empty input fields retain a visible border in the preview and generated PDF; entered values are exported inside the field.

### Streamlined signer-details modal

- The signer-details modal opens with **Signature** and **Type** active by default.
- The redundant **Use selected typed signature** action was removed.
- The large native ink-color row and selected-signature preview/save card were removed from the Signature tab.
- Signature and Initials each show a compact black, red, blue, and green color palette beside the style chooser.
- The final **Apply** action creates the selected typed signature directly.
- Draw, Upload, Initials, Company stamp, saved browser assets, required fields, field editing, and real PDF output remain available.

### Simplified Sign PDF entry flow

- The compact Sign PDF upload card no longer shows a duplicate **Sign it myself / Request signatures** chooser.
- The full-screen empty Sign PDF workspace no longer shows the same duplicate chooser above the upload card.
- A single clear PDF upload card remains in each empty state.
- After upload, the existing **Who will sign this document?** modal remains the only workflow chooser.
- The signer-details modal, eight Signature styles, eight Initials styles, automatic initials, saved assets, field editor, and real PDF output are unchanged.

### Expanded signature and initials styles

- Signature Type mode provides eight original NovaPDF style presets: Flowing, Signature, Classic, Casual, Elegant, Formal, Clean, and Bold.
- Initials uses the same complete scrollable style list rather than a reduced three-style list.
- The selected typed-signature style is used when creating the browser-generated PNG signature asset.
- The selected initials style maps to the supported PDF text treatment for exported initials fields.
- The chooser uses system and web-safe font stacks; no third-party font files or proprietary signature assets are bundled.

### Automatic initials and typed-name synchronization

- Full name automatically generates initials in real time, for example `Tawhidul Islam` becomes `TI`.
- Users can manually edit initials; after a deliberate edit, later full-name changes do not overwrite the custom value.
- Clearing the initials field returns it to automatic generation from the current full name.
- The duplicate Signature name field is removed; typed-signature previews and output use the Full name field directly.
- Apply automatically creates the selected typed signature when no signature asset exists, removing an unnecessary extra click.

### Homepage hero default

- Opening `/` without a tool route displays **Edit PDF** in the hero upload card.
- Returning home through the NovaPDF logo resets every mounted workspace and restores Edit PDF as the hero default.
- Browser back navigation to `/` follows the same reset rule.
- Edit PDF remains a Coming Soon engine in 0.12.6; the homepage default does not imply that its real editing engine is complete.

### Reliable homepage top-right tool picker

- The initial upload cards use the existing custom grouped tool picker.
- The picker is rendered at document level so the hero card's overflow and backdrop-filter boundary cannot clip or hide it.
- Clicking the top-right trigger reliably expands the complete grouped list below the button.
- The menu has an internal scrollbar when available vertical space is limited.
- Clicking outside or pressing Escape closes the menu.
- Selecting a tool preserves the existing direct-route and compatible-file transfer behaviour.

### Category-based workspace navigation

- The left workspace rail displays only the seven registered categories.
- On desktop devices with hover and a fine pointer, hovering a category opens its tools in a dedicated submenu.
- The rail/submenu handoff has no dead gap, uses a safer exit delay, and remains open while the pointer travels into the submenu.
- Each desktop/tablet submenu starts beside its own category button; it is shifted only when required to keep the complete menu inside the viewport.
- Clicking a category pins its submenu open. Clicking the same category again, using the close button, selecting a tool, or clicking anywhere outside the rail/submenu closes it.
- The outside-click rule prevents a pinned menu from remaining over the canvas or right settings panel after the user resumes work.
- Category buttons do not use the blocking native `Click to keep open` title tooltip; category names and submenu content remain unobstructed.
- Mobile/touch devices retain tap-to-open and tap-to-close behaviour.
- The active tool's category remains visually highlighted.
- The submenu shows tool name, status badge, and a short description.
- Selecting a tool closes the submenu and switches to the selected direct route.
- On mobile, categories appear in the bottom dock and the submenu opens above that dock.
- The right-side control panel remains tool-specific and was not removed or merged into the category menu.


### Sign PDF workflow and workspace redesign in 0.12.2

- Uploading a PDF opens a dedicated **Who will sign this document?** modal rather than dropping the user directly into a crowded editor.
- **Only me** opens the working browser-local self-signing path. **Several people** remains visibly disabled and labelled as a backend phase.
- A separate **Set your signature details** modal collects full name and initials and provides Signature, Initials, and Company stamp tabs.
- Signature setup supports Type, Draw, Upload, browser-saved signature assets, ink color, and browser-local profile saving.
- The existing NovaPDF category rail remains at the far left. A dedicated scrollable document-page strip sits immediately beside it.
- The centre canvas displays every PDF page in one continuous vertical document; Previous/Next navigation scrolls to adjacent pages.
- The right panel is simplified to **Signing options**, Simple/Digital type cards, signer summary, required fields, optional fields, selected-object settings, output, and result.
- Required and optional field rows support click placement and drag-to-page placement.
- The layout uses common document-signing workflow patterns but keeps NovaPDF colors, spacing, typography, components, source code, and wording. No third-party branding, illustration, source code, or exact pixel interface is copied.
- Tablet and mobile layouts keep the category dock, use a horizontal page strip, and retain the mobile settings panel.

### Complete self-signing workspace

- `/sign-pdf` uses a dedicated full-screen working workspace rather than the generic placeholder.
- After upload, the entry workflow presents **Only me** as the active browser-local path and a truthful disabled **Several people** card for Build Step 12.3.
- Accept one PDF up to 50 MB and render up to 300 real page thumbnails locally with PDF.js in the dedicated page strip.
- Create signature assets by drawing with mouse, pen, or touch; typing a name; or uploading PNG, JPG, JPEG, or WebP.
- Typed signatures offer Script, Elegant, and Clean presentation styles and use the selected ink color.
- Uploaded images are normalized locally to PNG; transparent pixels are preserved and a plain white background can be removed.
- Start Full name and Initials empty for each new job; derive Initials from the first two name words until manually edited.
- Save up to 12 reusable signature or company-stamp assets locally, reuse them from the signature-details modal, or delete them there.
- Add signature, initials, signer name, current date, free text, bordered input, checkbox, and company-stamp fields by clicking the right palette or dragging a palette row onto the active page.
- Mark fields required or optional. Final output is blocked if a required asset/value is missing or a required checkbox is unchecked.
- Edit field labels, text, font size, regular/bold/italic style, color, checkbox state, and exact rotation.
- Clicking a page-strip thumbnail scrolls the continuous centre canvas to that page; scrolling either pane keeps the other pane synchronized.
- Move fields by pointer drag or Arrow keys, resize them proportionally, rotate, duplicate, delete, copy, cut, and paste.
- Optional snapping aligns an object to page centre, common page positions, or another field centre and shows visible alignment guides while dragging.
- Undo and Redo remain beside the shared zoom controls; Ctrl/Cmd+Z and Ctrl/Cmd+Y follow the same bounded history.
- Browser-local output uses `pdf-lib` and preserves page count, order, dimensions, crop boxes, existing content, and source rotations, including 90, 180, and 270-degree pages.
- The generated signed PDF becomes the active compatible document when switching tools.
- Browser-saved signatures and company stamps are local conveniences, not cloud records, and disappear when browser storage is cleared.
- Certificate-based cryptographic signatures, signer identity verification, recipient invitations, signing order, reminders, status tracking, audit certificates, and secure signing links remain future full-stack scope.


### Real Watermark PDF workspace

- `/watermark-pdf` uses a dedicated full-screen working workspace rather than the generic placeholder.
- Upload one PDF and render real page thumbnails with clean visual-first cards.
- Choose **Text** or **Image** watermark mode.
- Text mode supports up to 120 characters, standard Helvetica regular/bold, font size, six preset colors plus custom color, opacity, rotation, nine placement presets, and edge offset.
- Image mode accepts PNG, JPG, JPEG, and WebP. WebP is normalized to PNG locally before embedding.
- Image mode supports proportional size, opacity, rotation, nine placement presets, and edge offset.
- Drag the visible text or image watermark directly on any affected preview to switch to a normalized free position; the same position is applied consistently to the selected output pages.
- Click anywhere inside the complete text/image bounds. From grid view, the first click opens that page in a large focused editor so Rotate, Duplicate, Delete, dragging, and keyboard movement are easier to use.
- Focused editing provides **Back to grid**, previous/next page controls, Escape-to-grid, and outside-canvas dismissal while retaining the original thumbnail grid as the default overview.
- The focused page keeps the full rectangular SVG hitbox and pure SVG Rotate, Duplicate, and Delete controls; `foreignObject` is not used.
- Move the selected object with document-level Arrow handling in 4-PDF-point steps or Shift+Arrow in 12-point steps; Delete/Backspace removes it, Ctrl/Cmd+D duplicates it, and Escape returns from focused editing or deselects it in grid view. Movement no longer depends only on the page SVG retaining focus.
- **All pages** selects the linked object across every affected page. Moving, placing, rotating, duplicating, or deleting it updates every affected page. **This page only** creates/selects an independent object for the active page so the same actions affect only that page.
- Multiple watermark objects can be global or page-specific while the active Text/Image content and style controls remain shared.
- If every watermark object is removed, the focused page and right panel show a clear **Add text watermark** or **Add image watermark** recovery action.
- If an image watermark was deleted and the user chooses or replaces the source image while no objects remain, a new visible image object is created automatically.
- Apply either watermark type to all pages or a custom From/To range.
- Live overlays update on affected page previews before processing.
- Browser-local output uses `pdf-lib` and creates a separate watermarked PDF.
- Source page count, page dimensions, crop boxes, rotations, and existing content are retained.
- Text and image placement use the same crop-box, page-rotation, transformed bounding-box, normalized-position, and standard-font metric calculations in the live preview and PDF output. Output tests cover normal pages and pages rotated 90, 180, and 270 degrees.
- Generated output becomes the active compatible document when switching to another PDF tool.
- Standard Latin text is supported by built-in Helvetica; embedded Unicode fonts and tiled/repeated patterns remain planned.



### Crop exact-margin and Watermark style-scope correction in 0.11.5

- Crop PDF starts with the complete original-page rectangle `{ x: 0, y: 0, width: 1, height: 1 }`. Therefore Top, Right, Bottom, and Left Exact margin fields all display `0` after first upload, replacement upload, Start over, and complete workspace reset.
- The active Watermark edit scope controls the right-side object style settings for both Text and Image modes.
- In **All pages**, position preset, rotation, font size, Regular/Bold, color, opacity, edge offset, and image width are written to every affected watermark object.
- In **This page only**, the active page receives or selects an independent object, and the same style settings change only that object.
- Watermark instances store optional per-object font size, font weight, color, opacity, edge offset, and image scale overrides.
- Live thumbnails/focused previews read the effective per-object styles, and the browser-local PDF engine uses the same overrides when drawing text or image watermarks.
- Document-level controls such as PDF page range and output filename remain document-level by design.

### Crop default/tick and Watermark text-scope correction in 0.11.4

- Crop PDF starts with **Original** selected after first upload, replacement upload, Start over, and a complete workspace reset. Manual margin edits still switch the active page to Free, while Original/A4/Letter/Square remain explicit independent presets.
- Every page targeted by Current, Selected, All, Odd, Even, or Custom range receives the same selected visual class used by the green tick control. The tick's ARIA pressed state matches the visible target state.
- Watermark instances can store optional per-object text. A page-specific clone therefore keeps its own text without changing the linked watermark on other pages.
- In **All pages**, editing the text field updates every affected text-watermark object and the shared default. In **This page only**, the text editor creates/selects the independent active-page object and changes only that object's text.
- Thumbnail/focused previews render the effective text for each object, and the browser-local PDF engine embeds each instance's own text. Page-specific output was verified by extracting different watermark text from pages 1 and 2 of the generated PDF.
- Image-watermark scope, positioning, replacement, and output behaviour are unchanged.

### Watermark scope and shared toolbar correction in 0.11.3

- The Watermark editing scope uses two explicit choices: **All pages** and **This page only**.
- In **All pages**, the linked text or image object is selected on every affected thumbnail and every position preset, drag, Arrow movement, rotation, duplication, or deletion is applied to the linked object across those pages.
- In **This page only**, the active page receives or selects an independent text/image object; the same editing actions affect only that page. Returning to **All pages** restores selection of the linked object.
- The same scope rules apply to image watermarks, including replacement-image creation and placement presets.
- Focused text-watermark editing includes an **Edit text** icon beside Rotate, Duplicate, and Delete. It opens the right settings panel and focuses/selects the watermark text field.
- Undo and Redo are located beside Zoom Out, percentage reset, and Zoom In in the shared canvas toolbar. This placement is visible in every workspace that uses the shared zoom component.
- Undo/Redo are functional in the reversible editing workspaces that currently maintain bounded history: Watermark PDF, Crop PDF, Rotate PDF, Organize PDF, Merge PDF, JPG to PDF, and Page Numbers PDF. Other current conversion/settings workspaces display disabled Undo/Redo controls rather than making false history claims.
- Watermark history also records scope changes and the text/image settings required to restore a deleted or replaced object.

### Watermark recovery and keyboard history in 0.11.1

- Deleting a page-specific watermark in the focused editor no longer leaves that page permanently empty. The empty page shows a compact **Add watermark** action in grid and focused view, and the right settings panel identifies the active empty page.
- Adding a replacement text watermark uses the intended page. Adding/replacing an image remembers that page while the native image picker is open and creates a visible page-specific object when the image loads.
- All nine position presets remain clickable even when no watermark object is currently selected. Text mode creates/selects an object at the chosen preset; image mode remembers the preset, opens the image picker if required, and applies it after loading.
- Watermark history covers add, delete, duplicate, rotate, preset placement, free drag, Arrow movement, image recovery, copy, cut, paste, and page/global scope changes.
- Watermark keyboard actions include `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+Y`, `Ctrl+O`, `Ctrl+S`, `Ctrl+A`, `Ctrl+C`, `Ctrl+X`, `Ctrl+V`, `Ctrl+D`, Arrow keys, Shift+Arrow, Delete/Backspace, Escape, and zoom shortcuts where applicable.
- A shared bounded history hook is also used by Organize PDF, Rotate PDF, Crop PDF, Merge PDF, JPG to PDF, and Page Numbers PDF. These workspaces expose visible Undo/Redo controls and tool-appropriate Windows shortcuts. Simple conversion/settings tools that do not maintain a destructive canvas history are not falsely described as having undoable document edits.

### Crop PDF correction in 0.11.2

- A4, Letter, Square, and Original aspect buttons always calculate a fresh maximum-size crop rectangle from the original visible page. Switching Square to A4 therefore cannot inherit the Square geometry.
- Shared mode retains one proportional crop rectangle for Current, Selected, All, Odd, Even, or Custom targets.
- Optional **Free-form crop** stores an independent normalized crop rectangle and independent aspect mode for each edited page.
- Previously edited Free-form pages remain in the generated output target set when another page is opened and cropped.
- Unedited Free-form pages fall back to the shared crop rectangle until the user gives them their own crop.
- The crop engine accepts page-specific rectangles while retaining the shared rectangle as a safe fallback.
- Clicking the gray area outside the large focused crop page returns to grid view. Clicking, dragging, or resizing inside the page and using its toolbar does not close the editor.
- Crop Undo/Redo history includes Free-form mode, page-specific rectangles, per-page aspect modes, target modes, exact margins, and crop presets.

### Real Crop PDF workspace

- `/crop-pdf` uses a dedicated full-screen working workspace rather than the generic placeholder.
- Upload one PDF up to 50 MB and render up to 300 real page previews.
- Grid thumbnails show target-aware ticks and a shaded crop boundary on every page affected by the current target mode.
- Clicking a page opens a large focused crop editor; Back to grid, previous/next page buttons, Escape, and outside-canvas click return to the overview.
- Move the crop rectangle with pointer/touch input and resize it with eight handles.
- Exact Top, Right, Bottom, and Left controls use PDF points and update the live editor immediately.
- Full page, Small, Medium, and Large presets provide quick equal-margin choices.
- Free, Original, A4, Letter, and Square modes constrain the crop area to a chosen aspect ratio.
- Target modes are Current page, Selected pages, All pages, Odd pages, Even pages, and Custom From/To range.
- The crop area is stored as normalized visual-page geometry so it transfers proportionally across differently sized pages.
- Output uses `pdf-lib`, preserves existing page rotation and content, and synchronizes MediaBox, CropBox, BleedBox, TrimBox, and ArtBox.
- The result uses the shared download card and becomes the active compatible PDF when switching tools.

### Tool-specific names

The header title, right-panel title, result title, and primary action text follow the active tool name.

Examples:

- Merge PDF
- Split PDF
- Organize PDF
- Compress PDF
- JPG to PDF
- PDF to JPG
- Page Numbers PDF
- Watermark PDF

Future tools must follow the same rule and must not display the name of a different tool.



### Complete tools catalog retained from 0.8.1

The homepage All PDF Tools section and direct-route generator contain all 32 approved catalog entries. Inside the full-screen workspace, the seven category buttons expose the same 32 tools through category submenus:

- Merge PDF, Split PDF, Compress PDF
- PDF to Word, PDF to PowerPoint, PDF to Excel
- Word to PDF, PowerPoint to PDF, Excel to PDF
- Edit PDF, PDF to JPG, JPG to PDF
- Sign PDF, Watermark PDF, Rotate PDF
- HTML to PDF, Unlock PDF, Protect PDF
- Organize PDF, PDF to PDF/A, Repair PDF
- Page Numbers PDF, Scan to PDF, OCR PDF
- Compare PDF, Redact PDF, Crop PDF
- PDF Forms, AI Summarizer, Translate PDF
- PDF to Markdown and Create a Workflow

The catalog filters are All, Workflows, Organize PDF, Optimize PDF, Convert PDF, Edit PDF, PDF Security, and PDF Intelligence. Completed tools open their real workspaces. Unimplemented tools are clearly marked `Soon`, have root-level direct routes, and open the existing generic placeholder workspace. Page Numbers PDF is explicitly visible in the All Tools grid and in the Edit PDF category submenu.

### Complete 32-tool registry

Status meanings:

- **Working:** a real browser-local processing engine is implemented and connected to its dedicated workspace.
- **Coming Soon:** the catalog card, category filter, direct route, active category/submenu state, dynamic title, generic upload workspace, and file-compatibility metadata exist, but the real processing engine has not yet been built.

**1. Merge PDF** - `/merge-pdf`  
Category: Organize PDF | Status: **Working** | Input: PDF, JPG/JPEG, PNG, WebP | Upload: Multiple

**2. Split PDF** - `/split-pdf`  
Category: Organize PDF | Status: **Working** | Input: PDF | Upload: Single

**3. Compress PDF** - `/compress-pdf`  
Category: Optimize PDF | Status: **Working** | Input: PDF | Upload: Multiple

**4. PDF to Word** - `/pdf-to-word`  
Category: Convert PDF | Status: **Coming Soon** | Input: PDF | Upload: Multiple

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

Selecting a category filters the cards without changing the registered direct routes. The workspace category rail and its submenus retain the full catalog so users can switch tools without returning to the homepage.

### Detailed option inventory for every catalog tool

The option lists below are the approved product scope. Items marked **implemented** exist in 0.12.2. Items marked **planned** document the first intended workspace scope and must not be described as working until their processing engine and tests are complete.

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

#### 4. PDF to Word - planned

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

- Upload one PDF and render editable page canvases.
- Add text boxes, images, shapes, highlights, underlines, and freehand drawing.
- Move, resize, rotate, duplicate, delete, and reorder added objects.
- Configure font family, size, color, alignment, border, fill, and opacity.
- Add links and basic annotations where supported.
- Provide undo, redo, zoom, page navigation, and object selection.
- Save edits into a new PDF without overwriting the source file.

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

- Choose **Sign it myself**; keep **Request signatures** clearly disabled until the complete production-provider gate passes.
- Upload one PDF up to 50 MB and render up to 300 real page thumbnails locally with PDF.js.
- Draw, type, or upload signature assets and optionally remove a plain white image background.
- Save and reuse up to 12 signatures or company stamps in browser storage.
- Start each new signing job with empty Full name and Initials; derive Initials from the first two name words until manually edited.
- Add signature, initials, current date, signer name, free text, bordered input, checkbox, and company-stamp fields.
- Mark fields required or optional and validate them before output.
- Render every page in one continuous scrollable centre canvas synchronized with the page-thumbnail strip.
- Move with pointer-offset preservation; resize from a stable anchored handle; rotate, duplicate, delete, copy, cut, and paste signing objects.
- Edit field label, text, font size, regular/bold/italic style, color, checkbox state, and rotation.
- Snap objects to page positions and other object centres with visible alignment guides.
- Show Undo/Redo and zoom only after upload; support toolbar zoom and Ctrl+mouse-wheel zoom plus Windows/macOS keyboard shortcuts.
- Configure a custom output filename and create a separate signed PDF locally with `pdf-lib`.
- Preserve source page count, page order, dimensions, crop boxes, content, and existing rotations.
- Transfer the generated PDF to compatible PDF tools.
- Certificate-based cryptographic signing, identity verification, and legal-signature claims remain later scope. The Step 12.8 remote-request backend remains disabled pending UI and production end-to-end validation.

#### 14. Watermark PDF - implemented

- Upload one PDF and render real page thumbnails.
- Choose a text watermark or an image/logo watermark.
- Configure text, font size, regular/bold style, color, opacity, and rotation in text mode.
- Upload PNG, JPG, JPEG, or WebP and configure proportional size, opacity, and rotation in image mode.
- Choose a placement preset and edge/offset spacing.
- Drag the text or image directly on an affected preview to use a free normalized position.
- Click an object from grid view to open its page in a large focused editor, then use on-canvas Rotate, Duplicate, and Delete controls.
- Return with Back to grid, Escape, or an outside-canvas click; move between focused pages with previous/next controls.
- Move a selected object by keyboard using Arrow keys (4 PDF points) or Shift+Arrow (12 PDF points), captured at document level after selection.
- Choose **All pages** for linked text/image edits across every affected page or **This page only** for independent editing on the active page.
- Add multiple global or page-specific watermark objects.
- Recover after deleting every object through prominent page and right-panel add actions.
- Automatically restore a visible object when a new/replacement image is chosen and no watermark object remains.
- Apply to all pages or a custom From/To page range.
- Show the watermark live on affected page previews using the same PDF-point geometry and font metrics as output.
- Configure output filename and create a new watermarked PDF.
- Preserve source-page count, dimensions, crop boxes, rotations, existing content, and current transfer behavior.
- Tiled/repeated patterns and embedded Unicode fonts remain planned extensions.

#### 15. Rotate PDF - implemented

- Upload one or multiple PDFs.
- Render real page thumbnails grouped by source document.
- Click thumbnails to select individual pages.
- Apply rotation to selected pages, all pages, odd pages, even pages, or the same custom From/To range inside each source PDF.
- Thumbnail ticks always represent the active target set: manual selections in Selected mode, every page in All pages, odd/even pages in their modes, and every page inside the Custom range.
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
- Show live placement and style changes on affected thumbnails.
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

- Upload one PDF and render real page thumbnails using PDF.js.
- Click any thumbnail to open a large single-page crop editor.
- Drag the crop area or resize it with eight visible handles.
- Enter exact top, right, bottom, and left margins in PDF points.
- Use Full page, Small, Medium, or Large margin presets.
- Choose Free, Original, A4, Letter, or Square aspect-ratio modes.
- Apply the crop to the current page, manually selected pages, all pages, odd pages, even pages, or a custom From/To range.
- Show target-aware tick marks and shaded live crop boundaries before processing.
- Copy one normalized crop area proportionally across targeted pages with different dimensions or rotations.
- Synchronize MediaBox, CropBox, BleedBox, TrimBox, and ArtBox in the generated PDF.
- Configure an output filename and transfer the generated PDF to compatible tools.

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
- Working tools use dedicated workspaces; unimplemented tools use the generic placeholder and remain marked `Soon`.
- The destination tool replaces stale state with the current compatible file context.
- Thumbnail cards remain visually clean; detailed names, sizes, dimensions, page counts, and tool-specific metadata belong in the right panel.
- Start over clears only the active workspace.
- Clicking the NovaPDF logo returns to the homepage and clears all in-memory workspaces and generated results.
- Existing v0.4.10 zoom behavior must remain unchanged.


### Canvas thumbnail metadata policy

Canvas previews are intentionally visual-first:

- Merge PDF cards do not show file names, file sizes, or type metadata below the thumbnail.
- Compress PDF cards do not show file names, page counts, or file sizes below the thumbnail.
- JPG to PDF cards do not show file names, image dimensions, file sizes, rotation degrees, or page-size/orientation labels.
- Organize PDF cards keep only the output page-order number and do not show the source filename.
- Split PDF keeps page numbers and selection tick marks because they are required for page selection.
- Detailed file names, dimensions, file sizes, page counts, and other metadata remain in the right-side panel and must not be removed there.
- JPG to PDF live previews still visually update for A4/Letter/Auto, Auto/Portrait/Landscape, margins, and Fit/Fill. Only the text labels are hidden.

### Direct routes and dynamic page names

Every tool uses a clean root-level route without a `/tools/` prefix.

Examples:

```text
/                     Homepage
/merge-pdf            Merge PDF
/split-pdf            Split PDF
/organize-pdf         Organize PDF
/compress-pdf         Compress PDF
/jpg-to-pdf            JPG to PDF
/pdf-to-jpg           PDF to JPG
/page-numbers-pdf      Page Numbers PDF
```

Selecting a tool updates the URL, workspace title, sidebar active state, and browser page title without reloading the page. Direct refreshes work because `src/app/[tool]/page.tsx` statically generates every known tool route. Browser Back and Forward update the visible workspace.

### Active document handoff

The current tool's compatible files become the active file context for the next selected tool.

Example flow:

1. Upload `A.pdf` in Merge PDF.
2. Select Organize PDF.
3. `A.pdf` automatically opens in Organize PDF.
4. Replace it with `B.pdf` in Organize PDF.
5. Select Split PDF.
6. `B.pdf` automatically opens in Split PDF.

The destination tool's old files are replaced. Stale per-tool sessions are not preserved during tool switching.

Compatibility rules:

- Merge PDF accepts PDFs, JPG/JPEG, PNG, and WebP.
- Split PDF accepts the most recently added compatible PDF.
- Organize PDF accepts all compatible PDFs.
- Other tools receive files according to their `accepts` and `multiple` configuration.
- If the current context has no compatible files, the destination workspace is cleared instead of displaying stale files.

### Homepage behavior

Clicking the NovaPDF workspace logo:

- Navigates to `/`
- Returns to the homepage
- Clears all uploaded files in every workspace
- Clears generated object URLs/results
- Clears selections, ordering, and temporary tool settings
- Resets the workspace session in browser memory
- Restores Edit PDF as the homepage hero default

This is intentionally different from Start over, which clears only the active tool.

### Zoom behavior

Merge, Split, Organize, and generic future-tool workspaces use one shared zoom control:

- Minus: zoom out
- Percentage: reset to 100 percent
- Plus: zoom in

Current range is 50 percent to 200 percent in 10 percent steps.

## 4. Working tool details

### Merge PDF

Supported input:

- PDF
- JPG/JPEG
- PNG
- WebP

Features:

- Multiple file upload
- Drag-and-drop upload
- Mix PDFs and images
- First-page or image preview
- File ordering by drag or arrow buttons
- Reverse order
- Add/remove files
- Output filename
- File and total-page statistics
- Browser-local merge using `pdf-lib`
- Images become fitted PDF pages while preserving aspect ratio
- Full-width Merge PDF action
- Action hides after a result appears
- Full-width Download PDF result

Current limits:

- Maximum 20 sources
- Maximum 50 MB per source
- Maximum 150 MB combined

### Split PDF

Features:

- Upload one PDF
- Real page thumbnails
- Extract selected pages into one PDF
- Structured custom ranges with separate From page and To page controls
- Visual range groups with add/remove controls
- Optional merge-all-ranges output
- Every page as a separate PDF
- Click thumbnails to select pages
- Page-range validation
- Output filename
- Shared result/download card
- Browser-local processing using `pdf-lib`

Current limits:

- Maximum 50 MB input
- Every-page mode supports up to 200 outputs

### Organize PDF

Features:

- One or multiple source PDFs
- Real page thumbnails using PDF.js
- Drag page reorder
- Move buttons
- Rotate pages
- Duplicate pages
- Delete pages
- Select pages
- Bulk rotate or delete
- Extract selected pages
- Reverse order
- Restore original order
- Add/remove source PDFs
- Output filename
- Browser-local PDF generation using `pdf-lib`

Current limits:

- Maximum 50 MB per source PDF
- Maximum 200 pages in one workspace

### Compress PDF

Features:

- One or multiple PDF inputs
- First-page thumbnail previews
- Preserve Quality mode using object-stream re-save
- Balanced mode using medium-quality page rasterization
- Strong Compression mode using lower-resolution page rasterization
- Output filename or filename-prefix controls
- Progress display
- Before/after file-size reporting
- Saved-percentage reporting
- Automatic original-file fallback when recompression is larger
- Shared full-width result and download cards
- Browser-local processing using `pdf-lib` and PDF.js

Important behavior:

- Preserve Quality keeps selectable text and vector content as far as the source and browser library allow.
- Balanced and Strong modes convert pages into images. Text, links, forms, annotations, and vector editability may be lost.
- The interface must always show this trade-off clearly.

Current limits:

- Maximum 10 PDFs per batch
- Maximum 50 MB per file
- Maximum 150 MB combined
- Maximum 120 pages per browser batch
- Password-protected PDFs must be unlocked first


### JPG to PDF

Live preview behavior (added in 0.6.1):

- Default settings are A4, Auto orientation, Small margin, and Fit Entire Image.
- Changing A4, Letter, or Auto changes the visible page shape immediately.
- Changing Auto, Portrait, or Landscape changes each workspace page preview immediately.
- Auto visibly uses the correct Portrait or Landscape page shape for each image; the text label is hidden.
- Changing None, Small, or Large margin changes the visible white spacing around the image.
- Changing Fit Entire Image or Fill Page immediately shows fitting or cropping in the preview.
- Final PDF generation uses the same page-size, orientation, margin, and fit calculations as the live preview.

Supported input:

- JPG/JPEG
- PNG
- WebP

Features:

- Multiple image upload
- White-background image previews
- Drag-and-drop and button-based page ordering
- Reverse order
- Individual 90-degree image rotation
- A4, Letter, or Auto page size with live preview
- Auto, Portrait, or Landscape orientation with live preview
- None, Small, or Large margins with live spacing preview
- Fit Entire Image or Fill Page modes with live fitting/cropping preview
- Custom output filename
- Browser-local PDF creation using `pdf-lib`
- Generated output PDF can become the active handoff file for PDF-only tools
- Shared full-width result/download card

Current limits:

- Maximum 30 images
- Maximum 50 MB per image
- Maximum 150 MB combined
- Fill Page can crop edges when aspect ratios differ
- Very large images can exceed browser memory


### PDF to JPG

Supported input:

- One PDF

Features:

- Real page thumbnails using PDF.js
- All pages selected by default
- Click thumbnails to include or exclude pages
- Select All and Clear controls
- Smaller, Standard, and High JPG quality modes
- Standard, High, and Very High resolution modes
- Browser-local page rendering to JPG
- Individual JPG downloads
- One-click ZIP download for all converted images using JSZip
- Output filename prefix
- Progress display
- Shared full-width result/download cards
- Compatible handoff: JPG results go to image-capable tools; the source PDF goes to PDF-only tools

Current limits:

- Maximum 50 MB input
- Maximum 200 pages
- Password-protected PDFs must be unlocked first
- Large page counts and Very High resolution can use substantial browser memory

### Page Numbers PDF

Supported input:

- One PDF

Features:

- Real page thumbnails using PDF.js
- Live page-number placement preview in the workspace
- Six placement positions: top-left, top-center, top-right, bottom-left, bottom-center, and bottom-right
- All-pages or custom From/To page range
- Configurable starting number
- Number-only, `Page 1`, and `1 / N` formats
- Font sizes from 8 to 36 pt
- Edge margin from 12 to 72 pt
- Regular and bold Helvetica styling
- Black, gray, and teal number colors
- Custom output filename
- Browser-local PDF modification using `pdf-lib`
- Shared full-width result/download card
- Generated numbered PDF becomes the active handoff document for compatible PDF tools

Current limits:

- Maximum 50 MB input
- Maximum 300 pages
- Password-protected PDFs must be unlocked first
- This browser build uses standard Helvetica fonts
- Rotated or unusually cropped source pages require final visual checking


### Watermark PDF

Supported input:

- One PDF

Features:

- Real page thumbnails using PDF.js
- Text and Image mode selector
- Text watermark input up to 120 characters
- Standard Helvetica regular and bold styles
- Font sizes from 8 to 160 pt
- Six preset colors plus a custom color picker
- PNG, JPG, JPEG, and WebP image/logo input up to 15 MB
- Proportional image width from 5 to 95 percent of the visual page width
- Opacity from 5 to 100 percent
- Rotation from -180 to 180 degrees
- Nine placement presets: top, center, and bottom combined with left, center, and right
- Configurable edge offset from 0 to 144 pt
- Pointer/touch drag positioning directly on affected page previews
- Normalized free positioning that transfers consistently across selected pages of different dimensions
- All-pages or custom From/To page range
- Live text or image overlays on affected page previews
- Browser-local PDF modification using `pdf-lib`
- Source page count, dimensions, crop boxes, rotations, and existing content retained
- Tested text and image placement on 0, 90, 180, and 270 degree page rotations
- Custom output filename and shared full-width result card
- Generated watermarked PDF transfers to compatible PDF tools

Current limits:

- Maximum 50 MB PDF input
- Maximum 15 MB watermark image and 40 million source image pixels
- Maximum 300 PDF pages
- Password-protected PDFs must be unlocked first
- Standard Latin text is supported with the built-in Helvetica fonts
- Tiled/repeated watermark patterns and embedded Unicode fonts are not yet implemented

### Crop PDF

Supported input:

- One PDF

Features:

- Real page thumbnails using PDF.js
- Large focused page editor with draggable crop movement and eight resize handles
- Exact top, right, bottom, and left margins in PDF points
- Full page, Small, Medium, and Large equal-margin presets
- Free, Original, A4, Letter, and Square aspect-ratio modes; non-Free presets restart from the original visible page
- Current page, Selected pages, All pages, Odd pages, Even pages, and Custom range targeting
- Target-aware tick marks and live shaded crop boundaries
- Shared proportional crop-area application across pages of different dimensions
- Optional Free-form crop with independent page rectangles and aspect modes
- Previously edited Free-form pages remain output targets while another page is edited
- Rotation-aware visual-to-PDF coordinate mapping for 0, 90, 180, and 270 degree source pages
- MediaBox, CropBox, BleedBox, TrimBox, and ArtBox synchronization
- Custom output filename and shared full-width result card
- Generated cropped PDF becomes the active handoff document for compatible tools

Current limits:

- Maximum 50 MB input
- Maximum 300 pages
- Password-protected PDFs must be unlocked first
- Crop hides/clips content outside the new page boxes; it does not perform content-aware edge detection
- Shared mode applies one normalized crop area proportionally; Free-form mode can apply independent normalized rectangles per edited page

### Development-origin fix

`next.config.ts` now includes `allowedDevOrigins` for `172.24.48.1` and `172.21.32.1`. This prevents Next.js development resources such as `__nextjs_font/geist-latin.woff2` from being blocked when the site is opened through those local network hosts. Restart the development server after changing this configuration.

## 5. Technology versions

- Next.js 16.2.10
- React 19.2.4
- React DOM 19.2.4
- TypeScript 5
- Tailwind CSS 4
- Lucide React 1.25.x
- pdf-lib 1.17.1
- pdfjs-dist 6.1.200
- JSZip 3.10.1
- Node.js LTS and npm on the user's Windows computer

PDF processing is currently browser-local. A backend, queue, object storage, accounts, billing, and admin system remain planned for later phases.

Because browser security prevents silently restoring local `File` objects, uploaded files remain available while switching tools in the same tab, but a hard browser refresh clears those local files.

## 6. Important source files

```text
src/app/page.tsx
src/app/[tool]/page.tsx
src/app/globals.css
src/components/home-page.tsx
src/components/brand-logo.tsx
src/components/workspace-tool-rail.tsx
src/components/workspace-zoom-controls.tsx
src/components/workspace-result-card.tsx
src/components/merge-pdf-workspace.tsx
src/components/split-pdf-workspace.tsx
src/components/organize-pdf-workspace.tsx
src/components/compress-pdf-workspace.tsx
src/components/jpg-to-pdf-workspace.tsx
src/components/pdf-to-jpg-workspace.tsx
src/components/page-numbers-pdf-workspace.tsx
src/components/watermark-pdf-workspace.tsx
src/components/rotate-pdf-workspace.tsx
src/components/crop-pdf-workspace.tsx
src/components/sign-pdf-workspace.tsx
src/components/generic-tool-workspace.tsx
src/data/tools.ts
src/lib/workspace-file-transfer.ts
src/lib/watermark-pdf.ts
src/lib/rotate-pdf.ts
src/lib/rotate-pdf-targeting.ts
src/lib/crop-pdf.ts
public/pdf.worker.min.mjs
test-files/
```

### State and navigation design

- All workspaces are mounted inside `UploadWorkspace` so transfer events can reach hidden destination tools.
- `workspace-file-transfer.ts` filters compatible files and dispatches a browser CustomEvent.
- Destination workspaces always replace their previous file state with the transferred active context.
- `workspaceResetVersion` in `home-page.tsx` remounts all workspace components when the logo returns home, clearing all in-memory state.
- `home-page.tsx` uses the browser History API to change direct tool URLs without remounting the active React workspace.
- `src/app/[tool]/page.tsx` supports direct loading and refresh for every registered tool slug.
- Single-file destinations receive the last compatible PDF so a newly added PDF becomes the next active document.

## 7. Run instructions for Windows

1. Extract the latest ZIP into Documents.
2. Open the extracted folder in Visual Studio Code.
3. Open `Terminal -> New Terminal`.
4. Run:

```powershell
npm.cmd install
```

5. Then run:

```powershell
npm.cmd run dev
```

6. Open:

```text
http://localhost:3000
```

To stop the website, click the terminal and press `Ctrl + C`.

## 8. Required test flow for version 0.12.7

### Homepage and navigation test

1. Open `/` and confirm the hero upload card says Edit PDF, not Merge PDF.
2. Open the top-right tool picker and confirm the menu begins below the trigger.
3. Confirm the picker groups tools under the seven categories and scrolls internally when needed.
4. Select Merge PDF and upload files to enter the full-screen workspace.
5. Confirm the left rail displays categories only, not a flat list of 32 tools.
6. Hover Organize PDF, move the pointer into its submenu, wait at least 400 ms, and confirm the submenu stays open.
7. Confirm the submenu begins beside the Organize PDF category rather than at a fixed top position.
8. Click Edit PDF, move the pointer to the canvas, and confirm the submenu remains pinned open.
9. Click Edit PDF again or use the submenu close button and confirm it closes.
10. Hover each category long enough for a browser tooltip and confirm no `Click to keep open` tooltip covers a category name or submenu entry.
11. Confirm Merge PDF, Split PDF, Rotate PDF, and Organize PDF appear under Organize PDF.
12. Confirm Edit PDF, Sign PDF, Watermark PDF, Page Numbers PDF, Crop PDF, and PDF Forms appear under Edit PDF.
13. Select Page Numbers PDF and confirm the submenu closes and the route changes to `/page-numbers-pdf`.
14. On a narrow mobile viewport, confirm category buttons use the bottom dock and the submenu opens above it with tap-to-open/tap-to-close behaviour.
15. Click the NovaPDF logo and confirm the homepage returns to Edit PDF with all in-memory workspace data cleared.

### JPG to PDF live-preview test

1. Open `/jpg-to-pdf`.
2. Upload `test-files/sample-image.png` and `test-files/sample-photo.jpg`.
3. Confirm the defaults are A4, Auto orientation, Small margin, and Fit Entire Image.
4. Select Portrait and confirm every visible page becomes portrait.
5. Select Landscape and confirm every visible page becomes landscape.
6. Return to Auto and confirm each page visibly uses its correct Portrait or Landscape shape without a text label.
7. Change Small margin to None and Large and confirm the white page spacing updates immediately.
8. Change Fit Entire Image to Fill Page and confirm the workspace preview shows potential edge cropping.
9. Generate the PDF and confirm its page shape and image placement match the live preview.

### JPG to PDF regression test

1. Open `/jpg-to-pdf`.
2. Upload `test-files/sample-image.png` and `test-files/sample-photo.jpg`.
3. Confirm both image previews appear on white backgrounds.
4. Drag or use arrows to change their order.
5. Rotate one image.
6. Test A4, Letter, and Auto page size.
7. Test Auto, Portrait, and Landscape orientation.
8. Test None, Small, and Large margins.
9. Create the PDF using Fit Entire Image and confirm two pages.
10. Test Fill Page and confirm the interface warns that edges may crop.

### PDF to JPG test

1. Open `/pdf-to-jpg`.
2. Upload `test-files/sample-six-pages.pdf`.
3. Confirm all six page thumbnails appear and all six have active tick marks.
4. Clear the selection and select pages 1, 3, and 6.
5. Test Smaller, Standard, and High JPG quality.
6. Test Standard, High, and Very High resolution.
7. Convert the selected pages.
8. Confirm individual JPG download buttons appear.
9. Confirm Download All as ZIP works and the ZIP contains the selected page images.
10. Switch to JPG to PDF and confirm the converted images transfer.
11. Switch to Split PDF and confirm the source PDF transfers instead of incompatible JPG files.

### Page Numbers PDF test

1. Open `/page-numbers-pdf`.
2. Upload `test-files/sample-six-pages.pdf`.
3. Confirm six real page thumbnails appear.
4. Confirm the default live preview shows number-only text at bottom-center on all pages.
5. Test all six positions and confirm every numbered thumbnail updates immediately.
6. Choose Custom range, set From 2 and To 5, and confirm only pages 2-5 show overlays.
7. Set Start at 10 and confirm the visible sequence becomes 10, 11, 12, 13.
8. Test `1`, `Page 1`, and `1 / N` formats.
9. Change font size, edge margin, Regular/Bold, and black/gray/teal color; confirm live preview updates.
10. Create and download the PDF.
11. Confirm pages outside the custom range were not changed and downloaded number placement matches the thumbnail preview for all six positions.
12. Test a PDF containing 90, 180, and 270 degree page rotations and confirm preview/output placement remains visually aligned.
13. Run `node --experimental-strip-types test-files/test-page-numbers-engine.mjs`.
14. Switch to Split PDF or Organize PDF and confirm the generated numbered PDF transfers.


### Step 11.1 Watermark recovery and shortcuts test

1. Open `/watermark-pdf` and upload `test-files/sample-six-pages.pdf`.
2. Open page 1 in focused editing, select its watermark, choose **This page only**, and delete the watermark.
3. Return to grid and confirm page 1 shows a compact Add watermark action.
4. Add a text watermark to page 1 and confirm it appears only on page 1.
5. Delete it, switch to Image mode, choose an image, and confirm the image preview appears on page 1 rather than another page.
6. Delete all objects on the active page and click each of the nine placement presets; confirm the preset remains clickable and creates/selects an object or opens the image picker as appropriate.
7. Move or delete the selected object, press `Ctrl+Z`, and confirm the prior state returns. Test `Ctrl+Y` and `Ctrl+Shift+Z` for redo.
8. Test `Ctrl+C`, `Ctrl+X`, `Ctrl+V`, `Ctrl+D`, Arrow movement, Shift+Arrow, Delete, Escape, `Ctrl+O`, `Ctrl+S`, and zoom shortcuts where applicable.
9. Confirm visible Undo/Redo controls work in Watermark, Organize, Rotate, Crop, Merge, and JPG to PDF.
10. Generate a PDF and confirm the Watermark output engine and preview/output placement remain unchanged.


### Step 11.5 Crop margin and Watermark style-scope test

1. Open Crop PDF and upload `test-files/sample-six-pages.pdf`. Confirm **Original** is active and Top, Right, Bottom, and Left Exact margins all show `0` before any edit.
2. Open Watermark PDF, keep **All pages**, and change position, rotation, font size, font weight, color, opacity, and edge offset. Confirm every affected text watermark updates.
3. Switch to **This page only** on page 2 and change the same settings. Confirm only page 2 changes.
4. Repeat All-pages and This-page-only checks in Image mode for image width, opacity, edge offset, position, and rotation.
5. Generate the PDFs and confirm the downloaded text/image watermark styles match the previews.
6. Run `node --experimental-strip-types test-files/test-step-11-5-crop-watermark-scope.mjs`.

### Step 11.4 Crop default/tick and Watermark page-text test

1. Open Crop PDF and upload `test-files/sample-six-pages.pdf`. Confirm **Original** is active before changing any crop setting.
2. Select **Selected pages**, tick pages 1 and 3, and confirm both thumbnails show visible green ticks.
3. Switch to All, Odd, Even, Current, and Custom range and confirm ticks always match the active target pages.
4. Open Watermark PDF with the six-page sample, choose **All pages**, use Edit text, and confirm every affected preview changes.
5. Switch to **This page only** on page 2, use Edit text, enter a different phrase, and confirm only page 2 changes.
6. Return to grid and confirm page 1 retains the all-pages phrase while page 2 retains its independent phrase.
7. Generate the PDF and confirm the downloaded output contains the shared text on page 1 and the independent text on page 2.
8. Confirm image-watermark All-pages and This-page-only behaviour remains unchanged.

### Step 11.3 Watermark scope and shared toolbar test

1. Open `/watermark-pdf`, upload `test-files/sample-six-pages.pdf`, and keep **All pages** selected.
2. Click a text watermark and confirm the linked object is selected across every affected thumbnail.
3. Click each position preset, drag the object, press Arrow keys, and rotate it; confirm all affected page previews update together.
4. Switch to **This page only** on page 2 and confirm only page 2 is selected. Move it and choose another position preset; confirm the other pages remain unchanged.
5. Repeat the same All-pages and This-page-only checks in Image mode.
6. Open a text watermark in focused view and click **Edit text**; confirm the right settings panel opens and the text field is focused and selected.
7. Confirm Undo and Redo are beside the zoom controls in all shared workspaces. Test functional Undo/Redo in Watermark, Crop, Rotate, Organize, Merge, JPG to PDF, and Page Numbers PDF; confirm unsupported workspaces show disabled controls rather than false operations.
8. Run `node test-files/test-step-11-3-watermark-scope-toolbar.mjs`.

### Watermark PDF test

1. Open `/watermark-pdf`.
2. Upload `test-files/sample-six-pages.pdf`.
3. Confirm six real thumbnails appear and the default `CONFIDENTIAL` watermark is visible on every page.
4. Click the watermark on page 1 from grid view and confirm only page 1 opens in the large focused editor.
5. Confirm Rotate, Duplicate, and Delete controls are comfortably usable in focused view. Use Back to grid, Escape, and an outside-canvas click to return to the six-page grid.
6. Use previous/next controls in focused view and confirm the large editor changes pages without losing the grid state.
7. With **All pages** selected, press Arrow Right and confirm every affected page moves together. Hold Shift while pressing an Arrow key and confirm the movement step is larger.
8. Select **This page only**, move or rotate page 1, and confirm the first edit creates an independent page object while the other pages remain unchanged.
9. Duplicate the page-1 object and confirm the extra copy exists only on page 1. Delete the selected copy and confirm other pages are unchanged.
10. Delete every remaining watermark object and confirm both the focused page and right panel expose an Add watermark recovery action. Add a new text watermark and confirm it reappears.
11. Switch to Image mode, upload `test-files/sample-image.png`, delete every image watermark object, then choose `test-files/sample-photo.jpg`; confirm a visible preview object is automatically restored.
12. Test Delete/Backspace, Ctrl/Cmd+D, selection, drag, keyboard, rotation, duplication, shared scope, and page-only scope.
13. Change text/image style, opacity, rotation, position, edge offset, and Custom range; confirm every preview updates.
14. Create and download the PDF. Confirm preview and output positions match for preset and free positions.
15. Confirm source page count, dimensions, crop boxes, and rotations are retained.
16. Test 90, 180, and 270 degree source rotations.
17. Switch to Split PDF or Organize PDF and confirm the generated watermarked PDF transfers.
18. Run `node --experimental-strip-types test-files/test-watermark-engine.mjs` and `node test-files/test-step-10-1-interaction-contract.mjs`.

### Rotate PDF test

1. Open `/rotate-pdf`.
2. Upload `test-files/sample-six-pages.pdf` and optionally a second PDF.
3. Confirm real thumbnails appear grouped under each source filename.
4. Click pages 1 and 3 and confirm the target mode becomes Selected and only pages 1 and 3 show ticks.
5. Choose All pages and confirm every thumbnail shows a tick. Choose Odd pages and Even pages and confirm only the matching thumbnails show ticks. Set Custom range 2-5 and confirm only pages 2-5 show ticks.
6. Rotate selected pages right 90 degrees and confirm only the current target thumbnails change.
7. Test All pages, Odd pages, Even pages, and Custom range rotation output.
8. Test Left 90 degrees, Right 90 degrees, 180 degrees, and Reset.
9. Generate the output and confirm page count, order, dimensions, and rotations.
10. For multiple source PDFs, confirm one result per source and Download all as ZIP.
11. Switch to Split PDF or Organize PDF and confirm generated rotated PDFs transfer.
12. Run `node --experimental-strip-types test-files/test-rotate-engine.mjs` and `node --experimental-strip-types test-files/test-rotate-targeting.mjs`.

### Crop PDF test

1. Open `/crop-pdf`.
2. Upload `test-files/sample-six-pages.pdf`.
3. Confirm six real thumbnails appear and all pages show target ticks by default.
4. Click page 1 and confirm it opens in the large crop editor.
5. Drag the crop area and resize it from corner and edge handles.
6. Click the gray area outside the enlarged page and confirm the workspace returns to grid view. Also test Back to grid and Escape.
7. Test Current page, Selected pages, All pages, Odd pages, Even pages, and Custom range 2-5; confirm ticks and overlays match each target.
8. Select Square and then A4. Confirm A4 is calculated from the original page and does not inherit the Square rectangle. Repeat with Letter and Original.
9. Enable Free-form crop. Crop page 1, return to grid, crop page 2 differently, and confirm page 1 keeps its earlier rectangle.
10. While Free-form is enabled, open a third page and confirm previously edited pages remain targeted and keep their independent overlays.
11. Test Full page, Small, Medium, and Large presets and exact Top, Right, Bottom, and Left margins on different pages.
12. Generate and download the cropped PDF; confirm page count/order remain unchanged and every targeted page uses its own expected box.
13. Test a PDF with 90, 180, and 270 degree page rotations.
14. Switch to Split PDF or Organize PDF and confirm the generated cropped PDF transfers.
15. Run `node --experimental-strip-types test-files/test-crop-engine.mjs` and `node --experimental-strip-types test-files/test-step-11-2-crop-refinement.mjs`.

### Sign PDF test

1. Open `/sign-pdf` and confirm **Sign it myself** is active while **Request signatures** is visibly marked as the next backend phase.
2. Upload `test-files/sample-six-pages.pdf` and confirm six real thumbnails appear.
3. Confirm Full name and Initials start empty. Enter `Tawhidul Islam` and confirm Initials becomes `TI`; manually edit Initials and confirm later name changes do not overwrite it.
4. Use Type, Draw, and Upload in Signature, then repeat all three modes in Initials.
5. Save a signature locally, reuse it, and delete a saved copy.
6. Upload a company stamp and add it to another page.
7. Add signature, initials, date, name, text, bordered input, and checkbox fields.
8. Mark an empty field required and confirm output is blocked until it is completed; test a required unchecked checkbox too.
9. Confirm all PDF pages appear in one continuous centre canvas. Test offset-preserving drag, stable anchored resize, rotate, duplicate, delete, copy, cut, paste, Arrow movement, and Undo/Redo.
10. Scroll the centre canvas and confirm the thumbnail strip follows. Scroll the thumbnail strip and confirm the centre canvas follows. Test toolbar zoom and Ctrl+mouse-wheel zoom, then enable snapping and confirm alignment guides.
11. Drag Text and Input from the right panel onto different pages. Confirm Text shows Edit/Duplicate/Delete, Input is editable, and both appear in the generated PDF.
12. Test a source containing 90, 180, and 270-degree rotated pages and confirm source rotations are preserved.
13. Switch to Split PDF or Organize PDF and confirm the generated signed PDF transfers.
14. Run `node test-files/test-sign-engine.mjs`, `node test-files/test-step-12-sign-contract.mjs`, `node test-files/test-step-12-1-self-signing.mjs`, and `node test-files/test-step-12-1-self-signing-contract.mjs`.


### Regression tests

1. Re-test Merge PDF with a PDF and image.
2. Re-test Split Custom Parts and Every Page tick marks.
3. Re-test Organize page ordering and rotation.
4. Re-test all three Compress PDF modes.
5. Switch from JPG to PDF to Merge PDF and confirm compatible images transfer.
6. Click the NovaPDF logo and confirm all workspace data clears on the homepage.
7. Confirm zoom behaviour matches v0.4.10.

## 9. Validation history and v0.12.7 status

- v0.12.6 TypeScript syntax transpilation passed for the Sign PDF workspace and PDF engine.
- All v0.12.6 Sign PDF source-contract tests passed, including hidden pre-upload zoom, empty signer defaults, two-name initials derivation, Initials Type/Draw/Upload, continuous all-page canvas, synchronized scrolling, Ctrl+wheel zoom, text/input placement, object controls, and stable drag/resize state.
- The packaging container could not complete a clean dependency install because its npm gateway repeatedly returned HTTP 503. Therefore ESLint, semantic TypeScript, engine-output tests, production build, npm audit, and route HTTP checks were not rerun for v0.12.6 inside this container.
- `package-lock.json` still uses public `registry.npmjs.org` URLs only and `allowedDevOrigins` remains unchanged.
- The complete v0.12.6 gate must be run with the supplied Windows commands before the release is considered production-confirmed.

- Complete self-signing engine tests passed for signature image, company stamp, bordered input, and checkbox output on separate pages.
- The generated six-page self-signing output was rendered and visually inspected.
- Prior self-signing source-contract tests confirmed workflow cards, browser-local saved signatures and stamps, company stamp, input, checkbox, required validation, snapping guides, and local-only disclosure.
- All existing Crop, Rotate, Watermark, Page Numbers, Sign, and interaction-contract regression tests passed.
- ESLint passed without errors or warnings; TypeScript passed.
- Next.js production build passed and generated 36 static pages.
- Homepage and all 32 registered root tool routes returned HTTP 200 from the production server.
- `npm audit` reported 0 vulnerabilities, public npm registry URLs were preserved, and `allowedDevOrigins` remained unchanged.
- Full native local-storage, drawing, file-picker, and pointer flow still requires confirmation in the user's Windows Chrome because the packaging environment could not complete the full localhost Chromium interaction.
- Sign PDF engine tests passed for image signatures, signer name, date, initials, multiple pages, and separate object types.
- A normal six-page signed output and a four-page source containing 90/270/90/0-degree rotations were generated and rendered. Page count, page order, crop boxes, dimensions, content, and original rotations were preserved.
- The normal and rotated signed outputs were visually inspected.
- Sign PDF source-contract tests confirmed Draw, Type, Upload, field controls, focused editing, drag, resize, rotate, duplicate, delete, keyboard shortcuts, real engine registration, and Working status.
- ESLint passed without errors or warnings.
- TypeScript passed.
- Next.js production build passed and generated 36 static pages.
- Homepage and all 32 registered root tool routes returned HTTP 200 from the production server.
- Offline `npm audit` reported 0 vulnerabilities. The dependency set is unchanged and `package-lock.json` contains public npm registry URLs only.
- Existing Crop, Rotate, Watermark, Page Numbers, and interaction-contract regression tests passed.
- Automated Chromium navigation to localhost remained blocked by administrator policy, so the complete native file-picker and pointer flow requires the supplied Windows Chrome checklist.

- Step 11.5 tests passed for full-page Crop defaults, zero Exact margins, per-object Watermark style contracts, and independent page-specific font sizes in generated output.
- Text output was rendered and visually inspected with a small red page-1 watermark and a large bold teal page-2 watermark using different margins and opacity.
- Image output was rendered and visually inspected with independent page-specific width, opacity, rotation, placement, and edge offset.
- Step 11.4 corrective tests passed for Crop PDF Original default, reset/load restoration, target tick visual state, Watermark scope-aware text source contracts, and per-instance text output.
- PDF.js text extraction confirmed that a generated document can contain the shared watermark phrase on page 1 and a different This-page-only phrase on page 2 without leakage in either direction.
- Step 11.3 source-contract tests passed for All-pages and This-page-only selection, text/image scope synchronization, focused Edit text action, and shared Undo/Redo placement beside zoom.
- Every workspace using the shared zoom component now renders the same Undo/Redo/Zoom strip; history-enabled workspaces supply active callbacks and unsupported workspaces keep the controls disabled.
- Clean dependency installation completed successfully and `npm audit` reported 0 vulnerabilities.
- ESLint passed without errors or warnings.
- TypeScript passed.
- Next.js production compilation, type checking, and static generation completed for 36 pages.
- Homepage and all 32 registered root tool routes returned HTTP 200 from the production server.
- Rotate target-mode tests passed for Selected, All pages, Odd pages, Even pages, and Custom range.
- Rotate PDF engine tests passed for 90, 180, and 270-degree changes, existing source rotations, page count, page dimensions, and page order.
- Crop PDF engine tests passed for selective pages, normalized visual crop mapping, synchronized page boxes, page count, page order, and 0/90/180/270 degree source rotations.
- Step 11.2 Crop refinement tests passed for aspect reset independence, exact A4 geometry, Original full-page reset, page-specific rectangles, retained Free-form page targets, and focused-editor outside-click source contracts.
- The crop engine generated different page boxes from different normalized page rectangles in one output PDF.
- Generated Crop PDF outputs were rendered and visually inspected.
- Watermark engine tests passed for text, image, multiple objects, page-specific objects, hidden pages, custom position, custom range, and rotated-page output.
- Source-contract tests confirmed focused-page editing, Back to grid, empty-object recovery, image replacement recovery, target-aware Rotate ticks, and removal of the native category tooltip.
- Page Numbers PDF parity tests passed for all six positions.
- All eleven completed browser-local processing engines remain registered.
- `allowedDevOrigins` remains unchanged.
- Package lock uses public npm registry URLs only.
- The user confirmed that the v0.9.3 watermark selection, controls, and keyboard interaction work in their browser.
- Automated Chromium access to the locally hosted full application remained blocked by the packaging environment's administrator policy, so the new focused-view click flow still requires the simple Windows Chrome checklist in this handoff.

- Step 11.1 Watermark recovery and Windows-keyboard source-contract tests passed.
- Watermark text, image, custom-position, multiple-instance, page-specific, and rotated-page engine tests passed.
- Shared history integration is present in Watermark, Organize, Rotate, Crop, Merge, and JPG to PDF.
- ESLint passed with zero warnings, TypeScript passed, production build passed, npm audit reported zero vulnerabilities, and all 32 root routes plus the homepage returned HTTP 200.
- Automated full-app Chromium interaction remains blocked by administrator policy in the packaging environment; the exact pointer and native-file-picker flow must be manually confirmed in the user's Windows Chrome.

- Step 12.3 source-contract tests passed for all eight Signature styles, the matching Initials style list, full-name-to-initials generation, manual initials override protection, duplicate Signature-name control removal, full-name synchronization, and automatic typed-signature creation on Apply.
- Step 12.4 source-contract tests confirmed that both duplicate pre-upload workflow chooser blocks were removed while the upload cards and post-upload workflow modal remain.
- ESLint, TypeScript, production build, npm audit, and the existing Sign PDF engine/regression tests passed after the entry-flow simplification.

- Step 12.5 source-contract tests confirmed Signature/Type defaults, removal of the redundant typed-signature button and large Signature detail block, compact Signature and Initials palettes, and direct typed-signature creation through Apply.
- Clean npm install, audit, ESLint, TypeScript, all engine/contract tests, production build, and all 33 routes passed. Full localhost Chromium interaction remained blocked by administrator policy.

- Step 12.6 syntax transpilation and all Sign PDF source-contract tests passed.
- The packaging container could not rerun clean npm installation, ESLint, semantic TypeScript, engine-output tests, production build, npm audit, or HTTP route checks because its npm gateway returned repeated HTTP 503 responses. The package lock still contains public `registry.npmjs.org` URLs only. Run the listed Windows validation commands before treating v0.12.6 as production-confirmed.


### v0.12.7 validation status

- All 30 TypeScript/TSX source files passed syntax transpilation in the packaging environment.
- Step 12.6 and Step 12.7 Sign PDF source-contract tests passed after the scrolling and resize contracts were updated for the stabilized architecture.
- A temporary semantic check with ambient external-library stubs found no errors in `sign-pdf-workspace.tsx` or `sign-pdf.ts`; one real unreachable comparison in the Sign PDF engine was found and corrected.
- The Windows self-signing test runner was changed to execute the local TypeScript CLI through Node, avoiding Node 24 `spawnSync npx.cmd EINVAL`.
- The packaging environment could not finish a clean dependency installation because registry downloads repeatedly failed with DNS/gateway errors. Therefore ESLint, full semantic TypeScript, production build, npm audit, route HTTP checks, and engine-output regression tests must be rerun on Windows before calling v0.12.7 production-confirmed.
- The user previously reported two high `sharp@0.34.5` audit findings in v0.12.6. Do not run `npm audit fix --force`, because npm proposed a breaking Next.js downgrade. Recheck the audit in this release and handle the dependency through an explicit tested upgrade rather than a forced downgrade.

## 10. Known limitations and truthful release boundary

- Browser refresh still clears frontend files and results.
- The eleven working engines remain browser-local. Large files can exceed browser memory.
- Sign PDF remains a visual self-signing tool. It does not yet provide certificate-backed cryptographic signatures or identity verification.
- The Step 12.8 Request Signatures backend is source-complete as an API-first preview, but the original NovaPDF sender/signer pages are not connected to it.
- The emailed development signer URL currently opens the secure JSON review endpoint. A finished recipient signing page is Step 12.9 scope.
- The packaging environment could not install dependencies, create `backend/package-lock.json`, run migrations, start Docker services, deliver SMTP mail, execute the BullMQ worker, or run the full backend end-to-end test.
- Request signatures must remain disabled and must not be labelled Working until real email delivery, secure-link UI access, recipient completion, status tracking, final output, and audit enforcement pass in the target environment.
- Office conversion, full PDF editing, protect, unlock, OCR, AI, forms, and other Coming Soon tools remain planned scope.
- Password-protected PDFs must be unlocked before processing.
- Preserve Quality compression may produce little or no reduction; Balanced and Strong compression rasterize pages and can remove interactive/vector content.
- Fill Page intentionally crops image edges when page and image ratios differ.
- A production retention/deletion policy, CSRF layer, rate limiting, abuse controls, provider-specific webhook adapter, transactional outbox, and recovery sweeper remain Step 12.9 hardening work.

## 11. Build Step 12.8 - Request Signatures Backend Preview

### 11.1 Preserved frontend baseline

The entire `src` tree and `next.config.ts` are byte-for-byte unchanged from the uploaded Step 12.7 source. This preserves:

- all 32 tool cards and 33 root-level routes including the homepage;
- all eleven working engines;
- current categories, submenus, placeholder labels, and direct-route behaviour;
- current NovaPDF branding and original interface;
- right-side tool panels and preview behaviour;
- compatible-file transfer, Start over, and full home reset;
- v0.4.10 50-200 percent zoom behaviour;
- Sign PDF empty name/initial defaults, Initials Type/Draw/Upload, continuous all-page canvas, thumbnail synchronization, Ctrl+wheel zoom, Text/Input editing, stable drag/resize, object controls, and real PDF export;
- the main Sign PDF canvas as the only active-page scroll controller;
- lazy high-resolution previews limited to the active-page neighbourhood;
- signature safety padding, content-aware text/input sizes, rotation-aware resize math, inline object editing, and fitted input export;
- `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`;
- public `registry.npmjs.org` values for every root lockfile `resolved` entry.

The only existing test-file edit corrects one stale Step 12.1 assertion so it checks the current inline Required control instead of removed wording.

### 11.2 Backend package and approved architecture

The new source is isolated under:

```text
NovaPDF_Build_Step_12_8\backend
```

Architecture:

- NestJS REST API under `/api/v1`;
- PostgreSQL through TypeORM migrations;
- Redis and BullMQ queues;
- private S3-compatible object storage, using MinIO locally;
- SMTP email provider abstraction, using Mailpit locally;
- separate email, lifecycle, and PDF-finalization workers;
- `pdf-lib` final rendering worker;
- opaque HttpOnly cookie sessions.

Local Docker services are in root `docker-compose.yml`.

### 11.3 Implemented data model

The migration creates:

- `users`;
- `auth_sessions`;
- `documents`;
- `signature_requests`;
- `signature_request_recipients`;
- `signature_request_fields`;
- `signature_request_audit_events`;
- `signature_request_email_deliveries`.

Important rules:

- emails use PostgreSQL `citext`;
- recipient emails and order positions are unique inside a request;
- signer tokens are stored only as SHA-256 hashes;
- document objects store size and SHA-256 integrity values;
- field page/position/size constraints are enforced in SQL;
- audit rows reject UPDATE and DELETE through a database trigger;
- one sender-completion email record is enforced per request;
- TypeORM entity enum names match the migration enum names exactly;
- schema synchronization is disabled.

### 11.4 Sender authentication and request API

Authentication routes:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Request routes require the signed-in sender session:

```text
POST /api/v1/signature-requests
GET  /api/v1/signature-requests
GET  /api/v1/signature-requests/:id
POST /api/v1/signature-requests/:id/send
POST /api/v1/signature-requests/:id/remind
POST /api/v1/signature-requests/:id/cancel
GET  /api/v1/signature-requests/:id/audit
GET  /api/v1/signature-requests/:id/completed-download
```

Creation accepts one PDF plus metadata. Current limits are:

- one unlocked PDF;
- 5 bytes to 50 MB by default;
- 1-300 pages;
- 1-25 recipients;
- 1-500 assigned fields;
- 1-30 day expiration;
- every recipient must have at least one field.

Supported recipient-assigned field types:

```text
SIGNATURE, INITIALS, NAME, DATE, TEXT, INPUT, CHECKBOX, STAMP
```

### 11.5 Signing order and secure links

- Parallel requests activate all recipients when sent.
- Sequential requests activate only the first recipient.
- Completing one sequential recipient generates and emails the next recipient token.
- Signer tokens are cryptographically random, stored only as hashes, bounded by both token TTL and request expiry, rotated on reminder, and cleared on completion/decline/cancel/expiry.
- Secure signer routes do not require a sender account:

```text
GET  /api/v1/signer/:token
POST /api/v1/signer/:token/complete
POST /api/v1/signer/:token/decline
```

- Review returns a short-lived private PDF view URL and only that recipient's assigned fields.
- Completion requires explicit consent and validates required fields.
- Signature/initial/stamp images accept PNG or JPEG data URLs up to 5 MB and are stored privately.
- Name and date fields can be populated automatically from recipient data and current date.

### 11.6 Statuses, reminders, decline, cancel, and expiry

Request statuses:

```text
DRAFT, SENT, DELIVERED, VIEWED, PARTIALLY_SIGNED,
COMPLETED, DECLINED, EXPIRED, CANCELLED
```

Recipient statuses:

```text
WAITING, READY, SENT, DELIVERED, VIEWED,
COMPLETED, DECLINED, EXPIRED, CANCELLED
```

Behaviour:

- invitation and reminder jobs are queued through BullMQ;
- reminders rotate the signer token and have a 24-hour cooldown;
- delivery/bounce webhook updates email and aggregate request status;
- recipient decline closes the request and invalidates other active links;
- sender cancel closes the request, invalidates active links, and queues cancellation notices;
- delayed lifecycle jobs expire active requests and recipients;
- each transition appends an audit event.

### 11.7 Private storage and email

Private object storage contains:

- original PDFs;
- recipient signature/initial/stamp assets;
- completed PDFs.

Controls:

- bucket access is private;
- objects request server-side AES-256 encryption;
- view/download URLs are presigned and short lived;
- completed downloads use an attachment filename;
- SMTP is verified when the email service starts;
- invitation, reminder, decline, cancellation, and completion templates use original NovaPDF wording;
- the generic delivery/bounce webhook requires an HMAC-SHA256 signature.

The generic webhook is not a claim that a production provider adapter is complete. Step 12.9 must map the selected provider's real signed payload format and test it.

### 11.8 Final completed-PDF worker

When every recipient is complete, the finalization worker:

1. locks and reloads the request;
2. confirms every recipient is complete;
3. downloads the original PDF and private response assets;
4. renders each assigned field through rotation-aware page geometry;
5. fits Text/Input content inside its box;
6. stores a separate completed PDF privately;
7. records completed size and SHA-256;
8. sets the request to COMPLETED;
9. appends `REQUEST_COMPLETED` to the audit timeline;
10. queues one completion email to the sender with a short-lived download URL.

The worker is idempotent for already completed requests and uses a unique completion-email constraint.

### 11.9 Important Step 12.8 source files

```text
backend/package.json
backend/.env.example
backend/Dockerfile
backend/src/main.ts
backend/src/worker.ts
backend/src/config/env.ts
backend/src/auth/
backend/src/common/
backend/src/database/entities/
backend/src/database/migrations/1721800000000-CreateSignatureRequestBackend.ts
backend/src/email/
backend/src/queues/
backend/src/signature-requests/
backend/src/signer/
backend/src/storage/
backend/src/worker/
backend/test/
backend/test/runtime-metadata.test.ts
docker-compose.yml
test-files/run-source-contracts.mjs
test-files/run-pdf-engine-tests.mjs
test-files/check-http-routes.mjs
test-files/test-step-12-8-route-manifest.mjs
test-files/test-step-12-8-request-signatures-backend.mjs
WINDOWS_VALIDATION_STEP_12_8.md
VALIDATION_REPORT.md
RELEASE_NOTES_0.12.8.md
```

### 11.10 Test inventory

Dependency-free source gate:

```powershell
npm.cmd run test:contracts
```

This runs 14 source-contract test files, including the 33-route manifest and 36-check Step 12.8 architecture/corrective contract.

Dependency-backed PDF/interaction gate:

```powershell
npm.cmd run test:pdf-engines
```

This runs 10 existing engine/interaction files covering Crop, Page Numbers, Rotate, Rotate targeting, Sign, Crop refinement, Watermark corrections/scope, self-signing, and Watermark output.

Production HTTP gate after `npm.cmd run start`:

```powershell
npm.cmd run test:http-routes
```

This checks the homepage and all 32 tool routes for HTTP 200.

Backend tests:

```powershell
cd backend
npm.cmd run test
npm.cmd run test:metadata
$env:RUN_BACKEND_E2E="1"
npm.cmd run test:e2e
Remove-Item Env:RUN_BACKEND_E2E
```

The backend unit command now runs the seven existing unit tests plus the metadata regression test. The opt-in end-to-end test creates a sender, sends a two-recipient sequential request through SMTP, reads real Mailpit mail, uses both secure links, completes recipient-specific fields, waits for the worker-generated PDF, downloads the final output, verifies statuses/audit events, and proves direct audit-row mutation is rejected.

## 12. Exact Windows validation and local run instructions

The separate file `WINDOWS_VALIDATION_STEP_12_8.md` contains the beginner checklist. The exact folder is:

```text
C:\NovaPDF\NovaPDF_Build_Step_12_8
```

### 12.1 Frontend clean gate

Open Windows PowerShell:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_12_8
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd config get registry
npm.cmd ci
npm.cmd audit
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:contracts
npm.cmd run test:pdf-engines
npm.cmd run build
```

Do not use `npm audit fix --force`.

### 12.2 All 33 production routes

First PowerShell window:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_12_8
npm.cmd run start
```

Second PowerShell window:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_12_8
npm.cmd run test:http-routes
```

Expected final line:

```text
All 33 NovaPDF routes returned HTTP 200.
```

Direct URLs:

```text
http://localhost:3000
http://localhost:3000/sign-pdf
```

### 12.3 Required preserved Sign PDF manual gate

Open `http://localhost:3000/sign-pdf`, upload:

```text
C:\NovaPDF\NovaPDF_Build_Step_12_8\test-files\sample-six-pages.pdf
```

Confirm all ten:

1. Full name and Initials start empty.
2. Initials has Type, Draw, and Upload.
3. Every PDF page appears in one continuous centre canvas.
4. Centre scrolling updates the active thumbnail without page skipping.
5. Clicking a thumbnail scrolls the centre canvas to that page.
6. Toolbar zoom and Ctrl+mouse-wheel share one 50-200 percent state.
7. Text and Input can be clicked or dragged onto any page and edited.
8. Drag/resize remains smooth, including rotated objects.
9. Objects expose Duplicate/Delete, and editable fields expose Edit.
10. Download creates a real signed PDF with the expected fields.

Do not restore a second active-page scroll handler.

### 12.4 Local infrastructure

Install Docker Desktop, then:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_12_8
copy backend\.env.example backend\.env
docker compose up -d postgres redis minio minio-init mailpit
```

Direct URLs:

```text
Mailpit: http://localhost:8025
MinIO console: http://localhost:9001
```

Local MinIO credentials:

```text
Username: novapdf
Password: novapdf-local-secret
```

### 12.5 Backend install, migration, API, and worker

Because the packaging environment could not create `backend\package-lock.json`, generate it once from the public registry and immediately prove a clean install:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd install --registry=https://registry.npmjs.org/
Select-String -Path package-lock.json -Pattern "artifactory|applied-caas|verdaccio"
Remove-Item node_modules -Recurse -Force
npm.cmd ci --registry=https://registry.npmjs.org/
```

`Select-String` must return no matches. Keep the generated `backend\package-lock.json` in every later package.

Continue:

```powershell
npm.cmd audit
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test
npm.cmd run migration:run
npm.cmd run dev
```

Direct API URLs:

```text
Swagger: http://localhost:4000/api/docs
Live: http://localhost:4000/api/v1/health/live
Ready: http://localhost:4000/api/v1/health/ready
```

Worker in another PowerShell window:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
npm.cmd run dev:worker
```

### 12.6 Full local end-to-end gate

Keep Docker, API, worker, and Mailpit running. In another PowerShell window:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
$env:RUN_BACKEND_E2E="1"
npm.cmd run test:e2e
Remove-Item Env:RUN_BACKEND_E2E
```

This local gate is required before Step 12.9 UI integration. A second gate with the selected real production email provider and its verified webhook is required before Request signatures can become Working.

## 13. Validation status

### 13.1 Windows Corrective Package 1 status on 25 July 2026

The first Windows run supplied after v0.12.8 packaging proved:

- all 14 dependency-free source-contract files passed;
- the Crop PDF engine test passed;
- the Page Numbers test stopped because its harness generated `C:\C:\Users\...`;
- Next.js production compilation succeeded before root type checking scanned `backend/src/app.module.ts` without backend dependencies.

Corrective changes now included:

- root `tsconfig.json` excludes `backend`;
- root ESLint ignores `backend/**`, while backend retains its own lint/type/build commands;
- Page Numbers uses `fileURLToPath(import.meta.url)`;
- backend declares direct `express` and `multer` dependencies;
- Node 24 E2E upload copies bytes to a guaranteed `ArrayBuffer` before constructing `Blob`;
- the Step 12.8 source contract now has 21 architecture/corrective checks.

The frontend `src` tree and `next.config.ts` are byte-for-byte unchanged from the original v0.12.8 package. The corrected Windows root, route, manual Sign PDF, backend clean-install, and full E2E gates remain required. Request signatures remains disabled and not Working.

### 13.2 Windows Corrective Package 2 status on 25 July 2026

The second Windows run proved:

- the public npm registry was reachable and root `npm ci` installed 376 packages;
- `npm audit` completed and reported two high-severity advisories in the locked Next.js 16.2.10 / Sharp 0.34.5 path; no forced fix was used;
- root ESLint completed with zero errors and two pre-existing unused-variable warnings;
- root semantic TypeScript passed;
- all 14 dependency-free source-contract files passed;
- Crop PDF, Page Numbers PDF, Rotate PDF, and Rotate target-mode tests passed;
- the Next.js production build completed, generated all static pages, and finalized build traces;
- the PDF-engine runner stopped in `test-sign-engine.mjs` before TypeScript compilation because Node.js 24 returned `spawnSync npx.cmd EINVAL`.

Corrective Package 2 now:

- resolves the installed TypeScript compiler with `createRequire(import.meta.url)` and `require.resolve("typescript/lib/tsc.js")`;
- executes that compiler through `process.execPath` instead of spawning a Windows `.cmd` shim;
- applies the same safe compiler launch to the complete self-signing test;
- initializes ESM-compatible `require` before using it in the self-signing test;
- expands the Step 12.8 architecture/corrective contract to 23 checks.

All 14 dependency-free source contracts pass in the packaged source. The frontend `src` tree, `next.config.ts`, and root `package-lock.json` are byte-for-byte unchanged from Corrective Package 1. The complete 10-test PDF-engine suite, 33 runtime routes, manual Sign PDF checklist, backend clean-install/runtime/E2E gate, and production-provider gate remain required. Request signatures remains disabled and not Working.

### 13.3 Windows Corrective Package 3 status on 25 July 2026

The third Windows run proved the complete frontend/root baseline:

- root public-registry `npm ci`, audit reporting, ESLint, semantic TypeScript, all 14 source contracts, all 10 dependency-backed PDF-engine tests, and the production build passed;
- Sign PDF and complete self-signing engine tests passed;
- all 33 production routes returned HTTP 200;
- the first backend install and a clean backend `npm ci` completed;
- all seven backend unit tests passed.

The same run exposed the remaining backend blockers before Docker/runtime E2E:

- Docker CLI and Compose were installed, but Docker Desktop's Linux engine was not running;
- strict backend ESLint reported untyped E2E JSON/database values, floating Node test registrations, one unnecessary renderer assertion, and one async helper without `await`;
- semantic TypeScript/build rejected a nullable TypeORM query and the missing `@types/pg`;
- direct TypeORM migration execution did not load `backend\.env`, so `DATABASE_URL` was missing.

Corrective Package 3 now:

- uses TypeORM `IsNull()` for active-session logout;
- imports `dotenv/config` in the standalone TypeORM data source and declares `dotenv` directly;
- declares `@types/pg` and types all E2E request, signer, download, audit, and database responses;
- makes Node test registration explicitly `void`;
- removes the renderer assertion and async-without-await lint defects;
- validates the email-provider result as `unknown` before reading `messageId`;
- disables Nodemailer file and URL content access;
- updates Nodemailer to 9.0.3 and its type package to 8.0.1;
- pins `@nestjs/swagger` 11.4.6 and overrides `js-yaml` to patched 5.2.2;
- expands the Step 12.8 architecture/corrective contract to 31 checks.

All 14 dependency-free source contracts pass in the packaged source. The backend syntax/no-check TypeScript gate passes. The frontend `src` tree, `next.config.ts`, and root `package-lock.json` remain byte-for-byte unchanged from Corrective Package 2. Dependency-backed backend audit/lint/typecheck/build/migration/E2E must be rerun on Windows because the packaging npm gateway again returned HTTP 503. The manual Sign PDF checklist also remains unrecorded: the previous log launched dev on port 3001 because port 3000 was occupied, then terminated it without the ten pass/fail results. Request signatures remains disabled and not Working.

### 13.4 Windows Corrective Package 4 status on 25 July 2026

The fourth Windows run proved the local infrastructure and backend compile baseline:

- Docker Desktop returned a Linux `Server:` section;
- PostgreSQL, Redis, MinIO, and Mailpit started and were healthy;
- backend public-registry install and clean install completed;
- backend ESLint, semantic TypeScript, build, and all seven unit tests passed;
- TypeORM connected to PostgreSQL and began migration startup.

The migration stopped before executing any extension, enum, table, index, function, or trigger statement. TypeORM metadata validation reported `Data type "Object" in "DocumentEntity.completedStorageKey" is not supported by "postgres"`. TypeScript emits reflected type `Object` for nullable unions such as `string | null` unless the decorator supplies an explicit database type. The same latent defect existed in seven additional nullable bounded-string columns.

Corrective Package 4 now:

- declares explicit `type: "varchar"` for document `completedStorageKey` and `completedSha256`;
- declares explicit `type: "varchar"` for recipient `tokenHash`;
- declares explicit `type: "varchar"` for signature-field `label`;
- declares explicit `type: "varchar"` for audit `actorId`, `ipHash`, and `userAgent`;
- declares explicit `type: "varchar"` for email-delivery `providerMessageId`;
- matches all explicit entity types to the existing migration's `varchar(...)` columns;
- adds a source contract covering all eight columns;
- expands the Step 12.8 architecture/corrective contract to 32 checks.

The failed run logged only PostgreSQL version and current-schema discovery before metadata rejection, so that attempt did not partially create the Step 12.8 schema. The same run showed a changing npm audit result: the first backend install reported zero vulnerabilities, while the subsequent clean install/audit reported seven high-severity `brace-expansion` dependency-chain findings. No forced fix, untested ESLint major upgrade, or untested TypeORM override is included. Corrective Package 4 requires a fresh public-registry backend lock and exact audit capture.

All 14 dependency-free source contracts pass in the packaged and re-extracted source. Modified entity files pass a TypeScript syntax/no-check compile. The frontend `src` tree, `public` tree, `next.config.ts`, root `package.json`, root `package-lock.json`, root `tsconfig.json`, and root ESLint configuration remain byte-for-byte unchanged from Corrective Package 3. Request signatures remains disabled and not Working.

### 13.5 Windows Corrective Package 5 status on 25 July 2026

The fifth Windows run proved the full database migration gate:

- all Step 12.8 enums, tables, indexes, constraints, and append-only audit triggers were created;
- the migration record was inserted and the transaction committed;
- no database reset or replacement migration is required.

The first API start immediately after migration used `tsx watch src/main.ts` and failed before Nest bootstrap with `ColumnTypeUndefinedError` for `AuthSessionEntity.tokenHash`. This is a runtime compiler boundary rather than a PostgreSQL migration defect. `tsx` uses esbuild and does not emit TypeScript `design:paramtypes` / decorator metadata, while Nest dependency injection and TypeORM decorator inference rely on it.

Corrective Package 5 now:

- runs API development with `node --watch -r ts-node/register src/main.ts`;
- runs worker development with `node --watch -r ts-node/register src/worker.ts`;
- runs unit and real E2E TypeScript tests through `ts-node/register`;
- removes the unused backend `tsx` dependency;
- declares explicit PostgreSQL types for all entity primitives that previously depended on reflected metadata;
- adds a runtime regression test that verifies Nest constructor `design:paramtypes` and loads all eight TypeORM entities;
- requires every TypeORM `@Column` declaration to include an explicit database type;
- expands the Step 12.8 architecture/corrective contract from 32 to 36 checks.

All 14 dependency-free source-contract files pass in the packaged source. The modified TypeScript files pass syntax/no-check compilation. The packaging container could not complete the public-registry backend install, so Windows must rerun backend install, lint, typecheck, build, the now eight-test unit/metadata suite, API/worker startup, and E2E. Frontend `src`, `public`, `next.config.ts`, root package/lock, root TypeScript/ESLint configuration, all routes, and all eleven browser engines remain unchanged. Request signatures remains disabled and not Working.

### 13.6 Original packaging status on 24 July 2026

#### Completed in the packaging environment

- Read the entire v0.12.7 master handoff.
- Read the entire 32-tool options inventory.
- Inspected the actual uploaded Step 12.7 source and package lock.
- Confirmed source started at 0.12.7 and the current working copy is 0.12.8.
- Confirmed the frontend `src` tree and `next.config.ts` are unchanged from Step 12.7.
- Confirmed 32 unique tool slugs plus the homepage.
- Confirmed all eleven working route slugs remain present.
- Confirmed exact `allowedDevOrigins` preservation.
- Confirmed every root lockfile `resolved` value uses the public npm registry.
- Corrected one stale Step 12.1 source assertion.
- Passed all 14 dependency-free source-contract files.
- Passed the 33-route source manifest.
- Passed the Step 12.8 backend architecture/corrective contract with 21 checks.
- Passed a TypeScript syntax/no-check compile of the new backend source.
- Added cross-platform source, PDF-engine, and HTTP-route runners.

#### Blocked by npm infrastructure

The direct public npm registry repeatedly failed DNS/network access and the configured packaging gateway repeatedly returned HTTP 503 or stalled. Therefore the following are not certified by this package:

- root clean `npm ci`;
- root `npm audit`;
- root ESLint;
- full semantic TypeScript;
- production build;
- runtime 33-route HTTP check;
- the 10 dependency-backed PDF/interaction tests;
- backend package-lock creation;
- backend install/audit/ESLint/semantic TypeScript/build/unit tests;
- PostgreSQL migration execution;
- real Mailpit SMTP delivery;
- Redis/BullMQ execution;
- MinIO object storage;
- final completed-PDF E2E;
- manual Windows Chrome Sign PDF verification.

The Step 12.8 package is therefore a backend preview, not a production-confirmed release.

## 14. Next.js and Sharp security hold

The checked root lock remains on:

```text
next 16.2.10
eslint-config-next 16.2.10
optional sharp 0.34.5
```

The official Next.js July 20, 2026 security release instructs 16.2 users to upgrade to 16.2.11. No forced audit fix and no untested dependency edit were made because the complete install/build/PDF regression gate could not run.

Official direct URL:

```text
https://nextjs.org/blog/july-2026-security-release
```

After Corrective Package 5 passes the API/worker/runtime/E2E gate and the manual Sign PDF checklist:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_12_8
npm.cmd install next@16.2.11 eslint-config-next@16.2.11 --save-exact
```

Then rerun every command in `WINDOWS_VALIDATION_STEP_12_8.md`. Do not accept the update if any route, engine, Sign PDF behavior, or build gate regresses.

## 15. Exact next milestone

**Build Step 12.9 - Request Signatures UI Integration and Production Provider Gate**

Required work:

- first run and record every corrected Windows root, route, manual Sign PDF, backend clean-install, and E2E gate;
- update Next.js and `eslint-config-next` to the tested security patch only after the baseline passes;
- connect the original NovaPDF Several people / Request signatures sender flow to the Step 12.8 API;
- create original NovaPDF recipient review, consent, sign, decline, and completion pages;
- keep the main Sign PDF canvas architecture and existing self-signing flow unchanged;
- add sender request list/detail/status/audit/download pages;
- adapt email delivery/bounce events to the selected production provider's real signed webhook format;
- add CSRF protection, login/request/signing rate limits, abuse controls, retention/deletion jobs, token redaction, safe logs, and operational recovery;
- add transactional outbox/reconciliation for database-to-queue reliability;
- test parallel and sequential flows, reminders, bounce, decline, cancel, expiry, duplicate completion, worker retry, and final-PDF idempotency;
- run real provider delivery, secure-link access, recipient completion, final output, status, and audit tests;
- only then change Request signatures from disabled/backend phase to Working.

Certificate-backed digital signatures and identity verification remain later separate milestones.

## 16. Approved long-term full-stack architecture

Long-term architecture remains:

- Next.js and TypeScript frontend;
- NestJS REST API under `/api/v1`;
- PostgreSQL;
- Redis and BullMQ;
- private S3-compatible object storage;
- separate PDF and conversion workers;
- secure cookie sessions;
- signed expiring view/download URLs;
- Free, Pro, Business, Admin, and Superadmin roles;
- user dashboard, billing, teams, workflows, signatures, AI tools, support, and full admin area.

Large files will eventually upload directly to private object storage and process through background jobs. The current browser engine remains the working incremental product and must not be discarded.

## 17. Continuation instruction

When continuing in another account:

1. Upload `NovaPDF_Project_Handoff_v136_Unified_Viewer_Active_Page_Smooth_Resize_Full.zip`.
2. Upload `NovaPDF_Build_Step_13_6_Unified_Viewer_Active_Page_Smooth_Resize.zip` if it is not already inside the handoff package.
3. Paste `NovaPDF_Continue_Project_Prompt_v136.txt`.
4. Require the assistant to read this complete master handoff, `NovaPDF_All_Tools_Options.md`, the v0.13.6 release/validation files, and the actual source before modifying code.
5. Run `RUN_NOVAPDF_ALL.cmd` and complete `WINDOWS_VALIDATION_STEP_13_6.md` before further feature work.
6. Preserve the body-portaled shared viewer, two/three-page views, smooth visual-only resize guides, Edit PDF active-page targeting, Sign PDF natural panel flow, all tools/routes/engines, Docker volumes, exact development origins, and public registry locks.
7. Keep Request Signatures disabled and do not start Step 12.9 until every automated, manual, controlled-security, and production-provider gate passes.
