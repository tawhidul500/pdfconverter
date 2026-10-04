# Running NovaPDF v0.14.1 on Windows

## Required software

- Windows 10 or 11
- Node.js and npm
- Docker Desktop with Docker Compose
- Google Chrome for browser validation
- Microsoft Word desktop for final DOCX acceptance

## One-click run

1. Extract the ZIP to a fresh, short local path such as `C:\NovaPDF\NovaPDF_Build_Step_14_1_PDF_To_Word_Working_Candidate`.
2. Do not delete Docker volumes or overwrite an existing `backend/.env` without reviewing it.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Keep the Web, API, and Worker CMD windows open.
5. Complete every item in `WINDOWS_VALIDATION_STEP_14_1.md`.
6. Retain the generated `validation-logs` folder and acceptance screenshots.

The runner performs the public-registry clean install, audit capture without fixes, lint, semantic TypeScript, 23 source contracts, 12 PDF-engine tests, production build, unchanged backend gates, migration checks, health checks, all 33 routes, and local backend E2E. It preserves Docker volumes and never runs `npm audit fix` or `npm audit fix --force`.

## Direct frontend route

```text
http://localhost:3000/pdf-to-word
```

PDF to Word has a real browser-local engine with Preserve layout and Editable text modes. It remains an implementation candidate until the full Windows/browser/Microsoft Word checklist passes.

## Manual development commands

```bat
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd audit --registry=https://registry.npmjs.org/
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:contracts
npm.cmd run test:pdf-engines
npm.cmd run build
npm.cmd run dev
```

## Locked scope

- Preserve all 32 tools and 33 routes.
- Preserve the byte-identical Step 12.8 backend.
- Preserve `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Use public npm registry URLs only.
- Do not delete Docker volumes.
- Do not run automatic audit fixes.
- Keep Request Signatures disabled until the final major feature milestone.
- Build every other normal tool as a complete functional tool, not a frontend-only placeholder.
