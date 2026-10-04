# Running NovaPDF v0.14.3 on Windows

## Recommended full launch

1. Extract the ZIP to a fresh short path such as `C:\NovaPDF-v143`.
2. Start Docker Desktop.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Keep the NovaPDF Web, API, Worker, Docker Desktop, and converter running while testing.

## PDF to Word converter-only repair

When the website is already running but PDF to Word says `Converter offline`:

1. Double-click `START_PDF_CONVERTER.cmd`.
2. Wait for `[SUCCESS] PDF converter is online`.
3. Return to the PDF to Word page.
4. Click `Retry converter`, or wait up to five seconds.

Command-line equivalent:

```bat
docker compose up -d --build --force-recreate pdf-converter
```

Health URLs:

- Web proxy: `http://localhost:3000/api/pdf-to-word/health`
- Direct local converter: `http://localhost:4010/health`

`npm run dev` now attempts to start the converter first. `npm run dev:web` starts only Next.js and is intended for cases where the converter is managed separately.
