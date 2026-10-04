# NovaPDF Step 13.1 Windows Validation

## 1. Extract without touching Docker data

Extract the source package to:

```text
C:\NovaPDF\NovaPDF_Build_Step_13_1_Sign_PDF_Corrections
```

Do not delete Docker volumes. Do not run `docker compose down -v`.

## 2. Root public-registry gate

Open Windows PowerShell and run one command at a time:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_1_Sign_PDF_Corrections
npm.cmd config set registry https://registry.npmjs.org/
Select-String -Path .npmrc,package-lock.json -Pattern "artifactory|applied-caas|verdaccio"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd audit
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:contracts
npm.cmd run test:pdf-engines
npm.cmd run build
```

Expected:

```text
16 dependency-free source contracts
11 dependency-backed PDF-engine tests
```

The private-registry search must return no project-file match. Capture audit output; do not run `npm audit fix --force`.

## 3. Production route gate

PowerShell window 1:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_1_Sign_PDF_Corrections
npm.cmd run start
```

PowerShell window 2:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_1_Sign_PDF_Corrections
npm.cmd run test:http-routes
```

All 33 routes must return HTTP 200.

## 4. Sign PDF corrective Chrome checklist

Use a multi-page PDF, a rotated/cropped PDF, a long full name, and the first two typed-signature styles. Record Pass/Fail and a screenshot for each item.

1. Add Signature, Initials, Name, Date, Text, Input field, Checkbox, and Company stamp. Each field can be resized continuously down to a tiny usable size without stopping at the former large minimum or becoming larger again after export.
2. Select every field type. Every selected field shows **Edit**. Every type except Company stamp shows **Change color**. Company stamp shows Edit, Rotate, Duplicate, and Delete without a color action.
3. The right-side field list shows a separate Edit icon for Initials, Name, Date, Text, Input field, Checkbox, and Company stamp. Signature retains its Edit control.
4. Open the inline editor for Date, Name, Text, Input field, and Checkbox. The **Done** button closes the editor and keeps the change.
5. The filename area clearly shows **Output file name**, helper text, a readable input box, spacing, and a separate `.pdf` suffix.
6. The old **Text or input value** control is absent above the filename area. Text and Input content is edited from the field itself.
7. No red star appears at the top-left of Signature, Input field, or any other required field. Required validation still blocks incomplete required fields.
8. Enter a long name using each typed-signature style. The first two styles are not clipped on either side in preview or exported PDF.
9. Reload the page or reopen Sign PDF in the same browser. The previously entered full name and initials restore locally, and the full name appears in the typed-signature text box.
10. In Sign PDF, `Page X of Y` stays at the bottom of the centre workspace while scrolling pages and using Previous/Next.
11. In Edit PDF, `Page X of Y` also stays at the bottom of the centre workspace.
12. Date fields use US English display such as `Jul 30, 2026`.
13. Undo/Redo, drag, rotate, duplicate, delete, keyboard movement, snapping, file transfer, Start over, and home reset still work.
14. Exported output preserves source page count, order, dimensions, crop boxes, existing content, and page rotations.
15. **Several people / Request signatures** remains visibly disabled and is not presented as Working.

## 5. Existing Step 13 Edit PDF checklist

Complete all items in `WINDOWS_VALIDATION_STEP_13.md`. Edit PDF must remain an implementation candidate until that checklist, the engine tests, build, and route gate pass.

## 6. Preserved backend continuation

After the root gate, continue the existing Corrective Package 5 backend procedure without deleting volumes:

```powershell
cd C:\NovaPDF\NovaPDF_Build_Step_13_1_Sign_PDF_Corrections\backend
npm.cmd config set registry https://registry.npmjs.org/
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm.cmd install --package-lock-only --registry=https://registry.npmjs.org/
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd audit
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test
npm.cmd run test:metadata
npm.cmd run migration:show
npm.cmd run migration:run
```

`migration:show` must include:

```text
[X] CreateSignatureRequestBackend1721800000000
```

`migration:run` must report no pending migration. Then run API/worker health and the real Mailpit/MinIO/PostgreSQL/Redis sequential two-recipient E2E from the preserved Step 12.8 validation guide.

## Release boundary

Do not begin Step 12.9 UI integration. Do not mark Request signatures Working. Do not promote the v0.13.1 corrections or Edit PDF to fully accepted until all relevant Windows, browser, engine, build, route, security, and production-provider gates pass.
