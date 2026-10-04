# NovaPDF Release Notes 0.9.2

**Release date:** 20 July 2026  
**Milestone:** Build Step 9.2 - Watermark Object Editing and Coordinate Parity Refinement

## Added

- Outside-click dismissal for click-pinned workspace category submenus.
- Selectable text and image watermark objects in the page thumbnails.
- On-object Rotate, Duplicate, and Delete controls.
- Arrow-key movement by 1 PDF point and Shift+Arrow movement by 5 PDF points.
- **All affected pages** scope for linked changes across the selected output range.
- **This page only** scope for independent per-page move, rotation, duplication, and deletion.
- Multiple watermark objects with global or page-specific scope.
- Keyboard shortcuts: Delete/Backspace to remove, Ctrl/Cmd+D to duplicate, and Escape to deselect.

## Fixed

- A click-pinned category submenu no longer remains over the workspace after the user clicks elsewhere.
- Watermark preview and generated-PDF placement now use the same page-point coordinate model, rotated bounding boxes, crop-box offsets, page rotations, and standard-font metrics.
- Page Numbers PDF preview and generated output now use the same standard-font bounding metrics and six-position geometry.
- Free-position text/image watermarks retain consistent normalized placement across different page sizes and rotations.

## Preserved

- Existing NovaPDF design, colours, spacing, control panels, thumbnail fitting, and workspace structure.
- Desktop category hover handoff, category-relative submenu positioning, and mobile/touch tap interaction.
- All eight working browser-local engines and all 32 root routes.
- Compatible-file transfer, Start over, home clear, clean-thumbnail policy, v0.4.10 zoom, and `allowedDevOrigins`.

## Verified

- Clean dependency installation and npm audit: 0 vulnerabilities.
- ESLint and TypeScript passed.
- Next.js production build generated 36 static pages.
- All 32 root tool routes returned HTTP 200 from the production server.
- Text/image watermark tests passed for shared objects, page-specific objects, duplicates, hidden pages, free position, custom ranges, and 90/180/270-degree source rotations.
- Page Numbers PDF engine tests passed for all six positions and rotated source pages.
- Page count, page dimensions, crop boxes, page rotations, and source content were preserved.
- Generated text/image watermark and page-number PDFs were rendered and visually inspected.

## Environment limitation

Automated Chromium access to localhost is blocked by administrator policy in the packaging environment (`ERR_BLOCKED_BY_ADMINISTRATOR`). The included Windows checklist is required for final mouse, outside-click, toolbar, keyboard, and per-page interaction confirmation.
