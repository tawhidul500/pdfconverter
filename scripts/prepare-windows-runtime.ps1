param(
  [string]$ExpectedWebVersion = "0.14.11"
)

$ErrorActionPreference = "Stop"

function Stop-NovaPdfListener {
  param([int]$Port)

  $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
  foreach ($listener in $listeners) {
    $pidValue = [int]$listener.OwningProcess
    if ($pidValue -le 0) { continue }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$pidValue" -ErrorAction SilentlyContinue
    if (-not $process) { continue }
    $command = [string]$process.CommandLine
    $name = [string]$process.Name
    $isNode = $name -match '^node(\.exe)?$'
    $isNovaPdf = $command -match '(?i)NovaPDF'
    if ($isNode -and $isNovaPdf) {
      Write-Host "[NovaPDF] Stopping stale NovaPDF process on port $Port (PID $pidValue)."
      Stop-Process -Id $pidValue -Force -ErrorAction Stop
      Start-Sleep -Milliseconds 500
      continue
    }
    throw "Port $Port is occupied by a non-NovaPDF process (PID $pidValue, $name). Close it, then rerun NovaPDF."
  }
}

function Stop-NovaPdfWorkers {
  $workers = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '^node(\.exe)?$' -and
    $_.CommandLine -match '(?i)NovaPDF' -and
    $_.CommandLine -match '(src[\\/]worker\.ts|dist[\\/]worker\.js)'
  })
  foreach ($worker in $workers) {
    Write-Host "[NovaPDF] Stopping stale NovaPDF worker (PID $($worker.ProcessId))."
    Stop-Process -Id ([int]$worker.ProcessId) -Force -ErrorAction SilentlyContinue
  }
}

function Stop-LegacyNovaPdfContainers {
  $ids = @(docker.exe ps -q 2>$null)
  foreach ($id in $ids) {
    if (-not $id) { continue }
    $inspectionJson = docker.exe inspect $id 2>$null
    if (-not $inspectionJson) { continue }
    $inspection = $inspectionJson | ConvertFrom-Json
    $labels = $inspection[0].Config.Labels
    $project = [string]$labels.'com.docker.compose.project'
    $service = [string]$labels.'com.docker.compose.service'
    if ($project -match '(?i)^novapdf' -and $project -ne 'novapdf-local') {
      Write-Host "[NovaPDF] Stopping legacy container $id ($project/$service); volumes are preserved."
      docker.exe stop $id | Out-Null
      if ($LASTEXITCODE -ne 0) { throw "Could not stop legacy NovaPDF container $id." }
    }
  }
}

Stop-NovaPdfListener -Port 3000
Stop-NovaPdfListener -Port 4000
Stop-NovaPdfWorkers
Stop-LegacyNovaPdfContainers
Write-Host "[OK] Windows runtime preflight completed. No Docker volume was removed."
