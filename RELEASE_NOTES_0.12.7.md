# NovaPDF 0.12.7 - Sign PDF Core Stabilization

## Summary

This corrective release stabilizes the existing browser-local Sign PDF editor. It does not add the Request Signatures backend.

## Sign PDF improvements

- Lazy high-resolution PNG rendering for the active page and nearby pages.
- Main canvas is the authoritative scroll controller; thumbnail clicks navigate directly and thumbnail auto-scroll no longer changes the active page.
- Transparent safety padding prevents typed/drawn signature edge clipping.
- Content-aware minimum sizes protect Name, Date, Text, Initials, and Input values from being resized inside their text.
- Rotation-aware resize calculations remove reverse/opposite resize behaviour.
- Pointer-offset dragging prevents fields from jumping when movement starts.
- Removed the right-side Selected Text settings card.
- Added a floating inline editor on the document for text-like fields.
- Text/Input/Name/Date fields expose Edit and Colour; all fields expose Rotate, Duplicate, and Delete.
- Text and Input can be clicked or dragged from the right panel to any visible page.
- Input fields retain a border, accept editable content, and export fitted text.
- Palette Add and Edit actions are now separate valid controls.

## Preview and output quality

- PDF workspace snapshots use lossless PNG instead of lossy JPEG where they are only previews.
- Merge, Split, Organize, Crop, Rotate, Watermark, Page Numbers, Sign, and Preserve Quality workflows keep their existing vector-preserving PDF output paths.
- Compress PDF Balanced/Strong and PDF to JPG remain intentionally raster workflows and are not described as lossless.

## Tests

- All TypeScript/TSX source files passed syntax transpilation.
- Step 12.6 and Step 12.7 Sign PDF interaction contracts passed.
- A dependency-network outage prevented a clean container installation, ESLint, full semantic TypeScript, production build, npm audit, and engine-output regression reruns. Run the Windows commands in the handoff before treating this release as production-confirmed.
- The Windows self-signing test runner was corrected to avoid `spawnSync npx.cmd EINVAL`.
