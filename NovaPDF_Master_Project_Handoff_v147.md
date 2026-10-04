# NovaPDF Master Project Handoff v0.14.7

Continue from Build Step 14.7. Windows validation has already proved the PDF-to-Word/OCR converter, root lint and semantic TypeScript, all source contracts, all 12 PDF engines, production build, and backend compile/test gates. Step 14.6 corrected migration apply/verify sequencing. Step 14.7 corrects the Windows Node.js development launcher.

The authoritative development launch is now:

1. Confirm or start the local PDF converter.
2. Resolve the installed local Next.js JavaScript CLI.
3. Spawn `process.execPath` with that CLI and `dev`.
4. Do not directly spawn `npx.cmd`/`npm.cmd` and do not use `shell: true`.
5. Preserve controlled error handling for missing dependencies or child-process startup failure.

Complete the v0.14.7 automated and manual sequence before beginning the next tool. Request Signatures remains disabled and must be implemented last. Preserve all 32 tools, 33 routes, existing engines, NovaPDF UX, right-side panels, preview behavior, page-view modes, file transfer, Start over, Home reset, exact allowed development origins, public-registry policy, Docker volumes, and Step 12.8 backend source.
