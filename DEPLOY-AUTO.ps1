$VPS_IP = '72.60.188.172'
$VPS_USER = 'root'
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
if (-not $ROOT_DIR) { $ROOT_DIR = $PSScriptRoot }

Write-Host '=================================================' -ForegroundColor Cyan
Write-Host 'DEPLOY AUTOMATICO - Portal TradeHub' -ForegroundColor Cyan
Write-Host '=================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'VPS:' $VPS_IP -ForegroundColor Yellow
Write-Host ''

$deployScript = Join-Path $PSScriptRoot 'deploy\full-deploy-vps.sh'

Write-Host '[1/4] Enviando script de setup...' -ForegroundColor Blue
scp $deployScript ($VPS_USER + '@' + $VPS_IP + ':/root/full-deploy-vps.sh')

Write-Host ''
Write-Host '[2/4] Executando setup na VPS...' -ForegroundColor Blue
ssh ($VPS_USER + '@' + $VPS_IP) 'chmod +x /root/full-deploy-vps.sh; bash /root/full-deploy-vps.sh'

Write-Host ''
Write-Host '[3/4] Enviando aplicacao...' -ForegroundColor Blue
scp -r (Join-Path $ROOT_DIR 'backend') ($VPS_USER + '@' + $VPS_IP + ':/var/www/tradehub/')
scp -r (Join-Path $ROOT_DIR 'frontend') ($VPS_USER + '@' + $VPS_IP + ':/var/www/tradehub/')
scp -r (Join-Path $ROOT_DIR 'database') ($VPS_USER + '@' + $VPS_IP + ':/var/www/tradehub/')

Write-Host ''
Write-Host '[4/4] Configurando aplicacao...' -ForegroundColor Blue
ssh ($VPS_USER + '@' + $VPS_IP) 'bash /var/www/tradehub/setup-app.sh'

Write-Host ''
Write-Host '===============================================' -ForegroundColor Green
Write-Host 'DEPLOY CONCLUIDO!' -ForegroundColor Green
Write-Host '===============================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Acesse: http://72.60.188.172' -ForegroundColor White
