# NovaPDF 0.14.7 Release Notes

## Fixed

- Corrected `npm.cmd run dev` on modern Windows/Node.js where direct `spawn("npx.cmd", ...)` failed with `spawn EINVAL`.
- The development launcher now resolves the installed local Next.js CLI and executes it with `process.execPath`.
- The launcher no longer depends on shell execution or a `.cmd` shim, avoiding quoting and command-injection ambiguity.
- Missing root dependencies now produce a controlled instruction to run `npm.cmd ci`.
- Spawn failures now have an explicit NovaPDF error handler.

## Preserved

The Step 14.6 migration apply/verify/idempotency correction, service-backed PDF to Word, Preserve layout, Editable text, English/Bangla OCR, page ranges, separate/combined downloads, same-origin proxying, offline recovery, all 32 tools, 33 routes, exact allowed development origins, the Step 12.8 backend source, Docker-volume protection, public-registry policy, and the deferred Request Signatures boundary.
