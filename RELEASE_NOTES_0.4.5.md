# NovaPDF 0.4.5 Release Notes

This patch contains three requested workspace improvements:

1. The floating Next.js development `N` indicator is disabled.
2. Merge, Split, Organize, and placeholder tools retain separate in-memory state while switching through the left tool rail.
3. Primary processing buttons fill the available width of the right control panel.

State is retained while the current browser page remains open. Refreshing or closing the page clears browser-memory state.

## Quick test

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`, upload files in Merge, switch to Split and upload a PDF, then switch back and forth to confirm each tool keeps its own files.
