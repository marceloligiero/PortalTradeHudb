param(
    [switch]$InstallFrontendDeps
)

# Start backend in new PowerShell window
$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendDir = Resolve-Path "$backendDir\.."

Write-Host "Starting backend in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; ./venv/Scripts/activate; uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info"

# Optionally install frontend deps
if ($InstallFrontendDeps) {
    Write-Host "Installing frontend dependencies..."
    cd "$backendDir\frontend"
    npm install
}

# Start frontend in new window if Node is available
$node = (Get-Command node -ErrorAction SilentlyContinue)
if ($node) {
    Write-Host "Starting frontend in a new window..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir\frontend'; npm run dev"
} else {
    Write-Host "Node.js not found in PATH. To start the frontend, install Node.js and run 'npm run dev' in the 'frontend' folder."
}
