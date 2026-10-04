# NovaPDF 0.12.6 Release Notes

## Sign PDF editor interaction refinement

- Zoom and Undo/Redo controls appear only after a PDF has loaded.
- Full name and Initials start empty for every new self-signing job.
- Initials are generated from the first letters of the first two name words and remain manually editable.
- Initials now include Type, Draw, and Upload modes matching Signature.
- All PDF pages appear in one continuous centre canvas.
- The left page strip and centre canvas scroll in synchronization.
- Ctrl + mouse wheel and the shared zoom controls use the same 50–200% zoom state.
- The extra outer white page-card background was removed; PDF pages use a subtle document shadow.
- Text and Input fields can be clicked or dragged onto any page and edited after placement.
- Text/Input fields expose Edit, Rotate, Duplicate, and Delete controls; other fields expose Rotate, Duplicate, and Delete.
- Object movement preserves pointer offset for smooth dragging.
- Resizing stays anchored and proportional where appropriate.
- Empty input borders and entered input values are included in generated PDFs.

## Validation status

Source-level syntax transpilation and all Sign PDF interaction contracts passed. A clean dependency install, full ESLint, TypeScript, engine-output tests, production build, npm audit, and HTTP route checks could not be rerun in the packaging container because its npm gateway returned repeated HTTP 503 responses. The package lock still contains public `registry.npmjs.org` URLs only. Run the Windows validation commands after extraction before treating this corrective release as production-confirmed.
