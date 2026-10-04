# NovaPDF Step 13.2 Windows Validation

## Primary one-click process

1. Extract the source ZIP to:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_2_One_Click_Windows_Runner
```

2. Make sure Node.js and Docker Desktop are installed.
3. Open the extracted project folder.
4. Double-click `RUN_NOVAPDF_ALL.cmd`.

Do not move the CMD file outside the project folder. It resolves all paths from its own location.

## What the runner performs automatically

The runner:

- checks Node.js, npm, PowerShell, Docker CLI, and Docker Desktop;
- starts Docker Desktop if the engine is not ready;
- preserves all existing Docker volumes;
- creates `backend\.env` from `.env.example` only when `.env` does not already exist;
- starts PostgreSQL, Redis, MinIO, and Mailpit and confirms they are ready;
- initializes the private MinIO bucket;
- enforces `https://registry.npmjs.org/` and rejects private-registry references in project registry files;
- removes only root/backend `node_modules` and generates a fresh backend public-registry lock;
- runs root clean install, audit capture, ESLint, TypeScript, all 17 source contracts, all 11 PDF-engine tests, and the production build;
- runs backend audit capture, ESLint, TypeScript, build, unit tests, runtime metadata test, migration status, and migration run;
- requires `[X] CreateSignatureRequestBackend1721800000000` and `No migrations are pending`;
- opens separate persistent CMD windows for NovaPDF Web, API, and Worker;
- verifies API live and ready endpoints;
- runs all 33 HTTP route checks;
- runs the real local Mailpit/MinIO/PostgreSQL/Redis sequential two-recipient E2E;
- opens Sign PDF, Edit PDF, API health, API docs, Mailpit, MinIO Console, and this checklist;
- writes audit, migration, and summary files to `validation-logs`.

The runner never runs `docker compose down -v`, never deletes Docker volumes, and never runs `npm audit fix` or `npm audit fix --force`.

## Expected open CMD windows

Keep these windows open while testing:

- `NovaPDF Web`
- `NovaPDF API`
- `NovaPDF Worker`
- the original runner window

The runner reuses an already healthy Web/API process rather than starting a duplicate. It also checks for an existing TypeScript worker process.

## Expected automated gates

```text
17 dependency-free source contracts
11 dependency-backed PDF-engine tests
33 HTTP routes
Backend unit and metadata tests
Applied Step 12.8 migration
No pending migration
Real local sequential two-recipient E2E
```

`npm audit` may return a nonzero status when findings exist. The runner captures the exact report, displays a warning, and continues without applying an automatic fix. Audit findings still require review before release promotion.

## Sign PDF corrective Chrome checklist

Use a multi-page PDF, a rotated/cropped PDF, a long full name, and the first two typed-signature styles. Record Pass/Fail and a screenshot for every item.

1. Signature, Initials, Name, Date, Text, Input field, Checkbox, and Company stamp can shrink continuously to a tiny usable size and export at that size.
2. Every selected field has **Edit**. Every type except Company stamp has **Change color**.
3. Every right-side field row has its own Edit control.
4. The inline editor has a clear **Done** action and retains changes.
5. The output filename area has a clear label, helper text, visible input, spacing, and separate `.pdf` suffix.
6. The old **Text or input value** control is absent.
7. No red required star appears on any canvas field; required validation still works.
8. Long typed signatures in the first two styles are not clipped in preview or export.
9. The prior browser-local name and initials restore, and the name pre-fills the signature text box.
10. `Page X of Y` remains at the bottom of the Sign PDF center workspace.
11. `Page X of Y` remains at the bottom of the Edit PDF center workspace.
12. Date fields use US English display such as `Jul 30, 2026`.
13. Undo/Redo, drag, resize, rotate, duplicate, delete, keyboard movement, snapping, file transfer, Start over, and home reset still work.
14. Export preserves page count, order, dimensions, crop boxes, existing content, and rotations.
15. **Several people / Request signatures** remains disabled and is not presented as Working.

## Edit PDF checklist

Complete the ten-item checklist preserved in `WINDOWS_VALIDATION_STEP_13.md`. Edit PDF remains an implementation candidate until every automated and manual gate passes.

## What is still not automatic

The runner cannot truthfully complete visual/manual Chrome acceptance or production-provider delivery because those require human inspection and real provider credentials. Complete the manual checklists and the selected production email/object-storage/webhook gate before promotion.

## Failure behavior

The runner stops at the first failed non-audit gate and shows the failed step. Review the CMD output and `validation-logs`. Fix the cause, close stale service windows if necessary, and double-click the same file again.

## Release boundary

Do not begin Step 12.9 Request Signatures UI integration. Do not mark Request signatures Working. Do not promote the v0.13.1 Sign PDF corrections or Edit PDF until automated Windows gates, manual browser verification, controlled root security regression, and production-provider delivery pass.
