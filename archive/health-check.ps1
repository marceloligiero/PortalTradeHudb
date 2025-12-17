# Script para verificar status dos serviços (Windows)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  TradeHub - Service Health Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "   [OK] Docker instalado" -ForegroundColor Green
} catch {
    Write-Host "   [ERRO] Docker não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Verificando containers..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "3. Testando Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Backend respondendo (http://localhost:8000)" -ForegroundColor Green
    }
} catch {
    Write-Host "   [ERRO] Backend não respondeu" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Testando Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Frontend respondendo (http://localhost:3000)" -ForegroundColor Green
    }
} catch {
    Write-Host "   [ERRO] Frontend não respondeu" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Testando SQL Server..." -ForegroundColor Yellow
try {
    $output = docker exec tradehub-sqlserver /opt/mssql-tools/bin/sqlcmd `
        -S localhost -U sa -P Tradehub@2024 `
        -Q "SELECT 1" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] SQL Server conectado (localhost:1433)" -ForegroundColor Green
    }
} catch {
    Write-Host "   [ERRO] SQL Server não respondeu" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Health Check Concluído" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
