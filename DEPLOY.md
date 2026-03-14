# Portal TradeHub — Guia Completo de Deploy

## Índice

1. [Arquitetura de Ambientes](#1-arquitetura-de-ambientes)
2. [Pré-requisitos](#2-pré-requisitos)
3. [PRODUÇÃO — Deploy Passo a Passo](#3-produção--deploy-passo-a-passo)
4. [DESENVOLVIMENTO — Setup Local](#4-desenvolvimento--setup-local)
5. [TESTES / QA](#5-testes--qa)
6. [Deploy via Imagens Exportadas (Offline)](#6-deploy-via-imagens-exportadas-offline)
7. [Deploy Automático (CI/CD)](#7-deploy-automático-cicd)
8. [Rollback](#8-rollback)
9. [Backup e Restore](#9-backup-e-restore)
10. [Monitorização](#10-monitorização)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Arquitetura de Ambientes

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  PRODUÇÃO   │    │DESENVOLVIMENTO│    │  TESTES/QA  │
│  porta 80   │    │  porta 5173  │    │  porta 8180 │
│  porta 443  │    │  porta 8100  │    │  porta 8107 │
│  MySQL 3306 │    │  MySQL 3307  │    │  MySQL 3308 │
│  (internal) │    │              │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
```

| Ficheiro | Ambiente | Comando |
|----------|----------|---------|
| `docker-compose.yml` + `docker-compose.prod.yml` | Produção | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` |
| `docker-compose.yml` + `docker-compose.dev.yml` | Desenvolvimento | `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` |
| `docker-compose.yml` + `docker-compose.test.yml` | Testes/QA | `docker compose -f docker-compose.yml -f docker-compose.test.yml up -d` |

---

## 2. Pré-requisitos

### Software no Servidor

| Software | Versão Mínima | Verificar | Instalação |
|----------|--------------|-----------|------------|
| Docker Engine | 24+ | `docker --version` | [docs.docker.com](https://docs.docker.com/engine/install/) |
| Docker Compose | v2+ | `docker compose version` | Incluído no Docker Desktop |
| Git | 2.30+ | `git --version` | [git-scm.com](https://git-scm.com/download/win) |

### Recursos Mínimos por Ambiente

| Ambiente | RAM | CPU | Disco |
|----------|-----|-----|-------|
| Produção | 4 GB | 2 cores | 20 GB |
| Desenvolvimento | 2 GB | 1 core | 10 GB |
| Testes | 1 GB | 1 core | 5 GB |

### Verificar Pré-requisitos (PowerShell)

```powershell
.\scripts\setup-server.ps1
```

---

## 3. PRODUÇÃO — Deploy Passo a Passo

### Passo 1 — Preparar o Servidor

```powershell
# Verificar Docker
docker --version
docker compose version

# Criar directório da aplicação
mkdir C:\opt\tradehub
cd C:\opt\tradehub
```

### Passo 2 — Obter o Código

**Opção A — Clonar do GitHub:**
```powershell
git clone https://github.com/marceloligiero/PortalTradeHudb.git app
cd app
```

**Opção B — Copiar ficheiros (servidor sem acesso ao GitHub):**
```powershell
# No PC de origem, comprimir o projecto
# Copiar o .zip para o servidor via pendrive/rede
# Descomprimir em C:\opt\tradehub\app
```

### Passo 3 — Configurar Variáveis de Ambiente

```powershell
# 3.1 — Ficheiro raiz (.env) para o MySQL
copy .env.example .env
```

Editar `.env` com valores **seguros**:
```env
MYSQL_ROOT_PASSWORD=SuaSenhaForte_Root_2026!
MYSQL_DATABASE=tradehub_db
MYSQL_USER=tradehub_user
MYSQL_PASSWORD=SuaSenhaForte_User_2026!
```

```powershell
# 3.2 — Ficheiro backend (.env.prod) para o FastAPI
copy backend\.env.example backend\.env.prod
```

Editar `backend/.env.prod`:
```env
DATABASE_URL=mysql+pymysql://root:SuaSenhaForte_Root_2026!@tradehub-db:3306/tradehub_db
SECRET_KEY=cole_aqui_uma_chave_de_64_caracteres
ALLOWED_ORIGINS=https://seu-dominio.com,http://seu-ip-servidor
FRONTEND_URL=https://seu-dominio.com
```

> **Gerar SECRET_KEY segura:**
> ```powershell
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### Passo 4 — Build e Arranque

**Opção A — Build no próprio servidor:**
```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**Opção B — Usar imagens pré-compiladas (ver [secção 6](#6-deploy-via-imagens-exportadas-offline)):**
```powershell
# Carregar imagens do .tar
docker load -i deploy-images\tradehub-backend.tar
docker load -i deploy-images\tradehub-frontend.tar
docker load -i deploy-images\mysql-8.0.39.tar

# Arrancar (sem --build, usa as imagens carregadas)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Passo 5 — Verificar Status

```powershell
# Verificar que os 3 containers estão "Up" e "healthy"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Testar o backend
curl http://localhost/api/health

# Testar o frontend
curl -o /dev/null -s -w "%{http_code}" http://localhost/
# Deve retornar 200
```

### Passo 6 — Inicializar Dados (apenas no primeiro deploy)

```powershell
# Criar admin user + dados de referência
# Aguardar 30s para o MySQL estar pronto no primeiro arranque
Start-Sleep -Seconds 30

# Executar script de inicialização
Get-Content database\init_mysql.sql | docker exec -i tradehub-db mysql -uroot -pSuaSenhaForte_Root_2026! tradehub_db
```

### Passo 7 — Configurar DNS / Hosts (opcional)

**Opção A — DNS real:** Apontar o domínio para o IP do servidor.

**Opção B — Ficheiro hosts (para testes):**
```powershell
# Executar como Administrador
Add-Content C:\Windows\System32\drivers\etc\hosts "IP_DO_SERVIDOR portaltradedatahub"
```

### Passo 8 — Acesso

| Item | Valor |
|------|-------|
| URL | `http://seu-dominio.com` ou `http://IP_DO_SERVIDOR` |
| Login | `admin@tradehub.com` |
| Password | `admin123` |

> **IMPORTANTE:** Altere a password do admin imediatamente após o primeiro login.

---

## 4. DESENVOLVIMENTO — Setup Local

### Passo 1 — Clonar

```powershell
git clone https://github.com/marceloligiero/PortalTradeHudb.git
cd PortalTradeHudb
```

### Passo 2 — Configurar Variáveis

```powershell
copy .env.example .env
# Editar .env (pode usar os valores de exemplo para dev)
```

Criar `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://root:tradehub_root_pass@tradehub-db:3306/tradehub_db
SECRET_KEY=devsecret
ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://localhost:5173,http://portaltradedatahub
FRONTEND_URL=http://localhost:5173
```

### Passo 3 — Arrancar em Modo Dev

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Passo 4 — Verificar

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

### Acesso em Desenvolvimento

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend (Vite) | http://localhost:5173 | Hot reload automático |
| Backend (API) | http://localhost:8100 | Auto-reload (uvicorn --reload) |
| MySQL | `localhost:3307` | Acesso directo via client SQL |

### Características do Modo Dev

- **Hot reload** no frontend (Vite) e backend (uvicorn)
- Volumes montados: editar código localmente reflete imediatamente
- MySQL exposto na porta 3307 para acesso com ferramentas externas
- Flag `DEBUG=true` activado

---

## 5. TESTES / QA

### Passo 1 — Configurar

```powershell
# Variáveis de teste (já incluídas com defaults)
# Opcionalmente criar backend/.env.test personalizado
```

### Passo 2 — Arrancar Ambiente de Testes

```powershell
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build
```

### Passo 3 — Verificar

```powershell
docker compose -f docker-compose.yml -f docker-compose.test.yml ps
```

### Acesso em Testes

| Serviço | URL/Porta |
|---------|-----------|
| Frontend | http://localhost:8180 |
| Backend API | http://localhost:8107 |
| MySQL | `localhost:3308` |

### Executar Testes Automatizados

```powershell
# Testes do backend (dentro do container)
docker exec tradehub-backend-test python -m pytest

# Ou externamente
cd backend
python -m pytest
```

### Parar Ambiente de Testes

```powershell
docker compose -f docker-compose.yml -f docker-compose.test.yml down

# Para limpar também os volumes de teste
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v
```

### Isolamento

O ambiente de testes usa:
- Containers com sufixo `-test`
- Volume separado `tradehub_mysql_test`
- Rede separada `tradehub-test-network`
- Portas diferentes (8180, 8107, 3308)

Pode correr **em paralelo** com o ambiente de desenvolvimento sem conflitos.

---

## 6. Deploy via Imagens Exportadas (Offline)

Para servidores sem acesso à internet ou ao GitHub, as imagens Docker podem ser exportadas como ficheiros `.tar` e transferidas manualmente.

### 6.1 — Exportar Imagens (no PC de desenvolvimento)

As imagens já foram geradas em `deploy-images/`:

| Ficheiro | Tamanho | Conteúdo |
|----------|---------|----------|
| `tradehub-backend.tar` | ~132 MB | FastAPI + Python 3.13 |
| `tradehub-frontend.tar` | ~22 MB | React + nginx 1.27 |
| `mysql-8.0.39.tar` | ~159 MB | MySQL 8.0.39 |

Para regenerar (após alterações no código):
```powershell
# Rebuild das imagens
docker compose build tradehub-backend tradehub-frontend

# Exportar
docker save portaltradedatahub-tradehub-backend:latest -o deploy-images\tradehub-backend.tar
docker save portaltradedatahub-tradehub-frontend:latest -o deploy-images\tradehub-frontend.tar
docker save mysql:8.0.39 -o deploy-images\mysql-8.0.39.tar
```

### 6.2 — Transferir para o Servidor

```powershell
# Opção 1: Pendrive / disco externo
# Copiar a pasta deploy-images/ e os ficheiros do projecto

# Opção 2: SCP (se tiver SSH)
scp deploy-images\*.tar usuario@servidor:/opt/tradehub/deploy-images/

# Opção 3: Partilha de rede
Copy-Item deploy-images\* \\SERVIDOR\tradehub\deploy-images\
```

### 6.3 — Restaurar no Servidor de Produção

```powershell
cd C:\opt\tradehub\app

# 1. Carregar as 3 imagens
docker load -i deploy-images\tradehub-backend.tar
docker load -i deploy-images\tradehub-frontend.tar
docker load -i deploy-images\mysql-8.0.39.tar

# 2. Verificar que foram carregadas
docker images | Select-String "tradehub|mysql"

# 3. Configurar .env e backend/.env.prod (ver Passo 3 da secção Produção)

# 4. Arrancar (SEM --build, usa as imagens carregadas)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Inicializar dados (primeiro deploy apenas)
Start-Sleep -Seconds 30
Get-Content database\init_mysql.sql | docker exec -i tradehub-db mysql -uroot -pSUA_SENHA tradehub_db

# 6. Verificar
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl http://localhost/api/health
```

---

## 7. Deploy Automático (CI/CD)

### Pipeline

```
push → CI (tests + lint) → Build & Push (GHCR) → Deploy (SSH)
```

| Workflow | Trigger | Função |
|----------|---------|--------|
| `ci.yml` | Push/PR para main, develop | Lint, type check, testes |
| `build-and-push.yml` | Após CI passar em main | Build Docker images → GHCR |
| `deploy.yml` | Após Build ou manual | Deploy para servidor via SSH |
| `dependabot.yml` | Semanal (segundas) | PRs de atualização de deps |

### Secrets Configurados no GitHub

| Secret | Descrição | Status |
|--------|-----------|--------|
| `SERVER_HOST` | IP ou hostname do servidor | Placeholder (alterar) |
| `SERVER_USER` | Utilizador SSH | Placeholder (alterar) |
| `SERVER_SSH_KEY` | Chave privada SSH | Placeholder (alterar) |
| `SERVER_SSH_PORT` | Porta SSH | `22` |
| `SERVER_APP_PATH` | Caminho da app no servidor | `/opt/PortalTradeHudb` |

> Para alterar: GitHub → Settings → Secrets and variables → Actions

### Environment "Production" (configurado)

- Deployment branches: apenas `main`
- Branch protection: PR obrigatório + CI checks

### Deploy Manual via Script

```powershell
# Deploy completo (com backup automático)
.\scripts\deploy.ps1

# Deploy sem backup
.\scripts\deploy.ps1 -SkipBackup
```

### Deploy Manual via GitHub Actions

GitHub → Actions → Deploy → Run workflow → Selecionar `production`.

---

## 8. Rollback

### Rollback Rápido

```powershell
# Voltar ao commit anterior
.\scripts\rollback.ps1

# Voltar a um commit específico
.\scripts\rollback.ps1 -Commit abc1234
```

### Rollback Manual

```powershell
git log --oneline -10
git checkout <commit-sha> -- .
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 9. Backup e Restore

### Backup Manual

```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not (Test-Path backups)) { mkdir backups }
docker exec tradehub-db mysqldump -uroot -pSUA_SENHA tradehub_db > "backups\manual-$timestamp.sql"
```

### Restore

```powershell
Get-Content backups\manual-20260314-120000.sql | docker exec -i tradehub-db mysql -uroot -pSUA_SENHA tradehub_db
```

### Backup Automático

O script `deploy.ps1` cria backup antes de cada deploy em `backups\pre-deploy-*.sql` (mantém os últimos 10).

### Migrar Dados entre Servidores

```powershell
# No servidor de origem: exportar
docker exec tradehub-db mysqldump -uroot -pSENHA_ORIGEM tradehub_db > tradehub_dump.sql

# Transferir tradehub_dump.sql para o novo servidor

# No servidor de destino: importar
Get-Content tradehub_dump.sql | docker exec -i tradehub-db mysql -uroot -pSENHA_DESTINO tradehub_db
```

---

## 10. Monitorização

### Status

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Logs

```powershell
# Todos os serviços (follow)
docker compose logs -f

# Serviço específico
docker compose logs -f tradehub-backend
docker compose logs --tail 50 tradehub-backend
```

### Health Checks

```powershell
curl http://localhost/api/health
docker inspect --format='{{.State.Health.Status}}' tradehub-backend
docker inspect --format='{{.State.Health.Status}}' tradehub-db
```

### Recursos

```powershell
docker stats --no-stream
```

---

## 11. Troubleshooting

### Container não arranca

```powershell
docker compose logs tradehub-backend
docker compose restart tradehub-backend
```

### Erro de conexão à base de dados

```
OperationalError: Can't connect to MySQL server on 'tradehub-db'
```
**Solução:** Reiniciar o backend (o `depends_on` + health check resolve):
```powershell
docker compose restart tradehub-backend
```

### Porta 80 ocupada

```powershell
Get-NetTCPConnection -LocalPort 80 | ForEach-Object { Get-Process -Id $_.OwningProcess }
# Parar serviço conflitante (ex: IIS)
Stop-Service W3SVC
```

### Frontend mostra página em branco

```powershell
docker exec tradehub-frontend ls /usr/share/nginx/html/
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache tradehub-frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d tradehub-frontend
```

### Login falha (401)

```powershell
# Verificar se o admin existe
docker exec tradehub-db mysql -uroot -pSUA_SENHA tradehub_db -e "SELECT email, is_active FROM users WHERE role='ADMIN';"

# Resetar password do admin
docker exec tradehub-backend python -c "
from app.database import get_db
from app.models import User
import bcrypt
db = next(get_db())
admin = db.query(User).filter(User.email == 'admin@tradehub.com').first()
if admin:
    pwd = bcrypt.hashpw(b'admin123', bcrypt.gensalt())
    admin.hashed_password = pwd.decode('utf-8')
    admin.is_active = True
    admin.is_pending = False
    db.commit()
    print('Password reset OK')
db.close()
"
```

### Reconstruir tudo do zero

```powershell
# ATENÇÃO: Remove todos os dados!
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Re-inicializar dados
Start-Sleep -Seconds 30
Get-Content database\init_mysql.sql | docker exec -i tradehub-db mysql -uroot -pSUA_SENHA tradehub_db
```

---

## Checklist de Deploy Rápido

### Produção (nova instalação)

- [ ] Docker e Docker Compose instalados
- [ ] Código no servidor (git clone ou cópia manual)
- [ ] `.env` configurado com passwords fortes
- [ ] `backend/.env.prod` configurado
- [ ] Imagens carregadas ou build executado
- [ ] `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
- [ ] Dados inicializados (`init_mysql.sql`)
- [ ] Health check OK (`curl http://localhost/api/health`)
- [ ] Login testado (`admin@tradehub.com`)
- [ ] Password do admin alterada

### Actualização de Produção

- [ ] Backup da DB executado
- [ ] `git pull origin main` ou novas imagens carregadas
- [ ] Rebuild: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
- [ ] Health check OK
- [ ] Teste funcional rápido no browser
