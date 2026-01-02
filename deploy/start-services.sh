#!/bin/bash
# Script para iniciar serviços com PM2

set -e

APP_DIR="/var/www/tradehub"

echo "==================================="
echo "Iniciando Serviços"
echo "==================================="

cd $APP_DIR/backend

# Ativar ambiente virtual
source venv/bin/activate

# Iniciar backend com PM2
echo "🚀 Iniciando backend..."
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4" --name tradehub-backend

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup | tail -n 1 | sudo bash

echo ""
echo "✅ Serviços iniciados!"
echo ""
echo "Comandos úteis:"
echo "  pm2 status           - Ver status dos serviços"
echo "  pm2 logs            - Ver logs"
echo "  pm2 restart all     - Reiniciar serviços"
echo "  pm2 stop all        - Parar serviços"
echo "  pm2 delete all      - Remover serviços"
