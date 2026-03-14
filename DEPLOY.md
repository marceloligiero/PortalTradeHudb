# Portal TradeHub — Guia de Deploy

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Setup Inicial](#2-setup-inicial)
3. [Deploy Automático (CI/CD)](#3-deploy-automático-cicd)
4. [Deploy Manual](#4-deploy-manual)
5. [Rollback](#5-rollback)
6. [Monitorização](#6-monitorização)
7. [Backup e Restore](#7-backup-e-restore)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Pré-requisitos

### Software no Servidor

| Software | Versão Mínima | Instalação |
|----------|--------------|------------|
| Docker Engine | 24+ | [docs.docker.com](https://docs.docker.com/engine/install/) |
| Docker Compose | v2+ | Incluído no Docker Desktop |
| Git | 2.30+ | [git-scm.com](https://git-scm.com/download/win) |

### Portas

| Porta | Serviço | Obrigatória |
|-------|---------|-------------|
| 80 | Frontend (nginx) + API proxy | Sim |
| 3307 | MySQL (acesso direto, dev) | Opcional |

### Verificar Pré-requisitos

```powershell
.\scripts\setup-server.ps1
```

---

## 2. Setup Inicial

### 2.1 — Clonar o Repositório

```powershell
git clone https://github.com/marceloligiero/PortalTradeHudb.git C:\opt\tradehub\app
cd C:\opt\tradehub\app
```

### 2.2 — Configurar Variáveis de Ambiente

```powershell
# Ficheiro raiz (Docker Compose)
copy .env.example .env

# Backend (FastAPI)
copy backend\.env.example backend\.env
```

**Editar `.env`** com valores seguros:
```env
MYSQL_ROOT_PASSWORD=<password-forte>
MYSQL_DATABASE=tradehub_db
MYSQL_USER=tradehub_user
MYSQL_PASSWORD=<password-forte>
```

**Editar `backend/.env`**:
```env
DATABASE_URL=mysql+pymysql://root:<password-forte>@tradehub-db:3306/tradehub_db
SECRET_KEY=<gerar-com-python-c-import-secrets-print-secrets.token_urlsafe(32)>
ALLOWED_ORIGINS=http://portaltradedatahub,http://localhost
```

### 2.3 — Primeiro Deploy

```powershell
# Build e arranque (utilizar apenas docker-compose.yml em produção)
docker compose -f docker-compose.yml up -d --build

# Verificar status
docker compose ps

# Inicializar dados (admin user + dados de referência)
docker exec tradehub-db mysql -uroot -p<password> tradehub_db < database/init_mysql.sql
```

### 2.4 — Acesso

- **URL**: http://portaltradedatahub (requer entrada no ficheiro hosts)
- **Login**: `admin@tradehub.com` / `admin123`

> **Importante**: Alterar a password do admin após o primeiro login.

---

## 3. Deploy Automático (CI/CD)

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

### Secrets Necessários no GitHub

Em **Settings → Secrets and variables → Actions**:

| Secret | Descrição |
|--------|-----------|
| `SERVER_HOST` | IP ou hostname do servidor |
| `SERVER_USER` | Utilizador SSH |
| `SERVER_SSH_KEY` | Chave privada SSH |
| `SERVER_SSH_PORT` | Porta SSH (default: 22) |
| `SERVER_APP_PATH` | Caminho da app no servidor |

### Environment Protection

Criar environment `production` em **Settings → Environments**:
- Required reviewers (opcional)
- Deployment branches: `main` only

---

## 4. Deploy Manual

### Via Script PowerShell

```powershell
# Deploy completo (com backup automático)
.\scripts\deploy.ps1

# Deploy sem backup
.\scripts\deploy.ps1 -SkipBackup
```

O script executa:
1. Backup da base de dados
2. `git pull origin main`
3. `docker compose build --no-cache`
4. `docker compose up -d`
5. Health check de todos os serviços

### Via GitHub Actions (Dispatch)

No GitHub → Actions → Deploy → Run workflow → Selecionar `production`.

---

## 5. Rollback

### Rollback Rápido (código)

```powershell
# Voltar ao commit anterior
.\scripts\rollback.ps1

# Voltar a um commit específico
.\scripts\rollback.ps1 -Commit abc1234
```

### Rollback Manual

```powershell
# Ver histórico
git log --oneline -10

# Reverter
git checkout <commit-sha> -- .
docker compose -f docker-compose.yml build --no-cache
docker compose -f docker-compose.yml up -d
```

---

## 6. Monitorização

### Status dos Containers

```powershell
docker compose ps
```

### Logs

```powershell
# Todos os serviços
docker compose logs -f

# Serviço específico
docker compose logs -f tradehub-backend
docker compose logs -f tradehub-frontend
docker compose logs -f tradehub-db

# Últimas N linhas
docker compose logs --tail 50 tradehub-backend
```

### Health Checks

```powershell
# Backend
curl http://localhost/api/health

# Inspecionar health check
docker inspect --format='{{.State.Health.Status}}' tradehub-backend
docker inspect --format='{{.State.Health.Status}}' tradehub-db
```

### Recursos

```powershell
docker stats --no-stream
```

---

## 7. Backup e Restore

### Backup Manual

```powershell
# Criar backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker exec tradehub-db mysqldump -uroot -p<password> tradehub_db > "backups/manual-$timestamp.sql"
```

### Restore

```powershell
# Restaurar de um backup
Get-Content backups/pre-deploy-20260314-120000.sql | docker exec -i tradehub-db mysql -uroot -p<password> tradehub_db
```

### Backup Automático

O script `deploy.ps1` cria automaticamente um backup antes de cada deploy em `backups/pre-deploy-*.sql`. Mantém os últimos 10 backups.

---

## 8. Troubleshooting

### Container não arranca

```powershell
# Ver logs do container com erro
docker compose logs tradehub-backend

# Reiniciar um serviço
docker compose restart tradehub-backend
```

### Erro de conexão à base de dados

```
OperationalError: Can't connect to MySQL server on 'tradehub-db'
```

**Causa**: Backend arrancou antes da DB estar pronta.
**Solução**: Reiniciar o backend (o `depends_on` com health check deve resolver):
```powershell
docker compose restart tradehub-backend
```

### Porta 80 ocupada

```powershell
# Verificar o que usa a porta 80
Get-NetTCPConnection -LocalPort 80 | ForEach-Object { Get-Process -Id $_.OwningProcess }

# Parar o serviço (ex: IIS)
Stop-Service W3SVC
```

### Frontend mostra página em branco

```powershell
# Verificar se o build do frontend está correto
docker exec tradehub-frontend ls /usr/share/nginx/html/

# Rebuild
docker compose -f docker-compose.yml build --no-cache tradehub-frontend
docker compose -f docker-compose.yml up -d tradehub-frontend
```

### Login falha (401)

```powershell
# Verificar se o admin existe
docker exec tradehub-db mysql -uroot -p<password> tradehub_db -e "SELECT email, is_active FROM users WHERE role='ADMIN';"

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
docker compose down -v              # Remove containers + volumes (PERDE DADOS!)
docker compose -f docker-compose.yml up -d --build
# Re-inicializar dados
docker exec tradehub-db mysql -uroot -p<password> tradehub_db < database/init_mysql.sql
```
