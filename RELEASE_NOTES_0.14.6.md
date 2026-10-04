# NovaPDF 0.14.6 Release Notes

## Fixed

- Corrected the one-click runner PostgreSQL migration sequence.
- The runner now executes the committed migration first, verifies the exact migration as `[X]`, and executes a second idempotency check requiring `No migrations are pending`.
- Fresh versioned extractions with fresh Compose databases no longer fail merely because the migration starts as `[ ]`.
- The runner opens and references the current Step 14.6 Windows validation checklist.

## Preserved

Service-backed PDF to Word, Preserve layout, Editable text, English/Bangla OCR, page ranges, separate/combined downloads, same-origin proxying, offline recovery, all 32 tools, 33 routes, NovaPDF UX, exact allowed development origins, the 68-file Step 12.8 backend source, Docker-volume protection, and the deferred Request Signatures boundary.
