# NovaPDF Master Project Handoff v0.14.14

## Current source of truth

NovaPDF v0.14.14 adds searchable OCR to Preserve layout while retaining all v0.14.12 Windows stability corrections.

## PDF to Word modes

- **Editable text, no OCR:** native PDF text is converted into paragraphs.
- **Editable text + OCR:** scanned pages are recognized into editable paragraphs.
- **Preserve layout, no OCR:** each PDF page is rendered as a page image.
- **Preserve layout + OCR:** the page image remains visible; a hidden searchable layer uses native PDF text when available and Tesseract OCR for scanned pages.

## Constraints

- The preserve-layout searchable layer is not free-flow editable text; the visible page remains image-based.
- Keep Request Signatures deferred until the final major feature.
- Preserve Docker volumes and avoid forced audit remediation.
