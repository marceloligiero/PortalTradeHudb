```powershell
Start-Sleep -Seconds 2
Write-Host "Testando login..."
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" -Method POST -Body "username=admin@tradehub.com&password=admin123" -ContentType "application/x-www-form-urlencoded" -UseBasicParsing
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
```