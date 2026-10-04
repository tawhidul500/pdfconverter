# NovaPDF Release Notes 0.10.1

**Release date:** 21 July 2026  
**Release type:** Rotate and Watermark usability refinement

## Rotate PDF

- Active thumbnail ticks now reflect the current targeting mode.
- **Selected** shows the user’s manual page selection.
- **All pages** ticks every page.
- **Odd pages** ticks pages 1, 3, 5, and so on.
- **Even pages** ticks pages 2, 4, 6, and so on.
- **Custom range** ticks exactly the validated From/To pages in every source PDF.
- Manual selections are retained when switching away from and back to Selected mode.

## Watermark PDF

- Clicking a watermark from grid view opens that specific page in a large focused editor.
- The focused view provides larger Rotate, Duplicate, and Delete controls.
- Added Back to grid, previous/next page navigation, Escape-to-grid, and outside-canvas dismissal.
- Dragging and keyboard movement continue to use the existing object model.
- If all objects are deleted, the preview and right panel now provide a clear add-watermark action.
- Selecting or replacing an image while no watermark objects remain automatically creates a visible image object.
- Fixed duplicate-object creation so one action creates one duplicate.

## Workspace navigation

- Removed the native category tooltip that displayed “Click to keep open” and could cover tool names.
- Existing hover, click-to-pin, outside-click dismissal, category alignment, and mobile tap behaviour remain unchanged.

## Preserved

- All nine working engines
- All 32 routes and tool cards
- Existing NovaPDF design and right-side panels
- Homepage Edit PDF default
- Compatible-file transfer
- v0.4.10 zoom behaviour
- Public npm registry lockfile
- `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`

## Validation

- Clean `npm ci`: passed
- ESLint: passed
- TypeScript: passed
- Production build: passed, 36 static pages
- Homepage and all 32 routes: HTTP 200
- npm audit: 0 vulnerabilities
- Rotate engine and target-mode tests: passed
- Watermark engine and source-contract tests: passed
- Page Numbers parity tests: passed
- Source/package integrity: passed

The packaging environment blocked automated Chromium access to the local full application. Run the included Windows Chrome checklist to confirm the new focused Watermark interaction visually.
