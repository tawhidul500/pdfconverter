# Running NovaPDF v0.14.2 on Windows

## Requirements

- Windows 10 or 11
- Docker Desktop
- Node.js and npm
- Microsoft Word for final acceptance

## Start

1. Extract the package to a fresh short path, for example `C:\NovaPDF-v0142`.
2. Do not reuse an old `node_modules` directory.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Keep the Web, API, Worker, and Docker services running.
5. Open `http://localhost:3000/pdf-to-word`.
6. Confirm `Converter online` before converting.
7. Complete `WINDOWS_VALIDATION_STEP_14_2.md`.

## Services

- Web: `http://localhost:3000`
- PDF conversion/OCR health: `http://localhost:4010/health`
- Request Signatures API health: `http://localhost:4000/api/v1/health/live`
- Mailpit: `http://localhost:8025`
- MinIO: `http://localhost:9001`

The PDF conversion service is stateless. It processes uploaded bytes for the request and returns DOCX bytes without storing documents in a Docker volume.
