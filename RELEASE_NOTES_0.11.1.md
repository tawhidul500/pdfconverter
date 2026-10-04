# NovaPDF 0.11.1 Release Notes

**Release:** Build Step 11.1 corrective update  
**Date:** 21 July 2026

## Fixed

- A page-specific watermark can be added again after its previous watermark is deleted in the focused editor.
- The image picker now remembers the intended target page. Choosing or replacing an image creates a visible object on that page rather than silently affecting another page.
- Empty pages expose compact grid recovery buttons and a page-specific recovery panel in the right settings area.
- All nine Watermark placement presets remain clickable when no object is selected. In Text mode the preset creates/selects an object; in Image mode it opens the image picker and applies the chosen preset after loading.
- Preset, drag, keyboard, rotate, duplicate, delete, add, paste, and image-recovery changes are included in Watermark undo/redo history.

## Windows-style editing shortcuts

### Watermark PDF

- `Ctrl+Z`: Undo
- `Ctrl+Shift+Z` or `Ctrl+Y`: Redo
- `Ctrl+O`: Choose a PDF
- `Ctrl+S`: Generate the watermarked PDF
- `Ctrl+A`: Select the linked object scope
- `Ctrl+C`, `Ctrl+X`, `Ctrl+V`: Copy, cut, and paste watermark objects
- `Ctrl+D`: Duplicate
- Arrow keys / `Shift+Arrow`: Move selected object
- `Delete` or `Backspace`: Delete
- `Escape`: Deselect or return to grid
- `Ctrl+0`, `Ctrl++`, `Ctrl+-`: Reset/change workspace zoom

### Other state-editing workspaces

Shared bounded Undo/Redo history and visible controls are now included in Organize PDF, Rotate PDF, Crop PDF, Merge PDF, and JPG to PDF. Tool-appropriate `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+Y`, `Ctrl+O`, selection, delete, Escape, and zoom shortcuts are applied where the action exists.

## Preserved

- Ten real working engines
- All 32 catalog cards and root routes
- Existing NovaPDF visual design and right-side settings panels
- v0.4.10 zoom behavior
- Compatible-file transfer and reset rules
- Public npm registry URLs and approved `allowedDevOrigins`

## Validation

- Clean dependency installation passed.
- npm audit reported zero vulnerabilities.
- ESLint passed with zero warnings.
- TypeScript passed.
- Production build and all static routes passed.
- Watermark engine tests passed for text, image, custom-position, multiple-instance, page-specific, and rotated-page output.
- Step 10.1 and Step 11.1 interaction source-contract tests passed.
- Crop, Rotate, Rotate-targeting, and Page Numbers regression tests passed.

Full local pointer interaction still requires final confirmation in the user's Windows Chrome because the packaging environment blocks automated localhost Chromium access.
