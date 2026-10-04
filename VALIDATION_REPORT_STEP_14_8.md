# Validation Report — Step 14.8

## Windows evidence received

The v0.14.7 Windows runner successfully completed converter/OCR tests, root clean install, ESLint, semantic TypeScript, 29 source contracts, all 12 PDF-engine tests, production build, backend lint/typecheck/build/tests, and the actual migration transaction. TypeORM reported:

```text
Migration CreateSignatureRequestBackend1721800000000 has been executed successfully.
[X] 1 CreateSignatureRequestBackend1721800000000
```

The runner then failed because it searched for the exact legacy substring `[X] CreateSignatureRequestBackend1721800000000`, which does not include TypeORM's numeric ordering column. This was a runner parser false negative, not a database or migration failure.

## Correction

Step 14.8 adds `scripts/verify-migration-show.mjs`. The runner passes the captured migration-show log to this parser. It:

1. Reads the redirected TypeORM output.
2. Removes ANSI terminal sequences.
3. Requires an applied `[X]` marker.
4. Accepts an optional numeric migration-order field.
5. Requires the exact committed migration name.
6. Rejects pending `[ ]` output and unrelated migrations.

## Validation completed

- Dependency-free source contracts: **30/30 passed**.
- Step 14.8 source checks: **11/11 passed**.
- Migration parser functional fixtures: **5/5 passed**.
- MJS syntax checks passed.
- Converter/OCR functional tests: **5/5 passed**.
- TypeScript/TSX application source remains byte-for-byte unchanged from the Windows-validated Step 14.7 package.
- Step 12.8 backend tree remains byte-for-byte unchanged from Step 14.7.
- Public npm registry policy, exact allowed origins, Docker-volume protection, and no-force-audit policy remain intact.

## Remaining Windows boundary

Run the Step 14.8 one-click runner. The migration verification should now accept `[X] 1 CreateSignatureRequestBackend1721800000000`, then the second migration run must report `No migrations are pending`. Continue through Web/API/Worker launch, health, 33 routes, local E2E, and manual PDF-to-Word/OCR acceptance.

## Classification

Working implementation candidate. Request Signatures remains disabled and will be implemented last.
