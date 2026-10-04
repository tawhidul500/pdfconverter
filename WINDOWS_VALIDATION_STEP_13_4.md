# NovaPDF Step 13.4 Windows Validation

## 1. One-click execution

Extract the project to:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_4_Shared_Guides_Aspect_Resize
```

Double-click `RUN_NOVAPDF_ALL.cmd` from the project root.

The runner must automatically:

1. verify Node.js, npm, PowerShell, Docker CLI, and Docker Desktop;
2. start PostgreSQL, Redis, MinIO, and Mailpit without deleting volumes;
3. preserve an existing `backend\.env`;
4. enforce `https://registry.npmjs.org/` for project installs;
5. run root clean install, audit capture, lint, semantic TypeScript, 19 source contracts, 11 PDF-engine tests, and production build;
6. create a fresh backend public-registry lock and run clean install, audit, lint, typecheck, build, unit tests, and metadata test;
7. verify `[X] CreateSignatureRequestBackend1721800000000` and no pending migration;
8. open separate Web, API, and Worker CMD windows;
9. verify API live/ready, all 33 HTTP routes, and the real local sequential two-recipient E2E;
10. open the homepage, Sign PDF, Edit PDF, Watermark PDF, Crop PDF, API docs, Mailpit, MinIO Console, and this checklist.

Expected source-contract result:

```text
All 19 dependency-free source contracts passed.
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

## 2. Shared ruler and distance overlay

Complete these checks in Sign PDF, Edit PDF, Watermark PDF, and Crop PDF:

- Start moving a selected object or crop area.
- Confirm teal horizontal/vertical alignment lines appear when an edge or center approaches a page or peer-object anchor.
- Confirm the overlay shows live left, right, top, and bottom distances in points.
- Confirm the overlay shows live width and height.
- Confirm labels stay readable at 50%, 100%, and 200% zoom.
- Confirm the overlay never blocks pointer interaction.
- Confirm the overlay disappears after pointer release, pointer cancel, Undo, Start over, or tool change.
- Disable snapping in the right panel and confirm measurement rulers remain visible while snap alignment lines no longer pull the object.
- Re-enable snapping and confirm page-edge, page-center, common 10%/90%, and peer-object edge/center anchors work.

## 3. Shift-drag proportional resize

### Sign PDF

- Add Date, Name, Initials, Signature, Text, Input, Checkbox, and Company stamp fields.
- Resize each field normally and confirm free resize remains available where appropriate.
- Hold Shift while dragging each resize handle and confirm its current width-to-height ratio remains constant.
- Confirm Signature, uploaded Initials, Checkbox, and Company stamp remain proportional without Shift as before.
- Confirm the live width/height label preserves the same ratio while Shift is held.
- Undo to the inserted state and Redo to the final resized state.
- Export and compare the final field dimensions and placement.

### Edit PDF

- Add Text, Image, Rectangle, Ellipse, Line, Highlight, Underline, Link, and Freehand objects.
- Resize each object normally.
- Hold Shift while resizing each object and confirm the starting aspect ratio is preserved.
- Confirm images remain proportional without Shift.
- Confirm rotated objects preserve the ratio in their local resize direction.
- Undo and Redo all resize changes, then export and compare.

### Crop PDF

- Open a page in the focused crop editor.
- Test all eight crop handles.
- Hold Shift while resizing from each handle and confirm the current crop ratio stays constant.
- Confirm the opposite edge/corner remains anchored and the crop area stays inside the page.
- Test Shift resize in Free, Original, A4, Letter, and Square modes.
- Confirm live top/right/bottom/left distances match the Exact margins shown in the right panel.
- Export pages with normal and rotated source pages and compare output crop boxes.

## 4. Watermark movement

- Add at least two text watermarks and one image watermark on the same page.
- Grab each watermark away from its center and confirm it does not jump under the pointer.
- Snap left/center/right and top/middle/bottom anchors to the page and to another watermark.
- Confirm rulers and distances update while moving.
- Disable and re-enable snapping.
- Verify Arrow and Shift+Arrow movement, Undo/Redo, duplicate, delete, All pages scope, and This page only scope.
- Export and compare object positions and rotations.

## 5. Preserved regression gates

Re-run the complete v0.13.3 checklist:

- homepage and Home routing;
- bottom page/zoom/view controls;
- full-session Undo/Redo and keyboard coverage;
- Sign PDF checkbox styling and export;
- Edit PDF objects, layers, links, colors, opacity, and export;
- v0.13.1 Sign PDF tiny resize, editor actions, filename UI, unclipped signatures, saved signer name, US date formatting, file transfer, Start over, and home reset.

## 6. Backend and production boundary

- Confirm the backend migration is applied and no migration is pending.
- Confirm API and worker remain healthy during the sequential two-recipient local E2E.
- Retain Mailpit, MinIO, PostgreSQL, Redis, route, audit, and summary logs.
- Complete a controlled root security regression before dependency promotion.
- Complete real production email/storage provider delivery and signed webhook verification using actual provider credentials.

Request Signatures must remain disabled and not Working until every local, browser, security, and production-provider gate passes.
