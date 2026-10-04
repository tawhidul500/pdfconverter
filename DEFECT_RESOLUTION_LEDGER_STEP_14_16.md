# NovaPDF Defect Resolution Ledger - Step 14.16

## Defect 1: original PDF remains visible behind editable objects

**Observed:** moving or editing text/tables/shapes revealed the original PDF page underneath, causing doubled text and the impression that native objects were still only a background image.

**Root cause:** the v0.14.15 fallback renderer depended on removing recursively enumerated PDFium page objects. Objects nested inside Form XObjects could not always be detached from the page, so a full-page fallback still contained original content.

**Correction:** native digital pages no longer receive a full-page fallback. The converter builds an RGBA analysis render, removes the uniform paper background, explicitly masks every reconstructed text/table/shape/picture region, removes small specks, and emits only cropped unsupported residual components. Fully reconstructable pages emit no background picture.

**Regression:** both native sample DOCX files contain zero `behindDoc=1` anchors and one media image only, corresponding to the independently extracted embedded picture.

## Defect 2: font bold/italic lost

**Root cause:** Helvetica/Times/Courier font mapping occurred before trait detection, discarding PDF font suffixes such as `-Bold` and `-Oblique` when the PDF weight field was zero.

**Correction:** detect traits from the raw PDF font name first, then map the family for Word.

**Regression:** converter tests assert bold OOXML; visual samples show bold titles/table headers.

## Defect 3: text color, size, and alignment mismatch

**Root causes:** character color was not always exposed; complex-script run properties were incomplete; text-box geometry used aggressive ascent/line-height compensation.

**Correction:** use page-text-object fill color as fallback, emit all Word font-script attributes plus `bCs/iCs`, expand supported font-size bounds, and retune text-box top/width/height/exact line spacing.

**Regression:** tests assert known source colors and size markers; rendered samples preserve white, orange/brown, and red text with no collision.

## Defect 4: tables/shapes/pictures behave like page artwork

**Correction:** continue writing detected grids as `w:tbl`, supported paths as independent VML shapes, and embedded images as anchored DrawingML pictures. Remove their pixels from any residual artwork.

**Boundary:** picture-object operations are editable in Word, but raster image pixels are not converted into vector primitives. Complex vectors, irregular/merged tables, clipping/transparency groups, and scan-only structures may remain cropped visual residue or scan artwork.
