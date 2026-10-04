# NovaPDF Master Project Handoff v0.14.14

## Current release

NovaPDF v0.14.14 adds **Editable Layout Reconstruction (Beta)** to PDF to Word while preserving all v0.14.13 searchable-layout OCR behavior and v0.14.12 Windows stability corrections.

## PDF-to-Word modes

- `visual`: rendered page image, with optional hidden searchable OCR/native text.
- `hybrid`: rendered artwork cleaned of recognized text, plus visible positioned editable Word text boxes.
- `editable`: normal reading-flow paragraphs generated from native text or OCR.

## Hybrid architecture

1. PDFium renders each page and extracts native character geometry/style.
2. Tesseract optionally identifies image-only text with bounding boxes.
3. OCR blocks overlapping native blocks are deduplicated.
4. OpenCV builds and inpaints a text mask in the rendered artwork.
5. `python-docx` embeds the cleaned page artwork.
6. Word VML text boxes are overlaid at page coordinates with visible editable text.

## Non-negotiable boundary

The mode cannot restore original chart data, formulas, vector paths, or every native table/form object from an arbitrary PDF. Keep the UI limitation text and Beta label.

## Frozen areas

- Step 12.8 backend remains byte-identical.
- Request Signatures remains disabled until the final major feature.
- Docker volumes must not be deleted.
- Do not use forced audit remediation.
- Keep exact Next.js allowed development origins.

## Next recommended feature

After Windows acceptance of v0.14.14, continue the regular tools roadmap with PDF to PowerPoint as a functional end-to-end tool. Do not start Request Signatures yet.
