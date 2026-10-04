# Third-Party Notices

NovaPDF v0.14.2 uses the following open-source packages for PDF processing, Word generation, OCR, previews, and downloads. Package lockfiles and Python requirements remain the authoritative version records.

## PDFium / pypdfium2

- Python package: `pypdfium2`
- Version: `5.12.1`
- Purpose: PDF opening, text extraction, page geometry, and raster rendering in the local PDF-to-Word service
- Wrapper license: BSD-3-Clause / Apache-2.0
- PDFium binary license: BSD-3-Clause and bundled third-party notices
- Project: https://github.com/pypdfium2-team/pypdfium2

## python-docx

- Python package: `python-docx`
- Version: `1.2.0`
- Purpose: standards-based Microsoft Word DOCX generation
- License: MIT
- Project: https://github.com/python-openxml/python-docx

## Tesseract OCR / pytesseract

- System engine: Tesseract OCR, including English and Bangla language data
- Python package: `pytesseract`
- Version: `0.3.13`
- Purpose: optional OCR of image-only PDF pages
- Tesseract license: Apache-2.0
- pytesseract license: Apache-2.0
- Projects: https://github.com/tesseract-ocr/tesseract and https://github.com/madmaze/pytesseract

## Pillow

- Python package: `Pillow`
- Version: `12.2.0`
- Purpose: page image handling and OCR input preparation
- License: HPND
- Project: https://python-pillow.github.io/

## pdf-lib

- npm package: `pdf-lib`
- Version: `1.17.1`
- Purpose: browser-side PDF acceptance checks and existing NovaPDF PDF engines
- License: MIT
- Project: https://github.com/Hopding/pdf-lib

## PDF.js / pdfjs-dist

- npm package: `pdfjs-dist`
- Version: `6.1.200`
- Purpose: PDF preview rendering
- License: Apache-2.0
- Project: https://github.com/mozilla/pdf.js

## JSZip

- npm package: `jszip`
- Version: `3.10.1`
- Purpose: validating returned DOCX ZIP/OOXML packages before download
- License: MIT or GPL-3.0-or-later
- Project: https://github.com/Stuk/jszip
