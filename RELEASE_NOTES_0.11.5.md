# NovaPDF Release Notes 0.11.5

**Release:** NovaPDF_Build_Step_11_5  
**Type:** Crop exact-margin default and Watermark scope-style correction

## Fixed

- Changed Crop PDF's initial crop rectangle from a 5% inset to the complete original page, so Top, Right, Bottom, and Left Exact margins all start at `0`.
- Made the Watermark right-panel position preset and rotation controls obey **All pages** versus **This page only**.
- Made text font size, Regular/Bold, colour, opacity, and edge offset scope-aware.
- Made image width, opacity, edge offset, position, and rotation scope-aware.
- Added per-object Watermark style overrides to the real PDF output engine, not only the thumbnail preview.

## Scope rules

- **All pages:** the selected setting is written to every affected text/image watermark object.
- **This page only:** an independent active-page object is created or selected, and only that object's setting changes.
- Document-level settings such as PDF page range and output filename remain document-level by design.

## Preserved

- All ten working engines and all 32 root routes.
- Watermark page-specific text, image support, focused editor, object actions, keyboard controls, and Undo/Redo/Zoom toolbar.
- Crop PDF Original/A4/Letter/Square presets, Free-form per-page rectangles, target modes, and focused editor.
- Existing design, transfer rules, public npm registry URLs, approved `allowedDevOrigins`, and v0.4.10 zoom behavior.

## Validation

- Clean dependency installation and npm audit completed with 0 vulnerabilities.
- ESLint, TypeScript, and the Next.js production build passed.
- All existing engine and interaction-contract tests passed.
- The Step 11.5 test verified zero Crop margins, per-object Watermark style contracts, and independent page-specific font sizes in the generated PDF.
