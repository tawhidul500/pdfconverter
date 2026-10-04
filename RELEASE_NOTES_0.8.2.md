# NovaPDF Release Notes 0.8.2

## Homepage Default and Workspace Navigation Refinement

This maintenance release is based on NovaPDF 0.8.1. It keeps all seven completed PDF engines and all 32 registered tool routes.

### Changed

- The homepage hero upload card now defaults to Edit PDF instead of Merge PDF.
- Returning to the homepage through the NovaPDF logo or browser navigation resets the hero to Edit PDF.
- Replaced native top-right tool selects with a custom grouped tool menu.
- The tool menu is positioned below its trigger and scrolls internally instead of opening upward.
- Rebuilt the workspace left rail around the seven tool categories.
- Tool names are no longer displayed as one continuous 32-item rail list.
- Selecting a category opens its matching tools in a dedicated submenu.
- Selecting a submenu tool closes the submenu and preserves the existing direct-route and file-transfer behavior.
- Added a responsive mobile submenu above the bottom category dock.

### Retained

- All 32 homepage catalog cards and direct routes.
- Real Merge, Split, Organize, Compress, JPG to PDF, PDF to JPG, and Page Numbers PDF engines.
- Existing right-side settings panels and thumbnail metadata policy.
- `allowedDevOrigins` for `172.24.48.1` and `172.21.32.1`.
- Approved v0.4.10 zoom behavior.

### Verification

- Clean npm dependency audit reported 0 vulnerabilities.
- ESLint passed.
- TypeScript compilation and static route generation completed.
- Homepage prerender confirms Edit PDF as the hero upload tool.
- `/`, `/edit-pdf`, `/merge-pdf`, and `/page-numbers-pdf` returned HTTP 200 from the production server.
