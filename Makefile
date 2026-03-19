.PHONY: up up-d up-build up-prod up-prod-build down down-volumes build \
        build-backend build-frontend logs logs-backend logs-frontend logs-db \
        shell shell-db shell-db-root \
        restart restart-backend status health clean db-reset db-test db-reset-test \
        install-local start-local stop-local deploy-local build-dist help

# ── Prefixo do projecto ────────────────────────────────
PROJECT := tradehub

## ── Arranque ──────────────────────────────────────────────────────────────

up: ## Inicia todos os serviços em foreground (dev: hot reload activo)
	docker compose up

up-d: ## Inicia em background (dev)
	docker compose up -d

up-build: ## Rebuilda imagens e inicia (dev)
	docker compose up -d --build

up-prod: ## Inicia em modo PRODUÇÃO (sem override de dev)
	docker compose -f docker-compose.yml up -d

up-prod-build: ## Rebuilda e inicia em modo PRODUÇÃO
	docker compose -f docker-compose.yml up -d --build

## ── Paragem ───────────────────────────────────────────────────────────────

down: ## Para todos os serviços (preserva volumes e dados)
	docker compose down

down-volumes: ## Para e apaga volumes — ATENÇÃO: elimina dados da DB
	docker compose down -v

## ── Build ─────────────────────────────────────────────────────────────────

build: ## Builda todas as imagens
	docker compose -f docker-compose.yml build

build-backend: ## Builda apenas a imagem do backend
	docker compose -f docker-compose.yml build $(PROJECT)-backend

build-frontend: ## Builda apenas a imagem do frontend
	docker compose -f docker-compose.yml build $(PROJECT)-frontend

## ── Logs ──────────────────────────────────────────────────────────────────

logs: ## Logs de todos os serviços em tempo real
	docker compose logs -f

logs-backend: ## Logs do backend
	docker compose logs -f $(PROJECT)-backend

logs-frontend: ## Logs do frontend (nginx)
	docker compose logs -f $(PROJECT)-frontend

logs-db: ## Logs da base de dados
	docker compose logs -f $(PROJECT)-db

## ── Shells ────────────────────────────────────────────────────────────────

shell: ## Abre shell no container do backend
	docker compose exec $(PROJECT)-backend sh

shell-db: ## Abre MySQL shell como utilizador da app
	docker compose exec $(PROJECT)-db mysql -u $${MYSQL_USER:-tradehub_user} -p $${MYSQL_DATABASE:-tradehub_db}

shell-db-root: ## Abre MySQL shell como root
	docker compose exec $(PROJECT)-db mysql -u root -p

## ── Gestão ────────────────────────────────────────────────────────────────

restart: ## Reinicia todos os serviços
	docker compose restart

restart-backend: ## Reinicia apenas o backend
	docker compose restart $(PROJECT)-backend

status: ## Mostra estado e portas dos containers
	docker compose ps

health: ## Verifica o endpoint /health do backend
	@curl -sf http://localhost:$${BACKEND_PORT:-8100}/health \
		| python3 -m json.tool 2>/dev/null \
		|| curl -s http://localhost:$${BACKEND_PORT:-8100}/health

## ── Limpeza ───────────────────────────────────────────────────────────────

db-reset: ## Limpa banco mantendo apenas admin (backup automático)
	bash scripts/reset-db.sh

db-test: ## Executa testes E2E sem resetar o banco
	bash scripts/reset-seed-test.sh --test-only

db-reset-test: ## Pipeline completo: reset BD + seed users + testes E2E
	bash scripts/reset-seed-test.sh

clean: ## Remove containers, imagens e volumes deste projecto
	docker compose down -v --rmi local
	docker network rm $(PROJECT)-network 2>/dev/null || true

## ── Sem Docker (Windows nativo) ─────────────────────────────────────────

install-local: ## [No-Docker] Instala venv + deps + build frontend
	powershell -ExecutionPolicy Bypass -File scripts/install-nodocker.ps1

start-local: ## [No-Docker] Inicia backend (serve API + frontend em :8000)
	powershell -ExecutionPolicy Bypass -File scripts/start-nodocker.ps1

stop-local: ## [No-Docker] Para o backend
	powershell -ExecutionPolicy Bypass -File scripts/stop-nodocker.ps1

deploy-local: ## [No-Docker] git pull + deps + build + restart
	powershell -ExecutionPolicy Bypass -File scripts/deploy-nodocker.ps1

build-dist: ## Compila o frontend (npm run build → frontend/dist/)
	cd frontend && npm ci && npm run build

## ── Ajuda ─────────────────────────────────────────────────────────────────

help: ## Lista todos os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
