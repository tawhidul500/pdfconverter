# Validation Report — Step 14.6

## Windows evidence received

The real Windows v0.14.5 run completed the following successfully:

- Docker infrastructure and PDF converter startup.
- Converter health and all **5/5** native-text, preserve-layout, mixed-orientation, English OCR, and Bangla OCR tests.
- Root public-registry clean install and audit capture.
- Root ESLint and semantic TypeScript.
- All **27/27** packaged source contracts in v0.14.5.
- All **12/12** dependency-backed PDF-engine tests.
- Next.js production build and all generated routes.
- Backend public-registry lock/install, audit capture, ESLint, TypeScript, build, unit tests, and metadata test.

The run then showed:

```text
[ ] CreateSignatureRequestBackend1721800000000
[ERROR] The committed Step 12.8 migration was not shown as applied.
```

The database was fresh, so `[ ]` correctly meant the migration was pending. The v0.14.5 runner incorrectly treated that expected pre-application state as a failure and never reached its later `migration:run` command.

## Correction

The Step 14.6 runner now performs this deterministic sequence:

1. `npm.cmd run migration:run` — applies the migration when pending, or succeeds with no changes when already applied.
2. `migration:show` — must contain `[X] CreateSignatureRequestBackend1721800000000`.
3. A second `npm.cmd run migration:run` — must report `No migrations are pending`.

This supports both fresh and existing databases and does not delete or reset any Docker volume.

## Packaging validation completed

- Dependency-free source contracts: **28/28 passed**.
- Step 14.6 corrective contract: **12/12 passed**.
- TypeScript/TSX isolated syntax transpilation: **100/100 passed**.
- MJS syntax checks: **45/45 passed**.
- Python syntax checks: passed.
- Converter functional tests: **5/5 passed**, including English and Bangla OCR.
- Root lockfile resolved URLs: **464/464 public `registry.npmjs.org`**.
- Step 12.8 backend source: **68/68 files byte-for-byte unchanged** from v0.14.5.
- Exact allowed development origins preserved.
- Supplied runner contains no Docker-volume deletion and no automatic audit fix.

## Remaining Windows boundary

Rerun the one-click runner and confirm migration apply/show/idempotency, API/worker launch, live and ready health, all 33 routes, real local two-recipient E2E, and the complete browser/Microsoft Word checklist.

## Classification

Working implementation candidate. Request Signatures remains disabled and is not promoted to Working.
