# NovaPDF Step 13.7 Validation Report

## Packaging validation completed

- Package metadata updated to 0.13.7.
- All 22 dependency-free source contracts passed.
- The Step 13.7 corrective contract passed 16 checks.
- The preserved Step 13.6 contract passed 32 checks.
- The Step 13.5 corrective contract passed 19 checks.
- The Step 13.4 interaction contract passed 57 checks.
- The Step 13.3 shared-controls contract passed 91 checks.
- The Edit PDF contract passed 43 checks.
- The Step 12.8 backend architecture contract passed 36 checks.
- Route manifest retained 33 routes: homepage plus 32 tools.
- Syntax transpilation completed for all 92 TypeScript/TSX source and test files with zero syntax diagnostics.
- JSON parsing, CSS brace balance, resolved public-registry lock hygiene, runner CRLF, and forbidden-command checks passed.
- Backend source comparison against v0.13.6 reports 68 unchanged files and zero backend changes.

## Root cause confirmed

All generic tool workspaces remain mounted so their state can be preserved when users switch tools. Before v0.13.7, each hidden generic workspace rendered `WorkspaceZoomControls` with the component's default `active=true`. Because the controls use `createPortal(..., document.body)`, the hidden parent did not hide those portals. Multiple viewer cards and shadows therefore stacked in the same bottom-center position, causing the large background spot and making the viewer visible on upload screens.

The corrective makes the shared portal opt-in, passes explicit route activity to generic workspaces, and requires at least one accepted file before a generic viewer is active.

## Dependency-backed gates not certified in the packaging environment

A root `npm ci --ignore-scripts` attempt reached the sandbox's internal npm gateway but failed because that gateway does not contain `zod-validation-error-4.0.2.tgz`. Partial `node_modules` and `.next` directories were removed before packaging. The project lockfile still contains public `registry.npmjs.org` resolved URLs only. The following gates must be completed by `RUN_NOVAPDF_ALL.cmd` on Windows:

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

Version 0.13.7 is a source corrective candidate. It must not be promoted to proven Working status until the Windows automation and manual checklist pass. Request Signatures remains disabled and not Working.
