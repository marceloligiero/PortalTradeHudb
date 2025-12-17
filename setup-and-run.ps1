<#
setup-and-run.ps1
- Stops any running backend/frontend processes (uvicorn/node vite)
- Installs backend and frontend dependencies (venv, pip, npm)
- Starts backend (uvicorn) and frontend (vite) in separate processes
#>

Write-Host "== setup-and-run: stopping existing services ==" -ForegroundColor Cyan

# Stop Vite node processes
$nodes = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*vite*' }
if ($nodes) {
    foreach ($n in $nodes) { Write-Host "Stopping node PID $($n.Id)"; Stop-Process -Id $n.Id -Force -ErrorAction SilentlyContinue }
}

# Stop python/uvicorn processes
$py = Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'uvicorn|main:app' }
if ($py) {
    foreach ($p in $py) { Write-Host "Stopping python PID $($p.Id)"; Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
}

# Also kill processes listening on ports 8000 / 5173
try {
    $p8000 = (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess
    if ($p8000) { Write-Host "Stopping PID on :8000 => $p8000"; Stop-Process -Id $p8000 -Force -ErrorAction SilentlyContinue }
} catch {}
try {
    $p5173 = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess
    if ($p5173) { Write-Host "Stopping PID on :5173 => $p5173"; Stop-Process -Id $p5173 -Force -ErrorAction SilentlyContinue }
} catch {}

Write-Host "== setup-and-run: installing backend deps if needed ==" -ForegroundColor Cyan
Push-Location (Join-Path $PSScriptRoot 'backend')
if (-not (Test-Path '.venv')) {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "Creating venv..."
        python -m venv .venv
    } else {
        Write-Host "Python not found in PATH; please install Python 3.10+" -ForegroundColor Yellow
    }
}
$pipPath = Join-Path .venv 'Scripts\pip.exe'
if (Test-Path $pipPath) {
    Write-Host "Installing backend requirements..."
    Write-Host "Upgrading pip, setuptools and wheel to improve binary wheel availability..."
    & $pipPath install --upgrade pip setuptools wheel
    Write-Host "Installing backend requirements..."
    $installResult = & $pipPath install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "pip install returned exit code $LASTEXITCODE" -ForegroundColor Yellow
        Write-Host "If build failures occur (numpy/pandas), please install Visual C++ Build Tools or try rerunning with prebuilt wheels." -ForegroundColor Yellow
    }
} else {
    Write-Host "pip in venv not found; attempting global pip install..." -ForegroundColor Yellow
    if (Get-Command pip -ErrorAction SilentlyContinue) { pip install -r requirements.txt } else { Write-Host "pip not available" -ForegroundColor Red }
}
Pop-Location

Write-Host "== setup-and-run: installing frontend deps if needed ==" -ForegroundColor Cyan
Push-Location (Join-Path $PSScriptRoot 'frontend')
if (-not (Test-Path 'node_modules')) {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Host "Running npm install..."
        npm install
    } else {
        Write-Host "npm not found in PATH; please install Node.js and npm" -ForegroundColor Yellow
    }
} else { Write-Host "node_modules already present, skipping npm install" }
Pop-Location

Start-Sleep -Seconds 1

Write-Host "== setup-and-run: starting backend and frontend ==" -ForegroundColor Green
# Start backend
Push-Location (Join-Path $PSScriptRoot 'backend')
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCmd) {
    $backendProc = Start-Process -FilePath $pythonCmd.Path -ArgumentList '-m','uvicorn','main:app','--host','0.0.0.0','--port','8000' -WorkingDirectory (Get-Location) -PassThru
    Write-Host "Backend started PID: $($backendProc.Id)"
} else {
    Write-Host "Python not available to start backend" -ForegroundColor Red
}
Pop-Location

# Start frontend
Push-Location (Join-Path $PSScriptRoot 'frontend')
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($npmCmd) {
    $frontendProc = Start-Process -FilePath $npmCmd.Path -ArgumentList 'run','dev' -WorkingDirectory (Get-Location) -PassThru
    Write-Host "Frontend started PID: $($frontendProc.Id)"
} else {
    Write-Host "npm not available to start frontend" -ForegroundColor Red
}
Pop-Location

Write-Host "== setup-and-run: finished ==" -ForegroundColor Cyan
Write-Host "Check backend at http://localhost:8000 and frontend at http://localhost:5173" -ForegroundColor Cyan
