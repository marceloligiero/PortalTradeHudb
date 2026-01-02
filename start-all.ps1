<#
  start-all.ps1 - Start/stop the project (backend, frontend, cloudflared) on Windows PowerShell

  Usage:
    .\start-all.ps1            # start everything
    .\start-all.ps1 stop       # stop all services
    .\start-all.ps1 restart    # restart all services

  Notes:
  - Requires Python, Node/npm, and cloudflared to be in PATH.
  - Run PowerShell as Administrator if you need permissions to create venv or install packages.
  - To run this script without changing execution policy:
      powershell -ExecutionPolicy Bypass -File .\start-all.ps1
#>

param(
  [string]$Action = 'start'
)

Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Logs = Join-Path $Root 'logs'
New-Item -Path $Logs -ItemType Directory -Force | Out-Null

function Write-Log($msg) { Write-Host $msg }

function Start-Backend {
  Write-Log 'Starting backend...'
  Push-Location (Join-Path $Root 'backend')
  if (-not (Test-Path '.venv')) {
    Write-Log 'Creating virtualenv and installing requirements...'
    python -m venv .venv
    & .\.venv\Scripts\python.exe -m pip install --upgrade pip
    if (Test-Path 'requirements.txt') { & .\.venv\Scripts\python.exe -m pip install -r requirements.txt }
  }

  $python = Join-Path $PWD '.venv\Scripts\python.exe'
  if (-not (Test-Path $python)) { $python = (Get-Command python -ErrorAction SilentlyContinue).Path }

  $out = Join-Path $Logs 'backend-uvicorn.log'
  $err = $out
  $args = '-m','uvicorn','main:app','--host','127.0.0.1','--port','8000','--log-level','info'

  $proc = Start-Process -FilePath $python -ArgumentList $args -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
  $proc.Id | Out-File (Join-Path $Logs 'prod-backend.pid') -Encoding ascii
  Pop-Location
}

function Start-Frontend {
  Write-Log 'Starting frontend (Vite)...'
  Push-Location (Join-Path $Root 'frontend')
  if (-not (Test-Path 'node_modules')) {
    Write-Log 'Installing frontend dependencies (npm install)...'
    npm install
  }

  $out = Join-Path $Logs 'frontend-vite.log'
  $err = $out
  # Use npm.cmd on Windows if available
  $npm = (Get-Command npm -ErrorAction SilentlyContinue).Path
  $proc = Start-Process -FilePath $npm -ArgumentList 'run','dev','--','--host' -RedirectStandardOutput $out -RedirectStandardError $err -WorkingDirectory (Join-Path $Root 'frontend') -PassThru
  $proc.Id | Out-File (Join-Path $Logs 'prod-frontend.pid') -Encoding ascii
  Pop-Location
}

function Start-Cloudflared {
  Write-Log 'Starting cloudflared quick tunnels...'
  Push-Location $Root
  $outB = Join-Path $Logs 'cloudflared-backend.log'
  $outF = Join-Path $Logs 'cloudflared-frontend.log'

  $procB = Start-Process -FilePath 'cloudflared' -ArgumentList 'tunnel','--url','http://127.0.0.1:8000' -RedirectStandardOutput $outB -RedirectStandardError $outB -PassThru
  $procB.Id | Out-File (Join-Path $Logs 'cloudflared-backend.pid') -Encoding ascii

  $procF = Start-Process -FilePath 'cloudflared' -ArgumentList 'tunnel','--url','http://127.0.0.1:5173' -RedirectStandardOutput $outF -RedirectStandardError $outF -PassThru
  $procF.Id | Out-File (Join-Path $Logs 'cloudflared-frontend.pid') -Encoding ascii
  Pop-Location
}

function Stop-ByPidFile($pidFile) {
  if (Test-Path $pidFile) {
    try {
      $pid = Get-Content $pidFile -ErrorAction Stop
      if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      }
    } catch {
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
  }
}

function Stop-All {
  Write-Log 'Stopping services...'
  Stop-ByPidFile (Join-Path $Logs 'prod-backend.pid')
  Stop-ByPidFile (Join-Path $Logs 'prod-frontend.pid')
  Stop-ByPidFile (Join-Path $Logs 'cloudflared-backend.pid')
  Stop-ByPidFile (Join-Path $Logs 'cloudflared-frontend.pid')

  # As fallback, try to stop by process name
  Get-Process -Name 'uvicorn' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Get-Process -Name 'node' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

switch ($Action.ToLower()) {
  'stop' {
    Stop-All
    break
  }
  'restart' {
    Stop-All
    Start-Backend
    Start-Frontend
    Start-Cloudflared
    break
  }
  default {
    Start-Backend
    Start-Frontend
    Start-Cloudflared
    break
  }
}

Write-Log 'Done.'
