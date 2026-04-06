# Arquitetura e Requisitos de Infraestrutura — Portal TradeDataHub

> **Versão:** 1.0 — Abril 2026  
> **Stack:** FastAPI (Python 3.13) · React 18 · MySQL 8.0 · Nginx · Docker / Windows Server

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REDE CORPORATIVA                            │
│                                                                     │
│   Utilizadores (browsers)                                           │
│   Chrome / Edge / Firefox                                           │
│        │                                                            │
│        │  HTTP :80  (ou HTTPS :443 com SSL corporativo)            │
│        ▼                                                            │
│  ┌─────────────────────────────────────────────┐                   │
│  │           SERVIDOR HP (Windows Server)       │                   │
│  │                                              │                   │
│  │  ┌──────────────┐    ┌───────────────────┐  │                   │
│  │  │   FRONTEND   │    │     BACKEND       │  │                   │
│  │  │   Nginx :80  │───►│  FastAPI :8000    │  │                   │
│  │  │   React SPA  │    │  (Python 3.13)    │  │                   │
│  │  │  (dist/ git) │    │  Uvicorn 1 worker │  │                   │
│  │  └──────────────┘    └────────┬──────────┘  │                   │
│  │                               │              │                   │
│  │                       ┌───────▼──────────┐  │                   │
│  │                       │   BASE DE DADOS  │  │                   │
│  │                       │  MySQL 8.0 :3306 │  │                   │
│  │                       │  (local / Docker)│  │                   │
│  │                       └──────────────────┘  │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
│   (Opcional) Servidor de Email SMTP para notificações               │
│   (Opcional) Azure AD / Microsoft Entra para SSO                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Modos de Deploy

### Modo A — Docker Compose (recomendado)

```
┌─────────────────────────────────────────────────────────────┐
│  Host Windows Server                                         │
│                                                             │
│  Docker Engine                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Rede interna: tradehub-network (bridge)             │  │
│  │                                                      │  │
│  │  ┌─────────────────┐   proxy /api   ┌────────────┐  │  │
│  │  │ tradehub-        │──────────────►│ tradehub-  │  │  │
│  │  │ frontend-prod    │               │ backend-   │  │  │
│  │  │ nginx:alpine     │               │ prod       │  │  │
│  │  │ porta :80        │               │ python:3.13│  │  │
│  │  │ SPA React        │               │ porta :8100│  │  │
│  │  └─────────────────┘               └─────┬──────┘  │  │
│  │                                          │          │  │
│  │                                   ┌──────▼──────┐  │  │
│  │                                   │ tradehub-db │  │  │
│  │                                   │ mysql:8.0   │  │  │
│  │                                   │ (interno)   │  │  │
│  │                                   │ vol: mysql_ │  │  │
│  │                                   │ data        │  │  │
│  │                                   └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Portas expostas no host:**

| Serviço | Porta Host | Porta Container | Descrição |
|---------|-----------|----------------|-----------|
| Frontend (nginx) | **80** | 80 | Interface web — acesso dos utilizadores |
| Backend (dev) | 8100 | 8000 | API REST — só em modo DEV |
| MySQL (dev) | 127.0.0.1:3307 | 3306 | BD — só em modo DEV, bind local |

---

### Modo B — Windows Nativo (sem Docker, HP server atual)

```
┌─────────────────────────────────────────────────────────────┐
│  Windows Server / Windows 10/11 Pro                          │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Python 3.11+ (.venv)                            │      │
│  │  Uvicorn → FastAPI :8000                         │      │
│  │  Serve também o frontend/dist/ (SPA embutida)    │      │
│  └──────────────────────────────────────────────────┘      │
│                      │                                      │
│  netsh portproxy  :80 ──► :8000                             │
│                      │                                      │
│  ┌──────────────────────────────────────────────────┐      │
│  │  MySQL 8.0 (instalação nativa Windows)           │      │
│  │  :3306  (localhost apenas)                       │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

No modo B, o FastAPI serve o ficheiro `frontend/dist/index.html` para todas as rotas não-API, actuando como servidor estático da SPA.

---

## 3. Fluxo de Dados por Portal

```
Browser
  │
  ├── GET /                    → nginx → index.html (React SPA)
  ├── GET /formacoes           → nginx → index.html (React Router)
  ├── GET /tutoria             → nginx → index.html (React Router)
  ├── GET /relatorios          → nginx → index.html (React Router)
  ├── GET /chamados            → nginx → index.html (React Router)
  │
  ├── POST /api/auth/login     → FastAPI → MySQL (autenticação JWT)
  ├── GET  /api/users/me       → FastAPI → MySQL (perfil utilizador)
  ├── GET  /api/courses        → FastAPI → MySQL (formações)
  ├── GET  /api/tutoria/errors → FastAPI → MySQL (tutoria)
  ├── GET  /api/dw/summary     → FastAPI → MySQL (relatórios DW)
  ├── GET  /api/chamados       → FastAPI → MySQL (chamados)
  └── GET  /api/health         → FastAPI (healthcheck)
```

---

## 4. Requisitos de Hardware

### 4.1 Servidor de Produção (mínimo recomendado)

| Componente | Mínimo | Recomendado | Observações |
|-----------|--------|-------------|-------------|
| **CPU** | 2 vCPU / 2,0 GHz | 4 vCPU / 2,5 GHz | FastAPI é async; CPU raramente é gargalo |
| **RAM** | 4 GB | 8 GB | MySQL: 512 MB, Backend: 512 MB, SO: 2 GB |
| **Disco** | 60 GB SSD | 120 GB SSD | SO (40 GB) + BD (10 GB) + logs + backups |
| **Rede** | 100 Mbps | 1 Gbps | Tráfego interno corporativo |
| **SO** | Windows Server 2019 | Windows Server 2022 | Modo B; ou Linux para Docker |

> Para o modo Docker em Linux, os requisitos de RAM reduzem para 2 GB mínimo (sem overhead do Windows).

### 4.2 Estimativa de Carga (base 50 utilizadores simultâneos)

| Recurso | Consumo estimado |
|---------|-----------------|
| RAM total (SO + BD + Backend) | ~2,5 GB |
| CPU média (idle) | < 5% |
| CPU pico (relatórios pesados) | 30–60% |
| Disco BD (1 ano de dados) | < 5 GB |
| Throughput rede | < 10 Mbps |

---

## 5. Requisitos de Software

### 5.1 Modo Docker (Linux / Windows)

| Software | Versão | Obrigatório |
|---------|--------|-------------|
| Docker Engine | ≥ 24.0 | Sim |
| Docker Compose | ≥ 2.20 | Sim |
| Git | ≥ 2.30 | Sim |
| SO | Ubuntu 22.04 LTS / Windows Server 2022 | Sim |

**Não é necessário instalar Python, Node.js, MySQL ou Nginx separadamente** — tudo corre dentro dos containers.

---

### 5.2 Modo Windows Nativo (HP server atual)

| Software | Versão | Obrigatório | Download |
|---------|--------|-------------|---------|
| Python | **3.11 ou 3.13** | Sim | python.org |
| MySQL Server | **8.0** | Sim | dev.mysql.com |
| MySQL Connector | incluído no MySQL 8.0 | Sim | — |
| Git | ≥ 2.30 | Sim | git-scm.com |
| Node.js | ≥ 18 (só para build local) | Não* | nodejs.org |
| Windows Admin rights | — | Sim (portproxy) | — |

> *O `frontend/dist/` está pré-compilado no repositório git. Node.js só é necessário se quiser recompilar o frontend localmente.

**Pacotes Python (instalados automaticamente via pip):**

```
fastapi==0.109.0          # Framework web
uvicorn[standard]==0.27.0 # Servidor ASGI
sqlalchemy==2.0.40        # ORM / migrations
pymysql==1.1.0            # Conector MySQL
pydantic==2.12.5          # Validação de dados
pydantic-settings==2.1.0  # Configuração via .env
PyJWT==2.8.0              # Autenticação JWT
passlib[bcrypt]==1.7.4    # Hash de passwords
python-multipart==0.0.7   # Upload de ficheiros
python-dotenv==1.0.0      # Leitura do .env
email-validator==2.1.0    # Validação de emails
reportlab==4.0.9          # Geração de PDF (certificados)
pandas==2.3.3             # Processamento de dados (relatórios)
openpyxl==3.1.2           # Exportação Excel
anthropic==0.84.0         # Chat IA (opcional)
slowapi==0.1.9            # Rate limiting
psutil==6.1.1             # Métricas de sistema
```

---

## 6. Configuração de Rede

### 6.1 Portas a abrir no Firewall

| Porta | Protocolo | Origem | Destino | Serviço |
|-------|-----------|--------|---------|---------|
| **80** | TCP | Rede Interna | Servidor | Acesso web (HTTP) |
| **443** | TCP | Rede Interna | Servidor | Acesso web (HTTPS) — se SSL configurado |
| 3306 | TCP | Localhost | Localhost | MySQL — **nunca expor à rede** |
| 8000/8100 | TCP | Localhost | Localhost | Backend API — **nunca expor à rede** |

> A porta 3306 (MySQL) e 8000 (backend) **não devem estar acessíveis** fora do servidor. O acesso externo é sempre via nginx (porta 80/443).

### 6.2 DNS Interno (recomendado)

Configurar entrada DNS interna para acesso por nome em vez de IP:

```
portaltradedatahub.empresa.local → IP do servidor HP
```

Ou via ficheiro `hosts` em cada cliente:
```
192.168.x.x   portaltradedatahub
```

---

## 7. Configuração da Base de Dados (MySQL 8.0)

### 7.1 Criação manual (modo Windows nativo)

```sql
CREATE DATABASE IF NOT EXISTS tradehub_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'tradehub_user'@'localhost'
  IDENTIFIED BY '<password-forte>';

GRANT ALL PRIVILEGES ON tradehub_db.* TO 'tradehub_user'@'localhost';
FLUSH PRIVILEGES;
```

### 7.2 Variáveis my.ini recomendadas (Windows)

```ini
[mysqld]
character-set-server = utf8mb4
collation-server     = utf8mb4_unicode_ci
innodb_buffer_pool_size = 256M
max_connections      = 100
bind-address         = 127.0.0.1
```

### 7.3 Migrations aplicadas automaticamente

O script `scripts/run_migrations.py` aplica todas as migrations SQL em `database/migrations/` na ordem numérica (V001 → V015). Corre automaticamente no arranque via `iniciar-sem-docker.bat`.

---

## 8. Ficheiro .env — Variáveis Obrigatórias

Localização: `backend/.env`

```ini
# Base de dados
DATABASE_URL=mysql+pymysql://tradehub_user:<password>@localhost:3306/tradehub_db

# Segurança JWT — gerar com: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=<chave-secreta-64-chars-minimo>

# CORS — IPs/domínios dos clientes que acedem ao portal
ALLOWED_ORIGINS=http://portaltradedatahub,http://192.168.x.x,http://localhost

# URL pública do frontend (para redirects SSO)
FRONTEND_URL=http://portaltradedatahub

# Modo debug — SEMPRE false em produção
DEBUG=false

# Email (opcional — para notificações)
SMTP_HOST=smtp.empresa.local
SMTP_PORT=587
SMTP_USER=notificacoes@empresa.local
SMTP_PASSWORD=<password>
SMTP_FROM_EMAIL=notificacoes@empresa.local

# SSO Microsoft (opcional)
MICROSOFT_CLIENT_ID=<guid>
MICROSOFT_TENANT_ID=<guid>
MICROSOFT_CLIENT_SECRET=<secret>
MICROSOFT_REDIRECT_URI=http://portaltradedatahub/api/auth/microsoft/callback
```

---

## 9. Segurança

### 9.1 Checklist obrigatória antes de produção

- [ ] `SECRET_KEY` gerada aleatoriamente (≥ 64 caracteres)
- [ ] `DEBUG=false` no `.env`
- [ ] Password MySQL diferente da password de desenvolvimento
- [ ] MySQL não acessível fora do servidor (bind 127.0.0.1)
- [ ] Porta 8000/8100 não exposta externamente (só proxy nginx)
- [ ] Ficheiro `.env` com permissões restritas (só leitura para o processo)
- [ ] Backups automáticos da BD configurados
- [ ] Password admin alterada após primeiro login

### 9.2 Mecanismos de segurança implementados

| Mecanismo | Implementação |
|-----------|--------------|
| Autenticação | JWT (PyJWT) — expiração 24h |
| Passwords | bcrypt (passlib) — factor 12 |
| CORS | Lista explícita de origens |
| Rate limiting | slowapi — 60 req/min por IP |
| SQL Injection | SQLAlchemy ORM (queries parametrizadas) |
| XSS | Headers CSP via nginx |
| Clickjacking | X-Frame-Options: DENY |
| Swagger/Docs | Desactivado em produção (DEBUG=false) |
| Auditoria | Tabela `audit_logs` — todas as acções |

---

## 10. Backups

### Backup da base de dados (Windows — tarefa agendada)

```bat
:: Guardar em: C:\backups\tradehub\
set BKDIR=C:\backups\tradehub
set DATE=%date:~6,4%%date:~3,2%%date:~0,2%
mysqldump -u tradehub_user -p<password> tradehub_db > "%BKDIR%\tradehub_%DATE%.sql"
:: Apagar backups com mais de 30 dias
forfiles /p "%BKDIR%" /m "*.sql" /d -30 /c "cmd /c del @file"
```

**Frequência recomendada:** diária (tarefa agendada às 02:00)

### Backup do código e configurações

O código está no git (GitHub). O ficheiro `.env` deve ser guardado separadamente (não está no git por segurança).

---

## 11. Arranque e Paragem

### Modo Windows Nativo

```bat
:: Arrancar
iniciar-sem-docker.bat

:: Verificar saúde
curl http://localhost:8000/api/health

:: Parar (fechar a janela "TradeHub Backend")
:: ou terminar o processo uvicorn via Gestor de Tarefas
```

### Modo Docker

```bash
# Arrancar produção
docker compose --profile prod up -d

# Ver logs
docker compose logs -f tradehub-backend-prod

# Verificar saúde
curl http://localhost/api/health

# Parar
docker compose --profile prod down

# Backup BD antes de parar
docker exec tradehub-db mysqldump -u root -p$MYSQL_ROOT_PASSWORD tradehub_db > backup.sql
```

---

## 12. Diagnóstico

```bat
:: Verificar estado da BD e migrations
backend\.venv\Scripts\python.exe scripts\diagnostico_bd.py

:: Verificar saúde do backend
curl http://localhost:8000/api/health

:: Ver logs do backend (modo Windows)
:: Ver a janela "TradeHub Backend" no cmd

:: Testar acesso ao MySQL
mysql -u tradehub_user -p -h 127.0.0.1 tradehub_db -e "SELECT COUNT(*) FROM users;"
```

---

## 13. Resumo — Decisão de Deploy

| Critério | Docker | Windows Nativo |
|---------|--------|---------------|
| Facilidade de instalação | Médio (instalar Docker) | Médio (instalar Python + MySQL) |
| Isolamento | Alto | Baixo |
| Actualizações | `git pull` + `docker compose build` | `git pull` + restart bat |
| Requisitos SO | Linux/Windows com Docker | Windows 10/11 Pro ou Server |
| Compatibilidade rede corporativa | Depende de proxy/firewall | Alta |
| Backup BD | mysqldump via docker exec | mysqldump directo |
| **Recomendação** | Para novos servidores Linux | Para HP server existente |
