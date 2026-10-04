# NovaPDF Step 13.6 Windows Validation

## 1. One-click execution

Extract the project to:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_6_Unified_Viewer_Active_Page_Smooth_Resize
```

Double-click `RUN_NOVAPDF_ALL.cmd` from the project root.

The runner must complete root clean install, audit capture, ESLint, semantic TypeScript, 21 source contracts, 11 PDF-engine tests, production build, backend validation, migration verification, API/worker startup, health checks, 33 routes, and the local sequential two-recipient E2E without deleting Docker volumes.

Expected source-contract result:

```text
All 21 dependency-free source contracts passed.
```

Expected PDF-engine result:

```text
11 PDF-engine tests passed.
```

Expected route result:

```text
33 HTTP routes passed.
```

Audit findings may be captured, but no automatic audit fix may run.

## 2. Shared viewer toolbar on every implemented PDF workspace

Open every implemented PDF workspace that contains shared page/zoom controls.

- Confirm the toolbar is fully visible at the bottom center of the browser viewport.
- Confirm no part of the toolbar is hidden inside a horizontal scrollbar or clipped by a parent toolbar.
- Confirm the visual design matches the Edit PDF bottom toolbar: dark NovaPDF background, page count, zoom, Undo/Redo when available, and page-view control.
- Confirm the toolbar remains usable at 100%, 125%, and 150% browser zoom.
- Confirm the toolbar remains above page content without blocking required right-panel controls.
- Confirm `Ctrl++`, `Ctrl+-`, and `Ctrl+0` work when focus is not inside an input.
- Confirm Page Up, Page Down, Ctrl+Home, and Ctrl+End navigate where pages are available.

## 3. Page-view modes

For Sign PDF, Edit PDF, and each page-grid workspace:

- Select Continuous view.
- Select Single-page view.
- Select Two-page view and confirm two pages are laid out together.
- Select Three-page view and confirm three pages are laid out together on a wide desktop window.
- Resize the browser below 900 px and confirm Three-page view falls back to two columns.
- Resize below 640 px and confirm Two-page and Three-page views fall back to one usable column.
- Confirm the active-page outline follows page selection and page navigation.

## 4. Smooth moving and resizing

In Sign PDF, Edit PDF, and Crop PDF:

- Enable snapping.
- Move an object near page and peer-object anchors; movement may snap and guides/rulers/distances must remain visible.
- Resize near the same anchors; guides may appear, but width and height must follow the pointer smoothly and must not jump to a guide size.
- Hold Shift while dragging a resize handle; the current aspect ratio must remain stable and the scale must change continuously.
- Release Shift during the same drag; free resizing must resume where the tool supports it.
- Confirm minimum-size safety remains, but there is no large artificial size floor.
- Confirm Undo restores the exact pre-drag geometry and Redo reapplies it.

## 5. Edit PDF active-page targeting

Use a PDF with at least three pages and select Three-page view.

- Click page 1, add Text, and confirm it appears on page 1.
- Click page 2, add Highlight, and confirm it appears on page 2.
- Click page 3, add Rectangle or Link, and confirm it appears on page 3.
- Click page 2, choose Image, select a file, and confirm it appears on page 2 even though the file picker temporarily leaves the browser.
- Confirm the selected page receives an active-page outline and `Page X of N` updates.
- Select a highlight, then immediately drag it; movement must begin smoothly without a second click.
- Resize the selected highlight from its bottom-right handle; the hit target must be easy to acquire and resizing must remain smooth.
- Repeat movement and resizing after changing zoom and page-view mode.
- Confirm scrolling while no object is being dragged selects the page nearest the viewport center.
- Export and verify every object remains on its assigned PDF page.

## 6. Sign PDF right-panel flow

- Add enough fields to make the right panel scroll.
- Scroll through field controls to `Output file name`.
- Confirm `Output file name`, helper text, filename input, and `Sign PDF` action are part of the normal scroll flow.
- Confirm they are not pinned or stuck to the panel bottom.
- Complete signing and confirm the ready/download card also appears in normal scroll flow.
- Confirm the filename input and `.pdf` suffix remain clear and usable.

## 7. Regression checks

- `http://localhost:3000/` must open the homepage.
- Every Home icon must return to `/`.
- Complete all previous Sign PDF field, checkbox color, signature clipping, saved-name, export, and keyboard checks.
- Complete the v0.13.4 guide/ruler/distance checks for Sign PDF, Edit PDF, Watermark PDF, and Crop PDF.
- Confirm browser console has no React update-depth, stale-listener, hydration, or portal errors.
- Confirm all visible product copy is US English.

## 8. Backend and release boundary

- Confirm `[X] CreateSignatureRequestBackend1721800000000` is shown.
- Confirm migration run reports no pending migration.
- Retain audit, route, Mailpit, MinIO, PostgreSQL, Redis, health, E2E, and summary logs.
- Complete controlled root security regression before dependency promotion.
- Complete real production email/storage-provider delivery and signed-webhook verification with actual provider credentials.

Request Signatures must remain disabled and not Working until every automated, browser, security, and provider gate passes.
