# Running NovaPDF 0.13.5 on Windows

## Recommended one-click run

1. Extract the source ZIP to:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_5_Windows_Runner_ESLint_Corrective_1
```

2. Keep `RUN_NOVAPDF_ALL.cmd` in the project root.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Approve Docker Desktop startup if Windows asks.
5. Do not close the Web, API, or Worker CMD windows opened by the runner.
6. Review the final summary and timestamped files in `validation-logs`.
7. Complete the Chrome checklist opened by the runner.

The runner preserves Docker volumes and an existing `backend\.env`. It never runs `docker compose down -v`, `npm audit fix`, or `npm audit fix --force`.

## What happens automatically

The runner:

- uses the public npm registry;
- starts PostgreSQL, Redis, MinIO, and Mailpit;
- clean-installs and validates the web app;
- clean-installs and validates the backend;
- verifies the committed migration and no pending migration;
- opens Web, API, and Worker CMD windows;
- checks health, 33 routes, and the local two-recipient E2E;
- opens the relevant browser pages and manual checklist.

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
cd C:\NovaPDF\NovaPDF_Build_Step_13_5_Windows_Runner_ESLint_Corrective_1
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd run dev
```

Then open `http://localhost:3000/`.

## Expected corrective checkpoint

The previous run stopped at Root ESLint. In v0.13.5 the runner must pass Root ESLint and continue to Root TypeScript, 20 source contracts, 11 PDF-engine tests, production build, backend validation, migration checks, runtime health, routes, and local E2E.

## Important boundary

Request Signatures remains disabled and is not Working. Do not start Step 12.9 or promote pending work until the complete automated, browser, controlled-security, and production-provider gates pass.
