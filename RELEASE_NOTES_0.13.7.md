# NovaPDF 0.13.7 Release Notes

## Shared viewer lifecycle corrective

- Makes the shared floating viewer explicitly opt-in instead of rendering by default.
- Prevents hidden workspaces from creating `document.body` portals.
- Passes explicit active-route state into every generic workspace.
- Shows the generic-tool viewer only after at least one file is accepted.
- Hides the viewer again when Start over clears the file list.
- Preserves the portal-based unclipped viewer for the one active, document-ready workspace.

## Visual corrective

- Removes the stacked multi-portal shadow effect that appeared as a large spot behind the floating bar.
- Removes backdrop blur from the shared viewer cards.
- Uses one restrained NovaPDF shadow around the active toolbar.

## Preserved behavior

- Continuous, Single-page, Two-page, and Three-page views remain available after a file is loaded.
- Page number, zoom, Undo/Redo, keyboard controls, active-page targeting, and smooth non-forced resize remain unchanged.
- All 32 tools and 33 routes remain registered.
- Step 12.8 backend source remains unchanged.
- Request Signatures remains disabled and is not Working.
