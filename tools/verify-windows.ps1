$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot/..

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logDir = Join-Path (Get-Location) 'verification'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir "verify-$stamp.log"
Start-Transcript -Path $logFile -Force | Out-Null

function Invoke-Check([string]$Label, [scriptblock]$Command) {
    Write-Host "`n===== $Label =====" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Label завершилась с кодом $LASTEXITCODE. См. $logFile"
    }
}

try {
    Write-Host 'Astra Telegram Assistant — Windows verification' -ForegroundColor Green
    Write-Host "Project: $(Get-Location)"
    Invoke-Check 'Rust compiler version' { rustc --version }
    Invoke-Check 'Cargo version' { cargo --version }
    Invoke-Check 'Formatting check' { cargo fmt --all -- --check }
    # This resolves the newly added reqwest dependency and updates Cargo.lock.
    # Do not use --locked on this first run.
    Invoke-Check 'Cargo check' { cargo check }
    Invoke-Check 'Unit tests' { cargo test }
    Invoke-Check 'Release build' { cargo build --release }
    Invoke-Check 'Astra plugin package' { astra-plugin build }

    Write-Host "`nALL BUILD CHECKS PASSED" -ForegroundColor Green
    Write-Host "Log: $logFile"
}
catch {
    Write-Host "`nVERIFICATION FAILED: $_" -ForegroundColor Red
    Write-Host "Log: $logFile"
    exit 1
}
finally {
    Stop-Transcript | Out-Null
}
