# Running NovaPDF 0.14.9 on Windows

## Full validated launch

Double-click `RUN_NOVAPDF_ALL.cmd` from a fresh extraction. It preserves Docker volumes and does not run forced audit fixes.

## Manual development launch

```bat
npm.cmd run dev
```

This starts the converter when needed, removes only `.next-dev`, and runs the local Next.js CLI with Webpack. Production output remains in `.next`.

Expected:

```text
[NovaPDF] PDF converter is already online.
[NovaPDF] Starting the Webpack development server with a clean .next-dev cache.
▲ Next.js 16.2.10 (webpack)
- Local: http://localhost:3000
```
