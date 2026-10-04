# NovaPDF 0.14.5 Release Notes

## Fixed

- Corrected two semantic TypeScript errors in `src/components/edit-pdf-workspace.tsx`.
- Edit PDF preview cleanup now destroys the typed PDF.js loading task instead of calling an undeclared method on `PDFDocumentProxy`.

## Preserved

Service-backed PDF to Word, Preserve layout, Editable text, English/Bangla OCR, page ranges, separate/combined downloads, same-origin proxying, offline recovery, all 32 tools, 33 routes, NovaPDF UX, Step 12.8 backend, and the deferred Request Signatures boundary.
