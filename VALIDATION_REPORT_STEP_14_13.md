# NovaPDF v0.14.14 Validation Report

## Scope

Preserve-layout PDF-to-Word output with optional searchable OCR/native-text layer.

## Completed in sandbox

- 35/35 dependency-free source contracts passed.
- Step 14.13 contract passed 20/20 checks.
- Python converter compile passed.
- 8/8 converter tests passed, covering English and Bangla scanned OCR, digital native text, editable mode, preserve layout, and mixed orientation.
- API test returned HTTP 200 with `X-NovaPDF-OCR-Pages: 1`, a valid DOCX ZIP, one visible image, and `w:vanish` searchable text.
- LibreOffice plain-text export recovered `NovaPDF OCR TEST` from the hidden layer.
- LibreOffice render comparison produced byte-identical PNG pages for OCR-on and OCR-off preserve-layout outputs on scanned and digital fixtures.
- 57 JavaScript/MJS syntax checks and 101 TypeScript/TSX transpilation checks passed.
- 464/464 root package-lock resolved URLs use `https://registry.npmjs.org/`.
- 68/68 backend files are byte-for-byte unchanged from v0.14.12.
- All Windows CMD files are CRLF-only and BOM-free.

## Pending on Windows

- Full one-click runner, ESLint, semantic TypeScript, production build, routes, and E2E.
- Microsoft Word Ctrl+F/search acceptance for English, Bangla, and digital PDFs.
