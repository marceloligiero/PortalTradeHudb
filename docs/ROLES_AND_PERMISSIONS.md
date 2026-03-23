# Roles & Permissions — PortalTradeHub

> Gerado a partir de auditoria completa dos routers FastAPI e páginas React.
> Última actualização: 2026-03-21

---

## Índice

1. [Visão geral dos roles](#1-visão-geral-dos-roles)
2. [ADMIN / GESTOR](#2-admin--gestor)
3. [MANAGER (Chefe de Equipa)](#3-manager-chefe-de-equipa)
4. [TRAINER (Formador)](#4-trainer-formador)
5. [TRAINEE / STUDENT (Utilizador Simples)](#5-trainee--student-utilizador-simples)
6. [Flags de permissão especiais](#6-flags-de-permissão-especiais)
   - [is_tutor](#61-is_tutor)
   - [is_team_lead (isChefe)](#62-is_team_lead-ischefe)
   - [is_referente](#63-is_referente)
   - [is_liberador](#64-is_liberador)
7. [Data scoping (visibilidade de dados)](#7-data-scoping-visibilidade-de-dados)
8. [Matriz de acesso por portal](#8-matriz-de-acesso-por-portal)

---

## 1. Visão geral dos roles

| Role | Descrição | Flags adicionais |
|------|-----------|-----------------|
| **ADMIN** | Administrador do sistema; acesso total | — |
| **GESTOR** | Alias de ADMIN; tratados como iguais no código | — |
| **MANAGER** | Chefe de equipa; vê dados da sua equipa | `is_team_lead` geralmente `true` |
| **TRAINER** | Formador; cria e gere cursos | `is_pending` enquanto não validado |
| **TRAINEE** | Utilizador simples (= STUDENT = LIBERADOR) | `is_tutor`, `is_team_lead`, `is_referente`, `is_liberador`, `is_pending` |

> **Nota:** STUDENT e TRAINEE são o mesmo role no código. LIBERADOR é um TRAINEE com `is_liberador = true`.

---

## 2. ADMIN / GESTOR

### Portal de Formações (`/`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver dashboard com KPIs do sistema | `GET /stats` | `/` → AdminDashboard |
| Listar, criar, editar, apagar cursos | `GET/POST/PUT/DELETE /courses` | `/courses` |
| Listar, criar, editar, apagar lições | `POST /lessons`, `PUT/DELETE /courses/:id/lessons/:id` | `/courses/:id/lessons/new` |
| Listar, criar, editar, apagar desafios | `POST/PUT/DELETE /courses/:id/challenges/:id` | `/courses/:id/challenges/new` |
| Ver detalhe de curso / lição / desafio | `GET /courses/:id`, `/lessons/:id`, `/challenges/:id` | `/courses/:id` |
| Criar / gerir planos de formação | `GET/POST /training-plans` | `/training-plans` |
| Criar plano de formação | `GET /training-plan/new` | AdminTrainingPlanForm |
| Rever submissões pendentes | `GET /pending-review/list` | `/pending-reviews` |
| Gerir lição (submissions, revisão) | — | `/lessons/:id/manage` |
| Rever submissão de estudante | `POST /submissions/:id/finalize-review` | `/submissions/:id/review` |
| Executar desafio (modo sumário) | `POST /submit/summary` | `/challenges/:id/execute/summary` |
| Registar conclusão de desafio | `POST /submit/complete/start/:id` | `/challenges/:id/execute/complete` |
| Ver resultados de desafio | `GET /submissions/:id` | `/challenges/result/:id` |
| Ver certificados | `GET /certificates` | `/certificates/:id` |
| Ver relatórios avançados | `GET /advanced-reports/*` | `/advanced-reports` |
| Ver matriz de conhecimento | `GET /api/admin/knowledge-matrix` | `/knowledge-matrix` |
| Ver / gerir avaliações | `GET/POST /ratings/*` | `/ratings` |
| Configurações do sistema | — | `/settings` |

### Portal de Dados Mestres (`/master-data`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Gerir bancos (CRUD) | `GET/POST/PUT/DELETE /banks` | `/master-data` |
| Gerir produtos (CRUD) | `GET/POST/PUT/DELETE /products` | `/master-data/products` |
| Gerir equipas (CRUD) | `GET/POST/PATCH/DELETE /teams` | `/master-data/teams` |
| Atribuir / remover membros de equipa | `POST/DELETE /teams/:id/members` | `/master-data/teams` |
| Gerir categorias de erro (CRUD) | `GET/POST/PUT/DELETE /master/categories` | `/master-data/categories` |
| Gerir impactos, origens, detectados-por, departamentos, actividades, tipos de erro | `GET/POST/PUT/DELETE /master/*` | `/master-data/impacts`, etc. |
| Gerir FAQs (multilingue PT/ES/EN) | `GET/POST/PUT/DELETE /master/faqs` | `/master-data/faqs` |
| Gerir utilizadores (criar, editar, apagar, atribuir roles e flags) | `GET/POST/PUT/DELETE /users` | `/master-data/users` |
| Validar / rejeitar formadores/tutores/liberadores pendentes | `POST /validate-trainer/:id`, `/reject-trainer/:id` | `/master-data/trainer-validation` |
| Gerir hierarquia organizacional (CRUD nós, mover, membros) | `POST/PUT/DELETE /api/org/nodes`, `/api/org/nodes/:id/move` | `/master-data/org-hierarchy` |
| Ver log de auditoria da hierarquia | `GET /api/org/audit` | `/master-data/org-hierarchy` (tab Auditoria) |

### Portal de Tutoria (`/tutoria`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver todos os erros de tutoria | `GET /errors` | `/tutoria/errors` |
| Ver todos os planos de acção | `GET /plans` | `/tutoria/plans` |
| Criar / editar / analisar erros | `POST/PATCH /errors` | `/tutoria/errors/new` |
| Criar planos de acção | `POST /errors/:id/plans`, `POST /plans` | `/tutoria/errors/:id/plans/new` |
| Aprovar / devolver planos | `POST /plans/:id/approve`, `/plans/:id/return` | `/tutoria/plans/:id` |
| Gerir cápsulas de aprendizagem | `GET/POST/PUT/DELETE /capsulas` | `/tutoria/capsulas` |
| Gerir categorias de erro | `POST/PATCH/DELETE /categories` | `/tutoria/categories` |
| Gerir FAQs do chat | — | `/tutoria/chat-faqs` |
| Ver feedback dashboard | `GET /feedback/dashboard` | `/tutoria/feedback/dashboard` |
| Criar / fechar surveys de feedback | `POST /surveys`, `POST /surveys/:id/close` | `/tutoria/feedback` |
| Ver notificações | `GET /notifications` | `/tutoria/notifications` |
| Ver / criar fichas de aprendizagem | `GET/POST /learning-sheets` | `/tutoria/learning-sheets` |
| Gerir erros internos (qualidade) | `GET /errors` (internal) | `/tutoria/internal-errors` |
| Dashboard de erros internos | `GET /dashboard` (internal) | `/tutoria/internal-errors` |
| Gerir censos | `POST/PATCH/DELETE /sensos` | — |
| Treino side-by-side | `POST /plans/side-by-side` | `/tutoria/side-by-side` |

### Portal de Relatórios (`/relatorios`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver overview de KPIs | `GET /relatorios/overview` | `/relatorios` |
| Ver relatório de formações | `GET /relatorios/formacoes` | `/relatorios/formacoes` |
| Ver relatório de tutoria | `GET /relatorios/tutoria` | `/relatorios/tutoria` |
| Ver relatório de equipas | `GET /relatorios/teams` | `/relatorios/teams` |
| Ver relatório de membros | `GET /relatorios/members` | `/relatorios/members` |
| Exportar incidentes com filtros | `GET /relatorios/incidents` | `/relatorios/incidents` (export) |
| Dashboard DW com analytics | `GET /dw/*` | AdminDashboard (gráficos) |
| Trigger ETL manual | `POST /etl/run` | AdminDashboard |

### Portal de Chamados (`/chamados`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver todos os chamados | `GET /chamados` | `/chamados` |
| Criar chamado | `POST /chamados` | `/chamados` |
| Mover chamado entre estados (Kanban) | `PUT /chamados/:id` | `/chamados` |
| Atribuir responsável | `PUT /chamados/:id` { assigned_to_id } | `/chamados` |
| Adicionar notas de andamento | `PUT /chamados/:id` { admin_notes } | `/chamados` |
| Apagar chamado | `DELETE /chamados/:id` | `/chamados` |
| Comentar chamado | `POST /chamados/:id/comments` | `/chamados` |

---

## 3. MANAGER (Chefe de Equipa)

> MANAGER tem acesso a dados da sua equipa. `get_visible_user_ids()` retorna os IDs dos membros da equipa gerida.

### Portal de Formações (`/`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver dashboard | `GET /stats` | `/` → AdminDashboard |
| Listar / ver cursos | `GET /courses`, `/courses/:id` | `/courses` |
| Criar / editar cursos | `POST/PUT /courses` | `/course/new`, `/courses/:id/edit` |
| Criar / editar lições e desafios | `POST /lessons`, `PUT /challenges/:id` | `/courses/:id/lessons/new` |
| Gerir planos de formação | `GET/POST /training-plans` | `/training-plans` |
| Rever submissões da equipa | `GET /pending-review/list` | `/pending-reviews` |
| Rever submissão individual | `POST /submissions/:id/finalize-review` | `/submissions/:id/review` |
| Ver relatórios de formação | `GET /reports/*` | `/reports`, `/advanced-reports` |
| Ver matriz de conhecimento | `GET /api/admin/knowledge-matrix` | `/knowledge-matrix` |
| Ver avaliações | `GET /ratings/admin/*` | `/ratings` |

### Portal de Dados Mestres (`/master-data`)

> Acesso de leitura à maioria dos dados; sem escrita em bancos/produtos/equipas (apenas ADMIN).

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver bancos, produtos, categorias, etc. | `GET /banks`, `/products`, etc. | `/master-data/*` |
| Ver utilizadores da equipa | `GET /users` (scoped) | `/master-data/users` |
| Ver hierarquia organizacional | `GET /api/org/tree` | `/master-data/org-hierarchy` |
| Ver validações pendentes | `GET /pending-trainers` | `/master-data/trainer-validation` |

### Portal de Tutoria (`/tutoria`)

> Vê todos os erros e planos da sua equipa (via `get_visible_user_ids()`).

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver erros da equipa | `GET /errors` (scoped a equipa) | `/tutoria/errors` |
| Ver planos da equipa | `GET /plans` (scoped a equipa) | `/tutoria/plans` |
| Aprovar erros como chefe | `POST /errors/:id/approve-chief` | `/tutoria/errors/:id` |
| Ver relatório de progresso | `GET /relatorios/tutoria` | `/tutoria/report` |
| Ver fichas de aprendizagem | `GET /learning-sheets` | `/tutoria/learning-sheets` |
| Ver erros internos da equipa | `GET /errors` (internal, scoped) | `/tutoria/internal-errors` |
| Ver notificações | `GET /notifications` | `/tutoria/notifications` |

### Portal de Relatórios (`/relatorios`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver overview | `GET /relatorios/overview` | `/relatorios` |
| Ver relatório de formações | `GET /relatorios/formacoes` | `/relatorios/formacoes` |
| Ver relatório de tutoria | `GET /relatorios/tutoria` | `/relatorios/tutoria` |
| Ver relatório de equipas | `GET /relatorios/teams` | `/relatorios/teams` |
| Ver membros detalhado | `GET /relatorios/members` | `/relatorios/members` |
| Exportar incidentes | `GET /relatorios/incidents` | export |

### Portal de Chamados (`/chamados`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver chamados da equipa | `GET /chamados` (scoped) | `/chamados` |
| Criar chamado | `POST /chamados` | `/chamados` |
| Comentar chamado | `POST /chamados/:id/comments` | `/chamados` |

---

## 4. TRAINER (Formador)

> Acesso pendente de aprovação até `is_pending = false`. Enquanto pendente, vê banner de aviso.

### Portal de Formações (`/`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver dashboard do formador | `GET /stats` | `/` → TrainerDashboard |
| Listar / ver os seus cursos | `GET /courses` | `/courses` |
| Criar / editar / apagar os seus cursos | `POST/PUT/DELETE /courses` | `/course/new`, `/courses/:id/edit` |
| Criar / editar lições | `POST /lessons`, `PUT/DELETE /courses/:id/lessons/:id` | `/courses/:id/lessons/new` |
| Gerir lição (submissions dos alunos) | — | `/lessons/:id/manage` |
| Criar / editar desafios | `POST/PUT/DELETE /courses/:id/challenges/:id` | `/courses/:id/challenges/new` |
| Gerir planos de formação | `GET/POST /training-plans` | `/training-plans` |
| Criar plano de formação | `POST /training-plans` | `/training-plan/new` |
| Listar alunos atribuídos | `GET /students` | `/students` |
| Rever submissões pendentes | `GET /pending-review/list` | `/pending-reviews` |
| Aprovar / rejeitar submissão | `POST /submissions/:id/finalize-review` | `/submissions/:id/review` |
| Executar desafio | `POST /submit/summary` | `/challenges/:id/execute/summary` |
| Finalizar curso / plano | `POST /finalization/course/.../finalize` | Automático |
| Ver relatórios de formador | `GET /reports/*` | `/reports` |
| Ver / descarregar certificados | `GET /certificates` | `/certificates/:id` |

### Portal de Chamados (`/chamados`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver os seus chamados | `GET /chamados` (scoped a próprio) | `/chamados` |
| Criar chamado | `POST /chamados` | `/chamados` |
| Comentar chamado | `POST /chamados/:id/comments` | `/chamados` |

---

## 5. TRAINEE / STUDENT (Utilizador Simples)

> Inclui STUDENT, TRAINEE e LIBERADOR (base). Vê apenas os seus próprios dados.

### Portal de Formações (`/`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver dashboard pessoal | `GET /stats` | `/` → StudentDashboard |
| Ver os meus planos de formação | `GET /training-plans` | `/my-plans` |
| Ver cursos inscritos | `GET /student/courses` | `/my-courses` |
| Inscrever em curso | `POST /student/enroll/:id` | `/courses` |
| Ver os meus desafios | `GET /challenges/student/released` | `/my-challenges` |
| Ver as minhas lições | `GET /lessons/student/my-lessons` | `/my-lessons` |
| Executar desafio (linha a linha) | `POST /submit/complete/start/:id/self` | `/challenges/:id/execute` |
| Submeter parte de desafio | `POST /submit/complete/:id/part` | execução |
| Finalizar desafio | `POST /submit/complete/:id/finish` | execução |
| Ver resultado de desafio | `GET /submissions/:id` | `/challenges/result/:id` |
| Ver detalhe de lição | `GET /lessons/:id/detail` | `/lessons/:id/view` |
| Iniciar / pausar / retomar / terminar lição | `POST /lessons/:id/start`, `/pause`, `/resume`, `/finish` | `/lessons/:id/view` |
| Ver / descarregar certificados | `GET /certificates` | `/certificates/:id` |
| Ver relatórios pessoais | `GET /student/reports/*` | `/reports` |
| Avaliar cursos / lições / desafios / planos | `POST /ratings/submit` | — |

### Portal de Tutoria (`/tutoria`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver os meus erros de tutoria | `GET /errors` (scoped a próprio) | `/tutoria/my-errors` |
| Ver os meus planos de acção | `GET /plans` (scoped a próprio) | `/tutoria/my-plans` |
| Ver as minhas fichas de aprendizagem | `GET /learning-sheets/mine` | `/tutoria/my-learning-sheets` |
| Submeter ficha de aprendizagem | `POST /learning-sheets/:id/submit` | — |
| Ver o meu progresso | `GET /relatorios/tutoria` (scoped) | `/tutoria/report` |
| Ver notificações | `GET /notifications` | `/tutoria/notifications` |

### Portal de Chamados (`/chamados`)

| Acção | Endpoint | UI |
|-------|----------|----|
| Ver os seus chamados | `GET /chamados` (scoped a próprio) | `/chamados` |
| Criar chamado | `POST /chamados` | `/chamados` |
| Comentar chamado | `POST /chamados/:id/comments` | `/chamados` |

---

## 6. Flags de permissão especiais

### 6.1 `is_tutor`

Base role: TRAINEE. Activa acesso a funcionalidades de tutoria avançada.

| Acção adicional | Endpoint | UI |
|-----------------|----------|----|
| Ver todos os erros dos seus tutorandos | `GET /errors` (scoped por `User.tutor_id`) | `/tutoria/errors` |
| Criar / editar / verificar / resolver erros | `POST/PATCH /errors`, `POST /errors/:id/verify` | `/tutoria/errors` |
| Criar / aprovar / devolver planos de acção | `POST/PATCH /plans`, `POST /plans/:id/approve` | `/tutoria/plans` |
| Gerir cápsulas de aprendizagem | `GET/POST/PUT/DELETE /capsulas` | `/tutoria/capsulas` |
| Treino side-by-side | `POST /plans/side-by-side` | `/tutoria/side-by-side` |
| Criar / fechar surveys de feedback | `POST /surveys`, `POST /surveys/:id/close` | `/tutoria/feedback` |
| Ver feedback dashboard | `GET /feedback/dashboard` | `/tutoria/feedback/dashboard` |
| Criar acções sobre respostas de feedback | `POST /feedback/actions` | — |
| Criar / rever fichas de aprendizagem | `POST /learning-sheets`, `PATCH /learning-sheets/:id/review` | `/tutoria/learning-sheets` |
| Gerir erros internos (qualidade) | `GET /internal-errors/errors` | `/tutoria/internal-errors` |
| Dashboard de erros internos | `GET /internal-errors/dashboard` | — |
| Gerir censos | `POST/PATCH/DELETE /sensos` | — |

### 6.2 `is_team_lead` (isChefe)

Base role: TRAINEE (ou MANAGER). Activa visibilidade de dados da equipa.

| Acção adicional | Endpoint | UI |
|-----------------|----------|----|
| Ver erros de todos os membros da equipa | `GET /errors` (scoped a equipa) | `/tutoria/errors` (tab Análise) |
| Ver planos da equipa | `GET /plans` (scoped a equipa) | `/tutoria/plans` |
| Aprovar erros como chefe | `POST /errors/:id/approve-chief` | `/tutoria/errors/:id` |
| Ver fichas de aprendizagem da equipa | `GET /learning-sheets` (scoped) | `/tutoria/learning-sheets` |
| Ver relatório de progresso da equipa | `GET /relatorios/tutoria` (scoped) | `/tutoria/report` |

### 6.3 `is_referente`

Base role: TRAINEE. Visibilidade de análise de erros nas operações em que participa.

| Acção adicional | Endpoint | UI |
|-----------------|----------|----|
| Ver erros das operações em que é referente | `GET /errors` (scoped por participação) | `/tutoria/errors` (tab Análise) |
| Ver planos das operações em que participa | `GET /plans` (scoped) | `/tutoria/plans` |
| Ver fichas de aprendizagem | `GET /learning-sheets` | `/tutoria/learning-sheets` |
| Ver relatório de progresso | `GET /relatorios/tutoria` | `/tutoria/report` |

### 6.4 `is_liberador`

Base role: TRAINEE. Activa registo de erros internos de qualidade e feedback de gravadores.

| Acção adicional | Endpoint | UI |
|-----------------|----------|----|
| Registar erro interno de qualidade | `POST /internal-errors/errors` | `/tutoria/internal-errors/new` |
| Ver os seus erros internos (criados ou atribuídos) | `GET /internal-errors/errors` (scoped) | `/tutoria/internal-errors` |
| Ver / responder surveys de feedback | `GET /feedback/my-pending` | `/tutoria/feedback/respond` |
| Submeter resposta de feedback | `POST /feedback/responses` | `/tutoria/feedback/respond` |

---

## 7. Data scoping (visibilidade de dados)

A função `get_visible_user_ids(db, user)` em `backend/app/auth.py` centraliza toda a lógica de visibilidade:

| Role / Flag | Retorna | Resultado |
|-------------|---------|-----------|
| `ADMIN` ou `GESTOR` | `None` | Vê todos os dados sem restrição |
| `MANAGER` ou `is_team_lead=True` | Lista de IDs dos membros das equipas geridas + próprio | Vê dados da(s) equipa(s) gerida(s) |
| Qualquer outro (TRAINEE, TRAINER) | `[user.id]` | Vê apenas os seus próprios dados |

Routers que usam este scoping:
- `GET /chamados` — filtra por `created_by_id` ou `assigned_to_id`
- `GET /internal-errors/errors` — filtra por `gravador_id`
- `GET /tutoria/errors` — filtra por `tutorado_id`
- `GET /tutoria/plans` — filtra por `tutorado_id`

---

## 8. Matriz de acesso por portal

| Portal | ADMIN/GESTOR | MANAGER | TRAINER | TRAINEE | is_tutor | is_team_lead | is_referente | is_liberador |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Formações** (`/`) | ✅ Full | ✅ Full | ✅ Próprios | ✅ Readonly | ✅ Readonly | ✅ Equipa | ✅ Readonly | ✅ Readonly |
| **Dados Mestres** (`/master-data`) | ✅ Full | 🔍 Read | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tutoria** (`/tutoria`) | ✅ Full | 🏢 Equipa | ❌ | 🔒 Próprios | ✅ Tutorandos | 🏢 Equipa | 🏢 Operações | 🔒 Qualidade |
| **Relatórios** (`/relatorios`) | ✅ Full | 🏢 Equipa | 🔒 Próprios | 🔒 Próprios | 🔒 Próprios | 🏢 Equipa | 🔒 Próprios | 🔒 Próprios |
| **Chamados** (`/chamados`) | ✅ Full | 🏢 Equipa | 🔒 Próprios | 🔒 Próprios | 🔒 Próprios | 🔒 Próprios | 🔒 Próprios | 🔒 Próprios |

**Legenda:**
- ✅ Full — acesso completo (leitura + escrita + gestão)
- 🏢 Equipa — acesso scoped à(s) equipa(s) gerida(s)
- 🔒 Próprios — acesso apenas aos próprios dados
- 🔍 Read — só leitura
- ❌ — sem acesso
