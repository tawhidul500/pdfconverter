# Running NovaPDF 0.14.4 on Windows

1. Extract the ZIP to a fresh short path.
2. Start Docker Desktop.
3. Double-click `RUN_NOVAPDF_ALL.cmd`.
4. Wait for the completed summary and the Web/API/Worker windows.
5. Open `/pdf-to-word` only after converter health is ready.

When only the converter is offline, run `START_PDF_CONVERTER.cmd` and select Retry in the workspace. Docker volumes are preserved.
