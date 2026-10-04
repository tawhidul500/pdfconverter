# NovaPDF Release Notes 0.11.3

**Release:** NovaPDF_Build_Step_11_3  
**Type:** Watermark interaction and shared toolbar corrective release

## Changed

- Renamed the linked Watermark editing scope to **All pages** and synchronized selection across every affected text or image watermark preview.
- Made position presets, drag, Arrow movement, rotation, duplication, and deletion obey the active All-pages or This-page-only scope.
- Added **Edit text** beside Rotate, Duplicate, and Delete in the focused text-watermark toolbar.
- Moved Undo/Redo beside the existing zoom controls in the shared workspace toolbar.
- Made the Undo/Redo controls visible in every shared zoom workspace; history-enabled workspaces provide active actions and unsupported workspaces keep them disabled.
- Expanded Watermark history to restore scope, mode, text/image source, range, style, and placement state.

## Preserved

- All ten working engines and all 32 root routes.
- Crop PDF v0.11.2 per-page Free-form behavior.
- Existing NovaPDF design, panels, thumbnails, transfer rules, and v0.4.10 zoom behavior.
- `allowedDevOrigins` and public npm registry URLs.

## Validation

- Clean install, npm audit, ESLint, TypeScript, and production build passed.
- Homepage and all 32 tool routes returned HTTP 200.
- Watermark engine, scope/toolbar contracts, page-number, rotate, and crop tests passed.
- Full localhost Chromium interaction remained blocked by administrator policy; the Windows manual checklist is required for final pointer confirmation.
