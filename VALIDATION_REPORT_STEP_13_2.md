# NovaPDF Step 13.2 Validation Report

## Completed in the packaging environment

- Inspected the v0.13.1 source package and current Windows validation commands.
- Added the single-file Windows runner `RUN_NOVAPDF_ALL.cmd` with CRLF line endings.
- Added automatic prerequisite checks, Docker readiness, infrastructure startup, root/backend gates, migration verification, persistent service windows, health checks, 33-route execution, local E2E, browser opening, and timestamped logs.
- Preserved existing Docker volumes and existing backend environment files by construction.
- Added and passed a Step 13.2 source contract with 32 checks.
- All 17 dependency-free source contracts passed.
- The preserved Step 13 Edit PDF contract passed 43 checks.
- The preserved Step 13.1 Sign PDF contract passed 22 checks.
- The preserved Step 12.8 backend/corrective contract passed 36 checks.
- Confirmed the runner contains no `docker compose down -v`, `npm audit fix`, or `npm audit fix --force` command.
- Confirmed project registry policy remains public npm only.
- Confirmed `src`, `backend/src`, `backend/test`, and `public` are byte-for-byte unchanged from v0.13.1.
- Confirmed the runner uses CRLF line endings and all referenced labels/files exist.

## Not executable in the packaging environment

The Windows CMD runner, Docker Desktop, clean npm installs, live services, browser checklists, and production-provider delivery cannot be executed in this Linux packaging environment. The source contract validates the required command topology, safety boundaries, paths, and documentation, but Windows remains the authoritative runtime gate.

## Required Windows result

Double-click `RUN_NOVAPDF_ALL.cmd`. It must complete every automated gate and open the manual checklist. Retain the generated `validation-logs` as acceptance evidence.
