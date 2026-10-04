# NovaPDF 0.14.12 — Windows Service Launch Path Corrective

## Scope

This corrective replaces the nested `cmd.exe /k "cd /d ..."` Web/API/Worker launch commands that produced `The system cannot find the path specified` in the three service windows.

## Changes

- Added self-locating CRLF launchers for Web, API, and Worker.
- Added a PowerShell process orchestrator that passes the package directory through `Start-Process -WorkingDirectory` rather than embedding it inside a nested CMD command string.
- Starts the local Next.js CLI and compiled backend entry points directly with Node.js.
- Keeps current-version Web verification, API health, 33-route validation, and local E2E gates.
- Preserves every Docker volume and does not run automatic npm audit remediation.
- Request Signatures remains disabled.
