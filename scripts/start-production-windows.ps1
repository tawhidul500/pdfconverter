param(
  [Parameter(Mandatory = $true)]
  [string]$Root,
  [string]$ExpectedWebVersion = "0.14.16"
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path -LiteralPath $Root).Path
$commandProcessor = [Environment]::GetEnvironmentVariable("ComSpec")
if (-not $commandProcessor) { $commandProcessor = Join-Path $env:SystemRoot "System32\cmd.exe" }
if (-not (Test-Path -LiteralPath $commandProcessor -PathType Leaf)) {
  throw "Windows command processor was not found: $commandProcessor"
}

$targets = @(
  @{ Name = "Web"; Script = "START_NOVAPDF_WEB.cmd"; Expected = Join-Path $rootPath "node_modules\next\dist\bin\next" },
  @{ Name = "API"; Script = "START_NOVAPDF_API.cmd"; Expected = Join-Path $rootPath "backend\dist\main.js" },
  @{ Name = "Worker"; Script = "START_NOVAPDF_WORKER.cmd"; Expected = Join-Path $rootPath "backend\dist\worker.js" }
)

$started = @()
foreach ($target in $targets) {
  $scriptPath = Join-Path $rootPath $target.Script
  if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) {
    throw "NovaPDF $($target.Name) launcher is missing: $scriptPath"
  }
  if (-not (Test-Path -LiteralPath $target.Expected -PathType Leaf)) {
    throw "NovaPDF $($target.Name) runtime entry point is missing: $($target.Expected)"
  }

  # The package path is supplied through WorkingDirectory. It is never embedded in a nested cmd.exe command string.
  $process = Start-Process `
    -FilePath $commandProcessor `
    -ArgumentList @("/d", "/k", "call $($target.Script)") `
    -WorkingDirectory $rootPath `
    -PassThru
  $started += [pscustomobject]@{ name = $target.Name; pid = $process.Id; launcher = $target.Script }
  Write-Host "[OK] Started NovaPDF $($target.Name) window (PID $($process.Id))."
}

$runtimeFile = Join-Path $rootPath "validation-logs\runtime-processes.json"
$started | ConvertTo-Json | Set-Content -LiteralPath $runtimeFile -Encoding UTF8
Write-Host "[OK] Web, API, and Worker launch requests were issued from the verified package directory."
exit 0
