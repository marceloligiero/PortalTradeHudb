<#
setup-and-run-dev-clean.ps1
Clean dev setup using SQLite (no pyodbc). Run from repository root.
Usage:
  powershell -NoProfile -ExecutionPolicy Bypass -File "c:\Portal Trade DataHub\setup-and-run-dev-clean.ps1"
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Running clean dev setup (SQLite) - will create venv and install dev deps" -ForegroundColor Cyan

# Determine script root
if($PSScriptRoot){
    $repoRoot = $PSScriptRoot
} else {
    $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
}
Set-Location $repoRoot

function Stop-IfRunning([string]$processName){
    $procs = Get-Process -Name $processName -ErrorAction SilentlyContinue
    if($procs){
        foreach($p in $procs){ Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
        Write-Host "Stopped running $processName processes" -ForegroundColor Yellow
    }
}

Stop-IfRunning -processName "uvicorn"
Stop-IfRunning -processName "python"
Stop-IfRunning -processName "node"

if(-not (Test-Path (Join-Path $repoRoot 'backend'))){
    Write-Error "backend folder not found in $repoRoot"; exit 1
}

Push-Location (Join-Path $repoRoot 'backend')

if(-not (Test-Path ".venv")){
    Write-Host "Creating virtual environment .venv..." -ForegroundColor Green
    python -m venv .venv
}

Write-Host "Activating virtual environment" -ForegroundColor Green
. .venv\Scripts\Activate.ps1

Write-Host "Upgrading pip, setuptools, wheel" -ForegroundColor Green
python -m pip install --upgrade pip setuptools wheel

$reqFile = "requirements-dev.txt"
if(-not (Test-Path $reqFile)){
    Write-Host "Error: $reqFile not found in backend. Please ensure backend/requirements-dev.txt exists." -ForegroundColor Red
    exit 1
}

Write-Host "Installing backend dev dependencies (this may take a few minutes)..." -ForegroundColor Green
pip install --prefer-binary -r $reqFile

# Ensure .env contains a SQLite DATABASE_URL for local dev
$envFile = Join-Path $repoRoot "backend\.env"
if(-not (Test-Path $envFile)){
    Write-Host "Creating .env with SQLite DATABASE_URL" -ForegroundColor Green
    "DATABASE_URL=sqlite:///./dev.db" | Out-File -FilePath $envFile -Encoding utf8
} else {
    $env = Get-Content $envFile -Raw
    if($env -notmatch 'DATABASE_URL='){
        Write-Host "Appending SQLite DATABASE_URL to existing .env" -ForegroundColor Green
        "`nDATABASE_URL=sqlite:///./dev.db" | Out-File -FilePath $envFile -Append -Encoding utf8
    } else {
        Write-Host ".env already contains DATABASE_URL - leaving unchanged" -ForegroundColor Yellow
    }
}

Write-Host "Starting backend (uvicorn) on 0.0.0.0:8000" -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath .venv\Scripts\python.exe -ArgumentList '-m','uvicorn','main:app','--host','0.0.0.0','--port','8000','--reload' -WorkingDirectory (Join-Path $repoRoot 'backend')

Pop-Location

if(Test-Path (Join-Path $repoRoot 'frontend')){
    Write-Host "Starting frontend dev server (npm run dev) in background" -ForegroundColor Cyan
    try{ Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run","dev" -WorkingDirectory (Join-Path $repoRoot 'frontend') } catch { Write-Host "Failed to start frontend (npm)." -ForegroundColor Yellow }
}

Write-Host "Dev setup finished. Backend should be at http://127.0.0.1:8000/ (check /health)." -ForegroundColor Green
