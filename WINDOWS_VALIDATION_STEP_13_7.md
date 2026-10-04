# NovaPDF Step 13.7 Windows Validation

## 1. One-click execution

Extract the project to:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_7_Viewer_Visibility_Duplicate_Portal_Corrective
```

Double-click `RUN_NOVAPDF_ALL.cmd` from the project root.

The runner must complete root clean install, audit capture, ESLint, semantic TypeScript, 22 source contracts, 11 PDF-engine tests, production build, backend validation, migration verification, API/worker startup, health checks, 33 routes, and the local sequential two-recipient E2E without deleting Docker volumes.

Expected source-contract result:

```text
All 22 dependency-free source contracts passed.
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

## 2. Upload-screen viewer visibility — every PDF tool

Open each implemented PDF tool directly from a fresh browser tab before uploading a file.

- Confirm no floating page/zoom/view toolbar is visible on the upload screen.
- Confirm there is no dark control, shadow spot, blurred halo, or empty toolbar placeholder at the bottom center.
- Confirm browser DevTools returns `0` for:

```js
document.querySelectorAll(".workspace-bottom-controls").length
```

- Repeat after navigating between tools from the left rail without uploading.
- Repeat after returning to the homepage and opening another tool.

For generic/planned workspaces, accept a valid file.

- Confirm the viewer appears only for the currently active tool after the file is accepted.
- Confirm DevTools returns exactly `1` for `.workspace-bottom-controls`.
- Click Start over and confirm the count returns to `0`.

## 3. Loaded-workspace viewer appearance

For Edit PDF, Sign PDF, and at least three other implemented tools:

- Upload a valid file and confirm one bottom-center toolbar appears.
- Confirm there is no duplicate dark bar behind it.
- Confirm there is no oversized grey/teal shadow spot or blurred background patch.
- Confirm the single restrained shadow follows the toolbar outline.
- Confirm page number, zoom, Undo/Redo where supported, and page-view control remain usable.
- Confirm Continuous, Single-page, Two-page, and Three-page views still work.
- Confirm switching tools does not leave the previous tool's portal behind.
- Confirm Start over or clearing all files removes the toolbar.

## 4. Portal lifecycle regression

With DevTools open:

1. Upload a PDF in Edit PDF and confirm one viewer.
2. Switch to Sign PDF without uploading and confirm zero viewers.
3. Upload a PDF in Sign PDF and confirm one viewer.
4. Switch to a generic tool with no files and confirm zero viewers.
5. Add a file to that generic tool and confirm one viewer.
6. Switch back to Edit PDF and confirm only Edit PDF's retained document viewer is visible.

At no point may the DOM contain more than one `.workspace-bottom-controls` element.

## 5. Preserved v0.13.6 interaction checks

- Verify all four page-view modes.
- Verify active-page targeting in Edit PDF Three-page view.
- Verify selected highlight movement and resizing remain smooth.
- Verify resize guides do not force dimensions to snap.
- Verify `Shift + drag` preserves aspect ratio smoothly.
- Verify Sign PDF output controls scroll normally in the right panel.
- Verify `Ctrl++`, `Ctrl+-`, `Ctrl+0`, Page Up, Page Down, Ctrl+Home, and Ctrl+End.

## 6. Homepage and route regression

- `http://localhost:3000/` must open the homepage.
- Every Home icon must return to `/`.
- No floating viewer may remain on the homepage.
- All 33 routes must pass.
- Browser console must contain no hydration, portal, update-depth, or stale-listener errors.
- All visible product copy must remain US English.

## 7. Backend and release boundary

- Confirm `[X] CreateSignatureRequestBackend1721800000000` is shown.
- Confirm migration run reports no pending migration.
- Retain audit, route, Mailpit, MinIO, PostgreSQL, Redis, health, E2E, and summary logs.
- Complete controlled root security regression before dependency promotion.
- Complete real production email/storage-provider delivery and signed-webhook verification with actual provider credentials.

Request Signatures must remain disabled and not Working until every automated, browser, security, and provider gate passes.
