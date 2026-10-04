# NovaPDF v0.14.14 Windows Validation

## Automated gate

Run `RUN_NOVAPDF_ALL.cmd` from a fresh extraction. Confirm:

- converter health is ready;
- all converter tests pass, including hybrid native and scanned reconstruction;
- root ESLint, semantic TypeScript, contracts, PDF-engine tests, and production build pass;
- backend frozen tests and idempotent migration pass;
- Web, API, and Worker launch successfully;
- exact Web version is `0.14.14`;
- all 33 HTTP routes and local E2E pass.

## Microsoft Word acceptance

### Digital PDF

1. Upload a digital PDF containing tables, colors, charts, images, and multi-column text.
2. Select **Editable layout (Beta)** and optionally enable OCR.
3. Convert and open the DOCX in Microsoft Word.
4. Confirm text can be selected and directly edited.
5. Confirm heading colors, approximate fonts, table text positions, images, chart graphics, and page geometry remain close to the PDF.
6. Confirm there is no unreadable-content or repair dialog.

### Scanned PDF

1. Upload a scanned English or Bangla PDF.
2. Select **Editable layout (Beta)** and enable OCR.
3. Confirm recognized text is visible, selectable, and editable.
4. Confirm remaining artwork and page layout are preserved.
5. Record OCR errors or inpainting artifacts; scanned reconstruction is confidence-dependent.

## Known boundary

Do not mark as a defect when chart source data, vector paths, or complex table/form structures remain visual artwork. An arbitrary PDF lacks the original authoring object model. The Beta mode prioritizes editable text plus visual fidelity, not guaranteed source-object recovery.

## Safety

- Do not run `npm audit fix --force`.
- Do not delete Docker volumes.
- Keep Request Signatures disabled.
