# NovaPDF Step 13.6 Validation Report

## Packaging validation completed

- Package metadata updated to 0.13.6.
- All 21 dependency-free source contracts passed.
- The Step 13.6 contract passed 32 checks.
- The Step 13.5 corrective contract passed 19 checks.
- The Step 13.4 interaction contract passed 57 checks.
- The Step 13.3 shared controls contract passed 91 checks.
- The Edit PDF contract passed 43 checks.
- The Step 12.8 backend architecture contract passed 36 checks.
- Route manifest retained 33 routes: homepage plus 32 tools.
- Syntax transpilation completed for all 92 TypeScript/TSX source and test files with zero syntax diagnostics.
- JSON parsing, CSS brace balance, public-registry lock hygiene, runner CRLF, and forbidden-command checks passed.
- Backend source comparison against v0.13.5 reports zero changed backend files.

## Dependency-backed gates not certified in the packaging environment

The execution environment overrides npm to an internal package gateway that does not contain every public package tarball required by this lock. A clean install therefore cannot complete here even when the project requests `https://registry.npmjs.org/`. The project lock remains public-registry-only and was not rewritten to the internal gateway.

The following gates must be completed by `RUN_NOVAPDF_ALL.cmd` on Windows:

- Root ESLint.
- Semantic TypeScript.
- 11 PDF-engine tests.
- Production build.
- Backend dependency-backed gates.
- Migration/runtime health.
- 33 live HTTP routes.
- Local Mailpit/MinIO/PostgreSQL/Redis E2E.
- Chrome visual and interaction checklist.

## Release status

Version 0.13.6 is a source corrective candidate. It must not be promoted to proven Working status until the Windows automation and manual checklist pass. Request Signatures remains disabled and not Working.
