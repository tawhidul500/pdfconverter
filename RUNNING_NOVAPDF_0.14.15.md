# Running NovaPDF v0.14.15 on Windows

## Requirements

- Windows 10/11
- Docker Desktop running
- Node.js and npm available in PATH
- Windows PowerShell
- Microsoft Word for final DOCX acceptance

## One-click run

1. Extract the runnable source ZIP to a fresh path such as `C:\NovaPDF-v1415`.
2. Start Docker Desktop and wait for the engine to become ready.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Confirm the first heading is `NovaPDF v0.14.15 consolidated one-click runner`.
5. Wait for the converter, source contracts, PDF-engine tests, build, backend, migration, live routes, and E2E gates.
6. Open PDF to Word and select **Editable layout (Beta)**.
7. Test a native digital PDF and a scanned PDF separately.
8. Complete `WINDOWS_VALIDATION_STEP_14_15.md` before promotion.

## Output choices

- **Preserve layout:** best visual parity; content remains image-based, with optional hidden searchable text.
- **Editable layout (Beta):** positioned editable text plus reconstructable Word tables, shapes, and pictures.
- **Editable text:** reading-flow paragraphs for easier reflow editing.

The runner does not delete Docker volumes and does not run automatic audit remediation.
