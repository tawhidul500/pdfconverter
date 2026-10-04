# NovaPDF 0.5.0 - Real Compress PDF

## Base version

This release is built directly from NovaPDF v0.4.10. The reverted v0.4.11 vertical-only zoom experiment is not included.

## Added

- Dedicated full-screen Compress PDF workspace
- Multi-PDF compression batches
- First-page PDF previews
- Preserve Quality mode
- Balanced mode
- Strong Compression mode
- Output filename and multi-file prefix controls
- Before/after file-size reporting
- Saved-percentage reporting
- Automatic original-file fallback when recompression is larger
- Shared result and download card design
- Browser progress and error states
- Direct `/compress-pdf` route
- Active-file transfer between Compress and other compatible tools
- Image-heavy compression test PDF

## Limits

- 10 PDFs per batch
- 50 MB per file
- 150 MB total batch size
- 120 pages per browser batch
- Password-protected PDFs require Unlock PDF first
- Balanced and Strong modes rasterize pages

## Verified

- npm installation passed
- ESLint passed
- TypeScript and production build passed
- `/compress-pdf` route generated
- npm audit reported 0 vulnerabilities
