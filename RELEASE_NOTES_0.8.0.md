# NovaPDF Release Notes 0.8.0

## Build Step 8 - Real Page Numbers PDF

This release is based on NovaPDF 0.7.0 and keeps the approved v0.4.10 zoom behaviour.

### Added

- Real browser-based Page Numbers PDF tool at `/page-numbers-pdf`
- Real PDF page thumbnails using PDF.js
- Live page-number placement preview on every numbered thumbnail
- Six positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
- All-pages and custom From/To page ranges
- Configurable starting number
- Number-only, `Page 1`, and `1 / N` formats
- Font sizes from 8 to 36 pt
- Edge margins from 12 to 72 pt
- Regular and bold Helvetica styles
- Black, gray, and teal page-number colors
- Custom output filename
- Browser-local PDF generation using pdf-lib
- Shared result/download card
- Generated numbered PDF handoff to compatible PDF tools
- `sample-page-numbers-output.pdf` verification fixture

### Retained

- Clean visual-only canvas thumbnails; file metadata remains in the right panel
- Full-screen workspace, tool rail, mobile controls, Start over, homepage clear, and direct routes
- Existing Merge, Split, Organize, Compress, JPG to PDF, and PDF to JPG tools
- `allowedDevOrigins` fix for `172.24.48.1` and `172.21.32.1`

### Limits

- One PDF per numbering job
- Maximum 50 MB
- Maximum 300 pages
- Password-protected PDFs must be unlocked first
- Standard Helvetica fonts are used in this browser build
