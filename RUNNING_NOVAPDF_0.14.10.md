# Running NovaPDF 0.14.10 on Windows

## Full validated launch

Extract to a fresh short path such as `C:\NovaPDF-v1410`, then double-click `RUN_NOVAPDF_ALL.cmd`. Do not edit or resave the `.cmd` files in an editor that converts CRLF to LF.

Expected initial preflight:

```text
[OK] Node.js found.
[OK] npm found.
[OK] Windows PowerShell found.
[OK] Docker Desktop / Docker CLI found.
```

There must be no `cannot find the batch label` message.

## Manual development launch

```bat
npm.cmd run dev
```

This starts the converter when needed, removes only `.next-dev`, and runs the local Next.js CLI with Webpack. Production output remains in `.next`.
