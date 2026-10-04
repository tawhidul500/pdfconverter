# NovaPDF Master Project Handoff v0.14.4

## Authoritative continuation state

Continue from Build Step 14.4. This release is a narrow corrective based on the real Windows v0.14.3 runner log. The PDF-to-Word service, OCR, proxy architecture, 32 tools, 33 routes, existing engines, NovaPDF UX, and Step 12.8 backend remain preserved.

## Corrective detail

The Windows runner passed converter infrastructure and five functional converter tests, then Root ESLint found one `react-hooks/set-state-in-effect` issue and three `react/no-unescaped-entities` issues in `pdf-to-word-workspace.tsx`. Step 14.4 removes only those failures and adds a regression contract.

## Required next action

Run the complete v0.14.4 one-click Windows sequence. Do not begin the next tool until automated and manual validation is recorded. Request Signatures remains disabled and must be implemented last.

## Locked constraints

- No Docker volume deletion.
- No `npm audit fix --force`.
- Public npm registry URLs only.
- Preserve `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Preserve all 32 tools, routes, engines, panels, previews, page-view modes, transfers, Start over, and Home reset.
