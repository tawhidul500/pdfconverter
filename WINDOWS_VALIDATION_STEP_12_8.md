# NovaPDF Step 12.8 Windows Validation - Corrective Package 5

Use `NovaPDF_Build_Step_12_8_Windows_Corrective_5.zip`. These commands are for **Command Prompt (CMD)**. Enter one command at a time.

## 1. Extract Corrective Package 5

Put the ZIP here:

```text
C:\Users\HP\Downloads\NovaPDF_Build_Step_12_8_Windows_Corrective_5.zip
```

Run:

```cmd
cd /d C:\
rmdir /s /q C:\NovaPDF\NovaPDF_Build_Step_12_8 2>nul
mkdir C:\NovaPDF 2>nul
powershell.exe -NoProfile -Command "Expand-Archive -LiteralPath '%USERPROFILE%\Downloads\NovaPDF_Build_Step_12_8_Windows_Corrective_5.zip' -DestinationPath 'C:\NovaPDF' -Force"
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8
dir package.json package-lock.json backend\package.json
```

Do not continue unless all three files are listed. Do not delete Docker volumes.

## 2. Focused source gate

```cmd
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd ci
npm.cmd run test:contracts
```

Expected ending:

```text
Step 12.8 request-signatures backend contract passed (36 checks).
All 14 dependency-free source contracts passed.
```

## 3. Confirm existing infrastructure and environment

```cmd
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
docker info
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8
copy /Y backend\.env.example backend\.env
docker compose up -d postgres redis minio minio-init mailpit
docker compose ps
```

`docker info` must contain `Server:`. PostgreSQL, Redis, MinIO, and Mailpit must be running/healthy.

## 4. Install the corrected backend runtime

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd install --registry=https://registry.npmjs.org/
findstr /I /C:"artifactory" /C:"applied-caas" /C:"verdaccio" package-lock.json
```

`findstr` must print nothing. Then run:

```cmd
rmdir /s /q node_modules
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd audit
```

Do not run `npm audit fix` or `npm audit fix --force`.

## 5. Backend compile, unit, and runtime-metadata gate

Run one at a time and stop at the first failure:

```cmd
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test
npm.cmd run test:metadata
```

Expected unit summary now includes eight tests: the seven existing backend tests plus one metadata regression test. The metadata test must report:

```text
ts-node runtime emits Nest constructor metadata and loads every TypeORM entity
```

## 6. Confirm the existing migration

The migration already committed in the existing Docker volume. Check it:

```cmd
npm.cmd exec typeorm-ts-node-commonjs -- -d src/database/data-source.ts migration:show
```

Expected:

```text
[X] CreateSignatureRequestBackend1721800000000
```

Then:

```cmd
npm.cmd run migration:run
```

It should report no pending/new migration. Do not reset the database or delete Docker volumes.

## 7. Start the API

In CMD window 1:

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
npm.cmd run dev
```

The command now uses `node --watch -r ts-node/register`, not `tsx watch`. It must stay running and show:

```text
NovaPDF API listening on http://localhost:4000
```

Open:

```text
http://localhost:4000/api/v1/health/live
http://localhost:4000/api/v1/health/ready
http://localhost:4000/api/docs
```

## 8. Start the worker

In CMD window 2:

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
npm.cmd run dev:worker
```

Expected:

```text
NovaPDF email, lifecycle, and PDF workers are ready.
```

## 9. Run the real backend E2E

In CMD window 3:

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
set RUN_BACKEND_E2E=1
npm.cmd run test:e2e
set RUN_BACKEND_E2E=
```

The single E2E must pass real Mailpit invitations/completion email, expiring links, sequential two-recipient completion, final PDF generation/download, completed status, and database-enforced append-only audit behavior.

## 10. Manual Sign PDF checklist

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8
npm.cmd run dev
```

Open the exact Local URL shown and add `/sign-pdf`. Upload:

```text
C:\NovaPDF\NovaPDF_Build_Step_12_8\test-files\sample-six-pages.pdf
```

Record pass/fail for all ten items:

1. Full name starts empty.
2. Initials starts empty.
3. Initials has Type, Draw, and Upload modes.
4. Every page appears in one continuous centre canvas.
5. Centre-canvas scrolling updates the active thumbnail without page skipping.
6. Clicking a thumbnail navigates to the correct centre page.
7. Toolbar zoom and Ctrl+mouse-wheel share the 50-200 percent state.
8. Text and Input fields can be dropped on any page and edited inline.
9. Drag, resize, Duplicate/Delete, and text/input Edit controls remain stable.
10. Download produces a real PDF containing the placed fields.

Request signatures remains disabled and is not Working until E2E, manual verification, controlled root security regression, and production-provider delivery all pass.
