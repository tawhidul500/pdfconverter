# Windows Validation — NovaPDF Step 14.11

Use a fresh extraction. Do not run any Step 14.9 or older runner.

## Automated runner

1. Start Docker Desktop.
2. Double-click `RUN_NOVAPDF_ALL.cmd`.
3. Confirm the header says `NovaPDF v0.14.11 consolidated one-click runner`.
4. Confirm the runtime preflight reports that no Docker volume was removed.
5. Confirm converter tests 5/5, root lint, semantic TypeScript, all source contracts, all PDF-engine tests, production build, backend gates, migration apply/show/idempotency, 33 routes, and local E2E pass.
6. Open `/api/novapdf/version` and confirm `version` is `0.14.11`.

## PDF to Word manual acceptance

- Before upload, bottom viewer portal count is 0.
- Upload a searchable PDF; converter status becomes online and analysis completes.
- Convert Editable text; downloaded DOCX opens in Microsoft Word and text is editable.
- Convert Preserve layout; pages and orientations are preserved.
- Upload an English scan and run OCR.
- Upload a Bangla scan and run Bangla OCR.
- Verify custom ranges, separate output, combined output, Unicode filename, Start over, tool switching, and file transfer.
- After upload exactly one viewer portal exists; after Start over it returns to 0.
- Confirm no duplicate shadow spot and no stale toolbar after switching tools.

## Browser/runtime acceptance

- Home footer shows `Build Step 14.11 · PDF to Word + OCR`.
- No hydration mismatch overlay or console error.
- `/favicon.ico` returns 200.
- Running `npm.cmd run dev` while the production server is active exits cleanly with an already-running message; it must not start a mixed second server.

## Locked boundary

Do not begin Request Signatures frontend or mark it Working. Production-provider delivery and controlled security remain separate gates.
