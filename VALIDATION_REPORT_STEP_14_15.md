# NovaPDF Step 14.15 Validation Report

## Scope

Corrective validation for PDF-to-Word Editable layout native object reconstruction and dark-spot removal.

## Automated results

| Gate | Result | Evidence |
|---|---:|---|
| Python compile | PASS | `conversion-service/app` and tests compile |
| Converter functional tests | PASS 11/11 | Includes native, OCR, Bangla, mixed orientation, native-object, and line-grid coverage |
| Source contracts | PASS 37/37 | Includes Step 14.15 contract |
| Route manifest contract | PASS | 32 tools plus homepage = 33 routes |
| Backend byte identity | PASS | 68 files identical to supplied v0.14.14 backend |
| DOCX structural validation | PASS | Real tables, VML shapes/text boxes, anchored pictures, valid ZIP/XML |
| LibreOffice visual render | PASS | Line-grid and complex-layout samples rendered on one page without black spots |
| Clean fallback regression | PASS | Fully reconstructable fixture background: 0 dark pixels, 0 non-white pixels |
| Handoff document audit | PASS | 278 supplied Markdown/TXT inputs, 44,365 lines, 0 decode errors |
| Master Handoff publishing QA | PASS | Canonical/versioned DOCX and PDF rendered cleanly across 3 pages |

## Structural sample results

### Line-grid sample

- 2 real Word tables.
- Table 1: 4 rows x 2 columns.
- Table 2: 4 rows x 4 columns.
- Separate Word picture.
- Separate supported shapes.
- Visible editable positioned text.
- No hidden `w:vanish` text in Editable layout output.

### Complex-layout sample

- 1 real Word table: 4 rows x 3 columns.
- Chart bars and supported paths reconstructed as shapes.
- Embedded picture extracted independently.
- Text remains editable and no dark cleanup spots are visible.

## Not executed here

The complete dependency-backed root clean install, ESLint, semantic TypeScript, 12 PDF-engine tests, production build, Docker services, backend validation, migration, live HTTP routes, and E2E require the Windows/Docker runner. They remain encoded in `RUN_NOVAPDF_ALL.cmd` and must pass before promotion.

## Conclusion

The requested corrective behavior is implemented and structurally/visually validated in the delivery environment. Release status remains **candidate pending Windows Microsoft Word acceptance**.
