```powershell
<#
Start both backend (uvicorn) and frontend (vite) in development mode.
Usage: Run PowerShell with execution policy that allows script execution and run this file.
#>
param()

Write-Host "Starting Portal Trade DataHub (backend + frontend)" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Start backend (uvicorn)
Write-Host "Starting backend..." -ForegroundColor Green
Push-Location (Join-Path $root 'backend')
if (Get-Command python -ErrorAction SilentlyContinue) {
    $backend = Start-Process -FilePath python -ArgumentList '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000' -WorkingDirectory (Get-Location) -PassThru
    Write-Host "Backend started with PID $($backend.Id)" -ForegroundColor Green
} else {
    Write-Host "Python not found in PATH. Please ensure Python is installed." -ForegroundColor Yellow
}
Pop-Location

# Start frontend (npm run dev)
Write-Host "Starting frontend (Vite)..." -ForegroundColor Green
Push-Location (Join-Path $root 'frontend')
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $frontend = Start-Process -FilePath npm -ArgumentList 'run','dev' -WorkingDirectory (Get-Location) -PassThru
    Write-Host "Frontend started with PID $($frontend.Id)" -ForegroundColor Green
} else {
    Write-Host "npm not found in PATH. Please install Node.js/npm." -ForegroundColor Yellow
}
Pop-Location

Write-Host "Start commands issued. Check terminals or process list for status." -ForegroundColor Cyan
```