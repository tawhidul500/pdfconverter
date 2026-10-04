# Validation Report — Step 14.9

## Windows evidence received

The manual v0.14.7 development server started successfully with Node 24, but Next.js 16 selected Turbopack and reported a hydration mismatch in the footer. The server-rendered build stamp was from an older build while the current client bundle expected the PDF-to-Word/OCR build stamp. Application conversion functionality was not the source of the mismatch.

## Correction

1. `scripts/start-novapdf-dev.mjs` now launches `next dev --webpack` through the current Node executable.
2. `next.config.ts` selects `.next-dev` only when `NOVAPDF_NEXT_DIST_DIR` is set by the development launcher; production continues using `.next`.
3. The launcher removes only `.next-dev` before starting development.
4. The footer build stamp uses `useSyncExternalStore` with a stable server snapshot and current client snapshot. `suppressHydrationWarning` is scoped to that single release-metadata text node.
5. The existing `/icon.svg` is explicitly registered in metadata.

## Validation completed in packaging

- Dependency-free source contracts: **31/31 passed**.
- Step 14.9 corrective checks: **18/18 passed**.
- JavaScript/MJS syntax checks: **53 files passed**.
- TypeScript/TSX isolated transpilation: **41/41 files passed**.
- Converter/OCR tests: **5/5 passed**.
- Root lock resolved URLs: **464/464 public npm registry**.
- Step 12.8 backend: **68/68 files byte-for-byte unchanged from Step 14.8**.
- Exact `allowedDevOrigins` preserved.
- Docker-volume deletion and automatic audit-fix commands remain absent.

## Remaining Windows boundary

Run the complete Step 14.9 one-click sequence. Then close any old NovaPDF browser tabs, run `npm.cmd run dev`, confirm the banner says `(webpack)`, and hard-refresh once. Confirm no hydration overlay and no `/favicon.ico`-related functional issue. Continue through manual PDF-to-Word/OCR acceptance before promotion.

## Classification

Working corrective candidate. Request Signatures remains disabled and will be implemented last.
