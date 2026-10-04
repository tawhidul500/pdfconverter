# NovaPDF Step 13.3 Windows Validation

## 1. One-click execution

Extract the project to:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_3_Shared_Controls_Checkbox_Edit_Alignment
```

Then double-click `RUN_NOVAPDF_ALL.cmd` from the project root.

The runner must automatically:

1. verify Node.js, npm, PowerShell, Docker CLI, and Docker Desktop;
2. start PostgreSQL, Redis, MinIO, and Mailpit without deleting volumes;
3. preserve an existing `backend\.env`;
4. enforce `https://registry.npmjs.org/` for project installs;
5. run root clean install, audit capture, lint, semantic TypeScript, 18 source contracts, 11 PDF-engine tests, and production build;
6. create a fresh backend public-registry lock and run clean install, audit, lint, typecheck, build, unit tests, and metadata test;
7. verify `[X] CreateSignatureRequestBackend1721800000000` and no pending migration;
8. open separate Web, API, and Worker CMD windows;
9. verify API live/ready, all 33 HTTP routes, and the real local sequential two-recipient E2E;
10. open the homepage, Sign PDF, Edit PDF, API docs, Mailpit, MinIO Console, and this checklist.

Expected source-contract result:

```text
All 18 dependency-free source contracts passed.
```

Expected PDF-engine result:

```text
11 PDF-engine tests passed.
```

Expected route result:

```text
33 HTTP routes passed.
```

Do not use `docker compose down -v`. Do not use `npm audit fix` or `npm audit fix --force`.

## 2. Homepage and navigation checklist

- Open `http://localhost:3000/` directly in a new Chrome tab.
- Confirm the complete NovaPDF homepage appears. Edit PDF must not open automatically.
- Open Sign PDF, Edit PDF, and at least two other implemented tools.
- Click the left-side Home icon from each tool.
- Confirm the URL becomes exactly `/`, the homepage appears, the page scrolls to the top, and the previous workspace state is reset.
- Click the NovaPDF brand in the header and confirm it returns to `/`.
- Use Chrome Back and Forward and confirm tool routes and the homepage restore correctly.

## 3. Shared bottom viewer checklist

Complete this in Sign PDF, Edit PDF, Merge PDF, Split PDF, Compress PDF, Organize PDF, JPG to PDF, PDF to JPG, Page Numbers, Watermark, Rotate, and Crop:

- Confirm the compact viewer bar is fixed at the bottom center and uses NovaPDF navy/teal styling.
- Confirm it shows `current page / total pages` when pages are loaded.
- Select a page from the page menu and confirm that page becomes active and scrolls into view.
- Scroll through pages and confirm the current page value follows the visible page.
- Confirm Zoom Out, percentage selection, and Zoom In work from 50% through 200%.
- Press Ctrl+Minus, Ctrl+Plus, and Ctrl+0 and confirm zoom changes/reset.
- Press Page Up and Page Down and confirm page navigation.
- Press Ctrl+Home and Ctrl+End and confirm first/last page navigation.
- Cycle the page-view button through Continuous, Single-page, and Grid views.
- Switch tools after changing the view and confirm hidden tools do not change the active tool's viewer mode or intercept shortcuts.

## 4. Undo, Redo, and keyboard checklist

For every implemented tool, perform at least five different changes and then:

- click Undo repeatedly until the first state after file load is restored;
- click Redo repeatedly until the latest state is restored;
- repeat with Ctrl+Z, Ctrl+Shift+Z, and Ctrl+Y;
- confirm a new edit after Undo clears the previous Redo branch;
- confirm Delete/Backspace removes the selected page, object, or item only when that action is valid;
- confirm Ctrl+O opens the file picker;
- confirm Ctrl+S starts the tool's create/export/process action without triggering a browser page save;
- confirm arrow keys perform the tool-appropriate movement, reordering, selection, or page navigation;
- confirm shortcuts do not fire while typing in an input, textarea, or select control.

For Sign PDF, Edit PDF, and Watermark also verify Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D, Escape, and Shift+Arrow behavior.

## 5. Sign PDF checkbox checklist

- Add a checkbox field.
- Change **Check color** and confirm the visible tick updates.
- Change **Box background** and confirm the box fill updates.
- Change **Border color** and **Border width** and confirm the box outline updates.
- Move the **Check size** slider from 35% to 135% and confirm the tick grows/shrinks without distortion.
- Resize the checkbox from the handle and confirm the box remains square while becoming smaller or larger.
- Move it with drag and arrow keys and confirm alignment guides and snapping remain correct.
- Undo every checkbox style, move, and resize change back to the original inserted state, then Redo all changes.
- Export the PDF and confirm tick, fill, border, border width, size, position, and square aspect match the editor.

## 6. Edit PDF movement and alignment checklist

- Add Text, Image, Rectangle, Ellipse, Line, Highlight, Underline, Link, and Freehand objects.
- Drag every object from its visible area.
- Resize every resizable object from the bottom-right handle.
- Confirm images maintain their aspect ratio while resizing.
- Move objects near page 10%, center, and 90% anchors and confirm teal guides appear and the object snaps.
- Align an object to another object's center and edges and confirm guides appear.
- Turn **Snap to page and objects** off and confirm free movement.
- Turn snapping back on and confirm guides return.
- Use Arrow keys and Shift+Arrow to move; use Alt+Arrow to resize.
- Use `[` and `]` to change layer order.
- Use Ctrl+C/X/V/D, Delete, Escape, Undo, and Redo.
- Export and verify all object positions, sizes, rotations, colors, opacity, links, and layer order.

## 7. Preserved Sign PDF corrective checklist

Re-run all v0.13.1 checks: tiny field resizing/export, Edit/Color actions, Done action, output filename UI, no red required star, unclipped typed signatures, restored signer name, US date formatting, file transfer, Start over, home reset, preview neighborhoods, 50–200% zoom, and output export.

## 8. Backend and production boundary

- Confirm the backend migration is applied and no migration is pending.
- Confirm API and worker remain healthy during the sequential two-recipient local E2E.
- Retain Mailpit, MinIO, PostgreSQL, Redis, route, audit, and summary logs.
- Complete a controlled root security regression before dependency promotion.
- Complete real production email/storage provider delivery and signed webhook verification using actual provider credentials.

Request Signatures must remain disabled and not Working until every local, browser, security, and production-provider gate passes.
