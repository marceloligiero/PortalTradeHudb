$api='http://127.0.0.1:8000'
$body = @{ username='admin@tradehub.com'; password='admin123' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$api/api/auth/login" -Method Post -Body $body -ContentType 'application/json'
$token = $login.access_token
Write-Host "Token length:" $token.Length
$hdr = @{ Authorization = "Bearer $token"; 'Content-Type'='application/json' }
$payload = @{
  title = 'Aula de Teste - Teórica'
  description = 'Conteúdo teste via script'
  estimated_minutes = 45
  order = 1
  materials_url = 'https://example.com/material.pdf'
  course_id = 1
  lesson_type = 'THEORETICAL'
} | ConvertTo-Json

try {
  $resp = Invoke-RestMethod -Uri "$api/api/trainer/lessons" -Method Post -Headers $hdr -Body $payload -ErrorAction Stop
  Write-Host "CREATE_OK"
  $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Host "CREATE_FAIL" $_.Exception.Message
  if ($_.Exception.Response) { try { $_.Exception.Response.Content.ReadAsStringAsync() | Write-Host } catch { } }
}
