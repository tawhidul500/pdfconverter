# NovaPDF 0.11.2 Release Notes

**Release:** Build Step 11.2 Crop PDF corrective update  
**Date:** 21 July 2026

## Fixed

- A4, Letter, Square, and Original aspect selections no longer inherit the geometry of the previously selected aspect ratio. Each preset creates a fresh maximum-size rectangle from the original visible page.
- Crop settings no longer have to be shared across every page. Optional Free-form crop mode stores independent crop rectangles and independent aspect modes per edited page.
- Opening and editing another page in Free-form mode no longer replaces the previous page crop. Previously edited pages remain targeted for the generated output.
- The PDF crop engine now accepts page-specific normalized rectangles while retaining the shared rectangle as a fallback.
- Clicking the gray workspace outside the enlarged crop page returns to the previous grid view. Clicking or dragging inside the page does not close the editor.

## Preserved

- Current page, Selected, All pages, Odd pages, Even pages, and Custom range targeting.
- Shared crop mode for applying one proportional crop rectangle to a group of pages.
- Exact margin inputs, crop presets, draggable movement, eight resize handles, undo/redo, page selection, compatible-file transfer, and output naming.
- Ten real working engines, all 32 routes, existing NovaPDF design, right settings panels, v0.4.10 zoom behavior, public npm registry URLs, and approved development origins.

## Validation

- Clean dependency installation passed.
- npm audit reported zero vulnerabilities.
- ESLint and TypeScript passed.
- Production build generated all 36 static pages.
- Existing Watermark, Page Numbers, Rotate, Crop, and interaction-contract regression tests passed.
- New Step 11.2 tests verified aspect reset independence, exact A4 geometry, Original full-page reset, page-specific crop rectangles, retained free-form page targets, and outside-click return source contracts.

Full pointer interaction still requires final confirmation in the user's Windows Chrome because the packaging environment cannot reliably automate the complete localhost browser flow.
