# NovaPDF 0.12.3 - Typed Signature and Initials Style Refinement

## Added

- Expanded the typed Signature chooser from three generic options to eight original NovaPDF style presets.
- Added the same complete, scrollable style chooser to the Initials tab.
- Added real-time initials generation from the full name, for example `Tawhidul Islam` becomes `TI`.
- Preserved manual initials edits so later name changes do not overwrite a deliberate custom value.
- Removed the duplicate Signature name input and made Full name the single source for typed-signature previews and output.
- Made Apply automatically create the selected typed signature when no signature asset has been created yet.
- Used the selected typed style when producing the browser-generated signature image.
- Mapped the selected initials style to the supported PDF text treatment for exported initials fields.

## Design boundary

The expanded list follows the familiar scrollable signature-style selection pattern but uses original NovaPDF style definitions and system/web-safe font stacks. No iLovePDF font files, assets, source code, or exact interface were copied.

## Preserved

- NovaPDF colours, typography, spacing, category rail, page strip, centre document canvas, and right signing panel.
- All 32 root routes and 11 real working engines.
- Existing Sign PDF draw/upload methods, saved assets, object controls, real PDF export, transfer/reset rules, and v0.4.10 zoom behaviour.
- Public npm registry URLs and the approved `allowedDevOrigins` values.
