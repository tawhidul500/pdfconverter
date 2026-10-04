# NovaPDF 0.14.11 — End-to-End Stability Consolidation

This milestone consolidates every corrective from Steps 14.1–14.10 and removes the remaining version/process ambiguity in Windows validation.

## Changes

- Stable Docker Compose project name `novapdf-local`; future releases reuse one local volume set.
- Safe preflight stops only stale NovaPDF Node processes and legacy NovaPDF containers; volumes are never removed.
- Current-version endpoint at `/api/novapdf/version`.
- Runner always launches fresh production Web/API/Worker processes and verifies Web version `0.14.11`.
- Manual `npm run dev` refuses a stale or duplicate server on port 3000 instead of allowing mixed bundles.
- Static deterministic footer build stamp; no hydration placeholder swap.
- Real `/favicon.ico` asset.
- Existing converter proxy, Word-valid DOCX output, English/Bangla OCR, migration parser, CRLF runner safety, 32 tools, 33 routes, and frozen Step 12.8 backend remain preserved.

Request Signatures remains disabled and is not promoted to Working.
