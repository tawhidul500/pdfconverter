# Running NovaPDF v0.14.0 on Windows

## Required software

- Windows 10 or 11
- Node.js and npm
- Docker Desktop with Docker Compose
- Google Chrome for the manual browser checklist

## One-click run

1. Extract the ZIP to a fresh folder.
2. Do not delete Docker volumes or your existing `backend/.env`.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Keep the Web, API, and Worker CMD windows open.
5. Complete every item in `WINDOWS_VALIDATION_STEP_14_0.md`.
6. Keep the generated `validation-logs` folder.

The runner performs the public-registry clean install, audit capture, lint, TypeScript, 23 source contracts, 11 PDF-engine tests, production build, backend gates, migration checks, health checks, 33-route check, and local E2E. It does not delete Docker volumes and does not run an automatic npm audit fix.

## Direct frontend route

```text
http://localhost:3000/pdf-to-word
```

PDF to Word is a frontend candidate. Review conversion setup must not produce a DOCX in this milestone.

## Manual development commands

```bat
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:contracts
npm.cmd run test:pdf-engines
npm.cmd run build
npm.cmd run dev
```

## Locked scope

- Preserve all 32 tools and 33 routes.
- Preserve the Step 12.8 backend.
- Preserve `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Do not use `npm audit fix --force`.
- Do not mark PDF to Word Working.
- Defer Request Signatures until the final major feature milestone.
