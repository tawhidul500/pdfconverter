@echo off
setlocal EnableExtensions
for %%I in ("%~dp0.") do set "ROOT=%%~fI"
set "BACKEND=%ROOT%\backend"
cd /d "%BACKEND%" || goto :path_error
title NovaPDF Worker 0.12.8
if not exist "%BACKEND%\dist\worker.js" (
  echo [ERROR] The compiled Worker entry point is missing.
  echo Run RUN_NOVAPDF_ALL.cmd from this package first.
  goto :failed
)
node.exe "%BACKEND%\dist\worker.js"
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo [NovaPDF Worker] Process exited with code %EXIT_CODE%.
goto :hold
:path_error
echo [ERROR] NovaPDF Worker could not enter its backend directory:
echo %BACKEND%
goto :failed
:failed
set "EXIT_CODE=1"
:hold
echo Press Ctrl+C or close this window when finished reviewing the service output.
exit /b %EXIT_CODE%
