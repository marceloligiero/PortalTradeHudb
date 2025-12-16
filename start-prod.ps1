<#
Start-production script for Portal Trade DataHub (Windows PowerShell)

What it does:
- Loads `.env` and `backend/.env` into the process environment (if present)
- Builds the frontend (`npm ci` + `npm run build`) if `frontend/package.json` exists
- Starts the backend using `python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4`
- Writes backend logs to `backend/prod.log` and PID to `backend/uvicorn.pid`

Usage: Run from repo root in an elevated PowerShell if needed:
    .\start-prod.ps1
#>

Set-StrictMode -Version Latest

function Load-DotEnv {
    param(
        [string]$Path
    )
    if (-not (Test-Path $Path)) { return }
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        $m = $line -match '^(?<k>[^=]+)=(?<v>.*)$'
        if ($m) {
            $k = $matches['k'].Trim()
            $v = $matches['v'].Trim()
            if ($v.StartsWith('"') -and $v.EndsWith('"') -or $v.StartsWith("'") -and $v.EndsWith("'")) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            [Environment]::SetEnvironmentVariable($k, $v, 'Process')
        }
    }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Loading .env files (if any)..."
Load-DotEnv (Join-Path $root '.env')
Load-DotEnv (Join-Path $root 'backend\.env')

if (Test-Path (Join-Path $root 'frontend\package.json')) {
    Write-Host "Building frontend..."
    Push-Location (Join-Path $root 'frontend')
    if (Test-Path package-lock.json) { npm ci } else { npm install }
    npm run build
    Pop-Location
    Write-Host "Frontend build finished."
} else {
    Write-Host "No frontend/package.json found — skipping frontend build."
}

Write-Host "Starting backend (uvicorn)..."
Push-Location (Join-Path $root 'backend')

$logFile = Join-Path (Get-Location) 'prod.log'
$pidFile = Join-Path (Get-Location) 'uvicorn.pid'

$args = @('-m','uvicorn','main:app','--host','0.0.0.0','--port','8000','--workers','4','--log-level','info')

$proc = Start-Process -FilePath 'python' -ArgumentList $args -RedirectStandardOutput $logFile -RedirectStandardError $logFile -NoNewWindow -PassThru

if ($proc) {
    $proc.Id | Out-File -FilePath $pidFile -Encoding ascii
    Write-Host "Backend started with PID $($proc.Id). Logs: $logFile"
} else {
    Write-Error "Failed to start backend. See $logFile for details."
}

Pop-Location

Write-Host "Production start sequence complete."
