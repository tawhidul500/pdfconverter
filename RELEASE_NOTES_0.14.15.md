# NovaPDF v0.14.15 Release Notes

## Release type

Corrective release for **PDF to Word > Editable layout (Beta)**, built directly on the supplied v0.14.14 source.

## Fixed

### Black/gray spots in converted Word files

Native PDF text is no longer erased from a rasterized page with OpenCV. NovaPDF removes the native PDF text objects before rendering the fallback layer, then reconstructs the text as visible editable Word text boxes. This prevents the residual dark spots seen around punctuation, glyph edges, and small characters.

OCR-only text still requires raster cleanup because scanned pages do not contain removable native text objects.

### Tables acting only as background artwork

NovaPDF now reconstructs two common PDF table structures as actual Word tables:

- cells represented by individual stroked rectangles;
- grids represented by independent horizontal and vertical lines, including aligned row/cell fill rectangles.

Cell text, dimensions, borders, and supported fills are transferred into a fixed-layout Word table.

### Shapes and pictures acting only as background artwork

- Supported rectangles, rounded rectangles, thin lines, and chart-like bars are emitted as Word shapes.
- Embedded images are emitted as independent anchored Word pictures.
- Reconstructed objects are removed from the fallback page artwork to prevent duplication.

## Runner and handoff

- Updated all current-version stamps to v0.14.15 / Build Step 14.15.
- Updated `RUN_NOVAPDF_ALL.cmd` and added a dedicated converter native-object regression log.
- Added Step 14.15 source contract, Windows checklist, validation report, handoff, continuation prompt, manifests, and checksums.

## Validation summary

- Converter tests: 11/11 passed.
- Source contracts: 37/37 passed.
- Routes in manifest: 33 (32 tools plus homepage).
- Backend: 68 files byte-identical to the supplied v0.14.14 source.
- DOCX render QA: passed for native rectangle-cell and line-grid samples.

## Known limitations

An arbitrary PDF does not contain the original Word/Excel/PowerPoint object model. Complex charts, grouped vector art, formulas, merged/irregular tables, clipping masks, transparency groups, and scan-only structures may remain visual fallback artwork. A fully scanned page cannot reliably expose a native table or picture object; OCR reconstructs text, not the original authoring structure.
