# NovaPDF Release Notes 0.9.0

## Added

- Real browser-local Watermark PDF engine at `/watermark-pdf`.
- Dedicated full-screen workspace using the existing NovaPDF rail, canvas, right settings panel, result card, Start over, logo reset, and file-transfer system.
- Real PDF.js thumbnails and live watermark overlays.
- Text, font size, regular/bold Helvetica, six preset colours, custom colour picker, opacity, rotation, nine placement presets, edge offset, all-pages/custom range, and output filename controls.
- Rotation-aware placement for source pages rotated 0, 90, 180, and 270 degrees.
- Automated watermark engine test fixture and generated sample output.

## Preserved

- Existing NovaPDF design, colours, spacing, layout, and component styling.
- All seven previously working engines.
- All 32 tool cards, categories, root routes, category submenu entries, and placeholder labels.
- Homepage Edit PDF default and grouped overlay picker.
- Desktop hover and mobile/touch tap category navigation.
- Tool-specific right panel, clean-thumbnail policy, transfer behaviour, Start over, logo reset, `allowedDevOrigins`, and v0.4.10 zoom behaviour.

## Current limitations

- Text watermarking is implemented; image/logo and tiled watermark modes remain planned.
- The browser build uses standard Helvetica fonts and supports standard Latin watermark text.
- Password-protected PDFs must be unlocked first.

## Verification

- v0.8.3 baseline `npm ci`, ESLint, TypeScript, production build, route checks, and npm audit passed before coding.
- Final ESLint and TypeScript passed.
- Final Next.js production build generated 36 static pages.
- npm audit reported 0 vulnerabilities.
- Watermark output preserved page count, dimensions, crop boxes, and rotations.
- Custom-range render comparison changed only selected pages.
- Normal and rotated output PDFs were rendered and visually inspected.
