# NovaPDF 0.4.6 Release Notes

This release focuses on workspace navigation and cross-tool continuity.

## Highlights

- The left NovaPDF rail now reaches the top of the workspace.
- The NovaPDF logo replaces the old back-button area and returns to the homepage when clicked.
- Start over now appears directly before the active tool name.
- The old header subtitle and duplicate Start over controls were removed.
- When a user opens an empty compatible tool, the current files are handed into that tool automatically.
- Existing destination-tool sessions are never overwritten.
- Merge, Split, and Organize continue to preserve their own in-memory state.

## Compatibility rules

- Merge accepts PDF, JPG/JPEG, PNG, and WebP.
- Split receives the first compatible PDF only.
- Organize receives compatible PDFs.
- Placeholder tools receive only file types declared by their tool configuration.

## Next milestone

Build Step 5: Real Compress PDF Tool.
