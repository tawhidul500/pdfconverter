# NovaPDF 0.14.10 Release Notes

## Fixed

- Corrected LF-only Windows runner files that caused intermittent CMD subroutine-label resolution failure.
- Both `.cmd` files are now CRLF-only and BOM-free.
- Startup checks for Node.js, npm, Windows PowerShell, and Docker are inline and no longer depend on the removed `:require_command` subroutine.
- Added byte-level regression tests for line endings, labels, checklist selection, and safety boundaries.

## Preserved

Service-backed PDF to Word, Preserve layout, Editable text, English/Bangla OCR, same-origin proxy routes, Webpack development, isolated `.next-dev`, hydration-safe metadata, all 32 tools, 33 routes, exact allowed development origins, robust migration parser, Step 12.8 backend source, Docker-volume protection, public-registry policy, and deferred Request Signatures boundary.
