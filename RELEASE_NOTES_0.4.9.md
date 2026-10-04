# NovaPDF 0.4.9 Release Notes

## Added

- Direct, clean tool URLs without a `/tools/` prefix
- Static routes for every current and planned tool, including `/merge-pdf`, `/split-pdf`, `/organize-pdf`, and `/compress-pdf`
- Tool-specific browser page titles and metadata
- Browser Back and Forward synchronization for tool routes
- Shared workspace zoom range from 50% to 200%

## Changed

- Selecting a tool from the homepage opens its dedicated route and full-screen workspace
- Switching tools updates the URL without reloading the page, so browser `File` objects remain available
- The current compatible file set replaces the destination workspace file set
- Single-PDF tools receive the most recently added compatible PDF
- Merge is named `Merge PDF & Images` throughout the interface while retaining the short `/merge-pdf` URL
- Clicking the NovaPDF workspace logo navigates to `/` and clears all uploaded files, generated results, selections, ordering, and in-memory workspace settings

## Route examples

```text
/                     Homepage
/merge-pdf            Merge PDF & Images
/split-pdf            Split PDF
/organize-pdf         Organize PDF
/compress-pdf         Compress PDF
/pdf-to-jpg           PDF to JPG
/jpg-to-pdf           JPG to PDF
```

## Verified

- ESLint passed
- TypeScript passed
- Next.js production build passed
- All 12 tool routes were statically generated
- Homepage and representative direct tool routes returned HTTP 200
- Server-rendered page titles matched their respective tools
