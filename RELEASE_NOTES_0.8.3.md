# NovaPDF Release Notes 0.8.3

## Scope

This release intentionally changes only two navigation behaviours. No visual design, layout, colours, spacing, PDF-processing engine, upload logic, file-transfer rule, or right-side control panel was changed.

## Fixed

- Fixed the homepage upload-card tool picker so clicking the top-right dropdown reliably expands the complete grouped tool list.
- Rendered the picker as a document-level overlay so the existing upload-card clipping and backdrop-filter boundary cannot hide it.

## Improved

- Desktop workspace category buttons now expand their matching tool submenu when hovered.
- The submenu remains open while the pointer moves from the category rail into the submenu.
- Moving the pointer away collapses the submenu automatically.
- Added a short existing-style fade/slide animation for opening and closing.
- Mobile and touch devices retain the existing tap-to-open and tap-to-close behaviour.

## Unchanged

- Existing NovaPDF design and layout
- All seven completed browser-local PDF engines
- All 32 tool routes
- Current tool-to-tool file transfer
- Start Over and logo-reset behaviour
- v0.4.10 zoom behaviour

## Verification

- `npm ci` passed
- `npm audit` reported 0 vulnerabilities
- ESLint passed
- TypeScript passed
- Next.js production build passed
- 36 static pages generated
