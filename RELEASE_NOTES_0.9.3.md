# NovaPDF Release Notes 0.9.3

**Release date:** 21 July 2026  
**Milestone:** Build Step 9.3 - Watermark Selection and Keyboard Reliability Fix

## Why this release was required

Version 0.9.2 compiled and its PDF engines passed, but the actual on-thumbnail watermark interaction was not reliable in the user's browser. The embedded HTML `foreignObject` toolbar did not consistently appear, clicking the visible watermark text/image did not provide a dependable full-object hit target, and Arrow-key movement depended too heavily on SVG focus. This release replaces those fragile paths instead of pretending the previous behaviour was complete.

## Fixed

- Added a transparent rectangular SVG hitbox around the complete text/image watermark bounds, so clicking or dragging anywhere on the object selects it reliably.
- Removed the `foreignObject` action toolbar and replaced it with pure SVG Rotate, Duplicate, and Delete controls.
- Added document-level keyboard capture after a watermark is selected, so Arrow keys no longer depend on the page SVG retaining focus.
- Increased normal Arrow movement to 4 PDF points and Shift+Arrow movement to 12 PDF points so a single key press is visible at thumbnail scale.
- A newly loaded PDF starts with no selected object; clicking a watermark now produces an unambiguous selection outline and toolbar.
- Visible text/image artwork no longer intercepts pointer events separately from the larger object hitbox.

## Preserved

- **All affected pages** linked movement, rotation, duplication, and deletion.
- **This page only** independent object editing.
- Text and image watermark engines, multiple objects, custom range, preview/output coordinate model, rotated pages, and compatible-file transfer.
- All eight working engines, all 32 root routes, existing design, category navigation, v0.4.10 zoom behaviour, and `allowedDevOrigins`.

## Verified

- Clean interaction-contract source test passed.
- Pure SVG hitbox, toolbar actions, and document-level Arrow movement passed an isolated Chromium smoke test.
- Text/image watermark engine tests passed, including multi-object, page-specific, free-position, and rotated-page cases.
- Page Numbers PDF parity tests passed for all six positions.
- ESLint, TypeScript, and Next.js production build passed; 36 static pages were generated.
- npm audit reported 0 vulnerabilities.

## Remaining manual check

The packaging environment blocks direct browser navigation to the local NovaPDF server. The full PDF-thumbnail click, toolbar, and keyboard workflow must still be confirmed once in the user's normal Windows Chrome. Unlike 0.9.2, this release no longer relies on `foreignObject` or SVG-only focus for those interactions.
