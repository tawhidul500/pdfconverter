# NovaPDF v0.13.1 - Sign PDF Corrective Release

**Date:** 30 July 2026  
**Base:** NovaPDF v0.13.0 Step 13 Edit PDF implementation candidate

## Sign PDF corrections

- Removed the former content-aware resize floors for Signature, Initials, Name, Date, Text, Input field, Checkbox, and Company stamp objects. The UI and PDF export now retain a practical one-point minimum instead of snapping fields back to larger sizes.
- Added a contextual Edit action to every selected field.
- Added a color action to every selected field except Company stamp.
- Added right-panel Edit controls for every optional field type.
- Added a clear **Done** action to the inline field editor.
- Redesigned the output filename control with a visible label, helper text, separated input, and fixed `.pdf` suffix.
- Removed the old **Text or input value** control above the filename section.
- Removed the red required-field star from all canvas objects while preserving required-field validation.
- Rebuilt typed signature and initials image generation around measured glyph bounds and transparent safety padding so the first two italic styles do not clip on the left or right.
- Added browser-local signer profile restore for full name and initials. The restored full name also pre-fills the typed-signature box.
- Moved the `Page X of Y` navigator to the bottom of both Sign PDF and Edit PDF workspaces.
- Made Sign PDF date output explicitly use US English formatting.

## Tests and contracts

- Added `test-files/test-step-13-1-sign-pdf-corrections.mjs` with 22 corrective checks.
- Updated older Sign PDF contracts to require browser-local signer-profile restore rather than forbid it.
- Increased dependency-free source contracts from 15 to 16.
- Preserved the existing 11 dependency-backed PDF-engine tests.

## Preserved boundaries

- All 32 tools and 33 root routes remain.
- Edit PDF remains an implementation candidate until its Windows acceptance gate passes.
- The complete Step 12.8 Corrective Package 5 backend remains unchanged.
- Request signatures remains disabled and is not Working.
- Existing Docker volumes must not be deleted or recreated.
- Root and backend project registry files remain public-registry-only.
- Do not run `npm audit fix --force`.

## Validation classification

The recovery sandbox passed all 16 dependency-free source contracts, parsed all 90 TypeScript/TSX files without syntax diagnostics, and passed stylesheet delimiter validation. A complete dependency install was blocked by the sandbox npm proxy returning a missing-tarball 404. Therefore lint, semantic TypeScript, dependency-backed engine tests, production build, live routes, and Chrome manual verification remain required on Windows before this corrective release is promoted as fully accepted.
