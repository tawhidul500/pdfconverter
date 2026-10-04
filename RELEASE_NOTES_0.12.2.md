# NovaPDF 0.12.2 Release Notes

## Sign PDF workflow and workspace redesign

### Added

- Added a post-upload **Who will sign this document?** modal.
- Added an enabled **Only me** self-signing path and a truthful disabled **Several people** backend path.
- Added a dedicated **Set your signature details** modal with full name, initials, Signature, Initials, and Company stamp tabs.
- Added Type, Draw, and Upload signature source controls inside the setup modal.
- Added a scrollable page-thumbnail strip directly beside the existing NovaPDF category rail.
- Added a single large active-page document canvas with previous/next navigation.
- Added a simplified right-side **Signing options** panel.
- Added Simple signature and future Digital signature cards.
- Added required and optional field palettes that support click placement and drag-to-page placement.

### Improved

- Removed the cramped grid-first Sign PDF editing layout.
- Moved signer setup and signature creation out of the permanent right panel into a focused modal.
- Kept selected-object editing in the right panel only when an object is selected.
- Kept Undo/Redo, zoom, field snapping, keyboard controls, reusable assets, validation, output, file transfer, Start over, and home reset.
- Added responsive page-strip and modal layouts for tablet and mobile screens.

### Preserved

- Existing NovaPDF colours, typography, category rail, routes, right-panel architecture, and original source code.
- All 11 real browser-local engines and all 32 catalog routes.
- v0.4.10 zoom behaviour and approved `allowedDevOrigins`.
- Public npm registry URLs only.

### Product boundary

- The interface uses familiar signing-workflow patterns but does not copy third-party branding, copyrighted illustrations, source code, wording, or an exact pixel design.
- **Several people** and certificate-backed digital signatures remain disabled until their real backend, security, identity, tracking, finalization, and audit tests pass.
