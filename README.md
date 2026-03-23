# PortalTradeHub

> Sistema integrado de gestão de formações, tutoria, relatórios e suporte para equipas de Trade Finance — Santander.

**Stack:** FastAPI (Python 3.13) · React 18 · Tailwind CSS · MySQL 8.0 · Docker Compose
**Testes:** 341 testes pytest · Design System Santander (`#EC0000`)
**i18n:** Português · Espanhol · Inglês

---

## Índice

- [O que o sistema faz](#o-que-o-sistema-faz)
- [Portais e funcionalidades](#portais-e-funcionalidades)
- [Roles e permissões](#roles-e-permissões)
- [Arquitectura técnica](#arquitectura-técnica)
- [Arranque rápido — Docker](#arranque-rápido--docker)
- [Instalação local (sem Docker)](#instalação-local-sem-docker)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Base de dados](#base-de-dados)
- [API — referência rápida](#api--referência-rápida)
- [Testes](#testes)
- [Deploy e CI/CD](#deploy-e-cicd)
- [Estrutura do projecto](#estrutura-do-projecto)
- [Documentação adicional](#documentação-adicional)

---

## O que o sistema faz

O **PortalTradeHub** é uma plataforma interna para a equipa de Trade Finance do Santander. Centraliza cinco áreas críticas num único sistema:

| # | Área | O que resolve |
|---|------|--------------|
| 1 | **Formações** | Gestão completa de cursos, lições, desafios práticos e planos de formação individuais com cronometragem de operações (MPU) e emissão de certificados |
| 2 | **Tutoria** | Registo, análise e resolução de erros operacionais com ciclo completo de 6 estados, planos de acção, fichas de aprendizagem e treino side-by-side |
| 3 | **Relatórios** | Dashboards analíticos em tempo real por equipa, formador, estudante e portal — com exportação de incidentes |
| 4 | **Dados Mestres** | CRUD centralizado de bancos, produtos, equipas, utilizadores, hierarquia organizacional e todos os dados de referência do sistema |
| 5 | **Chamados** | Kanban de suporte interno (bugs e melhorias) com comentários, anexos, atribuição de responsável e notas de andamento |

---

## Portais e funcionalidades

### 1. Portal de Formações (`/`)

**Quem acede:** ADMIN · MANAGER · TRAINER · TRAINEE/STUDENT

#### Criação de conteúdo (TRAINER / ADMIN)
- Criar e gerir **cursos** com título, descrição, nível (Iniciante/Intermédio/Avançado), bancos e produtos associados
- Criar **lições** dentro de cursos com conteúdo escrito e controlo de tempo por operação (MPU)
- Criar **desafios** com lista de operações a executar linha a linha pelo estudante
- Criar **planos de formação** individuais atribuindo cursos e estudantes com prazos
- Rever e aprovar/rejeitar **submissões** dos estudantes
- Permitir **re-tentativas** de desafios reprovados
- Finalizar cursos e planos → gerar **certificados PDF**

#### Execução (TRAINEE / STUDENT)
- Ver planos de formação atribuídos (`/my-plans`)
- Ver e inscrever-se em cursos disponíveis (`/my-courses`)
- Executar lições com cronómetro: Iniciar → Pausar → Retomar → Terminar → Confirmar
- Executar desafios linha a linha (operação a operação) com registo de tempo
- Submeter desafio para revisão do formador
- Fazer re-tentativa após rejeição
- Ver e descarregar certificados PDF

#### Dashboards por role
- **ADMIN/MANAGER:** KPIs globais — utilizadores, cursos, formadores, estudantes, planos, desafios
- **TRAINER:** cursos próprios, alunos, submissões pendentes, horas de formação, MPU médio
- **STUDENT:** inscrições, planos activos, lições completas, certificados, submissões, MPU pessoal

---

### 2. Portal de Tutoria (`/tutoria`)

**Quem acede:** Todos os utilizadores autenticados (visibilidade filtrada por role)

#### Erros de tutoria — ciclo de 6 estados

```
PENDENTE → EM_ANALISE → AGUARDA_PLANOS → EM_EXECUCAO → VERIFICACAO → RESOLVIDO
```

- **Registo** (Liberador/Tutor): descrição, categoria, severidade, banco, produto, operação
- **Análise** (Tutor): análise técnica, revisão tutor, envio ao chefe para aprovação
- **Planos de acção** (Tutor): título, responsável, prazo, itens de acção individuais
- **Execução** (Tutorado): conclusão de itens → submissão para aprovação
- **Verificação** (Tutorado): confirmação da solução implementada
- **Resolução** (Tutor): validação e fecho do erro

#### Funcionalidades adicionais
- **Comentários** em erros e planos (todos os envolvidos)
- **Notificações** em tempo real com polling a 30s e badge de não lidos
- **Fichas de aprendizagem**: criadas por tutor, lidas e assinadas pelo tutorado
- **Treino Side-by-Side**: supervisão directa com registo de MPU
- **Cápsulas de aprendizagem**: biblioteca de recursos criada pelo tutor (título, nível, tipo)
- **Erros internos de qualidade** (Liberador): registo de erros do grabador com plano de acção e ficha de aprendizagem
- **Surveys de feedback** (Liberador → Tutor): avaliação semanal dos grabadores com dashboard de sentimento e alertas
- **Censos operacionais**: gestão de levantamentos de dados por equipa

#### Visibilidade por role
| Role | Vê |
|------|----|
| ADMIN/GESTOR | Todos os erros e planos |
| MANAGER / is_team_lead | Erros e planos da sua equipa |
| is_tutor | Erros dos seus tutorandos |
| is_referente | Erros das operações em que participa |
| is_liberador | Os seus erros internos + surveys pendentes |
| TRAINEE (simples) | Apenas os seus próprios erros e planos |

---

### 3. Portal de Relatórios (`/relatorios`)

**Quem acede:** Todos os utilizadores autenticados

| Relatório | Rota | Acesso |
|-----------|------|--------|
| Overview de KPIs (utilizadores, equipas, planos, erros, certificados, MPU) | `/relatorios` | Todos |
| Formações (inscrições, estado de planos, submissões, MPU, horas, erros) | `/relatorios/formacoes` | Todos |
| Tutoria (erros por severidade/estado, planos de acção, evolução temporal) | `/relatorios/tutoria` | Todos |
| Equipas (taxa de conclusão, MPU médio por equipa) | `/relatorios/teams` | ADMIN/GESTOR |
| Membros (relatório detalhado por membro de equipa) | `/relatorios/members` | MANAGER |
| Incidentes (exportação com filtros: data, impacto, banco, departamento...) | export | ADMIN/MANAGER |

**Data Warehouse integrado:**
- Snapshots diários de KPIs com tendência (30+ dias)
- Analytics por mês, por curso, por formador, por equipa
- ETL manual via `POST /etl/run` (ADMIN)
- Gráficos: certificados/mês, erros/categoria, chamados/tipo, erros internos/equipa

---

### 4. Portal de Dados Mestres (`/master-data`)

**Quem acede:** ADMIN · MANAGER · GESTOR

#### Dados de referência (CRUD completo — ADMIN)
| Entidade | Rota | Descrição |
|----------|------|-----------|
| Bancos | `/master-data` | Bancos parceiros (nome, código, estado activo/inactivo) |
| Produtos | `/master-data/products` | Produtos financeiros (LC, Garantias, Remessas, etc.) |
| Equipas | `/master-data/teams` | Equipas com gestor, membros e serviços atribuídos |
| Categorias de erro | `/master-data/categories` | Hierarquia de categorias de erro (pai/filho) |
| Impactos | `/master-data/impacts` | Níveis de impacto (BAIXA/MEDIA/ALTA/CRITICA) |
| Origens | `/master-data/origins` | Origens dos erros operacionais |
| Detectado por | `/master-data/detected-by` | Métodos de detecção de erros |
| Departamentos | `/master-data/departments` | Departamentos internos |
| Actividades | `/master-data/activities` | Tipos de actividades operacionais |
| Tipos de erro | `/master-data/error-types` | Classificação de erros |
| FAQs | `/master-data/faqs` | Perguntas frequentes multilingue (PT/ES/EN) com prioridade e filtro por role |

#### Gestão de utilizadores (`/master-data/users`)
- Criar, editar, desactivar utilizadores
- Atribuir roles (ADMIN/MANAGER/TRAINER/TRAINEE)
- Definir flags: `is_tutor`, `is_liberador`, `is_team_lead`, `is_referente`
- Atribuir a equipas

#### Validações pendentes (`/master-data/trainer-validation`)
- Lista de utilizadores com registo pendente de aprovação (TRAINER/MANAGER/tutor/liberador)
- Aprovar → activa conta completa
- Rejeitar → remove acesso

#### Hierarquia organizacional (`/master-data/org-hierarchy`)
- Visualização em **árvore interactiva** (expansível, drag-and-drop para mover nós)
- Visualização em **organograma visual** (CSS-based, color-coded por nível)
- CRUD completo de nós hierárquicos com prevenção de ciclos
- Atribuição de membros a cada nó
- Log de auditoria de todas as alterações

---

### 5. Portal de Chamados (`/chamados`)

**Quem acede:** Todos os utilizadores autenticados

**Kanban com 4 colunas:**

```
ABERTO → EM_ANDAMENTO → EM_REVISAO → CONCLUIDO
```

| Funcionalidade | Quem pode |
|----------------|-----------|
| Criar chamado (tipo, prioridade, portal afectado) | Todos |
| Comentar chamado | Todos |
| Mover entre colunas (drag-and-drop) | ADMIN |
| Atribuir responsável | ADMIN |
| Adicionar notas de andamento | ADMIN |
| Alterar prioridade (BAIXA/MEDIA/ALTA/CRITICA) | ADMIN |
| Eliminar chamado | ADMIN |

**Tipos:** BUG · MELHORIA
**Portais afectados:** FORMACOES · TUTORIA · RELATORIOS · DADOS_MESTRES · CHAMADOS · GERAL
**Anexos:** suporte a imagens com compressão automática (máx 1200px, qualidade 72%)

---

### Chatbot IA (widget global)

Disponível em todos os portais autenticados (widget flutuante).

- Responde a perguntas sobre o sistema usando as FAQs configuradas
- Powered by **Anthropic Claude API**
- FAQs geridas em `/master-data/faqs` (multilingue PT/ES/EN)
- Contexto preservado durante a sessão

---

## Roles e permissões

### Roles base

| Role | Descrição | Acesso padrão |
|------|-----------|---------------|
| **ADMIN** | Administrador do sistema | Total — todos os portais, CRUD completo |
| **GESTOR** | Alias de ADMIN | Idêntico ao ADMIN |
| **MANAGER** | Chefe de equipa | Formações + Relatórios (equipa) + Dados Mestres (leitura) |
| **TRAINER** | Formador | Cursos próprios + Alunos atribuídos |
| **TRAINEE** | Utilizador simples (= STUDENT = LIBERADOR base) | Dados próprios em todos os portais |

### Flags especiais (aplicam-se a utilizadores TRAINEE)

| Flag | Activa |
|------|--------|
| `is_tutor` | Acesso completo de tutoria: gerir erros, planos, cápsulas, feedback, side-by-side, fichas |
| `is_team_lead` | Ver dados de todos os membros da equipa (análise, planos, learning sheets) |
| `is_referente` | Ver erros e planos das operações em que participa |
| `is_liberador` | Registar erros internos, responder a surveys de feedback |
| `is_pending` | Conta criada mas aguarda aprovação de ADMIN; acesso limitado com banner de aviso |

### Matriz de acesso resumida

| Portal | ADMIN | MANAGER | TRAINER | TRAINEE | is_tutor |
|--------|:-----:|:-------:|:-------:|:-------:|:--------:|
| Formações | ✅ Full | ✅ Full | ✅ Próprios | 📖 Read | 📖 Read |
| Tutoria | ✅ Full | 🏢 Equipa | ❌ | 🔒 Próprios | ✅ Tutorandos |
| Relatórios | ✅ Full | 🏢 Equipa | 🔒 Próprios | 🔒 Próprios | 🔒 Próprios |
| Dados Mestres | ✅ Full | 📖 Read | ❌ | ❌ | ❌ |
| Chamados | ✅ Gestão | 🏢 Equipa | 🔒 Próprios | 🔒 Próprios | 🔒 Próprios |

> Documentação completa: [`docs/ROLES_AND_PERMISSIONS.md`](docs/ROLES_AND_PERMISSIONS.md)

---

## Arquitectura técnica

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Cliente                   │
│          React 18 · Tailwind CSS · Zustand            │
│       React Router v6 · react-i18next (PT/ES/EN)      │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS / fetch (JWT Bearer)
                         │ /api/* (proxy nginx)
┌────────────────────────▼────────────────────────────┐
│              nginx (porta 80 / 443)                   │
│   SPA React → /usr/share/nginx/html/                  │
│   Proxy /api → http://tradehub-backend:8000           │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│           FastAPI (Python 3.13) — porta 8000          │
│                                                       │
│  Routers:                                             │
│  ├── /api/auth           Autenticação JWT (PyJWT)     │
│  ├── /api/admin          Utilizadores, Master Data    │
│  ├── /api/teams          Equipas e membros            │
│  ├── /api/org            Hierarquia organizacional    │
│  ├── /api/trainer        Cursos, lições, desafios     │
│  ├── /api/lessons        Progresso de lições          │
│  ├── /api/challenges     Submissões, revisões         │
│  ├── /api/training-plans Planos de formação           │
│  ├── /api/finalization   Finalização e certificados   │
│  ├── /api/student        Rotas específicas do aluno   │
│  ├── /api/tutoria        Erros, planos, notificações  │
│  ├── /api/internal-errors Erros internos, censos      │
│  ├── /api/feedback       Surveys liberador → tutor    │
│  ├── /api/chamados       Kanban de suporte            │
│  ├── /api/relatorios     Relatórios por portal        │
│  ├── /api/dw             Data Warehouse + ETL         │
│  ├── /api/ratings        Avaliações de conteúdo       │
│  ├── /api/certificates   Certificados PDF (ReportLab) │
│  ├── /api/chat           Chatbot (Anthropic Claude)   │
│  └── /api/stats          KPIs públicos                │
│                                                       │
│  Middleware: CORS · Rate Limiting (slowapi)           │
│  Auth: JWT Bearer → get_current_user()                │
│  Migrations: Flyway-style (app/migrate.py)            │
│  Schedulers: ETL diário · Snapshot DW                 │
└────────────────────────┬────────────────────────────┘
                         │ SQLAlchemy 2.0 + PyMySQL
┌────────────────────────▼────────────────────────────┐
│               MySQL 8.0 — porta 3307 (DEV)            │
│               ~40 tabelas, migrações V001–V005         │
└─────────────────────────────────────────────────────┘
```

### Dependências principais

**Backend (Python)**

| Pacote | Versão | Função |
|--------|--------|--------|
| fastapi | 0.109.0 | Framework API |
| sqlalchemy | 2.0.40 | ORM |
| pymysql | 1.1.0 | Driver MySQL |
| pydantic | 2.12.5 | Validação de dados |
| PyJWT | 2.8.0 | Tokens JWT |
| passlib[bcrypt] | 1.7.4 | Hash de passwords |
| reportlab | 4.0.9 | Geração de PDFs |
| anthropic | 0.84.0 | Chatbot Claude AI |
| slowapi | 0.1.9 | Rate limiting |
| pandas | 2.3.3 | Analytics / ETL |
| pytest | 7.4.3 | Testes (341 testes) |

**Frontend (Node.js)**

| Pacote | Função |
|--------|--------|
| react 18 + react-dom | UI framework |
| react-router-dom v6 | Routing SPA |
| tailwindcss | Utility-first CSS |
| zustand | Estado global (auth) |
| react-i18next | i18n PT/ES/EN |
| lucide-react | Ícones |
| recharts | Gráficos |
| vite | Build tool + HMR |

---

## Arranque rápido — Docker

> Recomendado. Não é necessário instalar Python, Node.js ou MySQL localmente.

### Pré-requisitos

- Docker Engine 24+
- Docker Compose v2+

### 1. Clonar e configurar

```bash
git clone https://github.com/marceloligiero/PortalTradeHudb.git
cd PortalTradeHudb

# Variáveis Docker (MySQL, portas)
cp .env.example .env

# Variáveis do backend (DATABASE_URL, SECRET_KEY, SMTP)
cp backend/.env.example backend/.env
# Editar backend/.env com os valores reais (ver secção Variáveis de ambiente)
```

### 2. Iniciar em modo desenvolvimento (hot reload)

```bash
docker compose --profile dev up -d --build

# Verificar estado
docker compose ps

# Logs em tempo real
docker compose logs -f
```

**Acessos:**
| Serviço | URL |
|---------|-----|
| Frontend (React) | http://localhost |
| Backend API | http://localhost:8100 |
| Swagger UI (só DEV) | http://localhost:8100/docs |
| MySQL | 127.0.0.1:3307 |

### 3. Iniciar em modo produção

```bash
# Requer backend/.env.prod com valores de produção
docker compose --profile prod up -d --build
```

### 4. Comandos úteis

```bash
# Parar tudo (preserva dados)
docker compose down

# Parar e apagar base de dados (CUIDADO — dados perdidos)
docker compose down -v

# Shell no container do backend
docker exec -it tradehub-backend bash

# Shell MySQL
docker exec -it tradehub-db mysql -u tradehub_user -p tradehub_db

# Rebuild forçado (após alterações ao Dockerfile ou requirements.txt)
docker compose --profile dev up -d --build --force-recreate

# Ver logs por serviço
docker compose logs -f tradehub-backend
docker compose logs -f tradehub-frontend

# Copiar build de produção para nginx
npm run build  # na pasta frontend/
docker cp dist/. tradehub-frontend:/usr/share/nginx/html/
docker exec tradehub-frontend nginx -s reload
```

---

## Instalação local (sem Docker)

### Pré-requisitos

| Ferramenta | Versão mínima |
|------------|--------------|
| Python | 3.13+ |
| Node.js | 18+ |
| MySQL | 8.0+ |

### Backend

```bash
cd backend

# Criar e activar ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env (ver secção Variáveis de ambiente)

# Iniciar (hot reload)
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar (hot reload — porta 5173)
npm run dev
```

### Windows — arranque rápido

```bat
iniciar-sem-docker.bat    # Inicia backend + frontend numa janela
```

---

## Variáveis de ambiente

### `backend/.env` (obrigatórias)

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | `mysql+pymysql://user:pass@localhost/tradehub_db` | Connection string MySQL |
| `SECRET_KEY` | *(gerar abaixo)* | Chave de assinatura JWT |

```bash
# Gerar SECRET_KEY segura
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### `backend/.env` (opcionais)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Origens CORS (separadas por vírgula) |
| `ALGORITHM` | `HS256` | Algoritmo JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Validade do token JWT |
| `DEBUG` | `false` | Modo debug (activa Swagger, CORS permissivo) |
| `FRONTEND_URL` | — | URL base do frontend (para links de email) |
| `SMTP_HOST` | — | Servidor SMTP (recuperação de senha) |
| `SMTP_PORT` | `587` | Porta SMTP |
| `SMTP_USER` | — | Utilizador SMTP |
| `SMTP_PASSWORD` | — | Senha SMTP |
| `SMTP_FROM_EMAIL` | — | Endereço remetente |
| `SMTP_TLS` | `true` | Usar TLS |
| `ANTHROPIC_API_KEY` | — | API key Claude (chatbot) |

### `.env` (raiz — Docker)

| Variável | Padrão DEV |
|----------|-----------|
| `MYSQL_ROOT_PASSWORD` | `dev_root_pass` |
| `MYSQL_DATABASE` | `tradehub_db` |
| `MYSQL_USER` | `tradehub_user` |
| `MYSQL_PASSWORD` | `dev_pass` |
| `COMPOSE_PROFILES` | `dev` |

---

## Base de dados

MySQL 8.0 com **migrações automáticas** aplicadas no arranque do backend (`app/migrate.py`). Ficheiros em `database/migrations/V00N__descricao.sql`.

### Migrações

| Migração | Descrição |
|----------|-----------|
| `V001__initial_schema.sql` | Schema inicial: users, teams, courses, lessons, challenges, training_plans, certificates |
| `V002__tutoria_and_chamados.sql` | Tutoria (erros, planos, comentários, notificações), Chamados, FAQs |
| `V003__capsulas_side_by_side_feedback.sql` | Cápsulas de aprendizagem, side-by-side, surveys de feedback, erros internos, censos |
| `V004__org_hierarchy.sql` | Hierarquia organizacional (org_nodes, org_node_members, org_node_audit) |
| `V005__org_hierarchy_and_team_managers.sql` | Dados reais da estrutura Santander + ligação teams→org_nodes |

### Entidades principais (ERD simplificado)

```
User ──< TeamMember >── Team ──── node_id ──> OrgNode
 │                                                │
 ├──< Course >──< Lesson                 org_node_members
 │           └──< Challenge
 │
 ├──< TrainingPlan >──< Course (N:M)
 │          └──> Certificate
 │
 ├──< TutoriaError >──< TutoriaActionPlan >──< ActionItem
 │         └──< TutoriaComment             └──< Comment
 │
 ├──< InternalError >──< ActionPlan >──< ActionItem
 │         └──< LearningSheet
 │
 ├──< FeedbackSurvey >──< FeedbackResponse
 │
 └──< Chamado >──< ChamadoComment
```

---

## API — referência rápida

Todos os endpoints protegidos requerem header `Authorization: Bearer <token>`.

> **Swagger UI** disponível em `http://localhost:8100/docs` (apenas em modo DEBUG/DEV).

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/auth/login` | — | Login; retorna JWT + perfil |
| `POST` | `/api/auth/register` | — | Registo; roles TRAINEE/MANAGER/TRAINER |
| `GET` | `/api/auth/me` | Bearer | Perfil do utilizador autenticado |
| `POST` | `/api/auth/forgot-password` | — | Solicitar reset de senha (rate: 3/min) |
| `POST` | `/api/auth/reset-password` | — | Confirmar reset com token |
| `GET` | `/api/auth/validate-reset-token/{token}` | — | Validar token de reset |

### Utilizadores e validação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/admin/users` | ADMIN\|MANAGER | Listar utilizadores |
| `POST` | `/api/admin/users` | ADMIN | Criar utilizador |
| `PUT` | `/api/admin/users/{id}` | ADMIN | Actualizar utilizador (role, flags, equipa) |
| `DELETE` | `/api/admin/users/{id}` | ADMIN | Desactivar utilizador |
| `GET` | `/api/admin/pending-trainers` | ADMIN\|MANAGER | Utilizadores pendentes de validação |
| `POST` | `/api/admin/validate-trainer/{id}` | ADMIN | Aprovar utilizador pendente |
| `POST` | `/api/admin/reject-trainer/{id}` | ADMIN | Rejeitar utilizador pendente |

### Cursos, lições e desafios

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET/POST` | `/api/trainer/courses` | TRAINER\|ADMIN | Listar / criar cursos |
| `GET/PUT/DELETE` | `/api/admin/courses/{id}` | ADMIN\|TRAINER | Ver / editar / apagar curso |
| `POST` | `/api/trainer/lessons` | TRAINER\|ADMIN | Criar lição |
| `POST` | `/api/challenges/` | TRAINER\|ADMIN | Criar desafio |
| `POST` | `/api/challenges/{id}/release/{student_id}` | TRAINER\|ADMIN | Liberar desafio a estudante |
| `GET` | `/api/challenges/student/released` | Bearer | Ver desafios liberados (estudante) |
| `POST` | `/api/challenges/submit/complete/start/{id}/self` | Bearer | Estudante inicia execução |
| `POST` | `/api/challenges/submit/complete/{sub_id}/part` | Bearer | Submeter operação |
| `POST` | `/api/challenges/submit/complete/{sub_id}/finish` | Bearer | Finalizar execução |
| `POST` | `/api/challenges/submissions/{id}/finalize-review` | TRAINER\|ADMIN | Aprovar/rejeitar submissão |
| `POST` | `/api/challenges/submissions/{id}/allow-retry` | TRAINER\|ADMIN | Permitir re-tentativa |

### Planos de formação e certificados

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET/POST` | `/api/trainer/training-plans` | TRAINER\|ADMIN | Listar / criar planos |
| `POST` | `/api/finalization/plan/{id}/finalize` | TRAINER\|ADMIN | Finalizar plano (gera certificado) |
| `GET` | `/api/certificates/` | Bearer | Listar certificados do utilizador |
| `GET` | `/api/certificates/{id}/pdf` | Bearer | Download certificado PDF |

### Lições (progresso)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/lessons/{id}/start` | Bearer | Iniciar lição (começa timer) |
| `POST` | `/api/lessons/{id}/pause` | Bearer | Pausar lição |
| `POST` | `/api/lessons/{id}/resume` | Bearer | Retomar lição |
| `POST` | `/api/lessons/{id}/finish` | Bearer | Terminar lição |
| `POST` | `/api/lessons/{id}/approve` | TRAINER\|ADMIN | Aprovar lição do estudante |

### Tutoria

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET/POST` | `/api/tutoria/errors` | Bearer | Listar / criar erros (scoped por role) |
| `PATCH` | `/api/tutoria/errors/{id}/analysis` | Bearer | Actualizar análise do erro |
| `POST` | `/api/tutoria/errors/{id}/approve-chief` | MANAGER\|ADMIN | Aprovar como chefe de equipa |
| `POST` | `/api/tutoria/errors/{id}/resolve` | TUTOR\|ADMIN | Resolver erro |
| `GET/POST` | `/api/tutoria/plans` | Bearer | Listar / criar planos de acção |
| `POST` | `/api/tutoria/plans/{id}/approve` | TUTOR\|ADMIN | Aprovar plano |
| `POST` | `/api/tutoria/plans/{id}/return` | TUTOR\|ADMIN | Devolver plano para revisão |
| `GET/POST` | `/api/tutoria/capsulas` | Bearer\|TUTOR | Listar / criar cápsulas |
| `GET` | `/api/tutoria/notifications` | Bearer | Ver notificações |
| `PATCH` | `/api/tutoria/notifications/read-all` | Bearer | Marcar todas como lidas |

### Erros internos e feedback

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET/POST` | `/api/internal-errors/errors` | LIBERADOR | Listar / registar erros internos |
| `GET/POST` | `/api/feedback/surveys` | TUTOR\|ADMIN | Gerir surveys de feedback |
| `GET` | `/api/feedback/my-pending` | LIBERADOR | Ver surveys pendentes |
| `POST` | `/api/feedback/responses` | LIBERADOR | Submeter avaliação de grabador |
| `GET` | `/api/feedback/dashboard` | TUTOR\|ADMIN | Dashboard de sentimento |

### Chamados

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/chamados` | Bearer | Listar chamados (scoped por role) |
| `POST` | `/api/chamados` | Bearer | Criar chamado |
| `PUT` | `/api/chamados/{id}` | ADMIN | Gerir chamado (estado, prioridade, notas, responsável) |
| `DELETE` | `/api/chamados/{id}` | ADMIN | Apagar chamado |
| `POST` | `/api/chamados/{id}/comments` | Bearer | Adicionar comentário |

### Relatórios e analytics

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/relatorios/overview` | Bearer | KPIs gerais |
| `GET` | `/api/relatorios/formacoes` | Bearer | Analytics de formações |
| `GET` | `/api/relatorios/tutoria` | Bearer | Analytics de tutoria |
| `GET` | `/api/relatorios/teams` | ADMIN\|MANAGER | Relatório de equipas |
| `GET` | `/api/relatorios/incidents` | ADMIN\|MANAGER | Exportação de incidentes |
| `GET` | `/api/dw/snapshot/latest` | ADMIN\|MANAGER | Snapshot DW mais recente |
| `POST` | `/api/etl/run` | ADMIN | Forçar ETL manual |

### Dados Mestres

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET/POST/PUT/DELETE` | `/api/admin/banks` | ADMIN | Bancos |
| `GET/POST/PUT/DELETE` | `/api/admin/products` | ADMIN | Produtos |
| `GET/POST/PATCH/DELETE` | `/api/teams` | ADMIN | Equipas e membros |
| `GET/POST/PUT/DELETE` | `/api/admin/master/*` | ADMIN | Impactos, origens, departamentos, etc. |
| `GET/POST/PUT/DELETE` | `/api/org/nodes` | ADMIN | Hierarquia organizacional |
| `GET` | `/api/org/tree` | Bearer | Árvore hierárquica completa |
| `GET` | `/api/org/audit` | ADMIN | Log de auditoria |

### Chatbot e público

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/chat` | Bearer | Enviar mensagem ao chatbot Claude |
| `GET` | `/api/stats/kpis` | — | KPIs públicos (landing page) |
| `GET` | `/api/public/landing` | — | Dados da landing page |

---

## Testes

### Executar testes

```bash
# Na pasta backend/, com .venv activo

# Todos os testes (341 testes)
pytest tests/ -v

# Suite principal (todos os portais)
pytest tests/test_all_portals.py -v

# Suite de tutoria
pytest tests/test_tutoria_v4.py -v

# Com relatório de cobertura
pytest tests/ --cov=app --cov-report=html
# Abre htmlcov/index.html no browser

# Filtrar por keyword
pytest tests/ -k "admin" -v
pytest tests/ -k "tutoria" -v
```

### Testes E2E (Playwright)

```bash
# Na raiz do projecto

# Instalar browsers
npx playwright install

# Correr todos (3 browsers, 4 workers paralelos)
npx playwright test

# Modo UI (interface visual)
npx playwright test --ui

# Apenas Chromium
npx playwright test --project=chromium

# Ver relatório HTML
npx playwright show-report
```

> Configuração em `playwright.config.ts`. Fixtures em `tests/e2e/fixtures.ts`.

### Credenciais de teste

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@tradehub.com | test123 |
| MANAGER | manager@tradehub.com | test123 |
| TRAINER | trainer@tradehub.com | test123 |
| TRAINEE | student@tradehub.com | test123 |

---

## Deploy e CI/CD

### Pipeline automático

```
git push main
   │
   ├─► CI (ci.yml) ─────────────► lint + type-check + 341 testes pytest
   │
   ├─► Build (build-and-push.yml) ► Docker build → GHCR (ghcr.io/...)
   │
   └─► Deploy (deploy.yml) ──────► SSH → servidor → docker pull + restart
```

| Workflow | Trigger | Função |
|----------|---------|--------|
| `ci.yml` | Push/PR → main, develop | Lint, type check, pytest |
| `build-and-push.yml` | CI ✅ em main | Build imagens Docker → GitHub Container Registry |
| `deploy.yml` | Build ✅ ou manual | Deploy via SSH ao servidor |
| `dependabot.yml` | Semanal (segunda) | PRs automáticos de actualização de deps |

### Deploy manual (Docker em VPS)

```bash
# No servidor
cd /opt/tradehub

# Actualização completa (pull + deps + build frontend + restart)
./start-vps.sh update

# Actualização rápida (pull + restart backend sem rebuild)
./start-vps.sh quick

# Só frontend (pull + build + copiar para nginx)
./start-vps.sh frontend

# Restart de serviços
./start-vps.sh restart

# Parar tudo
./start-vps.sh stop

# Status + logs
./start-vps.sh status
```

### Primeiro deploy (servidor novo)

```bash
ssh <user>@<servidor>
cd /opt
git clone https://github.com/marceloligiero/PortalTradeHudb.git tradehub
cd tradehub
cp .env.example .env
cp backend/.env.example backend/.env
# Editar ambos os ficheiros com valores de produção
docker compose --profile prod up -d --build
```

### Portas em produção

| Serviço | Porta |
|---------|-------|
| nginx (HTTP) | 80 |
| nginx (HTTPS) | 443 |
| Backend (interno) | 8000 |
| Backend (externo via nginx) | 8100 |
| MySQL (apenas interno) | 3306 |

---

## Estrutura do projecto

```
PortalTradeHub/
│
├── backend/
│   ├── main.py                    # Ponto de entrada FastAPI, registo de routers
│   ├── requirements.txt           # Dependências Python
│   ├── Dockerfile                 # Multi-stage: deps / runtime
│   ├── .env.example               # Template de variáveis de ambiente
│   └── app/
│       ├── config.py              # Configuração (Pydantic Settings)
│       ├── database.py            # Engine + sessão SQLAlchemy
│       ├── models.py              # Todos os modelos ORM (~40 tabelas)
│       ├── auth.py                # JWT, bcrypt, get_current_user, get_visible_user_ids
│       ├── migrate.py             # Sistema de migrações automáticas (Flyway-style)
│       ├── schemas/               # Pydantic schemas por módulo
│       ├── routes/                # Routers: admin, trainer, student, certificates, ratings...
│       └── routers/               # Routers: tutoria, chamados, teams, org, feedback, dw...
│
├── backend/tests/
│   ├── test_all_portals.py        # Suite principal (todos os portais)
│   └── test_tutoria_v4.py         # Suite de tutoria
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Routing React Router v6 (role-based routes)
│   │   ├── pages/
│   │   │   ├── admin/             # ADMIN/GESTOR: Dashboard, Cursos, MasterData, OrgHierarchy...
│   │   │   ├── student/           # STUDENT/TRAINEE: Dashboard, Cursos, Desafios, Planos...
│   │   │   ├── trainer/           # TRAINER: Dashboard, Cursos, Alunos, Submissões...
│   │   │   ├── tutoria/           # Portal Tutoria: Erros, Planos, SideBySide, Capsulas...
│   │   │   ├── relatorios/        # Portal Relatórios: Overview, Formações, Tutoria, Teams...
│   │   │   └── chamados/          # Portal Chamados: Kanban
│   │   ├── components/
│   │   │   ├── layout/            # PortalLayout, Header, Sidebar, SidebarLink...
│   │   │   ├── landing/           # Landing page (animações, secções)
│   │   │   └── ChatWidget.tsx     # Chatbot Claude (widget global)
│   │   ├── stores/
│   │   │   └── authStore.ts       # Zustand: token JWT, user, role, setAuth, clear
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx   # Dark/light mode
│   │   └── i18n/
│   │       └── locales/           # en.json · es.json · pt-PT.json
│   ├── vite.config.ts             # Vite + proxy /api + polling HMR (Docker)
│   ├── Dockerfile                 # Multi-stage: builder (Node) / nginx (prod)
│   └── package.json
│
├── database/
│   └── migrations/                # V001 → V005 SQL migrations
│
├── docs/
│   ├── ROLES_AND_PERMISSIONS.md   # Permissões detalhadas por role e flag
│   ├── FLUXOGRAMAS_OPERACOES.md   # 21 fluxogramas Mermaid (todos os fluxos)
│   ├── TECHNICAL_AUDIT.md         # Auditoria técnica completa
│   ├── SECURITY_AUDIT.md          # OWASP Top 10, GDPR, ISO 27001
│   └── qa/                        # Checklists QA por role (ADMIN, MANAGER, TRAINER...)
│
├── docker-compose.yml             # Dev + Prod (profiles)
├── Makefile                       # Atalhos: make up / make logs / make shell
├── playwright.config.ts           # E2E Playwright (3 browsers, 4 workers)
├── CLAUDE.md                      # Instruções para Claude Code
└── README.md                      # Este ficheiro
```

---

## Documentação adicional

| Documento | Descrição |
|-----------|-----------|
| [`docs/ROLES_AND_PERMISSIONS.md`](docs/ROLES_AND_PERMISSIONS.md) | Todas as permissões por role, flag e portal com endpoints |
| [`docs/FLUXOGRAMAS_OPERACOES.md`](docs/FLUXOGRAMAS_OPERACOES.md) | 21 fluxogramas Mermaid — passo a passo de cada operação |
| [`docs/TECHNICAL_AUDIT.md`](docs/TECHNICAL_AUDIT.md) | Auditoria técnica: componentes, integrações, estado do código |
| [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md) | Auditoria OWASP Top 10:2025 + GDPR + ISO 27001 |
| [`docs/qa/README.md`](docs/qa/README.md) | Índice dos checklists de QA por role |
| [`docs/qa/QA_ADMIN.md`](docs/qa/QA_ADMIN.md) | Checklist de testes para ADMIN |
| [`docs/qa/QA_MANAGER.md`](docs/qa/QA_MANAGER.md) | Checklist de testes para MANAGER |
| [`docs/qa/QA_TRAINER.md`](docs/qa/QA_TRAINER.md) | Checklist de testes para TRAINER |
| [`docs/qa/QA_STUDENT.md`](docs/qa/QA_STUDENT.md) | Checklist de testes para STUDENT/TRAINEE |
| [`docs/qa/QA_TUTOR.md`](docs/qa/QA_TUTOR.md) | Checklist de testes para is_tutor |
| [`docs/qa/QA_REFERENTE.md`](docs/qa/QA_REFERENTE.md) | Checklist de testes para is_referente/is_liberador |

---

## Licença

Propriedade privada — Santander Trade Finance. Todos os direitos reservados.
