# NovaPDF Release Notes 0.9.1

**Release date:** 20 July 2026  
**Milestone:** Build Step 9.1 - Navigation, Watermark, and Preview Refinement

## Added

- Click-to-pin and click-to-close workspace category submenus.
- Category-relative desktop/tablet submenu positioning with viewport clamping.
- PNG, JPG, JPEG, and WebP image/logo watermark support.
- Pointer and touch dragging for text and image watermarks.
- Normalized free-position storage so placement remains consistent across selected pages.
- Image watermark size, opacity, rotation, page range, preset position, and edge-offset controls.

## Fixed

- Desktop hover submenu no longer closes before the pointer can enter it.
- The rail/submenu dead gap is removed and the exit delay is safer.
- Submenus no longer all begin at one fixed top position.
- Static page/image previews use more of the available thumbnail surface without stretching or changing the source aspect ratio.

## Preserved

- Existing NovaPDF design, colours, spacing, control panels, and workspace structure.
- All eight working browser-local engines and all 32 root routes.
- Mobile/touch tap behaviour, compatible-file transfer, Start over, home clear, and clean-thumbnail metadata policy.
- v0.4.10 zoom behaviour and `allowedDevOrigins`.

## Verified

- Clean npm install and npm audit: 0 vulnerabilities.
- ESLint and TypeScript passed.
- Next.js production compilation and 36-page static generation completed.
- All 32 root routes returned HTTP 200 from the production server.
- Engine tests passed for text, image, free position, custom range, page dimensions, and 90/180/270-degree rotations.
- Generated text and image watermark PDFs were rendered and visually checked.

## Environment limitation

Automated Chromium access to local URLs was blocked by administrator policy in the packaging environment. The included Windows checklist must be used for final mouse hover, click-pin, drag, and visual preview confirmation.
