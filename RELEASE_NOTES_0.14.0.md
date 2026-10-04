# NovaPDF v0.14.0 Release Notes

## Build Step 14.0 - PDF to Word Frontend Candidate

Version 0.14.0 starts the user-approved frontend-first tool sequence. Request Signatures is deferred until the final major feature milestone.

## Added

- A dedicated `/pdf-to-word` workspace replacing the generic placeholder.
- Multi-PDF upload with file type, PDF header, empty-file, 50 MB per-file, 150 MB batch, 10-file, 250-page, duplicate, password, damaged-file, and page-count validation.
- First-page previews rendered with the existing PDF.js worker.
- Source cards with page counts, file sizes, selected-page counts, active-source navigation, and add/remove controls.
- Shared bottom-center viewer with zero portals before upload and exactly one portal for the active PDF to Word workspace after upload.
- Continuous, Single-page, Two-page, and Three-page source-card views.
- All-pages and custom-range configuration.
- Preserve-layout and editable-text-flow priorities.
- Separate DOCX and combined DOCX output choices.
- Output filename or batch-prefix configuration.
- A visibly disabled OCR option for future engine integration.
- A truthful Review conversion setup action that summarizes the frontend configuration without generating a DOCX.
- Step 14 dependency-free source contract.

## Preserved

- All 32 registered tools and all 33 root routes.
- All existing PDF engines and dedicated workspaces.
- NovaPDF visual design, right-side panels, preview behavior, viewer modes, file transfer, Start over, and home reset.
- Exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Public npm registry project files.
- Updated one-click Windows runner without Docker volume deletion or automatic audit fixes.
- Step 12.8 backend source unchanged.

## Truthful status

PDF to Word is a **frontend candidate**, not a Working converter. DOCX extraction, reconstruction, packaging, downloads, OCR, and conversion-engine regression tests remain pending.

Request Signatures remains disabled, not Working, and intentionally deferred until the final major feature milestone.
