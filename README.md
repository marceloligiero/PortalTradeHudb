# Portal TradeHub

Sistema integrado de gestão de formações, tutoria, relatórios e suporte para equipas de trading.

---

## Arranque Rápido (Docker)

```bash
# 1. Clonar o repositório
git clone https://github.com/marceloligiero/PortalTradeHudb.git
cd PortalTradeHudb

# 2. Configurar variáveis de ambiente
cp .env.example .env                       # variáveis Docker (MySQL, portas)
cp backend/.env.example backend/.env       # variáveis do backend (DATABASE_URL, SECRET_KEY)
# Editar os dois ficheiros com os valores reais

# 3. Iniciar tudo
docker compose up -d

# 4. Verificar que está tudo a correr
docker compose ps
curl http://localhost:8000/health
```

Acesso: http://localhost (frontend) · http://localhost:8000/docs (API Swagger)

> Não é necessário instalar Python, Node.js ou MySQL localmente — tudo corre em containers.

## Pré-requisitos

| Modo | Ferramentas necessárias |
|---|---|
| **Docker** (recomendado) | Docker Engine 24+ · Docker Compose v2+ · (opcional) Make |
| **Local** (sem Docker) | Python 3.13+ · Node.js 18+ · MySQL 8.0+ |

---

## Comandos Úteis

| Comando | O que faz |
|---|---|
| `make up` | Inicia todos os serviços em foreground |
| `make up-d` | Inicia em background |
| `make up-prod` | Produção (sem hot reload) |
| `make down` | Para tudo (preserva dados) |
| `make down-volumes` | Para e apaga a DB — CUIDADO |
| `make logs` | Logs em tempo real |
| `make logs-backend` | Logs só do backend |
| `make shell` | Terminal no container do backend |
| `make shell-db` | MySQL shell |
| `make status` | Estado dos serviços |
| `make health` | Verifica `/health` |
| `make clean` | Remove tudo (containers + imagens + volumes) |
| `make help` | Lista todos os comandos |

---

## Instalação Local (sem Docker)

### Pré-requisitos

| Ferramenta | Versão mínima | Notas |
|---|---|---|
| Python | 3.13+ | Obrigatório para SQLAlchemy 2.0.40 |
| Node.js | 18+ | Inclui npm |
| MySQL | 8.0+ | Produção; desenvolvimento pode usar SQLite |

---

## Instalação Local

```bash
# 1. Clonar o repositório
git clone https://github.com/marceloligiero/PortalTradeHudb.git
cd PortalTradeHudb

# 2. Backend — criar ambiente virtual e instalar dependências
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente do backend
cp .env.example .env             # editar o ficheiro .env criado

# 4. Frontend — instalar dependências
cd ../frontend
npm install
```

---

## Configuração

O backend lê as variáveis de ambiente do ficheiro `backend/.env`.

| Variável | Obrigatória | Descrição | Exemplo |
|---|:---:|---|---|
| `DATABASE_URL` | ✅ | Connection string da base de dados | `mysql+pymysql://root:pass@localhost/tradehub_db` |
| `SECRET_KEY` | ✅ | Chave para assinar tokens JWT | gerar com `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `ALLOWED_ORIGINS` | ❌ | Origens CORS permitidas (separadas por vírgula) | `http://localhost:5173` |
| `ALGORITHM` | ❌ | Algoritmo JWT (padrão: `HS256`) | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | Validade do token em minutos (padrão: `480`) | `480` |
| `DEBUG` | ❌ | Modo debug, desativa CORS restrito (padrão: `false`) | `true` |
| `FRONTEND_URL` | ❌ | URL base do frontend, para links de e-mail | `https://srv1242193.hstgr.cloud` |
| `SMTP_HOST` | ❌ | Servidor SMTP para recuperação de senha | `smtp.gmail.com` |
| `SMTP_PORT` | ❌ | Porta SMTP (padrão: `587`) | `587` |
| `SMTP_USER` | ❌ | Utilizador SMTP | `no-reply@tradehub.com` |
| `SMTP_PASSWORD` | ❌ | Senha SMTP | — |
| `SMTP_FROM_EMAIL` | ❌ | Endereço remetente | `no-reply@tradehub.com` |
| `SMTP_TLS` | ❌ | Usar TLS (padrão: `true`) | `true` |

> Gerador de `SECRET_KEY` segura:
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(32))"
> ```

---

## Uso

### Desenvolvimento

```bash
# Backend (a partir da pasta backend/, com .venv activo)
uvicorn main:app --reload

# Frontend (a partir da pasta frontend/)
npm run dev
```

Acessos locais:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Documentação interactiva da API: http://localhost:8000/docs

**Credenciais padrão (alterar em produção):**
- Email: `admin@tradehub.com`
- Password: `admin123`

### Windows (scripts de arranque rápido)

```bat
start-all.bat        # Abre dois terminais: backend + frontend
start-backend.bat    # Apenas backend
start-frontend.bat   # Apenas frontend
```

### Produção (VPS)

O projecto corre num VPS Ubuntu com PM2 + Nginx.

- **IP**: 72.60.188.172
- **Domínio**: srv1242193.hstgr.cloud
- **Frontend**: https://srv1242193.hstgr.cloud
- **API**: https://srv1242193.hstgr.cloud/api

```bash
# No VPS: /var/www/tradehub
./start-vps.sh update    # Pull + deps + build frontend + restart PM2
./start-vps.sh quick     # Pull + deps Python + restart backend (sem rebuild)
./start-vps.sh frontend  # Pull + build frontend apenas
./start-vps.sh restart   # Reiniciar todos os serviços PM2
./start-vps.sh stop      # Parar todos os serviços PM2
./start-vps.sh status    # Status PM2 + últimos 20 logs
```

O deploy automático é feito via GitHub Actions a cada push para `main` (ver `.github/workflows/deploy.yml`).

#### Primeiro deploy manual

```bash
ssh root@72.60.188.172
cd /var/www
git clone https://github.com/marceloligiero/PortalTradeHudb.git tradehub
cd tradehub

# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Criar backend/.env com DATABASE_URL e SECRET_KEY

# Frontend
cd ../frontend
npm ci
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Estrutura do Projecto

```
PortalTradeHudb/
├── backend/
│   ├── main.py                  # Ponto de entrada FastAPI
│   ├── requirements.txt         # Dependências Python
│   ├── app/
│   │   ├── config.py            # Configuração (Pydantic Settings)
│   │   ├── database.py          # Engine + sessão SQLAlchemy
│   │   ├── models.py            # Todos os modelos ORM
│   │   ├── auth.py              # JWT + bcrypt
│   │   ├── migrate.py           # Sistema de migrações SQL automáticas
│   │   ├── routes/              # Módulos de rotas (formações, admin, etc.)
│   │   └── routers/             # Módulos de rotas (tutoria, chamados, etc.)
│   └── tests/                   # Testes pytest (341 testes)
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Routing React Router v6
│   │   ├── pages/               # Páginas por portal
│   │   ├── components/          # Componentes reutilizáveis + Chatbot
│   │   ├── stores/              # Estado Zustand (authStore)
│   │   ├── contexts/            # ThemeContext (dark/light)
│   │   └── i18n/locales/        # Traduções PT / ES / EN
│   ├── vite.config.ts
│   └── package.json
├── database/                    # Scripts SQL de migração
├── scripts/                     # Scripts de migração e utilitários
├── deploy/                      # Configs Nginx, systemd, webhook
├── docs/                        # Documentação técnica e relatórios de testes
├── .github/workflows/deploy.yml # CI/CD GitHub Actions
└── start-vps.sh                 # Script unificado de deploy no VPS
```

---

## API

A API segue o padrão REST. Autenticação via `Bearer <token>` em todos os endpoints protegidos. Documentação interactiva em `/docs` (Swagger UI).

Roles disponíveis: `ADMIN`, `TRAINER`, `STUDENT`, `TRAINEE`, `MANAGER`

### Autenticação

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Obter token JWT | — |
| POST | `/api/auth/register` | Registar utilizador | — |
| GET | `/api/auth/me` | Perfil do utilizador autenticado | Bearer |
| POST | `/api/auth/forgot-password` | Solicitar reset de senha | — |
| POST | `/api/auth/reset-password` | Confirmar reset de senha | — |

### Administração

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/admin/users` | Listar utilizadores | ADMIN |
| POST | `/api/admin/users` | Criar utilizador | ADMIN |
| PATCH | `/api/admin/users/{id}` | Actualizar utilizador | ADMIN |
| DELETE | `/api/admin/users/{id}` | Desactivar utilizador | ADMIN |
| GET | `/api/admin/stats` | Estatísticas globais | ADMIN |
| GET | `/api/admin/reports` | Relatórios administrativos | ADMIN |

### Formações (Cursos, Módulos, Lições, Desafios)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/admin/courses` | Listar cursos | Bearer |
| POST | `/api/admin/courses` | Criar curso | ADMIN/TRAINER |
| GET | `/api/admin/courses/{id}` | Detalhe do curso | Bearer |
| GET | `/api/lessons` | Listar lições | Bearer |
| POST | `/api/lessons` | Criar lição | ADMIN/TRAINER |
| GET | `/api/challenges` | Listar desafios | Bearer |
| POST | `/api/challenges` | Criar desafio | ADMIN/TRAINER |
| GET | `/api/training-plans` | Listar planos de treino | Bearer |
| POST | `/api/training-plans` | Criar plano de treino | ADMIN/TRAINER |
| GET | `/api/finalization` | Estado de conclusões | Bearer |

### Tutoria (Gestão de Erros)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/tutoria/categories` | Listar categorias de erro | Bearer |
| POST | `/api/tutoria/categories` | Criar categoria | ADMIN |
| PATCH | `/api/tutoria/categories/{id}` | Actualizar categoria | ADMIN |
| GET | `/api/tutoria/errors` | Listar erros | Bearer |
| POST | `/api/tutoria/errors` | Registar erro | Bearer |
| GET | `/api/tutoria/errors/{id}` | Detalhe do erro | Bearer |
| PATCH | `/api/tutoria/errors/{id}` | Actualizar erro | Bearer |
| POST | `/api/tutoria/errors/{id}/verify` | Verificar erro | ADMIN/TRAINER |
| GET | `/api/tutoria/plans` | Listar planos de acção | Bearer |
| POST | `/api/tutoria/plans` | Criar plano de acção | Bearer |
| GET | `/api/tutoria/plans/{id}` | Detalhe do plano | Bearer |
| POST | `/api/tutoria/plans/{id}/submit` | Submeter plano | Bearer |
| POST | `/api/tutoria/plans/{id}/approve` | Aprovar plano | ADMIN/TRAINER |
| POST | `/api/tutoria/plans/{id}/return` | Devolver plano | ADMIN/TRAINER |
| GET | `/api/tutoria/plans/{id}/items` | Itens do plano | Bearer |
| POST | `/api/tutoria/plans/{id}/items` | Adicionar item | Bearer |
| PATCH | `/api/tutoria/items/{id}` | Actualizar item | Bearer |
| GET | `/api/tutoria/errors/{id}/comments` | Comentários do erro | Bearer |
| POST | `/api/tutoria/errors/{id}/comments` | Adicionar comentário | Bearer |
| GET | `/api/tutoria/students` | Listar tutorandos | ADMIN/TRAINER |
| GET | `/api/tutoria/dashboard` | Dashboard de tutoria | Bearer |

### Erros Internos e Fichas de Aprendizagem

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/internal-errors` | Listar erros internos | Bearer |
| POST | `/api/internal-errors` | Registar erro interno | Bearer |
| GET | `/api/internal-errors/{id}` | Detalhe | Bearer |
| GET | `/api/internal-errors/learning-sheets` | Fichas de aprendizagem | Bearer |
| POST | `/api/internal-errors/learning-sheets` | Criar ficha | Bearer |

### Chamados (Suporte / Kanban)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/chamados` | Listar chamados | Bearer |
| POST | `/api/chamados` | Criar chamado | Bearer |
| GET | `/api/chamados/{id}` | Detalhe | Bearer |
| PATCH | `/api/chamados/{id}` | Actualizar estado/campos | Bearer |
| DELETE | `/api/chamados/{id}` | Eliminar chamado | ADMIN |

### Relatórios

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/relatorios/overview` | Visão geral | Bearer |
| GET | `/api/relatorios/formacoes` | Relatório de formações | Bearer |
| GET | `/api/relatorios/tutoria` | Relatório de tutoria | Bearer |
| GET | `/api/relatorios/teams` | Relatório de equipas | Bearer |
| GET | `/api/advanced-reports` | Relatórios avançados | ADMIN/TRAINER |

### Equipas

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/teams` | Listar equipas | Bearer |
| POST | `/api/teams` | Criar equipa | ADMIN |
| GET | `/api/teams/{id}` | Detalhe | Bearer |
| POST | `/api/teams/{id}/members` | Adicionar membro | ADMIN |

### Chatbot e FAQs

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/chat` | Enviar mensagem ao chatbot | Bearer |
| GET | `/api/chat/faqs` | Listar FAQs personalizadas | Bearer |
| POST | `/api/chat/faqs` | Criar FAQ | ADMIN |
| PATCH | `/api/chat/faqs/{id}` | Actualizar FAQ | ADMIN |
| DELETE | `/api/chat/faqs/{id}` | Eliminar FAQ | ADMIN |

### Certificados e Avaliações

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/certificates` | Listar certificados | Bearer |
| GET | `/api/certificates/{id}` | Download PDF | Bearer |
| GET | `/api/ratings` | Listar avaliações | Bearer |
| POST | `/api/ratings` | Submeter avaliação | Bearer |
| GET | `/api/knowledge_matrix` | Matriz de conhecimento | Bearer |
| GET | `/api/stats` | KPIs e estatísticas | Bearer |

---

## Base de Dados

MySQL 8.0+ em produção. Em desenvolvimento local pode usar SQLite definindo `DATABASE_URL=sqlite:///./dev_tradehub.db`.

As migrações SQL são aplicadas automaticamente no arranque do backend (via `app/migrate.py`). Os ficheiros SQL estão em `database/`.

### Entidades principais

```mermaid
erDiagram
    User {
        int id PK
        string email
        string hashed_password
        string role
        bool is_active
    }
    Course {
        int id PK
        string title
        string level
        int trainer_id FK
    }
    TrainingPlan {
        int id PK
        string title
        int trainer_id FK
        int student_id FK
    }
    Lesson {
        int id PK
        string title
        int course_id FK
    }
    Challenge {
        int id PK
        string title
        string difficulty
        int course_id FK
    }
    Certificate {
        int id PK
        int user_id FK
        int course_id FK
        date issued_at
    }
    Team {
        int id PK
        string name
    }
    TeamMember {
        int team_id FK
        int user_id FK
        string role
    }
    TutoriaError {
        int id PK
        string title
        string status
        int student_id FK
        int trainer_id FK
        int category_id FK
    }
    ErrorCategory {
        int id PK
        string name
    }
    TutoriaActionPlan {
        int id PK
        string status
        int error_id FK
        int student_id FK
    }
    TutoriaActionItem {
        int id PK
        string description
        bool completed
        int plan_id FK
    }
    TutoriaComment {
        int id PK
        string content
        int error_id FK
        int user_id FK
    }
    InternalError {
        int id PK
        string title
        string status
        int reported_by FK
    }
    Chamado {
        int id PK
        string title
        string status
        int created_by FK
    }
    ChatFAQ {
        int id PK
        string question
        string answer
        int priority
    }

    User ||--o{ Course : "ensina"
    User ||--o{ TrainingPlan : "atribuído"
    User ||--o{ Certificate : "recebe"
    User ||--o{ TeamMember : "pertence"
    Team ||--o{ TeamMember : "tem"
    Course ||--o{ Lesson : "contém"
    Course ||--o{ Challenge : "contém"
    User ||--o{ TutoriaError : "regista"
    ErrorCategory ||--o{ TutoriaError : "classifica"
    TutoriaError ||--o{ TutoriaActionPlan : "gera"
    TutoriaActionPlan ||--o{ TutoriaActionItem : "contém"
    TutoriaError ||--o{ TutoriaComment : "tem"
    User ||--o{ InternalError : "reporta"
    User ||--o{ Chamado : "abre"
```

---

## Portais (Frontend)

| Portal | Rota base | Roles com acesso |
|---|---|---|
| Landing page | `/` (não autenticado) | — |
| Portal de Formações | `/` (autenticado) | ADMIN, TRAINER, STUDENT, TRAINEE |
| Portal de Tutoria | `/tutoria` | Todos |
| Portal de Relatórios | `/relatorios` | Todos |
| Portal de Chamados | `/chamados` | Todos |
| Portal de Dados Mestres | `/master-data` | ADMIN |

O chatbot (widget flutuante) está disponível em todos os portais autenticados.

---

## Testes

```bash
# A partir da pasta backend/, com .venv activo

# Todos os testes (341 testes, todos os portais)
pytest tests/test_all_portals.py -v

# Testes de tutoria
pytest tests/test_tutoria_v4.py -v

# Todos os testes com output detalhado
pytest tests/ -v

# Relatório de cobertura (requer pytest-cov)
pytest tests/ --cov=app --cov-report=html
```

Os relatórios de testes encontram-se em `docs/TEST_EVIDENCE_REPORT.md`.

---

## Scripts Disponíveis

### Backend

| Comando | O que faz |
|---|---|
| `uvicorn main:app --reload` | Inicia backend em modo desenvolvimento |
| `python reset_admin_password.py` | Repõe a senha do utilizador admin |
| `python reset_user_password.py` | Repõe a senha de qualquer utilizador |
| `pytest tests/` | Corre todos os testes |

### Frontend

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia frontend em modo desenvolvimento (porta 5173) |
| `npm run build` | Compila para produção (output em `dist/`) |
| `npm run preview` | Pré-visualiza o build de produção |
| `npm run lint` | Executa ESLint |

### Deploy (Docker)

| Comando | O que faz |
|---|---|
| `.\scripts\deploy.ps1` | Deploy completo: backup + pull + build + restart |
| `.\scripts\rollback.ps1` | Rollback para o commit anterior |
| `.\scripts\setup-server.ps1` | Verificação de pré-requisitos do servidor |
| `docker compose ps` | Status dos containers |
| `docker compose logs -f` | Logs em tempo real |

---

## Deploy

O deploy de produção usa **Docker Compose** com 3 containers:
- **tradehub-frontend** — React SPA servida por nginx (porta 80) + proxy `/api` → backend
- **tradehub-backend** — FastAPI (Python 3.13)
- **tradehub-db** — MySQL 8.0

### CI/CD Pipeline

```
push → CI (lint + tests) → Build & Push (GHCR) → Deploy (SSH)
```

| Workflow | Trigger | Função |
|----------|---------|--------|
| `ci.yml` | Push/PR para main, develop | Lint, type check, testes |
| `build-and-push.yml` | Após CI passar em main | Build Docker → GHCR |
| `deploy.yml` | Após Build ou manual | Deploy via SSH |
| `dependabot.yml` | Semanal (segundas) | PRs de atualização de deps |

### Deploy Manual

```powershell
.\scripts\deploy.ps1           # Deploy com backup automático
.\scripts\rollback.ps1         # Rollback rápido
```

### Logs

```powershell
docker compose logs -f tradehub-backend    # logs em tempo real
docker compose logs --tail 50 tradehub-backend  # últimas 50 linhas
docker compose ps                          # estado dos containers
docker stats --no-stream                   # uso de recursos
```

> Para documentação detalhada de deploy, consultar [DEPLOY.md](DEPLOY.md).

---

## Licença

Propriedade privada. Todos os direitos reservados.
