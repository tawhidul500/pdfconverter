# NovaPDF v0.14.16 Release Notes

## Editable Layout Object Parity Corrective

This release is a focused corrective built directly on v0.14.15. It does not rebuild the project or alter unrelated engines/routes.

## Fixed

### Duplicate original PDF behind editable content

The previous native-object pipeline attempted to detach reconstructed PDFium page objects before rendering a full-page fallback. Content nested inside Form XObjects could survive that detachment, leaving the original PDF visible behind editable text, tables, shapes, and pictures.

v0.14.16 no longer inserts a full-page background for native digital pages. It renders a temporary source image, removes the uniform page background, erases every reconstructed object region, filters isolated antialiasing/compression specks, and inserts only cropped unsupported residual artwork. Fully reconstructable pages receive no fallback picture.

### Font color, bold, italic, size, and placement mismatch

- Bold/italic traits are detected from the original PDF font name before font-family mapping.
- PDF text-object fill color is used as a fallback when character color is unavailable.
- Word runs receive font settings for ASCII, high ANSI, East Asian, and complex scripts.
- Complex-script bold/italic flags are emitted.
- Font-size range and positioned text-box ascent/width/height/line spacing were corrected.

### Native object behavior

- Rectangle-cell and line-grid structures remain actual Word tables.
- Supported rectangles, rounded rectangles, lines, and chart bars remain selectable Word shapes.
- Embedded PDF images remain independent Word picture objects.
- Unsupported complex residue is cropped to its own bounds instead of becoming a selectable page-sized background.

## Validation summary

- Converter tests: 11/11 passed.
- Dependency-free source contracts: 38/38 passed.
- Route contract: 32 tools + homepage = 33 routes.
- Backend byte identity: 68/68 passed.
- Two native Editable layout sample DOCX files rendered as one clean page each in LibreOffice.
- Native sample OOXML contains zero `behindDoc=1` anchors and only one media image per sample, corresponding to the embedded source picture.

## Candidate status

Linux/LibreOffice validation is complete. Windows Docker, dependency-backed gates, and Microsoft Word manual acceptance remain required before promotion.
