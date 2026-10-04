# NovaPDF Release Notes 0.11.4

**Release:** NovaPDF_Build_Step_11_4  
**Type:** Crop defaults/tick visibility and Watermark page-specific text correction

## Fixed

- Changed Crop PDF's default aspect ratio from **Free** to **Original** on first load, replacement upload, Start over, and full workspace reset.
- Made Crop PDF targeted pages use the selected visual class, so the green tick remains visible in Selected, Current, All, Odd, Even, and Custom range modes.
- Corrected Watermark PDF's **Edit text** behavior: **All pages** changes every affected text watermark, while **This page only** changes only the active page's independent text watermark.
- Added per-object text content to the Watermark engine and preview model so page-specific text is preserved in both thumbnails and the downloaded PDF.
- Kept image-watermark scope behavior unchanged.

## Preserved

- All ten working engines and all 32 root routes.
- Crop PDF free-form per-page rectangles, aspect presets, and focused editor behavior.
- Watermark positioning, image support, object actions, keyboard controls, and shared Undo/Redo/Zoom toolbar.
- Existing NovaPDF design, file-transfer rules, clean thumbnails, `allowedDevOrigins`, public npm registry URLs, and v0.4.10 zoom behavior.

## Validation

- Clean `npm ci` completed and npm audit reported 0 vulnerabilities.
- ESLint, TypeScript, and the Next.js production build passed.
- Static generation completed for 36 pages.
- Homepage and all 32 root tool routes returned HTTP 200.
- All existing engine and interaction-contract tests passed.
- The new Step 11.4 test confirmed Crop defaults/tick source contracts and verified separate text extraction for global and page-specific Watermark output.
