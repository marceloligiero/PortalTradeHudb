# Start Cloudflare Tunnel for frontend and backend
# Requirements: install `cloudflared` and have it in PATH

function Ensure-Cloudflared {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Host "cloudflared not found in PATH. Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/ and add to PATH." -ForegroundColor Yellow
        return $false
    }
    return $true
}

if (-not (Ensure-Cloudflared)) { exit 1 }

$frontendPort = 5173
$backendPort = 8000

Write-Host "Starting Cloudflare temporary tunnel for frontend on http://127.0.0.1:$frontendPort"
Start-Process -FilePath cloudflared -ArgumentList "tunnel","--url","http://127.0.0.1:$frontendPort" -NoNewWindow -WindowStyle Normal

Write-Host "Starting Cloudflare temporary tunnel for backend on http://127.0.0.1:$backendPort"
Start-Process -FilePath cloudflared -ArgumentList "tunnel","--url","http://127.0.0.1:$backendPort" -NoNewWindow -WindowStyle Normal

Write-Host "Two cloudflared processes started in separate windows. Each will print a public trycloudflare.com URL you can use to access the service." -ForegroundColor Green
Write-Host "If you want to use your own domain, create a named tunnel and configure DNS per Cloudflare docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/configuration/" -ForegroundColor Cyan
