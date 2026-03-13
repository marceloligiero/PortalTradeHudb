# Manual de Testes Manuais — Frontend QA

**Portal TradeHub — Guia para Equipa de QA**

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Credenciais de Acesso](#2-credenciais-de-acesso)
3. [Portal Público (Sem Login)](#3-portal-público-sem-login)
4. [Portal do Administrador (ADMIN)](#4-portal-do-administrador-admin)
5. [Portal do Gestor (MANAGER)](#5-portal-do-gestor-manager)
6. [Portal do Formador (TRAINER)](#6-portal-do-formador-trainer)
7. [Portal do Formando (STUDENT)](#7-portal-do-formando-student)
8. [Portal de Tutoria (Todos os Roles)](#8-portal-de-tutoria-todos-os-roles)
9. [Portal de Relatórios (Todos os Roles)](#9-portal-de-relatórios-todos-os-roles)
10. [Portal de Chamados (Todos os Roles)](#10-portal-de-chamados-todos-os-roles)
11. [Chat Assistente](#11-chat-assistente)
12. [Testes de Controlo de Acesso (RBAC)](#12-testes-de-controlo-de-acesso-rbac)
13. [Checklist de Regressão](#13-checklist-de-regressão)

---

## 1. Pré-requisitos

### Ambiente

| Componente | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Base de Dados | MySQL 8.4 — `tradehub` |

### Como Iniciar

```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### Navegadores Recomendados
- Google Chrome (última versão)
- Mozilla Firefox (última versão)
- Microsoft Edge (última versão)

### Para cada teste:
1. Abrir o navegador em modo incógnito/privado
2. Aceder à URL indicada
3. Verificar o comportamento esperado
4. Registar screenshots de evidência (PrintScreen / Snipping Tool)
5. Anotar qualquer desvio no campo "Observações"

---

## 2. Credenciais de Acesso

> ⚠️ **IMPORTANTE:** Os utilizadores de teste precisam de ser criados antes dos testes manuais. O admin já existe na base de dados. Os restantes utilizadores devem ser criados pelo admin no portal ou executando os testes automatizados primeiro (`python -m pytest tests/test_all_portals.py -v -k "TestSetup"`).

| Role | Email | Password | Permissões |
|---|---|---|---|
| **ADMIN** | admin@tradehub.com | admin123 | Acesso total a todos os módulos |
| **MANAGER** | manager_test@tradehub.com | Test1234! | Gestão de equipa, relatórios, tutoria |
| **TRAINER** | trainer_test@tradehub.com | Test1234! | Cursos, lições, desafios, planos |
| **TUTOR** | tutor_test@tradehub.com | Test1234! | Tutoria, censos, fichas, erros internos |
| **STUDENT** | student_test@tradehub.com | Test1234! | Portal do aluno, cursos, desafios |
| **LIBERADOR** | liberador_test@tradehub.com | Test1234! | Criação de erros internos |
| **REFERENTE** | referente_test@tradehub.com | Test1234! | Acesso de referência |

### Como Criar Utilizadores de Teste via Frontend

1. Login como **ADMIN** (admin@tradehub.com / admin123)
2. Ir a `/master-data/users` → **Dados Mestres > Utilizadores**
3. Clicar em **"Novo Utilizador"**
4. Preencher os campos:
   - Nome: `Manager Teste` / `Trainer Teste` / etc.
   - Email: conforme tabela acima
   - Password: `Test1234!`
   - Role: selecionar o role adequado
   - Flags: ativar as flags correspondentes (is_trainer, is_tutor, etc.)
5. Guardar

---

## 3. Portal Público (Sem Login)

**URL:** http://localhost:5173

### TC-PUB-01: Landing Page
| Campo | Detalhe |
|---|---|
| **URL** | `/` |
| **Passos** | 1. Aceder à URL. 2. Verificar que a página de boas-vindas carrega. 3. Verificar KPIs visíveis. 4. Verificar cursos em destaque. 5. Verificar planos em destaque. |
| **Resultado Esperado** | Página carrega com estatísticas públicas, cursos e planos em destaque. |
| **Status** | ☐ OK ☐ NOK |

### TC-PUB-02: Portal Tutoria Público
| Campo | Detalhe |
|---|---|
| **URL** | `/portal-tutoria` |
| **Passos** | 1. Aceder à URL. 2. Verificar que a página pública do Portal de Tutoria carrega. |
| **Resultado Esperado** | Landing page do portal de tutoria exibida corretamente. |
| **Status** | ☐ OK ☐ NOK |

### TC-PUB-03: Login
| Campo | Detalhe |
|---|---|
| **URL** | `/login` |
| **Passos** | 1. Aceder à URL. 2. Verificar formulário de login (email + password). 3. Testar com credenciais válidas. 4. Testar com credenciais inválidas. 5. Verificar mensagem de erro para credenciais erradas. |
| **Resultado Esperado** | Login válido → redireciona para dashboard. Inválido → mensagem de erro. |
| **Status** | ☐ OK ☐ NOK |

### TC-PUB-04: Registo
| Campo | Detalhe |
|---|---|
| **URL** | `/register` |
| **Passos** | 1. Aceder à URL. 2. Preencher formulário de registo. 3. Submeter. |
| **Resultado Esperado** | Formulário funciona e regista o utilizador. |
| **Status** | ☐ OK ☐ NOK |

### TC-PUB-05: Recuperação de Password
| Campo | Detalhe |
|---|---|
| **URL** | `/forgot-password` |
| **Passos** | 1. Aceder à URL. 2. Inserir email. 3. Submeter. |
| **Resultado Esperado** | Mensagem de confirmação exibida. |
| **Status** | ☐ OK ☐ NOK |

---

## 4. Portal do Administrador (ADMIN)

**Login:** admin@tradehub.com / admin123

### 4.1 Dashboard

### TC-ADM-01: Dashboard Principal
| Campo | Detalhe |
|---|---|
| **URL** | `/` (após login como ADMIN) |
| **Passos** | 1. Fazer login como ADMIN. 2. Verificar que o dashboard carrega. 3. Verificar estatísticas/KPIs. 4. Verificar gráficos e métricas. |
| **Resultado Esperado** | Dashboard com estatísticas globais da plataforma. |
| **Status** | ☐ OK ☐ NOK |

### 4.2 Gestão de Utilizadores

### TC-ADM-02: Listar Utilizadores
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/users` |
| **Passos** | 1. Ir a Dados Mestres → Utilizadores. 2. Verificar lista de utilizadores. 3. Testar pesquisa/filtros. 4. Testar paginação. |
| **Resultado Esperado** | Lista de todos os utilizadores com paginação funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-03: Criar Utilizador
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/users` |
| **Passos** | 1. Clicar em "Novo Utilizador". 2. Preencher nome, email, password, role. 3. Guardar. 4. Verificar que aparece na lista. |
| **Resultado Esperado** | Utilizador criado e visível na lista. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-04: Editar Utilizador
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/users` |
| **Passos** | 1. Clicar num utilizador existente. 2. Alterar nome ou role. 3. Guardar. 4. Verificar alteração. |
| **Resultado Esperado** | Dados do utilizador atualizados. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-05: Eliminar Utilizador
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/users` |
| **Passos** | 1. Selecionar um utilizador de teste. 2. Clicar em "Eliminar". 3. Confirmar eliminação. |
| **Resultado Esperado** | Utilizador removido da lista. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-06: Validação de Formadores
| Campo | Detalhe |
|---|---|
| **URL** | `/trainer-validation` |
| **Passos** | 1. Ir a Validação de Formadores. 2. Verificar lista de formadores pendentes. 3. Aprovar um formador. 4. Rejeitar outro formador. |
| **Resultado Esperado** | Formadores pendentes listados. Aprovação/Rejeição funciona. |
| **Status** | ☐ OK ☐ NOK |

### 4.3 Dados Mestres

### TC-ADM-07: Bancos
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data` |
| **Passos** | 1. Ir a Dados Mestres → Bancos. 2. Criar novo banco. 3. Editar banco existente. 4. Eliminar banco. |
| **Resultado Esperado** | CRUD completo de bancos funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-08: Produtos
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/products` |
| **Passos** | 1. Ir a Dados Mestres → Produtos. 2. Criar novo produto (associar a banco). 3. Editar produto. 4. Eliminar produto. |
| **Resultado Esperado** | CRUD completo de produtos funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-09: Impactos
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/impacts` |
| **Passos** | 1. Ir a Dados Mestres → Impactos. 2. Criar, editar e eliminar impacto. |
| **Resultado Esperado** | CRUD de impactos funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-10: Origens
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/origins` |
| **Passos** | 1. Ir a Dados Mestres → Origens. 2. Criar, editar e eliminar origem. |
| **Resultado Esperado** | CRUD de origens funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-11: Detetado Por
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/detected-by` |
| **Passos** | 1. Ir a Dados Mestres → Detetado Por. 2. Criar, editar e eliminar. |
| **Resultado Esperado** | CRUD funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-12: Departamentos
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/departments` |
| **Passos** | 1. Ir a Dados Mestres → Departamentos. 2. Criar, editar e eliminar. |
| **Resultado Esperado** | CRUD funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-13: Atividades
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/activities` |
| **Passos** | 1. Ir a Dados Mestres → Atividades. 2. Criar, editar e eliminar. 3. Testar filtros. |
| **Resultado Esperado** | CRUD funcional com filtros. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-14: Tipos de Erro
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/error-types` |
| **Passos** | 1. Ir a Dados Mestres → Tipos de Erro. 2. Criar, editar e eliminar. 3. Testar filtros por tipo e categoria. |
| **Resultado Esperado** | CRUD funcional com filtros. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-15: Categorias (Tutoria)
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/categories` |
| **Passos** | 1. Ir a Dados Mestres → Categorias. 2. Criar, editar e eliminar. |
| **Resultado Esperado** | CRUD funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-16: FAQs (Chat)
| Campo | Detalhe |
|---|---|
| **URL** | `/master-data/faqs` |
| **Passos** | 1. Ir a Dados Mestres → FAQs. 2. Criar FAQ com pergunta/resposta. 3. Editar FAQ. 4. Eliminar FAQ. |
| **Resultado Esperado** | CRUD de FAQs funcional. |
| **Status** | ☐ OK ☐ NOK |

### 4.4 Cursos

### TC-ADM-17: Listar Cursos
| Campo | Detalhe |
|---|---|
| **URL** | `/courses` |
| **Passos** | 1. Ir a Cursos. 2. Verificar lista de cursos. 3. Testar filtros/pesquisa. |
| **Resultado Esperado** | Lista de cursos com filtros. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-18: Criar Curso
| Campo | Detalhe |
|---|---|
| **URL** | `/course/new` |
| **Passos** | 1. Clicar "Novo Curso". 2. Preencher título, descrição, nível. 3. Guardar. |
| **Resultado Esperado** | Curso criado e visível na lista. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-19: Detalhe do Curso
| Campo | Detalhe |
|---|---|
| **URL** | `/courses/{courseId}` |
| **Passos** | 1. Clicar num curso. 2. Verificar detalhes: título, descrição, lições, desafios. |
| **Resultado Esperado** | Página de detalhe com todas as informações. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-20: Criar Lição no Curso
| Campo | Detalhe |
|---|---|
| **URL** | `/courses/{courseId}/lessons/new` |
| **Passos** | 1. Dentro de um curso, clicar "Nova Lição". 2. Preencher título e conteúdo. 3. Guardar. |
| **Resultado Esperado** | Lição criada e visível no curso. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-21: Criar Desafio no Curso
| Campo | Detalhe |
|---|---|
| **URL** | `/courses/{courseId}/challenges/new` |
| **Passos** | 1. Dentro de um curso, clicar "Novo Desafio". 2. Preencher dados (título, tipo, etc.). 3. Guardar. |
| **Resultado Esperado** | Desafio criado e visível no curso. |
| **Status** | ☐ OK ☐ NOK |

### 4.5 Planos de Formação

### TC-ADM-22: Listar Planos
| Campo | Detalhe |
|---|---|
| **URL** | `/training-plans` |
| **Passos** | 1. Ir a Planos de Formação. 2. Verificar lista de planos. |
| **Resultado Esperado** | Lista de planos de formação. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-23: Criar Plano
| Campo | Detalhe |
|---|---|
| **URL** | `/training-plan/new` |
| **Passos** | 1. Clicar "Novo Plano". 2. Preencher nome, descrição, tipo de plano. 3. Guardar. |
| **Resultado Esperado** | Plano criado. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-24: Gerir Plano (Cursos, Alunos, Formadores)
| Campo | Detalhe |
|---|---|
| **URL** | `/training-plan/{id}` (admin) |
| **Passos** | 1. Abrir plano existente. 2. Adicionar curso ao plano. 3. Atribuir formando ao plano. 4. Adicionar formador ao plano. 5. Verificar estado de conclusão. |
| **Resultado Esperado** | Todas as operações de gestão do plano funcionam. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-25: Finalizar Plano de Formação
| Campo | Detalhe |
|---|---|
| **URL** | `/training-plan/{id}` |
| **Passos** | 1. Abrir plano com cursos concluídos. 2. Clicar "Finalizar Plano". 3. Confirmar. |
| **Resultado Esperado** | Plano marcado como finalizado. |
| **Status** | ☐ OK ☐ NOK |

### 4.6 Equipas

### TC-ADM-26: Gerir Equipas
| Campo | Detalhe |
|---|---|
| **URL** | `/teams` |
| **Passos** | 1. Ir a Equipas. 2. Criar nova equipa. 3. Adicionar membros. 4. Adicionar serviços/produtos. 5. Remover membro. 6. Editar equipa. 7. Eliminar equipa. |
| **Resultado Esperado** | CRUD completo de equipas com membros e serviços. |
| **Status** | ☐ OK ☐ NOK |

### 4.7 Relatórios Admin

### TC-ADM-27: Relatórios Base
| Campo | Detalhe |
|---|---|
| **URL** | `/reports` |
| **Passos** | 1. Ir a Relatórios. 2. Ver estatísticas gerais. 3. Ver relatório de cursos. 4. Ver relatório de formadores. 5. Ver relatório de planos de formação. 6. Ver insights. |
| **Resultado Esperado** | Todos os relatórios carregam com dados. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-28: Relatórios Avançados
| Campo | Detalhe |
|---|---|
| **URL** | `/advanced-reports` |
| **Passos** | 1. Ir a Relatórios Avançados. 2. Ver dashboard summary. 3. Ver desempenho de alunos. 4. Ver produtividade de formadores. 5. Ver analytics de cursos. 6. Ver tendências de certificação. 7. Ver analytics MPU. |
| **Resultado Esperado** | Relatórios avançados com gráficos e métricas. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-29: Matriz de Conhecimento
| Campo | Detalhe |
|---|---|
| **URL** | `/knowledge-matrix` |
| **Passos** | 1. Ir a Matriz de Conhecimento. 2. Verificar dados da matriz. |
| **Resultado Esperado** | Matriz carrega com dados dos formandos. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-30: Avaliações (Ratings)
| Campo | Detalhe |
|---|---|
| **URL** | `/ratings` |
| **Passos** | 1. Ir a Avaliações. 2. Ver todas as avaliações. 3. Ver resumo geral. 4. Ver dashboard de avaliações. 5. Ver avaliações por item. |
| **Resultado Esperado** | Dashboard de avaliações funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-ADM-31: Revisão de Desafios Pendentes
| Campo | Detalhe |
|---|---|
| **URL** | `/pending-reviews` |
| **Passos** | 1. Ir a Revisões Pendentes. 2. Verificar lista de submissões para revisão. |
| **Resultado Esperado** | Lista de desafios aguardando revisão. |
| **Status** | ☐ OK ☐ NOK |

---

## 5. Portal do Gestor (MANAGER)

**Login:** manager_test@tradehub.com / Test1234!

### TC-MGR-01: Dashboard Manager
| Campo | Detalhe |
|---|---|
| **URL** | `/` (após login como MANAGER) |
| **Passos** | 1. Login como Manager. 2. Verificar dashboard. 3. Verificar menu lateral (sidebar). |
| **Resultado Esperado** | Dashboard com visão de gestão. Menu com opções permitidas. |
| **Status** | ☐ OK ☐ NOK |

### TC-MGR-02: Listar Utilizadores
| Campo | Detalhe |
|---|---|
| **URL** | N/A (via menu) |
| **Passos** | 1. Verificar que o Manager consegue ver lista de utilizadores. |
| **Resultado Esperado** | Lista de utilizadores visível. |
| **Status** | ☐ OK ☐ NOK |

### TC-MGR-03: Cursos & Planos (Mesmas rotas do Admin)
| Campo | Detalhe |
|---|---|
| **URL** | `/courses`, `/training-plans` |
| **Passos** | 1. Navegar por cursos e planos. 2. Verificar acesso de leitura/gestão. |
| **Resultado Esperado** | Manager tem acesso similar ao Admin para formações. |
| **Status** | ☐ OK ☐ NOK |

### TC-MGR-04: Relatórios e Avançados
| Campo | Detalhe |
|---|---|
| **URL** | `/reports`, `/advanced-reports` |
| **Passos** | 1. Navegar pelos relatórios. |
| **Resultado Esperado** | Relatórios acessíveis pelo Manager. |
| **Status** | ☐ OK ☐ NOK |

---

## 6. Portal do Formador (TRAINER)

**Login:** trainer_test@tradehub.com / Test1234!

### TC-TRN-01: Dashboard Formador
| Campo | Detalhe |
|---|---|
| **URL** | `/` (após login como TRAINER) |
| **Passos** | 1. Login como Trainer. 2. Verificar dashboard com estatísticas do formador. 3. Verificar menu lateral. |
| **Resultado Esperado** | Dashboard com stats do formador: cursos, alunos, desafios. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-02: Meus Cursos
| Campo | Detalhe |
|---|---|
| **URL** | `/courses` |
| **Passos** | 1. Ir a Cursos. 2. Verificar lista de cursos do formador. 3. Criar novo curso (título, descrição, nível). 4. Editar curso existente. 5. Eliminar curso. |
| **Resultado Esperado** | CRUD de cursos funcional para o formador. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-03: Criar Lição
| Campo | Detalhe |
|---|---|
| **URL** | `/courses/{courseId}/lessons/new` |
| **Passos** | 1. Dentro de um curso, clicar "Nova Lição". 2. Preencher título, conteúdo, duração. 3. Guardar. |
| **Resultado Esperado** | Lição criada no curso. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-04: Gerir Lições (Release, Start, Pause, Finish, Approve)
| Campo | Detalhe |
|---|---|
| **URL** | `/lessons/{lessonId}/manage` |
| **Passos** | 1. Abrir gestão de lição. 2. Libertar lição (Release). 3. Iniciar lição (Start). 4. Pausar lição (Pause). 5. Retomar lição (Resume). 6. Finalizar lição (Finish). 7. Aprovar lição (Approve). |
| **Resultado Esperado** | Todos os estados da lição transitam corretamente. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-05: Detalhes da Lição
| Campo | Detalhe |
|---|---|
| **URL** | `/courses/{courseId}/lessons/{lessonId}` |
| **Passos** | 1. Abrir detalhe de uma lição. 2. Verificar timer, progresso, estado. |
| **Resultado Esperado** | Detalhes da lição com timer e progresso. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-06: Criar Desafio (Summary)
| Campo | Detalhe |
|---|---|
| **URL** | Dentro do detalhe de um curso |
| **Passos** | 1. Criar desafio tipo Summary. 2. Definir título, descrição, critérios. 3. Guardar. 4. Verificar que aparece no curso. |
| **Resultado Esperado** | Desafio SUMMARY criado. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-07: Criar Desafio (Complete — linha a linha)
| Campo | Detalhe |
|---|---|
| **URL** | Dentro do detalhe de um curso |
| **Passos** | 1. Criar desafio tipo Complete (linha a linha). 2. Definir operações/atividades. 3. Guardar. |
| **Resultado Esperado** | Desafio COMPLETE criado. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-08: Libertar Desafio para Alunos
| Campo | Detalhe |
|---|---|
| **URL** | `/courses/{courseId}/challenges/{challengeId}` |
| **Passos** | 1. Abrir detalhe do desafio. 2. Libertar para todos os alunos elegíveis. 3. Libertar para um aluno específico. |
| **Resultado Esperado** | Desafio libertado para os alunos indicados. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-09: Executar Desafio Summary (pelo Formador)
| Campo | Detalhe |
|---|---|
| **URL** | `/challenges/{challengeId}/execute/summary` |
| **Passos** | 1. Iniciar execução de desafio summary. 2. Preencher resumo. 3. Submeter. |
| **Resultado Esperado** | Submissão registada. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-10: Revisão de Submissões
| Campo | Detalhe |
|---|---|
| **URL** | `/pending-reviews`, `/submissions/{submissionId}/review` |
| **Passos** | 1. Ver lista de revisões pendentes. 2. Abrir uma submissão. 3. Revisar e finalizar. |
| **Resultado Esperado** | Fluxo completo de revisão funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-11: Planos de Formação do Formador
| Campo | Detalhe |
|---|---|
| **URL** | `/training-plans` |
| **Passos** | 1. Ver planos atribuídos ao formador. 2. Criar novo plano. 3. Verificar detalhes. |
| **Resultado Esperado** | Planos do formador listados e geridos. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-12: Meus Alunos
| Campo | Detalhe |
|---|---|
| **URL** | `/students` |
| **Passos** | 1. Ver lista de alunos atribuídos. |
| **Resultado Esperado** | Lista de formandos do formador. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-13: Relatórios do Formador
| Campo | Detalhe |
|---|---|
| **URL** | `/reports` |
| **Passos** | 1. Ver overview. 2. Ver relatório de planos. 3. Ver relatório de alunos. 4. Ver relatório de lições. 5. Ver relatório de desafios. |
| **Resultado Esperado** | Todos os relatórios do formador carregam. |
| **Status** | ☐ OK ☐ NOK |

### TC-TRN-14: Finalização de Curso
| Campo | Detalhe |
|---|---|
| **URL** | Dentro do detalhe do plano |
| **Passos** | 1. Verificar estado de conclusão de um curso. 2. Finalizar curso. |
| **Resultado Esperado** | Curso marque como finalizado. |
| **Status** | ☐ OK ☐ NOK |

---

## 7. Portal do Formando (STUDENT)

**Login:** student_test@tradehub.com / Test1234!

### TC-STD-01: Dashboard do Formando
| Campo | Detalhe |
|---|---|
| **URL** | `/` (após login como STUDENT) |
| **Passos** | 1. Login como Student. 2. Verificar dashboard com estatísticas pessoais. |
| **Resultado Esperado** | Dashboard com cursos inscritos, progresso, certificados. |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-02: Meus Cursos
| Campo | Detalhe |
|---|---|
| **URL** | `/my-courses` ou `/courses` |
| **Passos** | 1. Ver lista de cursos disponíveis. 2. Inscrever-se num curso. 3. Verificar curso inscrito. 4. Tentar inscrição duplicada (deve dar erro). |
| **Resultado Esperado** | Inscrição funcional. Duplicada é rejeitada. |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-03: Detalhe do Curso Inscrito
| Campo | Detalhe |
|---|---|
| **URL** | `/courses/{courseId}` |
| **Passos** | 1. Abrir um curso onde está inscrito. 2. Ver lições e desafios disponíveis. |
| **Resultado Esperado** | Detalhe do curso com conteúdo. |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-04: Minhas Lições
| Campo | Detalhe |
|---|---|
| **URL** | `/my-lessons` |
| **Passos** | 1. Ver lista de lições atribuídas. 2. Confirmar conclusão de uma lição. |
| **Resultado Esperado** | Lições listadas com opção de confirmar. |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-05: Meus Desafios
| Campo | Detalhe |
|---|---|
| **URL** | `/my-challenges` |
| **Passos** | 1. Ver desafios libertados para o aluno. 2. Ver submissões anteriores. |
| **Resultado Esperado** | Lista de desafios disponíveis e submissões. |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-06: Executar Desafio Complete (Linha a Linha)
| Campo | Detalhe |
|---|---|
| **URL** | `/challenges/{challengeId}/execute/complete` |
| **Passos** | 1. Abrir desafio Complete. 2. Iniciar execução. 3. Iniciar operação. 4. Finalizar operação. 5. Submeter para revisão. |
| **Resultado Esperado** | Fluxo completo de execução funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-07: Meus Planos
| Campo | Detalhe |
|---|---|
| **URL** | `/my-plans` |
| **Passos** | 1. Ver planos de formação atribuídos. 2. Ver estado de conclusão. |
| **Resultado Esperado** | Planos listados com progresso. |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-08: Certificados
| Campo | Detalhe |
|---|---|
| **URL** | `/certificates` |
| **Passos** | 1. Ver lista de certificados. 2. Verificar opção de download/PDF. |
| **Resultado Esperado** | Certificados listados (se existirem planos concluídos). |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-09: Relatórios do Formando
| Campo | Detalhe |
|---|---|
| **URL** | `/reports` |
| **Passos** | 1. Ver overview pessoal. 2. Ver relatório de cursos. 3. Ver relatório de lições. 4. Ver conquistas (achievements). |
| **Resultado Esperado** | Relatórios pessoais do formando. |
| **Status** | ☐ OK ☐ NOK |

### TC-STD-10: Submeter Avaliação (Rating)
| Campo | Detalhe |
|---|---|
| **URL** | Via modal/botão dentro de um curso ou plano |
| **Passos** | 1. Após concluir curso/plano, submeter avaliação. 2. Dar nota e comentário. |
| **Resultado Esperado** | Avaliação registada. |
| **Status** | ☐ OK ☐ NOK |

---

## 8. Portal de Tutoria (Todos os Roles)

**URL Base:** `/tutoria`

> O Portal de Tutoria é acessível a todos os roles autenticados, mas as funcionalidades variam conforme o role.

### 8.1 Todos os Roles

### TC-TUT-01: Dashboard de Tutoria
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria` |
| **Login** | Qualquer utilizador autenticado |
| **Passos** | 1. Aceder ao Portal de Tutoria. 2. Verificar dashboard com métricas. |
| **Resultado Esperado** | Dashboard carrega com dados relevantes ao role. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-02: Notificações
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/notifications` |
| **Login** | Qualquer utilizador autenticado |
| **Passos** | 1. Ver lista de notificações. 2. Marcar uma como lida. 3. Marcar todas como lidas. |
| **Resultado Esperado** | Notificações listadas e marcação funcional. |
| **Status** | ☐ OK ☐ NOK |

### 8.2 ADMIN / MANAGER — Erros de Tutoria

### TC-TUT-03: Registar Erro de Tutoria
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/new` |
| **Login** | ADMIN ou MANAGER |
| **Passos** | 1. Clicar "Novo Erro". 2. Preencher: produto, categoria, descrição, colaborador. 3. Guardar. |
| **Resultado Esperado** | Erro registado e visível na lista. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-04: Listar Erros
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors` |
| **Login** | ADMIN |
| **Passos** | 1. Ver lista de todos os erros. 2. Filtrar por estado. |
| **Resultado Esperado** | Lista de erros com filtros. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-05: Detalhe do Erro
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` |
| **Login** | ADMIN |
| **Passos** | 1. Abrir detalhe de um erro. 2. Ver informações completas. 3. Adicionar comentário. |
| **Resultado Esperado** | Detalhe completo com cronologia e comentários. |
| **Status** | ☐ OK ☐ NOK |

### 8.3 MANAGER — Análise

### TC-TUT-06: Guardar Análise
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` (secção de análise) |
| **Login** | MANAGER |
| **Passos** | 1. Abrir erro. 2. Preencher análise. 3. Guardar como rascunho. 4. Submeter análise. |
| **Resultado Esperado** | Análise guardada e submetida. Estado do erro avança. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-07: Confirmar Solução
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` |
| **Login** | MANAGER |
| **Passos** | 1. Abrir erro com planos aprovados. 2. Confirmar solução. |
| **Resultado Esperado** | Erro transita para estado "Solução Confirmada". |
| **Status** | ☐ OK ☐ NOK |

### 8.4 ADMIN — Aprovação Chefe

### TC-TUT-08: Aprovar como Chefe
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` |
| **Login** | ADMIN |
| **Passos** | 1. Abrir erro com análise submetida. 2. Aprovar como chefe. |
| **Resultado Esperado** | Erro aprovado pelo chefe. |
| **Status** | ☐ OK ☐ NOK |

### 8.5 TUTOR — Revisão e Planos

### TC-TUT-09: Retornar Análise
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` |
| **Login** | TUTOR |
| **Passos** | 1. Abrir erro com análise submetida. 2. Retornar análise com observações. |
| **Resultado Esperado** | Análise retornada ao manager. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-10: Aprovar Planos de Ação
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` |
| **Login** | TUTOR |
| **Passos** | 1. Abrir erro com planos pendentes. 2. Aprovar planos. |
| **Resultado Esperado** | Planos aprovados. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-11: Resolver Erro
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` |
| **Login** | TUTOR |
| **Passos** | 1. Abrir erro com solução confirmada. 2. Marcar como resolvido. |
| **Resultado Esperado** | Erro fechado/resolvido. |
| **Status** | ☐ OK ☐ NOK |

### 8.6 Planos de Ação (Tutoria)

### TC-TUT-12: Criar Plano de Ação
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{errorId}/plans/new` ou `/tutoria/plans/new` |
| **Login** | ADMIN ou TUTOR |
| **Passos** | 1. Criar novo plano de ação. 2. Definir título, tipo, responsável. 3. Guardar. |
| **Resultado Esperado** | Plano de ação criado. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-13: Fluxo Completo do Plano
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/plans/{planId}` |
| **Login** | Vários roles |
| **Passos** | 1. Criar plano (ADMIN/TUTOR). 2. Adicionar itens ao plano. 3. Submeter plano (ADMIN). 4. Aprovar plano (ADMIN). 5. Iniciar plano (ADMIN). 6. Completar itens. 7. Completar plano. |
| **Resultado Esperado** | Todo o ciclo de vida do plano funciona. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-14: Comentários no Plano
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/plans/{planId}` (secção comentários) |
| **Login** | ADMIN |
| **Passos** | 1. Adicionar comentário ao plano. 2. Ver lista de comentários. |
| **Resultado Esperado** | Comentários adicionados e listados. |
| **Status** | ☐ OK ☐ NOK |

### 8.7 Fichas de Aprendizagem

### TC-TUT-15: Criar Ficha de Aprendizagem
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/learning-sheets` |
| **Login** | TUTOR |
| **Passos** | 1. Criar nova ficha de aprendizagem. 2. Atribuir a um formando. 3. Guardar. |
| **Resultado Esperado** | Ficha criada e visível na lista. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-16: Submeter Ficha (Formando)
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/my-learning-sheets` |
| **Login** | STUDENT |
| **Passos** | 1. Ver fichas atribuídas. 2. Submeter ficha concluída. |
| **Resultado Esperado** | Ficha submetida para revisão. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-17: Revisar Ficha (Admin)
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/learning-sheets` |
| **Login** | ADMIN |
| **Passos** | 1. Ver fichas submetidas. 2. Revisar e avaliar. |
| **Resultado Esperado** | Ficha revisada com resultado. |
| **Status** | ☐ OK ☐ NOK |

### 8.8 Erros Internos

### TC-TUT-18: Registar Erro Interno
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/internal-errors/new` |
| **Login** | LIBERADOR ou TUTOR |
| **Passos** | 1. Registar novo erro interno. 2. Preencher produto, banco, impacto, etc. 3. Guardar. |
| **Resultado Esperado** | Erro interno registado. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-19: Gerir Erros Internos
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/internal-errors` |
| **Login** | ADMIN |
| **Passos** | 1. Listar erros internos. 2. Ver detalhe. 3. Atualizar estado. 4. Criar plano de ação. 5. Criar ficha de aprendizagem. |
| **Resultado Esperado** | CRUD e gestão de erros internos funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-20: Gestão de Censos
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/censos` |
| **Login** | TUTOR |
| **Passos** | 1. Criar novo censo. 2. Editar censo. 3. Eliminar censo (ADMIN). |
| **Resultado Esperado** | CRUD de censos funcional. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-21: Minhas Fichas de Aprendizagem (Erros Internos)
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/my-learning-sheets` |
| **Login** | STUDENT |
| **Passos** | 1. Ver fichas de erros internos. 2. Marcar como lida. |
| **Resultado Esperado** | Fichas visíveis e marcação funcional. |
| **Status** | ☐ OK ☐ NOK |

### 8.9 Cancelar / Desativar Erro

### TC-TUT-22: Cancelar Erro
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` |
| **Login** | ADMIN ou MANAGER |
| **Passos** | 1. Abrir erro. 2. Cancelar com motivo. 3. Verificar estado. |
| **Resultado Esperado** | Erro cancelado com razão registada. |
| **Status** | ☐ OK ☐ NOK |

### TC-TUT-23: Desativar Erro
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/errors/{id}` |
| **Login** | ADMIN |
| **Passos** | 1. Abrir erro. 2. Desativar. 3. Verificar que MANAGER não consegue desativar (403). |
| **Resultado Esperado** | Apenas ADMIN pode desativar. |
| **Status** | ☐ OK ☐ NOK |

### 8.10 Categorias de Tutoria

### TC-TUT-24: Gerir Categorias
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/categories` ou `/master-data/categories` |
| **Login** | ADMIN |
| **Passos** | 1. Criar categoria. 2. Editar categoria. 3. Eliminar categoria. |
| **Resultado Esperado** | CRUD de categorias funcional. |
| **Status** | ☐ OK ☐ NOK |

---

## 9. Portal de Relatórios (Todos os Roles)

**URL Base:** `/relatorios`

### TC-REL-01: Overview Geral
| Campo | Detalhe |
|---|---|
| **URL** | `/relatorios` |
| **Login** | ADMIN ou STUDENT |
| **Passos** | 1. Aceder ao portal de relatórios. 2. Ver overview geral. |
| **Resultado Esperado** | Overview carrega para todos os roles autenticados. |
| **Status** | ☐ OK ☐ NOK |

### TC-REL-02: Formações
| Campo | Detalhe |
|---|---|
| **URL** | `/relatorios/formacoes` |
| **Login** | ADMIN |
| **Passos** | 1. Ver relatório de formações. |
| **Resultado Esperado** | Relatório com dados de formações. |
| **Status** | ☐ OK ☐ NOK |

### TC-REL-03: Tutoria
| Campo | Detalhe |
|---|---|
| **URL** | `/relatorios/tutoria` |
| **Login** | ADMIN |
| **Passos** | 1. Ver relatório de tutoria. |
| **Resultado Esperado** | Relatório com dados de tutoria. |
| **Status** | ☐ OK ☐ NOK |

### TC-REL-04: Equipas
| Campo | Detalhe |
|---|---|
| **URL** | `/relatorios/teams` |
| **Login** | ADMIN |
| **Passos** | 1. Ver relatório de equipas. 2. Verificar que STUDENT recebe 403. |
| **Resultado Esperado** | Relatório visível apenas para ADMIN/MANAGER. |
| **Status** | ☐ OK ☐ NOK |

### TC-REL-05: Membros
| Campo | Detalhe |
|---|---|
| **URL** | `/relatorios/members` |
| **Login** | ADMIN |
| **Passos** | 1. Ver relatório de membros. |
| **Resultado Esperado** | Relatório de membros. |
| **Status** | ☐ OK ☐ NOK |

### TC-REL-06: Incidentes
| Campo | Detalhe |
|---|---|
| **URL** | `/relatorios/incidents` |
| **Login** | ADMIN |
| **Passos** | 1. Ver relatório de incidentes. 2. Testar filtros. |
| **Resultado Esperado** | Relatório de incidentes com filtros funcionais. |
| **Status** | ☐ OK ☐ NOK |

---

## 10. Portal de Chamados (Todos os Roles)

**URL Base:** `/chamados`

### TC-CHM-01: Kanban de Chamados
| Campo | Detalhe |
|---|---|
| **URL** | `/chamados` |
| **Login** | Qualquer utilizador autenticado |
| **Passos** | 1. Aceder ao portal de chamados. 2. Verificar vista Kanban. |
| **Resultado Esperado** | Board Kanban com colunas por estado. |
| **Status** | ☐ OK ☐ NOK |

### TC-CHM-02: Criar Chamado
| Campo | Detalhe |
|---|---|
| **URL** | `/chamados` |
| **Login** | STUDENT |
| **Passos** | 1. Clicar "Novo Chamado". 2. Preencher título, descrição, prioridade. 3. Guardar. |
| **Resultado Esperado** | Chamado criado e visível no board. |
| **Status** | ☐ OK ☐ NOK |

### TC-CHM-03: Atualizar Chamado (Admin)
| Campo | Detalhe |
|---|---|
| **URL** | `/chamados` |
| **Login** | ADMIN |
| **Passos** | 1. Abrir chamado. 2. Alterar estado. 3. Guardar. |
| **Resultado Esperado** | Estado atualizado no board. |
| **Status** | ☐ OK ☐ NOK |

### TC-CHM-04: Comentários no Chamado
| Campo | Detalhe |
|---|---|
| **URL** | `/chamados` (card do chamado) |
| **Login** | STUDENT e ADMIN |
| **Passos** | 1. Abrir chamado. 2. Student adiciona comentário. 3. Admin adiciona comentário. 4. Verificar cronologia. |
| **Resultado Esperado** | Comentários adicionados por ambos os roles. |
| **Status** | ☐ OK ☐ NOK |

### TC-CHM-05: Eliminar Chamado (Admin)
| Campo | Detalhe |
|---|---|
| **URL** | `/chamados` |
| **Login** | ADMIN |
| **Passos** | 1. Selecionar chamado. 2. Eliminar. 3. Confirmar que desapareceu do board. |
| **Resultado Esperado** | Chamado removido. |
| **Status** | ☐ OK ☐ NOK |

### TC-CHM-06: Filtros
| Campo | Detalhe |
|---|---|
| **URL** | `/chamados` |
| **Login** | ADMIN |
| **Passos** | 1. Filtrar por estado. 2. Filtrar por prioridade. |
| **Resultado Esperado** | Filtros funcionais. |
| **Status** | ☐ OK ☐ NOK |

---

## 11. Chat Assistente

### TC-CHAT-01: Enviar Mensagem
| Campo | Detalhe |
|---|---|
| **URL** | Widget de chat (canto inferior) |
| **Login** | STUDENT |
| **Passos** | 1. Abrir chat. 2. Enviar mensagem. 3. Verificar resposta do assistente. |
| **Resultado Esperado** | Chat funciona e responde. |
| **Status** | ☐ OK ☐ NOK |

### TC-CHAT-02: Chat em Diferentes Idiomas
| Campo | Detalhe |
|---|---|
| **URL** | Widget de chat |
| **Login** | STUDENT |
| **Passos** | 1. Enviar mensagem em Português. 2. Enviar mensagem com pedido de ajuda. 3. Enviar mensagem em Espanhol ("ayuda"). |
| **Resultado Esperado** | Chat responde em ambos os idiomas. |
| **Status** | ☐ OK ☐ NOK |

### TC-CHAT-03: Gerir FAQs (Admin)
| Campo | Detalhe |
|---|---|
| **URL** | `/tutoria/chat-faqs` ou `/master-data/faqs` |
| **Login** | ADMIN |
| **Passos** | 1. Criar FAQ. 2. Editar FAQ. 3. Eliminar FAQ. |
| **Resultado Esperado** | CRUD de FAQs funcional. |
| **Status** | ☐ OK ☐ NOK |

---

## 12. Testes de Controlo de Acesso (RBAC)

> Estes testes verificam que utilizadores sem permissão **NÃO conseguem** aceder a funcionalidades restritas. Devem ser executados alternando entre os diferentes utilizadores.

### TC-RBAC-01: Student Não Acede Admin
| Campo | Detalhe |
|---|---|
| **Login** | STUDENT |
| **Passos** | 1. Login como Student. 2. Tentar aceder manualmente a `/master-data/users` (URL direto). 3. Tentar aceder a `/advanced-reports`. 4. Tentar aceder a `/knowledge-matrix`. 5. Tentar aceder a `/ratings` (admin view). |
| **Resultado Esperado** | Acesso negado ou redirecionado. Sem dados sensíveis expostos. |
| **Status** | ☐ OK ☐ NOK |

### TC-RBAC-02: Student Não Cria Cursos
| Campo | Detalhe |
|---|---|
| **Login** | STUDENT |
| **Passos** | 1. Login como Student. 2. Verificar que não há opção de criar curso. 3. Tentar aceder `/course/new` diretamente. |
| **Resultado Esperado** | Sem acesso à criação de cursos. |
| **Status** | ☐ OK ☐ NOK |

### TC-RBAC-03: Trainer Não Submete Rating
| Campo | Detalhe |
|---|---|
| **Login** | TRAINER |
| **Passos** | 1. Login como Trainer. 2. Tentar submeter uma avaliação (rating). |
| **Resultado Esperado** | Ação rejeitada (403). |
| **Status** | ☐ OK ☐ NOK |

### TC-RBAC-04: Student Não Atualiza Chamado de Outro
| Campo | Detalhe |
|---|---|
| **Login** | STUDENT |
| **Passos** | 1. Login como Student. 2. Tentar atualizar estado de um chamado (função admin). |
| **Resultado Esperado** | Ação rejeitada. |
| **Status** | ☐ OK ☐ NOK |

### TC-RBAC-05: Manager Não Desativa Erro
| Campo | Detalhe |
|---|---|
| **Login** | MANAGER |
| **Passos** | 1. Login como Manager. 2. Abrir erro de tutoria. 3. Tentar desativar. |
| **Resultado Esperado** | Ação rejeitada (apenas ADMIN pode desativar). |
| **Status** | ☐ OK ☐ NOK |

### TC-RBAC-06: Acesso Sem Login
| Campo | Detalhe |
|---|---|
| **Login** | Nenhum |
| **Passos** | 1. Sem fazer login. 2. Tentar aceder `/tutoria`. 3. Tentar aceder `/chamados`. 4. Tentar aceder `/relatorios`. |
| **Resultado Esperado** | Redirecionado para login. |
| **Status** | ☐ OK ☐ NOK |

---

## 13. Checklist de Regressão

Use esta checklist para testes rápidos de regressão após cada deploy:

### Funcionalidades Críticas

| # | Funcionalidade | Role | URL | Status |
|---|---|---|---|---|
| 1 | Login funciona | — | `/login` | ☐ |
| 2 | Dashboard Admin carrega | ADMIN | `/` | ☐ |
| 3 | Dashboard Student carrega | STUDENT | `/` | ☐ |
| 4 | Dashboard Trainer carrega | TRAINER | `/` | ☐ |
| 5 | Criar Utilizador | ADMIN | `/master-data/users` | ☐ |
| 6 | Criar Curso | ADMIN/TRAINER | `/course/new` | ☐ |
| 7 | Criar Plano de Formação | ADMIN | `/training-plan/new` | ☐ |
| 8 | Inscrição em Curso | STUDENT | `/courses` | ☐ |
| 9 | Registar Erro Tutoria | ADMIN | `/tutoria/errors/new` | ☐ |
| 10 | Portal Chamados | ALL | `/chamados` | ☐ |
| 11 | Portal Relatórios | ADMIN | `/relatorios` | ☐ |
| 12 | Chat funciona | STUDENT | Widget chat | ☐ |
| 13 | Sidebar navega corretamente | ALL | — | ☐ |
| 14 | Logout funciona | ALL | — | ☐ |
| 15 | i18n (PT/EN/ES) | ALL | Seletor idioma | ☐ |

### Fluxos End-to-End

| # | Fluxo | Roles Envolvidos | Status |
|---|---|---|---|
| 1 | Admin cria curso → Trainer cria lição → Student inscreve e confirma lição | ADMIN, TRAINER, STUDENT | ☐ |
| 2 | Trainer cria desafio → Liberta para student → Student executa → Trainer revisa | TRAINER, STUDENT | ☐ |
| 3 | Admin cria plano → Adiciona curso → Atribui student → Finaliza | ADMIN, STUDENT | ☐ |
| 4 | Manager regista erro → Submete análise → Admin aprova → Tutor aprova planos → Manager confirma → Tutor resolve | MANAGER, ADMIN, TUTOR | ☐ |
| 5 | Student cria chamado → Admin responde → Student comenta → Admin fecha | STUDENT, ADMIN | ☐ |

---

## Notas para a Equipa QA

1. **Ordem dos testes:** Executar primeiro os testes do ADMIN para criar dados base, depois TRAINER para criar conteúdo, depois STUDENT para consumir conteúdo.
2. **Screenshots:** Tirar screenshot de cada ecrã testado para evidência.
3. **Bugs encontrados:** Registar no template: `[TC-ID] Descrição do bug | Passos para reproduzir | Resultado esperado | Resultado obtido | Screenshot`
4. **Ambiente:** Confirmar que backend e frontend estão a correr antes de iniciar os testes.
5. **Base de dados:** Os testes automatizados (`python -m pytest tests/test_all_portals.py -v`) podem ser executados antes dos testes manuais para garantir que a API está funcional.
6. **Idiomas:** Testar cada portal em pelo menos 2 idiomas (PT e EN) usando o seletor de idioma.
