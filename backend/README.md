# NovaPDF Request Signatures Backend

This is the Step 12.8 API-first backend preview. Request signatures remains disabled in the NovaPDF frontend and is not a Working product claim.

## Local services

- NestJS API: `http://localhost:4000`
- Swagger: `http://localhost:4000/api/docs`
- Live health: `http://localhost:4000/api/v1/health/live`
- Ready health: `http://localhost:4000/api/v1/health/ready`
- Mailpit inbox: `http://localhost:8025`
- MinIO console: `http://localhost:9001`

## Windows Command Prompt setup

Open Docker Desktop first:

```cmd
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

Verify that the Docker engine, not only the CLI, is running:

```cmd
docker info
docker compose version
```

From the project root:

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8
copy /Y backend\.env.example backend\.env
docker compose up -d postgres redis minio minio-init mailpit
docker compose ps
```

Install and validate the separate backend package:

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd install --registry=https://registry.npmjs.org/
rmdir /s /q node_modules
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd audit
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test
npm.cmd run migration:run
```

Do not use `npm audit fix --force`. Corrective Package 3 explicitly updates the vulnerable Nodemailer path and pins the patched `js-yaml` transitive version.

## Run API and worker

API window:

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
npm.cmd run dev
```

Worker window:

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
npm.cmd run dev:worker
```

E2E window:

```cmd
cd /d C:\NovaPDF\NovaPDF_Build_Step_12_8\backend
set RUN_BACKEND_E2E=1
npm.cmd run test:e2e
set RUN_BACKEND_E2E=
```

The first successful `npm install` creates `backend\package-lock.json`. Keep that lockfile in all later packages and prove later installs with `npm ci`.


## Corrective Package 4 metadata note

TypeScript emits `design:type` as `Object` for nullable unions such as `string | null`. Every nullable bounded string entity column therefore declares an explicit PostgreSQL `varchar` type. Keep this rule for future nullable columns; otherwise TypeORM can fail metadata validation before migrations execute.
