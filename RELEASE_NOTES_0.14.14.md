# NovaPDF v0.14.14 Release Notes

## Feature

Added **Editable layout (Beta)** to PDF to Word.

The converter now supports a hybrid reconstruction pipeline:

- native PDF text extraction with character geometry and styling;
- OCR text detection for scanned or image-only regions;
- duplicate removal where OCR overlaps native text;
- OpenCV inpainting of recognized text pixels in the page artwork;
- visible editable Word text boxes at the original page coordinates;
- retained visual artwork for borders, fills, charts, images, form styling, and complex vectors.

## Editability boundary

Editable: native text, OCR text, headings, labels, table-cell text, and form values reconstructed as positioned Word text boxes.

Visual rather than native Word structures: chart series/source data, table border structure, cell fill objects, images, vector paths, and complex artwork. The appearance is retained in the page artwork, but an arbitrary PDF cannot reliably restore every original authoring object.

## Preserved functionality

- Preserve Layout + hidden searchable OCR/native layer
- Editable reading-flow text
- English, Bangla, and combined OCR
- same-origin converter proxy and offline recovery
- stable Windows runner, process launch, migration, and Docker volume safety
- 32 tools / 33 public routes
- Request Signatures remains deferred
