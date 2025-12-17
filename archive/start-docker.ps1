```powershell
# Script para iniciar o projeto com Docker Compose no Windows

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  TradeHub - Docker Setup (Windows)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está instalado
try {
    docker --version | Out-Null
} catch {
    Write-Host "ERROR: Docker não está instalado!" -ForegroundColor Red
    exit 1
}

# Criar arquivo .env se não existir
if (!(Test-Path ".env")) {
    Write-Host "Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Arquivo .env criado. Atualize com suas credenciais de banco de dados!" -ForegroundColor Yellow
    Read-Host "Pressione ENTER para continuar"
}

# Build e inicie os containers
Write-Host ""
Write-Host "Construindo e iniciando containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Serviços iniciados com sucesso!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver os logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "Para parar os serviços:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
```