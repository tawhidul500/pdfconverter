@echo off
setlocal EnableExtensions

title NovaPDF PDF Converter - Start or Repair
color 0F
set "COMPOSE_PROJECT_NAME=novapdf-local"
for %%I in ("%~dp0.") do set "ROOT=%%~fI"
cd /d "%ROOT%" || goto :failed

echo ============================================================
echo NovaPDF PDF to Word Converter - Start or Repair
echo ============================================================
echo Docker volumes will be preserved.
echo.

where docker.exe >nul 2>&1
if errorlevel 1 if exist "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe" set "PATH=%ProgramFiles%\Docker\Docker\resources\bin;%PATH%"
where docker.exe >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker Desktop / Docker CLI was not found.
  goto :failed
)

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop is not ready. Attempting to start it...
  if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
  if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe"
  for /L %%S in (1,1,90) do (
    docker info >nul 2>&1 && goto :docker_ready
    timeout /t 2 /nobreak >nul
  )
  echo [ERROR] Docker engine did not become ready.
  goto :failed
)

:docker_ready
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\prepare-converter-runtime.ps1"
if errorlevel 1 goto :failed
echo Building and starting only the PDF converter...
docker compose up -d --build --force-recreate pdf-converter
if errorlevel 1 goto :converter_failed

for /L %%S in (1,1,90) do (
  powershell.exe -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://127.0.0.1:4010/health; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>&1
  if not errorlevel 1 goto :healthy
  timeout /t 2 /nobreak >nul
)

:converter_failed
echo.
echo [ERROR] PDF converter did not become healthy.
docker compose ps pdf-converter
docker compose logs --tail 200 pdf-converter
pause
exit /b 1

:healthy
echo.
echo [SUCCESS] PDF converter is online at http://localhost:4010/health
start "" "http://localhost:4010/health"
echo Return to NovaPDF and click Retry converter.
pause
exit /b 0

:failed
echo.
echo Docker volumes were not deleted.
pause
exit /b 1
