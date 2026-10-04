# NovaPDF Step 14.12 Defect Resolution Ledger

## User-observed failure

After every automated gate through migration passed, the main runner opened three service CMD windows. Each child window printed `The system cannot find the path specified` and returned to the package prompt.

## Root cause

The v0.14.11 main runner embedded `%ROOT%` and `%BACKEND%` inside nested quoted `cmd.exe /k "cd /d ..."` command strings. Windows reparsed the doubled quote boundaries and generated an invalid child `cd` command.

## Corrective design

1. `scripts/start-production-windows.ps1` resolves the package path once.
2. PowerShell supplies that path through `Start-Process -WorkingDirectory`; it is not embedded into a child command string.
3. Three CRLF/BOM-free launchers derive their own package path with `%~dp0`.
4. Web starts the installed Next.js CLI directly with Node.
5. API and Worker start their compiled JavaScript entry points directly with Node.
6. The main runner still verifies exact Web version, API live/ready health, all 33 routes, and local E2E after launch.

## Preserved boundaries

Docker volumes are preserved. Public npm registry policy remains. The PDF-to-Word/OCR engine is unchanged. The 68-file Step 12.8 backend is unchanged. Request Signatures remains disabled.
