# Release Notes - NovaPDF 0.6.0

**Release:** Build Step 6 - Real JPG to PDF  
**Date:** 19 July 2026

## Added

- Dedicated full-screen JPG to PDF workspace
- JPG, JPEG, PNG, and WebP input support
- Multiple-image upload with validation and browser-memory limits
- White-background image previews
- Drag-and-drop reordering and arrow controls
- Individual 90-degree image rotation
- Reverse-order control
- A4, Letter, and Auto page sizes
- Auto, Portrait, and Landscape orientation modes
- None, Small, and Large margin presets
- Fit Entire Image and Fill Page modes
- Custom output filename
- Progress, result summary, and full-width download card
- Direct `/jpg-to-pdf` route and active-file transfer integration
- JPG and PDF output test fixtures

## Processing behavior

- PDF creation happens in the browser using `pdf-lib`.
- Images are centered on white pages.
- Fit Entire Image preserves the full image and aspect ratio.
- Fill Page fills the page but can crop edges.
- WebP and rotated images are converted through a browser canvas before PDF embedding.

## Verified

- npm clean installation
- ESLint
- TypeScript
- Next.js production build
- Direct-route HTTP test
- Two-image PDF generation and page-count reopen test
- PDF visual render inspection
- npm audit with 0 known vulnerabilities
