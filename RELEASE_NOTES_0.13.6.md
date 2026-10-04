# NovaPDF 0.13.6 Release Notes

## Unified viewer toolbar

- Renders the shared PDF page/zoom/view toolbar through a `document.body` portal.
- Prevents transformed, fixed, or horizontally scrollable parent toolbars from clipping the shared viewer.
- Uses the same NovaPDF bottom-center toolbar across every implemented workspace that exposes shared PDF controls.
- Adds Continuous, Single-page, Two-page, and Three-page views.
- Keeps page selection, total pages, zoom, Undo, and Redo in one compact US English interface.

## Smooth interaction corrections

- Resize alignment guides are now visual feedback only in Edit PDF and Sign PDF.
- Crop PDF applies snapping to movement, not to resize dimensions.
- Aspect-ratio locking uses continuous vector projection instead of abrupt dominant-axis selection.
- `Shift + drag` continues to preserve the current aspect ratio without forcing an object toward a guide size.
- Moving objects can still snap to page and peer-object anchors when snapping is enabled.

## Edit PDF active-page and selection corrections

- Clicking a page makes it the explicit active insertion target.
- New text, highlight, shape, link, drawing, and image objects are assigned to the active page.
- Image selection dialogs retain the page that was active when the dialog opened.
- Three-page view no longer sends newly added objects to the last page by default.
- Pointer listeners stay stable while selected objects move or resize.
- Highlight and small-object resize handles have a larger transparent hit area.
- Document-to-page navigation centers both vertically and horizontally in multi-page layouts.

## Sign PDF panel flow

- Output file naming, signing action, and completed download result now scroll naturally with the right panel.
- The output controls are no longer pinned to the bottom of the panel.

## Preserved boundaries

- All 32 tools and 33 routes remain registered.
- The Step 12.8 backend is unchanged.
- Docker volumes are preserved by the one-click runner.
- Request Signatures remains disabled and is not Working.
- Step 12.9 has not started.
