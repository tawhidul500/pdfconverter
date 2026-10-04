# Running NovaPDF 0.13.7 on Windows

## Recommended one-click run

1. Extract the source ZIP to a new short local path:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_7_Viewer_Visibility_Duplicate_Portal_Corrective
```

2. Do not extract over an older NovaPDF folder.
3. Keep `RUN_NOVAPDF_ALL.cmd` in the project root.
4. Double-click `RUN_NOVAPDF_ALL.cmd`.
5. Approve Docker Desktop startup if Windows requests it.
6. Keep the Web, API, and Worker CMD windows open.
7. Review the timestamped reports in `validation-logs`.
8. Complete every item in `WINDOWS_VALIDATION_STEP_13_7.md`.

The runner preserves existing Docker volumes and an existing `backend\.env`. It never runs `docker compose down -v`, `npm audit fix`, or `npm audit fix --force`.

## What the runner does automatically

- Uses public npm registry URLs for project installs.
- Starts PostgreSQL, Redis, MinIO, and Mailpit.
- Clean-installs and validates the root web application.
- Generates a fresh public-registry backend lock and validates the backend.
- Verifies the committed PostgreSQL migration and confirms no migration is pending.
- Opens separate Web, API, and Worker CMD windows.
- Checks live/ready health, all 33 HTTP routes, and the local sequential two-recipient E2E.
- Opens the homepage, Sign PDF, Edit PDF, Watermark PDF, Crop PDF, API docs, Mailpit, MinIO Console, and the manual checklist.

## Main URLs

```text
Homepage:        http://localhost:3000/
Sign PDF:        http://localhost:3000/sign-pdf
Edit PDF:        http://localhost:3000/edit-pdf
Watermark PDF:   http://localhost:3000/watermark-pdf
Crop PDF:        http://localhost:3000/crop-pdf
API live:        http://localhost:4000/api/v1/health/live
API ready:       http://localhost:4000/api/v1/health/ready
API docs:        http://localhost:4000/api/docs
Mailpit:         http://localhost:8025
MinIO Console:   http://localhost:9001
```

## Web-only development run

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_7_Viewer_Visibility_Duplicate_Portal_Corrective
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd run dev
```

Open `http://localhost:3000/`.

## Manual validation commands

```powershell
npm.cmd audit
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:contracts
npm.cmd run test:pdf-engines
npm.cmd run build
npm.cmd run start
```

In a second PowerShell window:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_7_Viewer_Visibility_Duplicate_Portal_Corrective
npm.cmd run test:http-routes
```

Expected project gates:

```text
22 dependency-free source contracts
11 PDF-engine tests
33 HTTP routes
```

## Important boundary

Request Signatures remains disabled and is not Working. Do not begin Step 12.9 or promote the release until the complete automated, Chrome, controlled-security, and production-provider gates pass.
