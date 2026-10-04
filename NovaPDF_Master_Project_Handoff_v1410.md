# NovaPDF Master Project Handoff v0.14.10

Continue from Build Step 14.10. The authoritative application state remains the Step 14.9 service-backed PDF-to-Word implementation with editable/native text conversion, preserve-layout DOCX output, English/Bangla OCR, custom ranges, separate/combined output, same-origin service proxying, isolated Webpack development cache, and hydration-safe build metadata.

## Step 14.10 corrective

The Step 14.9 package emitted Windows `.cmd` files with Unix LF line endings. On Windows 10 CMD, the runner completed the first two label calls but then reported `The system cannot find the batch label specified - require_command` at the PowerShell preflight. Step 14.10:

- restores CRLF-only, BOM-free bytes for both Windows command files;
- replaces repeated startup subroutine calls with inline `where` checks;
- adds a byte-level contract that prevents LF-only batch files from being packaged again;
- preserves all Step 14.9 application and backend behavior.

## Locked boundaries

Preserve all 32 tools, 33 routes, existing engines, NovaPDF design, right-side panels, preview behavior, page-view modes, file transfer, Start over, Home reset, exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`, public npm registry URLs, Docker volumes, migration parsing, and the updated runner. Do not use `npm audit fix --force`.

Request Signatures remains disabled and must be implemented as the final major feature after the other working tools are completed.

## Next action

Run `RUN_NOVAPDF_ALL.cmd` from a fresh extraction and complete `WINDOWS_VALIDATION_STEP_14_10.md`. First confirm that all four startup dependency checks pass without a missing-label message.
