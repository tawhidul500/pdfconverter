# NovaPDF Step 13.5 Validation Report

## Grounded Windows result received

The supplied v0.13.4 one-click runner output proves that Docker Desktop and all four local services were healthy, the private MinIO bucket was initialized, the root public-registry clean install completed, and the root audit was captured without an automatic fix. The run then stopped at Root ESLint with five errors and one warning.

## Corrective work completed

- Corrected both `react-hooks/set-state-in-effect` findings using cancellable animation-frame callbacks.
- Corrected all three Split PDF `react-hooks/immutability` declaration-order findings by moving effects below the functions they access.
- Removed the unused Sign PDF helper warning.
- Added a 19-check corrective source contract and updated the one-click runner/checklist to v0.13.5.

## Completed in the packaging environment

- All 20 dependency-free source contracts passed.
- The new Step 13.5 corrective contract passed 19 checks.
- The preserved Step 13.4 contract passed 57 checks.
- The preserved Step 13.3 contract passed 91 checks.
- The preserved Edit PDF contract passed 43 checks.
- The preserved Sign PDF corrective contract passed 22 checks.
- The preserved one-click runner contract passed 32 checks.
- The preserved Step 12.8 backend/corrective contract passed 36 checks.
- TypeScript/TSX syntax transpilation passed.
- JSON parsing, registry hygiene, route manifest, exact development origins, and Windows batch safety checks passed.
- No Docker command was executed in the packaging environment and no Docker volume was changed.

## Dependency-backed gate limitation

The packaging environment could not complete the project dependency tree because its internal npm gateway did not contain `zod-validation-error-4.0.2.tgz`, while direct public-registry access was unavailable. Partial `node_modules` content was removed before packaging.

Therefore this report does not certify the v0.13.5 rerun of:

- Root ESLint;
- semantic TypeScript;
- 11 PDF-engine tests;
- production build;
- live 33-route runtime checks;
- backend install/build/runtime/E2E;
- Windows Chrome manual checks;
- controlled security regression;
- production-provider delivery and signed webhook verification.

Run `RUN_NOVAPDF_ALL.cmd` on Windows and retain the timestamped `validation-logs`.
