# NovaPDF 0.13.4 Release Notes

NovaPDF 0.13.4 continues from the actual v0.13.3 source. It does not begin Request Signatures UI integration and does not alter the Step 12.8 backend.

## Shared interactive-canvas guidance

- Added one shared geometry layer for page/object snapping, proportional resize constraints, and interaction measurements.
- Added a reusable SVG overlay that displays:
  - vertical and horizontal alignment guides;
  - live left, right, top, and bottom distances in PDF points;
  - live object or crop-area width and height.
- Applied the shared behavior to every implemented workspace with direct canvas movement or resizing:
  - Sign PDF;
  - Edit PDF;
  - Watermark PDF;
  - Crop PDF.

## Shift-drag aspect-ratio resize

- Sign PDF: holding Shift while dragging the resize handle preserves the selected field's current aspect ratio. Signature, initials-image, checkbox, and stamp fields retain their existing default proportional behavior.
- Edit PDF: holding Shift while resizing preserves the current aspect ratio for text, shapes, lines, highlights, underlines, freehand objects, links, and images. Images remain proportional by default.
- Crop PDF: holding Shift while dragging any of the eight resize handles temporarily preserves the crop area's current aspect ratio while keeping the opposite edge/corner anchored.

## Tool-specific refinements

- Sign PDF now snaps object left/center/right and top/middle/bottom anchors to page and peer-object anchors instead of checking centers only.
- Edit PDF uses the same shared edge/center snapping and live measurement overlay as Sign PDF.
- Watermark PDF now preserves the original grab offset, snaps to page and peer-watermark anchors, and shows live alignment rulers and distances while dragging.
- Crop PDF now snaps the movable crop area to page anchors and shows live crop margins and dimensions while moving or resizing.
- All new visible website text is written for a US English audience and follows the existing NovaPDF design system.

## Validation status

- All 19 dependency-free source contracts pass.
- The new Step 13.4 contract passes 57 checks.
- All 92 TypeScript/TSX source and test files pass syntax transpilation.
- The 32-tool and 33-route manifest remains intact.
- The complete backend remains unchanged from v0.13.3.

Dependency-backed Windows install, lint, semantic TypeScript, PDF-engine tests, production build, live routes, backend runtime/E2E, and manual Chrome acceptance remain mandatory.
