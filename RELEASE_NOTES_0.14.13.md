# NovaPDF 0.14.14 — Searchable Preserve-Layout OCR

## Added

- OCR can be enabled while `Preserve layout` is selected.
- Scanned pages use Tesseract OCR and keep the original page image as the visible layer.
- Digital pages use native PDF text for the searchable layer instead of unnecessary OCR.
- Searchable text is stored as a hidden Word run in the same page paragraph, preventing visual reflow.

## Preserved

- Editable-text conversion and OCR behavior.
- PDFium rendering, English/Bangla OCR, DOCX validation, converter proxy, Windows launchers, stable Compose volumes, and frozen Step 12.8 backend.
