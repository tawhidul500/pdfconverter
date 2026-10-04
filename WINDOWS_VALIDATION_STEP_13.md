# NovaPDF Step 13 Windows Validation

**Target folder:** `C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF`  
**Version:** 0.13.0  
**Rule:** Do not delete Docker volumes. Do not run `npm audit fix --force`.

Record every command, exit code, and manual result. A failure blocks promotion.

## A. Extract without touching Docker data

1. Close any old NovaPDF dev/API/worker process.
2. Extract the Step 13 source to `C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF`.
3. Do not run `docker compose down -v`, `docker volume rm`, or any database reset.
4. Keep the existing Docker Desktop volumes.

## B. Confirm public registry configuration

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd config get registry
Get-Content .npmrc
Select-String -Path .npmrc,package-lock.json -Pattern "artifactory|applied-caas|verdaccio"
```

Expected registry:

```text
https://registry.npmjs.org/
```

The private-registry search must return no match.

## C. Root clean-install and source gates

```powershell
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd audit
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:contracts
npm.cmd run test:pdf-engines
npm.cmd run build
```

Expected test totals:

```text
15 dependency-free source contracts
11 dependency-backed PDF-engine tests
```

Expected new engine artifact:

```text
test-files\sample-edit-pdf-output.pdf
```

Do not continue after a failed command. Save the full audit output; do not apply a forced fix.

## D. Production route gate

PowerShell 1:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF
npm.cmd run start
```

PowerShell 2:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF
npm.cmd run test:http-routes
```

Expected: all 33 URLs return HTTP 200, including `/edit-pdf`.

## E. Ten-item Edit PDF Chrome checklist

Use Chrome at `http://localhost:3000/edit-pdf`. Test `test-files\sample-six-pages.pdf` plus a rotated/cropped fixture.

| # | Check | Pass/Fail | Notes |
|---|---|---|---|
| 1 | Dedicated Edit PDF workspace opens and accepts one unlocked PDF. |  |  |
| 2 | Every page appears; centre scrolling updates the active thumbnail without skipping. |  |  |
| 3 | Thumbnail click scrolls the centre canvas; thumbnail auto-scroll never drives the centre canvas. |  |  |
| 4 | Toolbar zoom and Ctrl+wheel share 50–200%; active-neighbour previews remain sharp. |  |  |
| 5 | Text and image add/select/move/resize/rotate/duplicate/delete/layer controls work. |  |  |
| 6 | Rectangle, ellipse, line, highlight, underline, freehand, and link objects work. |  |  |
| 7 | Font/style/alignment/colour/fill/border/opacity/URL/exact rotation settings work. |  |  |
| 8 | Undo/Redo, keyboard nudging, Delete, duplicate, Escape, page navigation, Start over, and home reset work. |  |  |
| 9 | Compatible source/result file transfer works without changing unrelated workspaces. |  |  |
| 10 | Separate downloaded PDF is readable and preserves page count/order/crop/content/rotations. |  |  |

Promotion rule: all ten must pass.

## F. Existing Sign PDF Chrome checklist

Run the preserved ten-item Sign PDF checklist from the previous handoff with `test-files\sample-six-pages.pdf`:

1. Full name and Initials start empty.
2. Initials supports Type, Draw, and Upload.
3. All pages appear in one continuous centre canvas.
4. Centre scrolling updates the active thumbnail without page skipping.
5. Clicking a thumbnail scrolls the centre canvas to that page.
6. Toolbar zoom and Ctrl+mouse-wheel share the same 50–200% zoom state.
7. Text and Input can be clicked or dragged onto any page and edited inline.
8. Drag and resize remain smooth, including rotated objects.
9. Every object has Duplicate and Delete; editable text fields also have Edit.
10. Download produces a real signed PDF with the expected fields.

## G. Preserved backend public-registry gate

Do not copy a lockfile from a private mirror. Generate a fresh backend lock from the public registry:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF\backend
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm.cmd install --package-lock-only --registry=https://registry.npmjs.org/
Select-String -Path package-lock.json -Pattern "artifactory|applied-caas|verdaccio"
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd audit
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test
npm.cmd run test:metadata
```

The private-registry search must return no match.

## H. Migration state

With the existing PostgreSQL volume running:

```powershell
npm.cmd run migration:show
npm.cmd run migration:run
```

Expected:

```text
[X] CreateSignatureRequestBackend1721800000000
```

`migration:run` must report no pending migration. A reset is not required and must not be performed.

## I. Start infrastructure, API, and worker

PowerShell 1:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF
copy backend\.env.example backend\.env
docker compose up -d postgres redis minio minio-init mailpit
docker compose ps
```

PowerShell 2:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF\backend
npm.cmd run dev
```

PowerShell 3:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF\backend
npm.cmd run dev:worker
```

Verify:

```text
http://localhost:4000/api/v1/health/live
http://localhost:4000/api/v1/health/ready
http://localhost:8025
http://localhost:9001
```

## J. Real sequential two-recipient E2E

PowerShell 4:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_Edit_PDF\backend
$env:RUN_BACKEND_E2E="1"
npm.cmd run test:e2e
Remove-Item Env:RUN_BACKEND_E2E
```

The run must prove Mailpit invitation/completion mail, MinIO private storage, PostgreSQL state/audit data, Redis/BullMQ processing, sequential recipient order, recipient-specific completion, final PDF generation/download, and append-only audit protection.

## K. Release decision

Edit PDF may be promoted to proven Working only after B-E pass.

Do not begin Request Signatures UI integration or mark Request signatures Working until B-J, the controlled root security regression, and the selected production-provider delivery/webhook gate pass.
