# NovaPDF 0.12.4 - Simplified Sign PDF Entry Flow

## Fixed

- Removed the duplicate pre-upload **Sign it myself / Request signatures** card group from the compact Sign PDF upload view.
- Removed the same duplicate card group from the full-screen empty Sign PDF workspace.
- Kept the existing post-upload **Who will sign this document?** modal as the only workflow chooser.

## Preserved

- Single PDF upload card and drag-and-drop upload.
- Signer-details modal, automatic initials, eight Signature styles, eight Initials styles, saved signatures/stamps, field editing, and browser-local PDF output.
- NovaPDF colours, category rail, page strip, document canvas, right signing panel, 32 root routes, 11 working engines, v0.4.10 zoom behaviour, public npm registry URLs, and approved `allowedDevOrigins`.

## Verified

- ESLint, TypeScript, production build, npm audit, all engine/contract tests, and the dedicated Step 12.4 duplicate-workflow removal contract.
