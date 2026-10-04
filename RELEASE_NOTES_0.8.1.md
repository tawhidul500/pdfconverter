# NovaPDF Release Notes 0.8.1

## Complete All-Tools Catalog and Page Numbers Visibility Fix

This maintenance release is based on NovaPDF 0.8.0. It does not remove or alter any completed processing engine.

### Added to the public Tools catalog and workspace rail

- Merge PDF
- Split PDF
- Compress PDF
- PDF to Word
- PDF to PowerPoint
- PDF to Excel
- Word to PDF
- PowerPoint to PDF
- Excel to PDF
- Edit PDF
- PDF to JPG
- JPG to PDF
- Sign PDF
- Watermark PDF
- Rotate PDF
- HTML to PDF
- Unlock PDF
- Protect PDF
- Organize PDF
- PDF to PDF/A
- Repair PDF
- Page Numbers PDF
- Scan to PDF
- OCR PDF
- Compare PDF
- Redact PDF
- Crop PDF
- PDF Forms
- AI Summarizer
- Translate PDF
- PDF to Markdown
- Create a Workflow

### Changed

- Page Numbers PDF is now explicitly visible in the All Tools catalog and tool rail.
- Tool categories now use: All, Workflows, Organize PDF, Optimize PDF, Convert PDF, Edit PDF, PDF Security, and PDF Intelligence.
- All unimplemented tools have generated direct routes and open their existing browser-local placeholder workspace.
- Coming-soon tools are clearly marked `Soon`; completed tools retain their functional workspaces.
- The main navigation label now reads `All PDF Tools`.

### Retained

- Real Merge, Split, Organize, Compress, JPG to PDF, PDF to JPG, and Page Numbers PDF engines.
- Clean canvas thumbnails and detailed right-side panels.
- Tool-to-tool file transfer behavior.
- `allowedDevOrigins` for `172.24.48.1` and `172.21.32.1`.
- Approved v0.4.10 zoom behavior.

### Verification

- ESLint passed.
- TypeScript and Next.js production build passed.
- All 32 tool routes returned HTTP 200.
- The required screenshot tool list was checked: 32 of 32 entries are present.
