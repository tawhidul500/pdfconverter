# NovaPDF Master Project Handoff v0.14.9

Continue from Build Step 14.9. The authoritative application state remains the service-backed PDF-to-Word implementation with editable/native text conversion, preserve-layout DOCX output, English/Bangla OCR, custom ranges, separate/combined output, and validated DOCX package handling.

## Step 14.9 corrective

A manual `npm.cmd run dev` on Next.js 16 selected Turbopack and produced a footer hydration mismatch showing version skew between older server-rendered metadata and the current client bundle. Step 14.9:

- opts manual development into Webpack;
- isolates development output in `.next-dev`;
- clears only `.next-dev` before launch;
- preserves production `.next` output;
- makes the footer build stamp hydration-safe;
- explicitly declares the SVG icon.

## Locked boundaries

Preserve all 32 tools, 33 routes, existing engines, NovaPDF design, right-side panels, preview behavior, page-view modes, file transfer, Start over, Home reset, exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`, public npm registry URLs, Docker volumes, robust migration parsing, and the updated one-click runner. Do not use `npm audit fix --force`.

Request Signatures remains disabled and must be implemented as the final major feature after the other working tools are completed.

## Next action

Run `RUN_NOVAPDF_ALL.cmd`, then complete `WINDOWS_VALIDATION_STEP_14_9.md`, including the private-window hydration check and Microsoft Word/OCR acceptance. Do not begin the next tool until this corrective is accepted.
