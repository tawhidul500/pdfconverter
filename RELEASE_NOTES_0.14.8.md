# NovaPDF 0.14.8 Release Notes

## Fixed

- Corrected the PostgreSQL migration verification false failure after a successful TypeORM migration run.
- TypeORM currently reports applied migrations as `[X] 1 CreateSignatureRequestBackend1721800000000`; the prior runner required the older exact text `[X] CreateSignatureRequestBackend1721800000000`.
- Added a dedicated Node-based migration-show parser that accepts the current counter-bearing format, the legacy no-counter format, surrounding whitespace, and ANSI-colored output.
- Pending `[ ]` migrations and wrong migration names continue to fail the gate.

## Preserved

The Step 14.7 Node 24-safe development launcher, Step 14.6 apply/show/idempotency order, service-backed PDF to Word, Preserve layout, Editable text, English/Bangla OCR, all 32 tools, 33 routes, exact allowed development origins, Step 12.8 backend source, Docker-volume protection, public-registry policy, and deferred Request Signatures boundary.
