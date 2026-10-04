# NovaPDF Defect Resolution Ledger - Step 14.15

## Defect 1: black/gray spots after PDF-to-Word conversion

**Cause:** native PDF text was rasterized and then removed with an inpainting mask. Small glyphs, punctuation, anti-aliasing, and non-uniform backgrounds could leave dark residual pixels.

**Correction:** remove native PDF text page objects before rendering the fallback layer. Use OCR raster cleanup only for image-only text where no native object exists.

**Regression:** clean-background fixture asserts zero dark pixels and zero non-white pixels in the fully reconstructable fallback layer.

## Defect 2: tables remain background artwork

**Cause:** the hybrid mode preserved table paths only in the page image.

**Correction:** emit fixed-layout Word tables for rectangle-cell grids and independent line grids. Transfer supported fills, borders, row/column geometry, and cell text.

**Regression:** line-grid fixture must produce 4x2 and 4x4 Word tables.

## Defect 3: shapes and pictures remain background artwork

**Cause:** reconstructable paths/images were not separated from fallback artwork.

**Correction:** emit supported paths as Word shapes and embedded images as anchored pictures; remove reconstructed PDF objects from the fallback page.

**Boundary:** complex vectors, charts without recoverable structure, and scans remain visual fallback artwork.
