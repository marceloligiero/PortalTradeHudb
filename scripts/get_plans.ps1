$body = @{username='admin@tradehub.com'; password='admin123'} | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $login.access_token
Write-Output "TOKEN: $token"
$resp = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/training-plans/' -Headers @{ Authorization = "Bearer $token" } -Method Get
$resp | ConvertTo-Json -Depth 5
