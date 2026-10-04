# NovaPDF Master Project Handoff v0.14.6

Continue from Build Step 14.6. The real v0.14.5 Windows run proved the PDF-to-Word/OCR service, root application gates, all 12 PDF engines, production build, and backend compile/test gates. It stopped only because the runner checked a fresh migration as applied before executing it.

The v0.14.6 authoritative runner sequence is:

1. Apply the committed Step 12.8 migration idempotently.
2. Require `[X] CreateSignatureRequestBackend1721800000000` from `migration:show`.
3. Run migration again and require `No migrations are pending`.
4. Launch Web, API, and Worker.
5. Complete health, 33 routes, local E2E, and manual acceptance.

Do not begin the next tool until the full v0.14.6 automated and manual sequence is recorded. Request Signatures remains disabled and must be implemented last. Preserve all 32 tools, 33 routes, existing engines, NovaPDF UX, right-side panels, preview behavior, page-view modes, file transfer, Start over, Home reset, exact allowed development origins, public-registry policy, Docker volumes, and Step 12.8 backend source.
