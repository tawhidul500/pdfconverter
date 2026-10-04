# NovaPDF v0.13.2 Release Notes

**Date:** July 30, 2026  
**Milestone:** Step 13.2 one-click Windows runner

## Added

- `RUN_NOVAPDF_ALL.cmd`, a project-root one-click runner for Windows.
- Automatic Docker Desktop readiness and local PostgreSQL, Redis, MinIO, and Mailpit startup without volume deletion.
- Automatic root and backend public-registry clean installs, audit capture, lint, TypeScript, tests, build, migration, health, routes, and real local E2E gates.
- Separate persistent CMD windows for NovaPDF Web, API, and Worker.
- Automatic opening of Sign PDF, Edit PDF, health endpoints, API docs, Mailpit, MinIO Console, and the manual acceptance guide.
- Timestamped validation reports under `validation-logs`.
- A 32-check source contract that prevents loss of the one-click runner requirements.

## Preserved

- All v0.13.1 Sign PDF corrections.
- The Step 13 Edit PDF implementation candidate.
- All 32 tools, 33 routes, 11 previously proven engines, design, right-side panels, preview behavior, one-way canvas controller, lazy active-neighborhood previews, 50–200% zoom, file transfer, Start over, home reset, and exact allowed development origins.
- The Step 12.8 backend source and migration architecture.
- Request signatures remains disabled and not Working.

## Safety

The runner never deletes Docker volumes, never overwrites an existing `backend\.env`, rejects private npm registry references in project registry files, and never runs `npm audit fix` or `npm audit fix --force`.

## Acceptance boundary

The runner automates local command-driven gates. Visual Chrome acceptance and production-provider delivery remain manual/credentialed gates and must pass before status promotion or Request Signatures UI integration.
