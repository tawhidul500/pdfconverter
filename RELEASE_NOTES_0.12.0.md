# NovaPDF 0.12.0 Release Notes

**Release:** NovaPDF_Build_Step_12  
**Milestone:** Build Step 12 - Real Sign PDF  
**Date:** 21 July 2026

## What is new

Sign PDF is now a real browser-local processing tool rather than a placeholder.

### Signature creation

- Draw a signature with mouse, pen, or touch.
- Type a signature and choose Script, Elegant, or Clean presentation.
- Upload PNG, JPG, JPEG, or WebP.
- Preserve transparency or remove a plain white background.
- Choose the ink colour used for drawing and typed signatures.

### Signing fields

- Signature image
- Initials
- Date
- Signer name
- Optional text

### Visual editing

- Real page thumbnails
- Large focused page editor
- Previous/next page controls
- Back to grid and outside-canvas dismissal
- Drag movement
- Proportional resize handle
- Rotation
- Duplicate
- Delete
- Text content, size, style, colour, and rotation controls

### Keyboard workflow

- Arrow keys move the selected object.
- Shift+Arrow moves faster.
- Ctrl+C, Ctrl+X, Ctrl+V, and Ctrl+D support object copy/cut/paste/duplicate.
- Delete/Backspace removes the selected object.
- Ctrl+Z and Ctrl+Y provide Undo/Redo.
- Ctrl+S generates the signed PDF.
- Ctrl+O opens the PDF chooser.
- Escape deselects or returns to grid view.

### Output

- Creates a separate signed PDF locally with `pdf-lib`.
- Preserves source page order, count, page dimensions, crop boxes, content, and existing rotations.
- Supports signing pages already rotated 90, 180, or 270 degrees.
- Transfers the generated PDF to compatible NovaPDF tools.

## Important boundary

This release adds a visual signature to a PDF. It does not create a certificate-based cryptographic digital signature. Signer verification, remote signature requests, signing order, reminder email, audit certificates, and legally managed e-signature workflows remain later full-stack scope.

## Validation

- Clean dependency installation passed.
- ESLint passed.
- TypeScript passed.
- Production build passed with 36 generated static pages.
- Homepage and all 32 direct tool routes returned HTTP 200.
- Sign PDF normal and rotated-page engine tests passed.
- Generated PDFs were rendered and visually inspected.
- Existing PDF engine regression tests passed.
- Offline npm audit reported 0 vulnerabilities.
- Public npm registry URLs and approved `allowedDevOrigins` were preserved.

Full native browser interaction automation was blocked by the packaging environment's localhost policy. The supplied Windows checklist remains the final pointer/native-file-picker confirmation.
