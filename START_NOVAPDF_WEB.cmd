@echo off
setlocal EnableExtensions
for %%I in ("%~dp0.") do set "ROOT=%%~fI"
cd /d "%ROOT%" || goto :path_error
title NovaPDF Web 0.14.16
if not exist "%ROOT%\node_modules\next\dist\bin\next" (
  echo [ERROR] The local Next.js CLI is missing.
  echo Run RUN_NOVAPDF_ALL.cmd from this package first.
  goto :failed
)
node.exe "%ROOT%\node_modules\next\dist\bin\next" start
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo [NovaPDF Web] Process exited with code %EXIT_CODE%.
goto :hold
:path_error
echo [ERROR] NovaPDF Web could not enter its package directory:
echo %ROOT%
goto :failed
:failed
set "EXIT_CODE=1"
:hold
echo Press Ctrl+C or close this window when finished reviewing the service output.
exit /b %EXIT_CODE%
