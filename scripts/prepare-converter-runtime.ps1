$ErrorActionPreference = "Stop"
$ids = @(docker.exe ps -q 2>$null)
foreach ($id in $ids) {
  if (-not $id) { continue }
  $inspectionJson = docker.exe inspect $id 2>$null
  if (-not $inspectionJson) { continue }
  $inspection = $inspectionJson | ConvertFrom-Json
  $labels = $inspection[0].Config.Labels
  $project = [string]$labels.'com.docker.compose.project'
  $service = [string]$labels.'com.docker.compose.service'
  if ($project -match '(?i)^novapdf' -and $project -ne 'novapdf-local' -and $service -eq 'pdf-converter') {
    Write-Host "[NovaPDF] Stopping legacy PDF converter $id ($project); volumes are preserved."
    docker.exe stop $id | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not stop legacy PDF converter $id." }
  }
}
