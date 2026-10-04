# Validation Report — Step 14.7

## Windows evidence received

The supplied Windows command used Node.js v24.18.0 and produced:

```text
[NovaPDF] PDF converter is already online.
Error: spawn EINVAL
... scripts/start-novapdf-dev.mjs:55:15
```

The launcher was calling `spawn("npx.cmd", ["next", "dev"])` without a shell. Modern Node.js rejects direct `.cmd`/`.bat` child-process execution without a shell on Windows. The converter itself was healthy; the failure occurred before Next.js could start.

## Correction

The Step 14.7 launcher now:

1. Resolves `<project>/node_modules/next/dist/bin/next`.
2. Executes that JavaScript CLI with `process.execPath` and the `dev` argument.
3. Sets the project root as `cwd`.
4. Avoids `.cmd` execution and avoids `shell: true`.
5. Handles missing dependencies and child spawn errors explicitly.

This is cross-platform and avoids shell quoting/injection ambiguity.

## Validation completed

- Dependency-free source contracts: **29/29 passed**.
- Step 14.7 corrective contract: **15/15 passed**.
- Launcher functional stub test: passed using a temporary local Next.js CLI fixture.
- JavaScript/MJS syntax checks: passed.
- Python syntax checks: passed.
- Converter functional tests: **5/5 passed**.
- Root lockfile resolved URLs remain public `registry.npmjs.org` only.
- Step 12.8 backend source remains unchanged from Step 14.6.
- Exact allowed development origins preserved.
- Runner contains no Docker-volume deletion and no automatic audit fix.

## Remaining Windows boundary

Run the v0.14.7 one-click runner. Confirm migration apply/show/idempotency, Web/API/Worker windows, live/ready health, all 33 routes, local E2E, `npm.cmd run dev`, and the complete Microsoft Word/OCR browser checklist.

## Classification

Working implementation candidate. Request Signatures remains disabled and is not promoted to Working.
