# NovaPDF 0.4.8 Release Notes

## Added

- Shared Zoom In, Zoom Out, and 100% reset controls for Merge, Split, Organize, and placeholder workspaces
- Tool-specific workspace names, right-panel headings, result titles, and primary action labels

## Changed

- The current workspace file set now replaces the destination workspace file set when switching tools
- The most recently edited PDF becomes the active document context for the next compatible tool
- Clicking the NovaPDF workspace logo returns home and clears all uploaded files, generated results, selections, and in-memory tool sessions
- Transfer events now clear incompatible or empty destination states instead of leaving stale files visible

## Verified

- ESLint passed
- TypeScript passed
- Next.js production build passed
- Static generation passed
