# Validation Report — Step 14.10

## Windows evidence received

The Step 14.9 runner stopped during the initial PowerShell check with `The system cannot find the batch label specified - require_command`. Inspection found that Step 14.9 was the first recent package where `RUN_NOVAPDF_ALL.cmd` and `START_PDF_CONVERTER.cmd` contained bare LF line endings; Step 14.7 and Step 14.8 used CRLF. The `:require_command` label was present, so the failure was a Windows CMD parsing/packaging regression rather than a missing source label or missing PowerShell installation.

## Correction

1. Converted both Windows `.cmd` files to CRLF-only, BOM-free bytes.
2. Replaced the four startup `call :require_command` calls with inline `where` checks.
3. Removed the now-unused `:require_command` subroutine.
4. Added `test-step-14-10-windows-cmd-crlf-label.mjs`, which reads raw bytes and rejects bare LF, BOMs, missing labels, wrong version/checklist, volume deletion, or audit-fix commands.

## Validation completed in packaging

- Dependency-free source contracts: **32/32 passed**.
- Step 14.10 raw-byte/source checks: **14/14 passed**.
- JavaScript/MJS syntax: **50 files passed**.
- TypeScript/TSX isolated transpilation: **41/41 files passed**.
- Python conversion-service syntax passed.
- Converter/OCR functional tests: **5/5 passed**.
- Step 12.8 backend: **68/68 files byte-for-byte unchanged from Step 14.9**.
- Root lock resolved URLs: **464/464 public npm registry**.
- Exact allowed development origins, Docker-volume protection, and no-forced-audit-fix boundary are preserved.

## Remaining Windows boundary

Run the complete Step 14.10 one-click sequence. Confirm the four initial dependency checks, then continue through converter tests, root gates, production build, backend migration/health/routes/E2E, and the complete PDF-to-Word/OCR manual acceptance.

## Classification

Working corrective candidate. Request Signatures remains disabled and will be implemented last.
