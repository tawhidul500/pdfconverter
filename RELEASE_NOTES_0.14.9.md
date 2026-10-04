# NovaPDF 0.14.9 Release Notes

## Fixed

- Corrected a development-only React hydration mismatch where the server footer showed an older build label while the client bundle showed the current label.
- Manual development now starts Next.js with Webpack rather than the Next.js 16 default Turbopack path.
- Development output is isolated in `.next-dev`; the validated production `.next` build is not reused by manual development.
- The footer build stamp now uses a stable server snapshot and updates to the current build after hydration.
- The existing SVG icon is declared explicitly in application metadata.

## Preserved

Service-backed PDF to Word, Preserve layout, Editable text, English/Bangla OCR, all 32 tools, 33 routes, exact allowed development origins, robust migration parser, Step 12.8 backend source, Docker-volume protection, public-registry policy, and deferred Request Signatures boundary.
