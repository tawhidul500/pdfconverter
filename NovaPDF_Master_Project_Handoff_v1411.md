# NovaPDF Master Project Handoff v0.14.11

## Authoritative state

Continue from Build Step 14.11. This release consolidates the complete service-backed PDF-to-Word implementation and every corrective produced from Steps 14.1 through 14.10.

PDF to Word currently provides:

- editable DOCX generation from searchable PDFs;
- preserve-layout DOCX generation;
- English OCR, Bangla OCR, and combined English/Bangla OCR;
- custom ranges, separate output, combined output, Unicode filenames, progress, controlled errors, and download-package validation;
- a same-origin Next.js proxy to the local conversion service;
- a Dockerized PDFium/Tesseract/python-docx conversion service;
- shared viewer modes, file transfer, Start over, Home reset, and the Step 13.7 portal lifecycle.

Request Signatures remains disabled and is not Working. The Step 12.8 backend remains frozen and must not be extended until the frontend tool sequence is complete.

## Consolidated defect resolution

1. Unopenable/corrupt DOCX: browser-built OOXML was replaced by service-generated python-docx output with client-side ZIP/XML validation.
2. Converter offline and raw `Failed to fetch`: browser calls now use same-origin proxy routes and controlled 503 errors.
3. React abort/error overlay: unsafe health-poll abort cleanup was removed.
4. ESLint failures: synchronous effect state and unescaped JSX apostrophes were corrected.
5. PDF.js TypeScript cleanup errors: document loading-task cleanup is used instead of an unavailable proxy method type.
6. Fresh-database migration failure: migration is applied before show/verification, then checked for idempotency.
7. Node 24 Windows `spawn EINVAL`: the local Next.js JavaScript CLI is launched with `node.exe`, not direct `.cmd` spawning.
8. TypeORM migration-show formatting: the parser accepts the real `[X] 1 MigrationName` form.
9. Hydration mismatch and stale mixed bundles: development output is isolated, build metadata is deterministic, and current Web version is verified.
10. Windows missing batch label: both command files are CRLF-only and BOM-free.
11. Repeated wrong-version/stale-runtime reuse: Step 14.11 stops only stale NovaPDF processes/legacy containers, launches fresh current binaries, and checks `/api/novapdf/version`.
12. New Docker volumes for every extracted build: Compose now uses stable project name `novapdf-local`; legacy volumes are preserved and future releases reuse the stable set.

## Locked boundaries

Preserve all 32 tools, 33 public routes, existing engines, NovaPDF design, right-side panels, preview behavior, all page-view modes, file transfer, Start over, Home reset, exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`, public npm registry URLs, and Docker volumes.

Never run `docker compose down -v`. Never apply `npm audit fix` or `npm audit fix --force` automatically.

## Required next action

Use only the Step 14.11 package. Extract it to a fresh folder, start Docker Desktop, double-click `RUN_NOVAPDF_ALL.cmd`, and complete every item in `WINDOWS_VALIDATION_STEP_14_11.md`.

The first runner heading must be:

`NovaPDF v0.14.11 consolidated one-click runner`
