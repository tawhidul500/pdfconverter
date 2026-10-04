# NovaPDF Release Notes 0.7.0

## Build Step 7 - Real PDF to JPG

This release is based on NovaPDF 0.6.2 and keeps the approved v0.4.10 zoom behaviour.

### Added

- Real browser-based PDF to JPG conversion at `/pdf-to-jpg`
- Real PDF page thumbnails using PDF.js
- All pages selected by default with visible tick marks
- Select All, Clear, and click-to-toggle page selection
- Smaller, Standard, and High JPG quality modes
- Standard, High, and Very High resolution modes
- Individual JPG downloads
- Download All as ZIP using JSZip
- Output filename prefix
- Progress reporting
- Tool-to-tool handoff for source PDFs and generated JPG files
- Generic result-card download labels for PDFs, JPGs, and ZIPs

### Development origin fix

`next.config.ts` now allows these local development origins:

- `172.24.48.1`
- `172.21.32.1`

This prevents Next.js development resources such as `__nextjs_font/geist-latin.woff2` from being blocked when the website is opened through those local network hosts. The development server must be restarted after this configuration changes.

### Limits

- One PDF per conversion
- Maximum 50 MB
- Maximum 200 pages
- Password-protected PDFs must be unlocked first
- Very High resolution and large page counts can use substantial browser memory
