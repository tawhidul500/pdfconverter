# NovaPDF 0.12.1 Release Notes

**Release:** NovaPDF_Build_Step_12_1  
**Milestone:** Build Step 12.1 - Complete Self-Signing System  
**Date:** 21 July 2026

## What is new

### Signing workflow entry

- Added **Sign it myself** as the active browser-local workflow.
- Added a clearly disabled **Request signatures** card for the upcoming backend milestone.
- The interface does not claim that recipient invitations, tracking, reminders, or audit trails already work.

### Reusable signer identity

- Save full name and initials in browser storage.
- Restore saved signer details in later Sign PDF sessions.
- Save up to 12 reusable signature or stamp images locally.
- Reuse or delete saved items from the right panel.
- Saved data remains local to the browser and is removed if browser storage is cleared.

### Expanded field types

- Signature
- Initials
- Signer name
- Current date
- Free text
- Bordered input value
- Checkbox
- Company stamp

### Field rules and editing

- Mark fields required or optional.
- Prevent final output when a required field has no value, no asset, or an unchecked required checkbox.
- Edit field labels, text, font size, style, colour, checkbox state, and rotation.
- Preserve drag, resize, rotate, duplicate, delete, copy, cut, paste, Undo/Redo, and keyboard movement.

### Alignment assistance

- Added optional snapping to page centre, common page positions, and other fields.
- Added visible horizontal and vertical alignment guides while dragging.

### PDF engine

- Added company-stamp image output.
- Added bordered input output.
- Added checked and unchecked checkbox output.
- Preserved preview/output rotation behaviour for signatures, stamps, inputs, checkboxes, and pre-rotated source pages.

## Important boundary

This is a complete self-signing editor, not a remote e-signature platform. Request emails, recipients, secure signer links, signing order, reminders, status tracking, audit certificates, and certificate-backed cryptographic signatures require later backend milestones.

## Validation

- Clean dependency installation passed.
- npm audit reported 0 vulnerabilities.
- ESLint passed with no warnings.
- TypeScript passed.
- Production build passed and generated 36 static pages.
- Homepage and all 32 direct tool routes returned HTTP 200.
- All existing engine and interaction-contract tests passed.
- New signature, company-stamp, input, and checkbox output tests passed.
- Generated six-page self-signing output was rendered and visually inspected.
- Public npm registry URLs and approved `allowedDevOrigins` were preserved.

Full native file-picker, drawing, local-storage, and pointer interaction still require confirmation in the user's Windows Chrome because the packaging environment cannot reliably automate the complete localhost browser flow.
