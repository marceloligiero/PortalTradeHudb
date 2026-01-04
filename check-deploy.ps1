# Script para verificar status do deploy
$VPS_IP = "72.60.188.172"
$VPS_PASSWORD = "Escambal4..."
$MAX_ATTEMPTS = 60  # 10 minutos (verifica a cada 10 segundos)
$SLEEP_TIME = 10

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Verificando Deploy - Portal TradeHub  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$attempt = 0
$deployed = $false

while ($attempt -lt $MAX_ATTEMPTS -and -not $deployed) {
    $attempt++
    $elapsed = $attempt * $SLEEP_TIME
    
    Write-Host "[$attempt/$MAX_ATTEMPTS] Verificando... (${elapsed}s)" -ForegroundColor Yellow
    
    # Verificar se PM2 está rodando
    $pm2Status = echo $VPS_PASSWORD | ssh root@$VPS_IP "pm2 status 2>&1 | grep -q 'tradehub-backend' && echo 'OK' || echo 'NOT_READY'" 2>$null
    
    # Verificar se Nginx está ativo  
    $nginxStatus = echo $VPS_PASSWORD | ssh root@$VPS_IP "systemctl is-active nginx 2>&1" 2>$null
    
    # Verificar se o site responde
    try {
        $webTest = Invoke-WebRequest -Uri "http://$VPS_IP" -TimeoutSec 5 -ErrorAction SilentlyContinue
        $webOk = $webTest.StatusCode -eq 200
    } catch {
        $webOk = $false
    }
    
    if ($pm2Status -match "OK" -and $nginxStatus -eq "active" -and $webOk) {
        $deployed = $true
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        
        # Buscar detalhes
        $details = echo $VPS_PASSWORD | ssh root@$VPS_IP @"
echo '📊 Status dos Serviços:'
echo '---'
pm2 status
echo ''
echo '🔗 Links:'
echo '   Site: http://$VPS_IP'
echo '   API Docs: http://$VPS_IP/docs'
echo ''
echo '📝 Comandos úteis:'
echo '   pm2 logs              - Ver logs do backend'
echo '   pm2 restart all       - Reiniciar backend'
echo '   systemctl status nginx - Status do Nginx'
"@ 2>$null
        
        Write-Host $details
        Write-Host ""
        Write-Host "🌐 Abrindo site no navegador..." -ForegroundColor Cyan
        Start-Process "http://$VPS_IP"
        
    } else {
        Write-Host "   PM2: $pm2Status | Nginx: $nginxStatus | Web: $webOk" -ForegroundColor Gray
        Start-Sleep -Seconds $SLEEP_TIME
    }
}

if (-not $deployed) {
    Write-Host ""
    Write-Host "⚠️  Tempo limite atingido!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verificar logs manualmente:" -ForegroundColor Yellow
    Write-Host "   ssh root@$VPS_IP" -ForegroundColor Gray
    Write-Host "   pm2 logs" -ForegroundColor Gray
    Write-Host "   tail -f /var/log/nginx/tradehub_error.log" -ForegroundColor Gray
}

Write-Host ""
Read-Host "Pressione Enter para sair"
