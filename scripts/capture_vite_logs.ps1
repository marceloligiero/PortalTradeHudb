$cwd = 'C:\Portal Trade DataHub\frontend'
if (-not (Test-Path $cwd)) { Write-Host 'frontend folder missing'; exit 0 }
$out = 'C:\Windows\Temp\vite_out.log'
$err = 'C:\Windows\Temp\vite_err.log'
if (Test-Path $out) { Remove-Item $out -Force }
if (Test-Path $err) { Remove-Item $err -Force }
$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run dev' -WorkingDirectory $cwd -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
Start-Sleep -Seconds 8
if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
Write-Host '--- STDOUT ---'
if (Test-Path $out) { Get-Content $out -TotalCount 200 | Write-Host } else { Write-Host 'No stdout file' }
Write-Host '--- STDERR ---'
if (Test-Path $err) { Get-Content $err -TotalCount 200 | Write-Host } else { Write-Host 'No stderr file' }
