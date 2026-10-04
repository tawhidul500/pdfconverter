# NovaPDF v0.14.16 - Editable Layout Object Parity Corrective

NovaPDF v0.14.16 corrects **PDF to Word > Editable layout (Beta)** on the actual v0.14.15 source. The project was not rebuilt. Existing tools, routes, browser-local PDF engines, OCR choices, Windows runner architecture, Docker volume rules, and the deferred Request Signatures boundary remain preserved.

## PDF-to-Word modes

1. **Preserve layout** - a rendered page image with an optional hidden native/OCR search layer.
2. **Editable layout (Beta)** - positioned editable text plus reconstructable Word tables, shapes, and pictures.
3. **Editable text** - extracted native/OCR text as reading-flow paragraphs.

## v0.14.16 corrective behavior

- Native digital PDFs no longer receive a full-page PDF screenshot behind the editable Word objects.
- The converter renders the original page only as an analysis surface, explicitly masks every reconstructed text/table/shape/picture region, removes the uniform paper background, and retains only cropped unsupported residual artwork when needed.
- Fully reconstructable native pages contain no background page image.
- Font bold/italic detection now uses the original PDF font name before Helvetica/Times/Courier mapping, preserving suffixes such as `-Bold` and `-Oblique`.
- Text color now falls back to the PDF text object's fill color where character-level color is unavailable.
- Word run properties now set ASCII, high-ANSI, East Asian, and complex-script fonts plus complex-script bold/italic flags.
- Positioned text-box ascent, width, height, and exact line spacing were retuned to reduce overlap and improve size/position parity.
- Rectangle-cell tables and line-grid tables remain real Word tables; supported paths remain selectable Word shapes; embedded images remain independent Word pictures.

## Important boundary

A picture is editable in Word as a picture object (select, move, resize, crop, rotate, replace, format), but its internal pixels are not converted into editable vector primitives. Scan-only pages remain image-based because the PDF contains no native authoring objects; OCR can make text editable but cannot guarantee semantic table or shape recovery.

## Windows run

1. Extract the runnable source ZIP to a fresh folder, for example `C:\NovaPDF-v1416`.
2. Start Docker Desktop.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Confirm the heading says `NovaPDF v0.14.16 consolidated one-click runner`.
5. Complete `WINDOWS_VALIDATION_STEP_14_16.md` in Microsoft Word.

The runner preserves Docker volumes, never runs automatic `npm audit fix`, and records the converter regression output in `validation-logs`.
