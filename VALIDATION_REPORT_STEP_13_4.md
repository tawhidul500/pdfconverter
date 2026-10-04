# NovaPDF Step 13.4 Validation Report

## Completed in the packaging environment

- All 19 dependency-free source contracts passed.
- The new Step 13.4 shared-guides/aspect-resize contract passed 57 checks.
- The preserved Step 13.3 contract passed 91 checks.
- The preserved Step 13 Edit PDF contract passed 43 checks.
- The preserved Step 13.1 Sign PDF corrective contract passed 22 checks.
- The preserved Step 13.2 runner contract passed 32 checks.
- The preserved Step 12.8 backend/corrective contract passed 36 checks.
- All 92 TypeScript/TSX source and test files passed syntax transpilation.
- Shared geometry runtime smoke checks passed for center snapping and proportional resizing.
- JSON files parsed successfully.
- CSS delimiter and block balance passed.
- The 32-tool and 33-route manifest remains intact.
- Root and backend project registry files retain public npm registry URLs.
- Exact `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]` remains present.
- `RUN_NOVAPDF_ALL.cmd` remains a CRLF Windows batch file.
- No Docker command was executed and no Docker volume was changed.

## Backend preservation

The backend source, tests, configuration, and lock state are unchanged from the v0.13.3 source package. Request Signatures remains disabled and not Working.

## Dependency-backed gate limitation

The packaging environment does not contain the project dependency tree. A fresh `npm ci --registry=https://registry.npmjs.org/` attempt was redirected through the environment's internal package gateway and did not complete a valid dependency tree; the partial `node_modules` directory was removed before packaging. No project registry URL or lockfile source was weakened.

Therefore this report does not certify:

- root npm clean install or audit;
- ESLint;
- semantic TypeScript;
- 11 dependency-backed PDF-engine tests;
- Next.js production build;
- live 33-route runtime checks;
- Windows Chrome manual checks;
- backend install/build/runtime/E2E;
- production-provider delivery or signed webhook verification.

Run `RUN_NOVAPDF_ALL.cmd` on Windows with Docker Desktop and direct public npm access, then complete `WINDOWS_VALIDATION_STEP_13_4.md`.
