# NovaPDF 0.12.5 Release Notes

## Sign PDF signer-details cleanup

- Signature and Type are active by default when the signer-details modal opens.
- Removed the redundant **Use selected typed signature** button.
- Removed the large native colour row and selected-signature preview/save card from the Signature tab.
- Added compact black, red, blue, and green colour palettes to Signature and Initials.
- The bottom **Apply** button now creates the selected typed signature directly.
- Draw, Upload, Initials, Company stamp, reusable browser assets, field placement, and real signed-PDF output remain available.

## Validation

- Clean npm install and audit: 0 vulnerabilities.
- ESLint and TypeScript passed.
- All engine and source-contract tests passed.
- Production build generated 36 static pages.
- Homepage and all 32 root tool routes returned HTTP 200.
- Full localhost browser automation remained blocked by administrator policy; final modal click/colour checks should be confirmed in Windows Chrome.
