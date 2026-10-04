# NovaPDF Step 14.16 Validation Report

## Scope

Corrective validation for PDF-to-Word Editable layout: remove the duplicate native-PDF background, preserve exposed text style/geometry, and ensure reconstructable tables, shapes, and pictures are independent Word objects.

## Automated results

| Gate | Result | Evidence |
|---|---:|---|
| Python compile | PASS | `converter.py` and `main.py` compile |
| Converter functional tests | PASS 11/11 | Native, OCR, Bangla, mixed orientation, object reconstruction, no-background coverage |
| Source contracts | PASS 38/38 | Includes Step 14.16 object-parity contract |
| Route manifest | PASS | 32 tools plus homepage = 33 public routes |
| Backend byte identity | PASS | 68/68 files identical to v0.14.15 backend |
| DOCX package/OOXML validation | PASS | Real tables, VML shapes/text boxes, independent anchored picture, valid ZIP/XML |
| Native full-page background absence | PASS | Zero `behindDoc=1` anchors in both native samples |
| Media audit | PASS | One media image per sample; dimensions match the embedded picture, not the PDF page |
| LibreOffice visual render | PASS | Both samples render on one clean page without duplicate/ghost PDF content or black spots |
| Current handoff publishing QA | PASS | Canonical/versioned DOCX and PDF rendered and inspected |

## Structural sample results

### Line-grid sample

- 2 real Word tables: 4x2 and 4x4.
- 9 editable positioned text boxes.
- Supported shapes are independent VML objects.
- 1 DrawingML picture, 181x80 pixels.
- 0 hidden `w:vanish` nodes.
- 0 `behindDoc=1` anchors.

### Complex-layout sample

- 1 real Word table: 4x3.
- 22 editable positioned text boxes.
- Chart bars/axis and supported callout paths are independent shapes.
- 1 DrawingML picture, 261x121 pixels.
- 0 hidden `w:vanish` nodes.
- 0 `behindDoc=1` anchors.

## Visual observations

- Title weights, header fills, white title text, orange/brown callout text, and red footer text render correctly in the generated samples.
- No duplicate source page is visible behind moved/reconstructed content in the native samples.
- No black/gray inpainting spots are present because native pages no longer use raster text inpainting or a page-sized fallback.

## Not executed here

The complete dependency-backed root clean install, ESLint, semantic TypeScript, 12 PDF-engine tests, production build, Docker services, backend validation, migration, live HTTP routes, E2E, and Microsoft Word object interaction require the Windows runner. They remain mandatory before promotion.

## Conclusion

The requested correction is implemented and structurally/visually validated in Linux/LibreOffice. Release status is **candidate pending Windows Microsoft Word acceptance**.
