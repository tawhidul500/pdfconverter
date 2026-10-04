# NovaPDF 0.11.0 - Build Step 11

## Real Crop PDF

Crop PDF is now a real browser-local engine and dedicated full-screen workspace.

### Added

- One-PDF upload with real page thumbnails.
- Large single-page crop editor with draggable crop rectangle and eight resize handles.
- Exact top, right, bottom, and left margin controls in PDF points.
- Full page, Small, Medium, and Large margin presets.
- Free, Original, A4, Letter, and Square aspect-ratio modes.
- Apply crop to Current page, Selected pages, All pages, Odd pages, Even pages, or a Custom range.
- Target-aware thumbnail ticks and live shaded crop previews.
- Proportional crop-area transfer across pages with different dimensions and rotations.
- Browser-local output using pdf-lib with MediaBox, CropBox, BleedBox, TrimBox, and ArtBox synchronized.
- Generated cropped PDF handoff to compatible PDF tools.

### Preserved

- All previous nine working engines.
- All 32 root-level routes and catalog cards.
- Existing NovaPDF design, workspace rail, right settings panel, clean thumbnails, and v0.4.10 zoom behavior.
- `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Public npm registry URLs only.

### Validation

- Clean install and npm audit: passed, 0 vulnerabilities.
- ESLint and TypeScript: passed.
- Production build: passed, 36 static pages.
- Crop engine tests: passed for selective pages, crop/media boxes, 0/90/180/270 degree source rotations, page count, and page order.
- Generated crop outputs rendered and visually inspected.
