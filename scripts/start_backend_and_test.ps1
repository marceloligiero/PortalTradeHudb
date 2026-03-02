$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..")
# Ensure logs dir
New-Item -Path (Join-Path $repoRoot 'logs') -ItemType Directory -Force | Out-Null
$python = Join-Path $repoRoot ".venv\Scripts\python.exe"
$backendDir = Join-Path $repoRoot 'backend'
$stdout = Join-Path $repoRoot 'logs\backend_stdout.log'
$stderr = Join-Path $repoRoot 'logs\backend_stderr.log'
Start-Process -FilePath $python -ArgumentList '-m','uvicorn','main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory $backendDir -RedirectStandardOutput $stdout -RedirectStandardError $stderr -NoNewWindow
Start-Sleep -Seconds 5
Write-Host 'Checking health endpoint...'
try {
    $res = Invoke-RestMethod 'http://127.0.0.1:8000/api/health'
    Write-Host "Health: $($res | ConvertTo-Json -Compress)"
} catch {
    Write-Host 'Health check failed. Backend stderr (last 200 lines):'
    Get-Content $stderr -Tail 200
}
