param(
  [string]$Url = "http://localhost:3000/api/novapdf/version",
  [string]$ExpectedVersion = "0.14.16",
  [int]$TimeoutSeconds = 120
)

$ErrorActionPreference = "SilentlyContinue"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
  try {
    $response = Invoke-RestMethod -Uri $Url -TimeoutSec 5 -Headers @{ "Cache-Control" = "no-cache" }
    if ($response.product -eq "NovaPDF" -and $response.version -eq $ExpectedVersion) {
      Write-Host "[OK] NovaPDF Web $ExpectedVersion is responding."
      exit 0
    }
    if ($response) {
      Write-Host "[ERROR] Port 3000 is serving NovaPDF version '$($response.version)', expected '$ExpectedVersion'."
      exit 2
    }
  } catch {}
  Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)
Write-Host "[ERROR] NovaPDF Web $ExpectedVersion did not become ready within $TimeoutSeconds seconds."
exit 1
