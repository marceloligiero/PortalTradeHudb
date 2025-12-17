```bash
#!/bin/bash
# Script para iniciar o projeto com Docker Compose

echo "======================================"
echo "  TradeHub - Docker Setup"
echo "======================================"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker não está instalado!"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose não está instalado!"
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "Criando arquivo .env..."
    cp .env.example .env
    echo "Arquivo .env criado. Por favor, atualize com suas credenciais de banco de dados!"
    read -p "Pressione ENTER para continuar..."
fi

# Build e inicie os containers
echo ""
echo "Construindo e iniciando containers..."
docker-compose up -d

echo ""
echo "======================================"
echo "  Serviços iniciados com sucesso!"
echo "======================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Para ver os logs:"
echo "  docker-compose logs -f"
echo ""
echo "Para parar os serviços:"
echo "  docker-compose down"
echo "======================================"

```