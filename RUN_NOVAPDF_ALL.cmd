@echo off
setlocal EnableExtensions EnableDelayedExpansion

title NovaPDF v0.14.16 - Consolidated Setup, Validation, and Launch
color 0F

for %%I in ("%~dp0.") do set "ROOT=%%~fI"
set "BACKEND=%ROOT%\backend"
set "LOG_DIR=%ROOT%\validation-logs"
set "PUBLIC_REGISTRY=https://registry.npmjs.org/"
set "EXPECTED_WEB_VERSION=0.14.16"
set "COMPOSE_PROJECT_NAME=novapdf-local"

for /f %%I in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "RUN_ID=%%I"
if not defined RUN_ID set "RUN_ID=latest"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set "ROOT_AUDIT=%LOG_DIR%\root-audit-!RUN_ID!.txt"
set "BACKEND_AUDIT=%LOG_DIR%\backend-audit-!RUN_ID!.txt"
set "MIGRATION_APPLY_LOG=%LOG_DIR%\migration-apply-!RUN_ID!.txt"
set "MIGRATION_SHOW_LOG=%LOG_DIR%\migration-show-!RUN_ID!.txt"
set "MIGRATION_CONFIRM_LOG=%LOG_DIR%\migration-confirm-!RUN_ID!.txt"
set "CONVERTER_TEST_LOG=%LOG_DIR%\converter-native-objects-!RUN_ID!.txt"
set "SUMMARY_LOG=%LOG_DIR%\run-summary-!RUN_ID!.txt"
set "ROOT_AUDIT_CODE=0"
set "BACKEND_AUDIT_CODE=0"
set "FAILED_STEP=Unknown step"

cd /d "%ROOT%" || goto :invalid_root

call :heading "NovaPDF v0.14.16 consolidated one-click runner"
echo Project: %ROOT%
echo Compose project: %COMPOSE_PROJECT_NAME%
echo.
echo This runner validates the converter, frontend, production build, frozen backend, migration, routes, and local E2E.
echo It stops only stale NovaPDF processes/containers, preserves every Docker volume, and never runs automatic audit remediation.
echo.

rem Keep this file ASCII/UTF-8 without BOM and CRLF encoded.
set "FAILED_STEP=Checking Node.js"
where node.exe >nul 2>&1
if errorlevel 1 (echo [ERROR] Node.js was not found in PATH.& goto :failed)
echo [OK] Node.js found.

set "FAILED_STEP=Checking npm"
where npm.cmd >nul 2>&1
if errorlevel 1 (echo [ERROR] npm was not found in PATH.& goto :failed)
echo [OK] npm found.

set "FAILED_STEP=Checking PowerShell"
where powershell.exe >nul 2>&1
if errorlevel 1 (echo [ERROR] Windows PowerShell was not found in PATH.& goto :failed)
echo [OK] Windows PowerShell found.

set "FAILED_STEP=Checking Docker CLI"
where docker.exe >nul 2>&1
if errorlevel 1 if exist "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe" set "PATH=%ProgramFiles%\Docker\Docker\resources\bin;%PATH%"
where docker.exe >nul 2>&1
if errorlevel 1 (echo [ERROR] Docker Desktop / Docker CLI was not found in PATH.& goto :failed)
echo [OK] Docker Desktop / Docker CLI found.

call :heading "Starting Docker Desktop and stable local infrastructure"
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker engine is not ready. Attempting to start Docker Desktop...
  if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe") else if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" (start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe") else (echo [ERROR] Docker Desktop executable was not found.& set "FAILED_STEP=Starting Docker Desktop"& goto :failed)
)
set "FAILED_STEP=Waiting for Docker engine"
call :wait_for_docker
if errorlevel 1 goto :failed

echo Docker engine is ready.

call :heading "Preparing a deterministic Windows runtime"
set "FAILED_STEP=Stopping stale NovaPDF processes and legacy containers"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\prepare-windows-runtime.ps1" -ExpectedWebVersion "%EXPECTED_WEB_VERSION%"
if errorlevel 1 goto :failed
if not exist "%BACKEND%\.env" (copy /Y "%BACKEND%\.env.example" "%BACKEND%\.env" >nul& echo Created backend\.env from the example.) else echo Existing backend\.env preserved.

set "FAILED_STEP=Starting PostgreSQL, Redis, MinIO, and Mailpit"
docker compose up -d postgres redis minio mailpit
if errorlevel 1 goto :failed
set "FAILED_STEP=Building and starting PDF Converter"
docker compose up -d --build pdf-converter
if errorlevel 1 (docker compose logs --tail 200 pdf-converter& goto :failed)
set "FAILED_STEP=Waiting for PostgreSQL"
call :wait_for_postgres
if errorlevel 1 goto :failed
set "FAILED_STEP=Waiting for Redis"
call :wait_for_redis
if errorlevel 1 goto :failed
set "FAILED_STEP=Waiting for MinIO"
call :wait_url "http://localhost:9000/minio/health/live" 120
if errorlevel 1 goto :failed
set "FAILED_STEP=Waiting for Mailpit"
call :wait_url "http://localhost:8025" 120
if errorlevel 1 goto :failed
set "FAILED_STEP=Waiting for PDF to Word converter"
call :wait_url "http://localhost:4010/health" 180
if errorlevel 1 (docker compose ps pdf-converter& docker compose logs --tail 200 pdf-converter& goto :failed)
set "FAILED_STEP=PDF to Word converter functional and editable native-object regression tests"
docker compose exec -T pdf-converter python -m unittest discover -s tests -v > "%CONVERTER_TEST_LOG%" 2>&1
set "CONVERTER_TEST_CODE=!ERRORLEVEL!"
type "%CONVERTER_TEST_LOG%"
if not "!CONVERTER_TEST_CODE!"=="0" goto :failed
set "FAILED_STEP=Creating or confirming the private MinIO bucket"
docker compose run --rm minio-init
if errorlevel 1 goto :failed
docker compose ps

call :heading "Root public-registry clean install and complete validation"
set "FAILED_STEP=Setting the root public npm registry"
call npm.cmd config set registry "%PUBLIC_REGISTRY%"
if errorlevel 1 goto :failed
set "FAILED_STEP=Checking root registry hygiene"
findstr /I /M /C:"artifactory" /C:"applied-caas" /C:"verdaccio" "%ROOT%\.npmrc" "%ROOT%\package-lock.json" > "%LOG_DIR%\root-private-registry-!RUN_ID!.txt" 2>nul
if not errorlevel 1 (echo [ERROR] A private registry reference was found.& type "%LOG_DIR%\root-private-registry-!RUN_ID!.txt"& goto :failed)
echo Removing root node_modules only. Docker volumes are not touched.
if exist "%ROOT%\node_modules" rmdir /S /Q "%ROOT%\node_modules"
set "FAILED_STEP=Root npm clean install"
call npm.cmd ci --registry="%PUBLIC_REGISTRY%"
if errorlevel 1 goto :failed
set "FAILED_STEP=Capturing root npm audit"
call npm.cmd audit > "%ROOT_AUDIT%" 2>&1
set "ROOT_AUDIT_CODE=!ERRORLEVEL!"
type "%ROOT_AUDIT%"
if not "!ROOT_AUDIT_CODE!"=="0" echo [WARNING] Root npm audit findings were captured; no automatic fix was applied.
set "FAILED_STEP=Root ESLint"
call npm.cmd run lint
if errorlevel 1 goto :failed
set "FAILED_STEP=Root TypeScript"
node.exe "%ROOT%\node_modules\typescript\bin\tsc" --noEmit
if errorlevel 1 goto :failed
set "FAILED_STEP=Root source contracts"
call npm.cmd run test:contracts
if errorlevel 1 goto :failed
set "FAILED_STEP=PDF-engine tests"
call npm.cmd run test:pdf-engines
if errorlevel 1 goto :failed
set "FAILED_STEP=Production build"
call npm.cmd run build
if errorlevel 1 goto :failed

call :heading "Frozen Step 12.8 backend validation and idempotent migration"
pushd "%BACKEND%"
set "FAILED_STEP=Setting the backend public npm registry"
call npm.cmd config set registry "%PUBLIC_REGISTRY%"
if errorlevel 1 goto :backend_failed
if exist package-lock.json del /F /Q package-lock.json
if exist node_modules rmdir /S /Q node_modules
set "FAILED_STEP=Generating a fresh backend public-registry lock"
call npm.cmd install --package-lock-only --registry="%PUBLIC_REGISTRY%"
if errorlevel 1 goto :backend_failed
set "FAILED_STEP=Checking backend registry hygiene"
findstr /I /M /C:"artifactory" /C:"applied-caas" /C:"verdaccio" .npmrc package-lock.json > "%LOG_DIR%\backend-private-registry-!RUN_ID!.txt" 2>nul
if not errorlevel 1 (echo [ERROR] A private backend registry reference was found.& type "%LOG_DIR%\backend-private-registry-!RUN_ID!.txt"& goto :backend_failed)
set "FAILED_STEP=Backend npm clean install"
call npm.cmd ci --registry="%PUBLIC_REGISTRY%"
if errorlevel 1 goto :backend_failed
set "FAILED_STEP=Capturing backend npm audit"
call npm.cmd audit > "%BACKEND_AUDIT%" 2>&1
set "BACKEND_AUDIT_CODE=!ERRORLEVEL!"
type "%BACKEND_AUDIT%"
if not "!BACKEND_AUDIT_CODE!"=="0" echo [WARNING] Backend npm audit findings were captured; no automatic fix was applied.
set "FAILED_STEP=Backend ESLint"
call npm.cmd run lint
if errorlevel 1 goto :backend_failed
set "FAILED_STEP=Backend TypeScript"
call npm.cmd run typecheck
if errorlevel 1 goto :backend_failed
set "FAILED_STEP=Backend build"
call npm.cmd run build
if errorlevel 1 goto :backend_failed
set "FAILED_STEP=Backend unit tests"
call npm.cmd run test
if errorlevel 1 goto :backend_failed
set "FAILED_STEP=Backend runtime metadata test"
call npm.cmd run test:metadata
if errorlevel 1 goto :backend_failed
set "FAILED_STEP=Applying the committed PostgreSQL migration"
call npm.cmd run migration:run > "%MIGRATION_APPLY_LOG%" 2>&1
set "MIGRATION_APPLY_CODE=!ERRORLEVEL!"
type "%MIGRATION_APPLY_LOG%"
if not "!MIGRATION_APPLY_CODE!"=="0" goto :backend_failed
set "FAILED_STEP=Verifying the committed PostgreSQL migration is applied"
call npm.cmd exec typeorm-ts-node-commonjs -- -d src/database/data-source.ts migration:show > "%MIGRATION_SHOW_LOG%" 2>&1
set "MIGRATION_SHOW_CODE=!ERRORLEVEL!"
type "%MIGRATION_SHOW_LOG%"
if not "!MIGRATION_SHOW_CODE!"=="0" goto :backend_failed
node.exe "%ROOT%\scripts\verify-migration-show.mjs" "%MIGRATION_SHOW_LOG%"
if errorlevel 1 goto :backend_failed
set "FAILED_STEP=Confirming the PostgreSQL migration is idempotent"
call npm.cmd run migration:run > "%MIGRATION_CONFIRM_LOG%" 2>&1
set "MIGRATION_CONFIRM_CODE=!ERRORLEVEL!"
type "%MIGRATION_CONFIRM_LOG%"
if not "!MIGRATION_CONFIRM_CODE!"=="0" goto :backend_failed
findstr /I /C:"No migrations are pending" "%MIGRATION_CONFIRM_LOG%" >nul
if errorlevel 1 (echo [ERROR] The second migration run did not confirm idempotency.& goto :backend_failed)
popd
goto :launch_services

:backend_failed
popd
goto :failed

:launch_services
call :heading "Launching fresh current-version Web, API, and Worker processes"
set "FAILED_STEP=Launching current NovaPDF Web, API, and Worker windows"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\start-production-windows.ps1" -Root "%ROOT%" -ExpectedWebVersion "%EXPECTED_WEB_VERSION%"
if errorlevel 1 goto :failed
set "FAILED_STEP=Waiting for the current NovaPDF Web version"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\verify-web-version.ps1" -ExpectedVersion "%EXPECTED_WEB_VERSION%" -TimeoutSeconds 120
if errorlevel 1 goto :failed
set "FAILED_STEP=Waiting for API live health"
call :wait_url "http://localhost:4000/api/v1/health/live" 120
if errorlevel 1 goto :failed
set "FAILED_STEP=Waiting for API ready health"
call :wait_url "http://localhost:4000/api/v1/health/ready" 120
if errorlevel 1 goto :failed

call :heading "Live route and real local E2E gates"
set "FAILED_STEP=All 33 HTTP routes"
cd /d "%ROOT%"
call npm.cmd run test:http-routes
if errorlevel 1 goto :failed
set "FAILED_STEP=Real Mailpit, MinIO, PostgreSQL, Redis sequential two-recipient E2E"
pushd "%BACKEND%"
set "RUN_BACKEND_E2E=1"
call npm.cmd run test:e2e
set "E2E_CODE=!ERRORLEVEL!"
set "RUN_BACKEND_E2E="
if not "!E2E_CODE!"=="0" goto :e2e_failed
popd
goto :open_manual_validation

:e2e_failed
set "RUN_BACKEND_E2E="
popd
goto :failed

:open_manual_validation
call :heading "Opening current-version pages and manual acceptance checklist"
start "" "http://localhost:3000/"
start "" "http://localhost:3000/pdf-to-word"
start "" "http://localhost:3000/api/novapdf/version"
start "" "http://localhost:3000/api/pdf-to-word/health"
start "" "http://localhost:4010/health"
start "" "http://localhost:3000/sign-pdf"
start "" "http://localhost:3000/edit-pdf"
start "" "http://localhost:4000/api/v1/health/live"
start "" "http://localhost:4000/api/docs"
start "" "http://localhost:8025"
start "" "http://localhost:9001"
start "" notepad.exe "%ROOT%\WINDOWS_VALIDATION_STEP_14_16.md"
(
  echo NovaPDF v0.14.16 consolidated run completed.
  echo Run ID: !RUN_ID!
  echo Project: %ROOT%
  echo Compose project: %COMPOSE_PROJECT_NAME%
  echo Root audit exit code: !ROOT_AUDIT_CODE!
  echo Backend audit exit code: !BACKEND_AUDIT_CODE!
  echo Web version: http://localhost:3000/api/novapdf/version
  echo PDF to Word: http://localhost:3000/pdf-to-word
  echo PDF Converter: http://localhost:4010/health
  echo Converter native-object regression log: %CONVERTER_TEST_LOG%
  echo API: http://localhost:4000/api/v1/health/live
  echo Manual browser acceptance remains required.
  echo Request Signatures remains disabled and production-provider delivery remains separate.
) > "%SUMMARY_LOG%"
type "%SUMMARY_LOG%"
echo.
echo [SUCCESS] All local automated gates completed for NovaPDF v0.14.16.
echo Complete WINDOWS_VALIDATION_STEP_14_16.md before promotion.
start "" explorer.exe "%LOG_DIR%"
pause
exit /b 0

:invalid_root
echo [ERROR] The project directory could not be opened: %ROOT%
pause
exit /b 1

:failed
echo.
echo ============================================================
echo [FAILED] !FAILED_STEP!
echo ============================================================
echo Review the error above and validation logs at: %LOG_DIR%
echo Docker volumes were not deleted. No automatic audit remediation was run.
pause
exit /b 1

:heading
echo.
echo ============================================================
echo %~1
echo ============================================================
exit /b 0

:wait_for_docker
for /L %%N in (1,1,60) do (docker info >nul 2>&1& if not errorlevel 1 exit /b 0& echo Waiting for Docker engine... %%N/60& timeout /T 3 /NOBREAK >nul)
echo [ERROR] Docker engine did not become ready within 180 seconds.
exit /b 1

:wait_for_postgres
for /L %%N in (1,1,60) do (docker compose exec -T postgres pg_isready -U novapdf -d novapdf >nul 2>&1& if not errorlevel 1 (echo PostgreSQL is ready.& exit /b 0)& echo Waiting for PostgreSQL... %%N/60& timeout /T 2 /NOBREAK >nul)
echo [ERROR] PostgreSQL did not become ready within 120 seconds.
exit /b 1

:wait_for_redis
for /L %%N in (1,1,60) do (docker compose exec -T redis redis-cli ping 2>nul | findstr /I /C:"PONG" >nul& if not errorlevel 1 (echo Redis is ready.& exit /b 0)& echo Waiting for Redis... %%N/60& timeout /T 2 /NOBREAK >nul)
echo [ERROR] Redis did not become ready within 120 seconds.
exit /b 1

:wait_url
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$url='%~1'; $seconds=[int]'%~2'; $deadline=(Get-Date).AddSeconds($seconds); do { try { $response=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { Write-Host ('Ready: ' + $url); exit 0 } } catch {}; Start-Sleep -Seconds 2 } while ((Get-Date) -lt $deadline); Write-Host ('Timed out: ' + $url); exit 1"
exit /b %ERRORLEVEL%
