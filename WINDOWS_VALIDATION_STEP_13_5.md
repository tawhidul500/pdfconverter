# NovaPDF Step 13.5 Windows Validation

## 1. Corrective purpose

The v0.13.4 one-click runner successfully reached the public-registry clean install and audit capture, then stopped at Root ESLint with five errors and one warning. Version 0.13.5 corrects those exact findings without changing the backend or removing any v0.13.4 feature.

Corrected files:

- `src/components/edit-pdf-workspace.tsx`
- `src/components/workspace-zoom-controls.tsx`
- `src/components/split-pdf-workspace.tsx`
- `src/components/sign-pdf-workspace.tsx`

## 2. One-click execution

Extract the project to:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_5_Windows_Runner_ESLint_Corrective_1
```

Double-click `RUN_NOVAPDF_ALL.cmd` from the project root.

The runner must automatically:

1. verify Node.js, npm, PowerShell, Docker CLI, and Docker Desktop;
2. start PostgreSQL, Redis, MinIO, and Mailpit without deleting volumes;
3. preserve an existing `backend\.env`;
4. enforce `https://registry.npmjs.org/` for project installs;
5. run root clean install, audit capture, lint, semantic TypeScript, 20 source contracts, 11 PDF-engine tests, and production build;
6. generate a fresh backend public-registry lock and run clean install, audit, lint, typecheck, build, unit tests, and metadata test;
7. verify `[X] CreateSignatureRequestBackend1721800000000` and no pending migration;
8. open separate Web, API, and Worker CMD windows;
9. verify API live/ready, all 33 HTTP routes, and the real local sequential two-recipient E2E;
10. open the homepage, Sign PDF, Edit PDF, Watermark PDF, Crop PDF, API docs, Mailpit, MinIO Console, and this checklist.

Expected Root ESLint result:

```text
> novapdf@0.13.5 lint
> eslint
```

There must be no ESLint error or warning summary after this command.

Expected source-contract result:

```text
All 20 dependency-free source contracts passed.
```

Expected PDF-engine result:

```text
11 PDF-engine tests passed.
```

Expected route result:

```text
33 HTTP routes passed.
```

The audit report may contain findings. The runner must capture them and continue without applying an automatic fix. Never use `docker compose down -v`, `npm audit fix`, or `npm audit fix --force`.

## 3. Corrective regression checks

- Open Edit PDF directly and from the homepage. Confirm the empty workspace opens without repeated rendering, flicker, or console errors.
- Load a PDF, switch tools, return to Edit PDF, and confirm status and previews remain stable.
- Use the bottom current-page control in Sign PDF, Edit PDF, and other implemented workspaces. Confirm page selection remains synchronized without jumping or render loops.
- In Split PDF, transfer a file from another compatible workspace and confirm it loads once.
- In Split PDF, test `Ctrl+S`, `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+Y`, `Ctrl+O`, page arrows, Delete, and Backspace.
- In Sign PDF, open every object editor and confirm text inputs still focus correctly even though the unused helper was removed.
- Confirm browser console has no React effect, update-depth, or stale-listener errors.

## 4. Preserved shared interaction checks

Complete the full v0.13.4 checks in Sign PDF, Edit PDF, Watermark PDF, and Crop PDF:

- snap guides for page and peer-object edges and centers;
- alignment rulers and live four-side distances;
- live width and height labels;
- snapping toggle behavior;
- `Shift + drag` aspect-ratio preservation;
- Undo and Redo to the initial state;
- keyboard delete, movement, duplication, copy/paste, open, save, zoom, and page navigation where applicable;
- exported PDF placement, dimensions, colors, crop boxes, and rotations.

## 5. Homepage and shared viewer regression

- `http://localhost:3000/` must show the homepage, not Edit PDF.
- Every Home icon must return to `/` and reset workspace state.
- The bottom floating viewer controls must show current page, total pages, zoom, Undo/Redo, and page-view mode according to the tool.
- Confirm 50% through 200% zoom and all supported keyboard zoom shortcuts.

## 6. Backend and production boundary

- Confirm the backend migration is applied and no migration is pending.
- Confirm API and worker remain healthy during the sequential two-recipient local E2E.
- Retain Mailpit, MinIO, PostgreSQL, Redis, route, audit, and summary logs.
- Complete a controlled root security regression before dependency promotion.
- Complete real production email/storage provider delivery and signed webhook verification using actual provider credentials.

Request Signatures must remain disabled and not Working until every local, browser, security, and production-provider gate passes.
