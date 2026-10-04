# NovaPDF v0.14.12 Validation Report

## Corrective target

The v0.14.11 runner reached the service-launch stage after converter, frontend, production build, backend, and migration gates passed. Its three nested CMD launch commands produced `The system cannot find the path specified`.

## Root cause

The package path was embedded inside a nested quoted `cmd.exe /k` command. Windows CMD reparsed the doubled quotes and produced an invalid child `cd` command.

## Correction

The package path is now supplied as the structural `WorkingDirectory` parameter to PowerShell `Start-Process`. Each service uses a self-locating CRLF launcher and starts its installed JavaScript entry point directly with Node.js.

## Remaining Windows acceptance

Run the complete one-click runner and Microsoft Word/OCR manual checklist on Windows. Request Signatures remains disabled.
