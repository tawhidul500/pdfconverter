# Validation Report — Step 14.4

## Input evidence

The real Windows v0.14.3 runner successfully started PostgreSQL, Redis, MinIO, Mailpit, and the PDF converter; passed converter health; passed all five converter/OCR tests; initialized private storage; and completed the Root clean install. It then stopped at Root ESLint with four errors in `src/components/pdf-to-word-workspace.tsx`.

## Corrections

1. Removed the synchronous `setConverterState` and `setConverterMessage` calls from the converter-health effect. Initial component state and explicit Retry still provide the checking UI.
2. Escaped the three JSX apostrophes reported by `react/no-unescaped-entities`.
3. Added a dedicated Step 14.4 regression contract.
4. Updated current runner and converter health identifiers to 0.14.4.

## Sandbox validation completed

- Dependency-free source contracts: **26/26 passed**.
- Step 14.4 corrective contract: **11/11 passed**.
- TypeScript/TSX isolated syntax transpilation: **100/100 passed**.
- MJS syntax checks: **47/47 passed**.
- Converter functional tests: **5/5 passed**, including English and Bangla OCR.
- Root lockfile resolved URLs: **464/464 public `registry.npmjs.org`**.
- Step 12.8 backend: **68/68 files byte-for-byte unchanged** from v0.14.3.
- Exact allowed development origins preserved.
- Supplied runner contains no Docker-volume deletion and no automatic audit fix.

## Not completed in the sandbox

The clean npm dependency installation timed out in this environment, so the full Root ESLint, semantic TypeScript, production build, complete PDF-engine suite, backend runtime gates, HTTP routes, and E2E must be rerun on Windows. The four exact ESLint findings from the supplied Windows log are directly corrected and protected by the Step 14.4 contract.

## Classification

Working implementation candidate. Promotion requires the complete Windows runner and manual checklist.
