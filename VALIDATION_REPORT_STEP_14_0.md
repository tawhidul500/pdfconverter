# NovaPDF Build Step 14.0 Validation Report

## Candidate

- Version: `0.14.0`
- Milestone: PDF to Word dedicated frontend candidate
- Scope: frontend only; no DOCX engine or Request Signatures UI integration

## Packaging-environment results

### Passed

- 23 of 23 dependency-free source contracts.
- Step 14 PDF to Word contract: 22 of 22 checks.
- All 95 project TypeScript/TSX files passed syntax parsing.
- The new PDF to Word component passed an isolated strict-null semantic TypeScript check with local declaration stubs.
- PDF to Word is mounted as a dedicated workspace and removed from generic workspace mounting.
- All 32 tool registrations remain present.
- The route manifest still contains 33 routes.
- Shared viewer portal remains opt-in and PDF to Word requests it only when active and at least one PDF is loaded.
- Continuous, Single-page, Two-page, and Three-page CSS integration is present for PDF to Word source cards.
- File transfer, Start over, and home reset are present.
- OCR and DOCX execution remain truthfully deferred.
- Request Signatures remains disabled.
- Exact allowed development origins remain unchanged.
- No new runtime dependency was added.

### Preserved boundary

- The complete `backend` tree is unchanged from v0.13.7.
- Docker volumes are not deleted by the runner.
- The runner does not execute `npm audit fix` or `npm audit fix --force`.
- Root lockfile URLs remain public npm registry URLs only.

## Windows gates still required

The package is not promoted to a proven runtime result until Windows completes:

1. root `npm ci` from the public registry;
2. root audit capture without automatic fixes;
3. ESLint;
4. semantic TypeScript;
5. all 23 source contracts;
6. all 11 PDF-engine tests;
7. production build;
8. backend install, audit, lint, typecheck, build, unit and metadata tests;
9. migration show/run confirmation;
10. API and worker health;
11. all 33 live routes;
12. local Mailpit/MinIO/PostgreSQL/Redis E2E;
13. the complete `WINDOWS_VALIDATION_STEP_14_0.md` browser checklist.

## Promotion boundary

- Do not mark PDF to Word Working until a real DOCX engine, downloadable outputs, engine tests, and the full gate pass.
- Do not begin Request Signatures; it is deferred until the final major feature milestone.
