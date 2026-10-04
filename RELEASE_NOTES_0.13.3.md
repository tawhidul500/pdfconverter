# NovaPDF 0.13.3 Release Notes

NovaPDF 0.13.3 continues from the actual v0.13.2 source. It does not begin Request Signatures UI integration and does not alter the Step 12.8 backend.

## Shared PDF workspace improvements

- Rebuilt the shared PDF viewer controls as a compact bottom-center NovaPDF bar with:
  - current page and total page count;
  - page selection;
  - zoom out, percentage menu, and zoom in;
  - continuous, single-page, and grid page views;
  - current-page tracking while scrolling;
  - Page Up, Page Down, Ctrl/Cmd+Home, Ctrl/Cmd+End, Ctrl/Cmd+Plus, Ctrl/Cmd+Minus, and Ctrl/Cmd+0 shortcuts.
- Kept Undo and Redo beside the viewer bar when the active tool supports history.
- Prevented hidden inactive workspaces from registering viewer keyboard handlers or changing the active page-view mode.
- Removed session history truncation so Undo can return to the first recorded state after a file is loaded.
- Expanded tool-appropriate keyboard coverage across all implemented PDF workspaces, including Open, Save/Process, Undo, Redo, Delete, selection, movement, and page navigation where applicable.

## Homepage routing correction

- `http://localhost:3000/` now opens the NovaPDF homepage instead of Edit PDF.
- The header brand and workspace Home action return to `/` and reset mounted workspace state.
- A built tool workspace opens only after the user selects a tool or visits that tool route directly.

## Sign PDF checkbox controls

- Checkbox tick color is configurable.
- Box background color is configurable.
- Box stroke color and stroke width are configurable.
- Tick size is configurable while retaining its original aspect ratio.
- The checkbox field itself resizes proportionally as a square and exports with the same visual settings.

## Edit PDF interaction alignment

- Edit PDF objects use the same visible drag area and bottom-right resize handle pattern as Sign PDF.
- Moving objects displays live horizontal and vertical alignment guides.
- Snapping includes page anchors and nearby object centers and edges.
- Snap can be enabled or disabled in the right-side controls.
- Delete, copy, cut, paste, duplicate, layer movement, arrow movement, Shift+Arrow movement, and Alt+Arrow resizing are supported.

## Validation status

- All 18 dependency-free source contracts pass.
- The new Step 13.3 contract passes 91 checks.
- All 90 TypeScript/TSX source and test files pass syntax transpilation.
- The 32-tool and 33-route manifest remains intact.
- The complete backend remains unchanged from v0.13.2.

The packaging environment could not complete dependency installation because its npm gateway did not contain one required public package tarball. Windows dependency-backed lint, semantic TypeScript, PDF-engine tests, build, live routes, backend runtime, and manual browser acceptance remain required.
