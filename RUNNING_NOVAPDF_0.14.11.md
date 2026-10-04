# Running NovaPDF 0.14.11 on Windows

Use a fresh extraction, start Docker Desktop, and double-click `RUN_NOVAPDF_ALL.cmd`. The runner stops only stale NovaPDF processes and legacy NovaPDF containers; it does not delete containers or volumes.

After success, keep the NovaPDF Web, API, Worker, and Docker services running during manual validation. The exact Web version is available at `http://localhost:3000/api/novapdf/version`.

For manual development after the production runner is closed, run `npm.cmd run dev`. If another NovaPDF server already owns port 3000, the launcher exits with a controlled message instead of mixing bundles.
