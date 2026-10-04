# NovaPDF 0.4.10 - Visual Split Ranges

## Added

- Visual Custom Ranges mode in Split PDF
- Individual From page and To page controls for every range
- Add Range and Remove Range controls
- Canvas grouping that shows each range as a separate bordered group
- Optional "Merge all ranges into one PDF file" setting
- Active tick marks on every page in Every Page mode
- Active tick marks inside visual range groups

## Changed

- Removed the semicolon-only custom-range textarea from the primary workflow
- Custom range output names now use `range-01`, `range-02`, and so on
- Every Page toolbar now reports that all pages are selected

## Verified

- ESLint passed
- TypeScript and Next.js production build passed
- All direct tool routes generated successfully
- `/split-pdf` returned HTTP 200
- Custom separate-range output test passed
- Merge-all-ranges output test passed
- npm audit reported 0 vulnerabilities
