# NovaPDF Release Notes 0.10.0

**Release:** Build Step 10 - Real Rotate PDF  
**Date:** 21 July 2026

## Added

- Dedicated real Rotate PDF workspace at `/rotate-pdf`.
- Upload support for one or multiple PDFs.
- Real page thumbnails grouped by source document.
- Individual page selection.
- Target modes: Selected, All pages, Odd pages, Even pages, and Custom range.
- Rotation actions: Left 90 degrees, Right 90 degrees, 180 degrees, and Reset.
- Live thumbnail orientation and final-angle indicators.
- One generated PDF per uploaded source.
- Download-all ZIP for multi-file jobs.
- Output filename control for single files and output-prefix control for batches.
- Transfer of generated rotated PDFs to compatible destination tools.
- Automated Rotate PDF engine test fixture and output PDF.

## Preserved

- All eight previously working engines.
- All 32 tool cards and root-level routes.
- Existing NovaPDF design, colours, spacing, layout, and right-side control pattern.
- Homepage Edit PDF default.
- Desktop hover and click-pinned category navigation.
- Mobile/touch category behaviour.
- v0.4.10 zoom behaviour.
- Clean-thumbnail policy.
- `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Public npm registry entries only.

## Honest known issue

The user tested v0.9.3 and confirmed that the newer Watermark PDF object-selection toolbar and Arrow-key movement still do not work in their Windows browser. Version 0.10.0 does not falsely claim that issue is fixed. The Watermark PDF generation engine remains available, while the broken interaction is deferred to Build Step 10.1.

## Validation

- `npm ci` passed.
- `npm audit` reported 0 vulnerabilities.
- ESLint passed.
- TypeScript passed.
- Next.js production build passed and generated 36 static pages.
- Homepage plus all 32 tool routes returned HTTP 200.
- Rotate engine tests passed for new and pre-existing rotations.
- Page count, dimensions, order, and source rotation composition were verified.
- Generated rotated PDFs were rendered and visually inspected.
- Public-registry and allowed-origin scans passed.
