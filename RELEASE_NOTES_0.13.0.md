# NovaPDF v0.13.0 - Step 13 Edit PDF Implementation Candidate

**Date:** 30 July 2026

## Summary

This release continues from the supplied v0.12.8 Windows Corrective Package 5 source and implements the previously planned Edit PDF engine. The actual handoff, complete tools/options inventory, and source were inspected before coding.

Edit PDF now has a dedicated browser-local workspace and flattened export engine. The release is packaged as an **implementation candidate** because the recovery sandbox could not install the complete dependency tree from the public npm registry; Windows acceptance remains mandatory.

## Added

- Dedicated `/edit-pdf` workspace.
- Browser-local `pdf-lib` export engine.
- Text objects with Helvetica, Times, Courier, size, bold, italic, alignment, colour, fill, border, opacity, and rotation.
- PNG/JPG/JPEG/WebP image objects.
- Rectangle, ellipse, line, highlight, underline, freehand, and HTTP/HTTPS link objects.
- Move, resize, rotate, duplicate, delete, bring to front, send to back, keyboard nudging, and selection.
- Bounded Undo/Redo and shared 50–200% zoom.
- Continuous page canvas, low-resolution thumbnails, and lazy high-resolution active-page ±1 previews.
- Previous/Next navigation, thumbnail navigation, source/result transfer, Start over, and home reset.
- New 43-check Step 13 source contract.
- New dependency-backed Edit PDF engine test with rotated/cropped pages and link annotation verification.

## Preserved

- All 32 registered tools and all 33 root URLs.
- The eleven previously proven browser engines.
- Existing NovaPDF design, category navigation, right-side panels, preview behaviour, and responsive layout.
- Sign PDF continuous canvas, one-way active-page controller, lazy active-neighbourhood previews, and 50–200% zoom.
- Exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Compatible file transfer, Start over, and home reset.
- Public npm registry URLs only.
- The complete Step 12.8 Corrective Package 5 backend, byte-for-byte unchanged.

## Truthful limitations

- Added edits are flattened into a separate PDF; existing PDF text is not converted into native editable text objects.
- Password-protected/encrypted PDFs are not supported by this browser-local workspace.
- Link objects accept only HTTP/HTTPS URLs.
- Edit PDF is not promoted to proven Working until the Windows clean install, audit capture, lint, semantic TypeScript, all 15 contracts, all 11 PDF-engine tests, production build, 33-route check, and ten-item manual Chrome checklist pass.
- Request signatures remains disabled and not Working.

## Recovery-sandbox validation

Passed:

- all 15 dependency-free source contracts;
- preserved Step 12.8 36-check backend/corrective contract;
- new Step 13 43-check Edit PDF contract;
- syntax parsing of all 90 TypeScript/TSX files;
- stylesheet delimiter balance;
- byte-for-byte comparison of all 68 preserved backend files.

Pending on Windows because the sandbox npm mirror could not provide the complete dependency tree:

- clean dependency install and audit capture;
- ESLint and semantic TypeScript;
- 11 dependency-backed engine tests;
- production build and runtime routes;
- manual Edit PDF Chrome checklist.

Use `WINDOWS_VALIDATION_STEP_13.md` as the release acceptance record.
