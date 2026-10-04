# Defect Resolution Ledger — Step 14.13

## User limitation

`Preserve layout` automatically disabled OCR, forcing a choice between accurate visual reproduction and recognized text.

## Root cause

The frontend explicitly reset and disabled OCR in visual mode, and the converter visual branch only embedded a page image.

## Resolution

- OCR controls remain enabled in Preserve layout mode.
- The frontend sends `use_ocr=true` for visual conversion.
- Visible output remains the rendered page image.
- Digital pages contribute native PDF text to a hidden searchable Word run.
- Scanned pages contribute Tesseract OCR text to the hidden searchable run.
- Hidden content uses Word `w:vanish`, 1 pt text, and no-proof metadata in the same paragraph as the image.

## Limitation retained intentionally

Preserve-layout visible content remains image-based and is not free-flow editable. Use `Editable text + OCR` when paragraph-level editing is the priority.
