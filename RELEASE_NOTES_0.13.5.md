# NovaPDF 0.13.5 Release Notes

NovaPDF 0.13.5 is a narrow corrective release based on the actual v0.13.4 source and the real Windows one-click runner output.

## Root ESLint corrections

- Edit PDF no longer calls `setStatus` synchronously inside its workspace-activation effect. The reset is deferred through a cancellable animation-frame callback.
- Shared bottom viewer controls no longer call `setInternalPage` synchronously inside the controlled-page synchronization effect. Synchronization is deferred and cancelled safely.
- Split PDF declares `resetFields` and `loadPdf` before the file-transfer effect that accesses them.
- Split PDF declares `splitPdf` before the keyboard effect that invokes it for `Ctrl/Cmd+S`.
- Removed the unused Sign PDF `focusSelectedTextEditor` helper. Existing object-editor focus paths remain.

## Preserved product behavior

- No backend source, migration, Docker volume, or Request Signatures status was changed.
- All 32 tools, 33 routes, 12 implemented browser workspaces, shared bottom viewer, keyboard behavior, shared snap guides, alignment rulers, distance measurements, and Shift-drag proportional resizing remain.
- All visible website content remains US English.

## Validation status

- All 20 dependency-free source contracts pass.
- The new Step 13.5 corrective contract passes 19 checks.
- All TypeScript/TSX files pass syntax transpilation.
- The Windows one-click runner must be rerun to certify Root ESLint and every dependency-backed gate after it.

Request Signatures remains disabled and not Working. Step 12.9 has not started.
