# Relatório Detalhado por Role — PortalTradeHub

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Data:** 2026-03-19
**Total de Endpoints:** ~296
**Total de Roles:** 5 roles + 5 flags especiais

---

## Mapa de Roles e Permissões

| Role | Flag | Acesso | Descrição |
|------|------|--------|-----------|
| **ADMIN** | — | Total | Administrador do sistema |
| **MANAGER** | is_team_lead | Gestão + Relatórios | Gestor / Chefe de equipa |
| **TRAINER** | is_trainer | Formações + Cursos | Formador |
| **TRAINEE** | — | Aluno básico | Estudante |
| **TRAINEE** | is_tutor | Tutoria | Tutor (orienta tutorados) |
| **TRAINEE** | is_liberador | Erros Internos | Liberador (regista erros internos) |
| **TRAINEE** | is_referente | Tutoria (visualização) | Referente do chefe |
| **GESTOR** | — | Equivalente a ADMIN | Legado (mesmo acesso que ADMIN) |

---

## 1. ADMIN (admin@tradehub.com)

### 1.1 Autenticação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Login | POST | `/api/auth/login` | JWT token + dados do user |
| 2 | Ver perfil | GET | `/api/auth/me` | Dados completos do admin |

### 1.2 Gestão de Utilizadores
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar todos os utilizadores | GET | `/api/admin/users?page=1&page_size=50` | Lista paginada com todos os users |
| 2 | Criar utilizador | POST | `/api/admin/users` | Novo user com role, email, password |
| 3 | Ver detalhes de um utilizador | GET | `/api/admin/users/{user_id}` | Dados completos incluindo flags |
| 4 | Atualizar utilizador | PUT | `/api/admin/users/{user_id}` | Alterar nome, role, flags, is_active |
| 5 | Eliminar utilizador | DELETE | `/api/admin/users/{user_id}` | Remoção completa |
| 6 | Listar formadores pendentes | GET | `/api/admin/pending-trainers` | Trainers com is_pending=True |
| 7 | Aprovar formador | POST | `/api/admin/validate-trainer/{user_id}` | is_pending → False, validated_at |
| 8 | Rejeitar formador | POST | `/api/admin/reject-trainer/{user_id}` | Remoção ou desativação |
| 9 | Listar alunos | GET | `/api/admin/students` | Todos os TRAINEE |
| 10 | Listar formadores | GET | `/api/admin/trainers` | Todos os TRAINER ativos |

### 1.3 Bancos (Master Data)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar bancos | GET | `/api/admin/banks` | Lista completa |
| 2 | Criar banco | POST | `/api/admin/banks` | `{code, name, country}` |
| 3 | Atualizar banco | PUT | `/api/admin/banks/{bank_id}` | Alterar nome, país |
| 4 | Eliminar banco | DELETE | `/api/admin/banks/{bank_id}` | Remoção |

### 1.4 Produtos/Serviços (Master Data)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar produtos | GET | `/api/admin/products` | Lista completa |
| 2 | Criar produto | POST | `/api/admin/products` | `{code, name, description}` |
| 3 | Atualizar produto | PUT | `/api/admin/products/{product_id}` | Alterar dados |
| 4 | Eliminar produto | DELETE | `/api/admin/products/{product_id}` | Remoção |

### 1.5 Dados Mestres — Impactos
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar impactos | GET | `/api/admin/master/impacts` | Lista de níveis de impacto |
| 2 | Criar impacto | POST | `/api/admin/master/impacts` | `{name, description}` |
| 3 | Atualizar impacto | PUT | `/api/admin/master/impacts/{id}` | Alterar nome |
| 4 | Eliminar impacto | DELETE | `/api/admin/master/impacts/{id}` | Remoção |

### 1.6 Dados Mestres — Origens
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar origens | GET | `/api/admin/master/origins` | Lista de origens de erro |
| 2 | Criar origem | POST | `/api/admin/master/origins` | `{name, description}` |
| 3 | Atualizar origem | PUT | `/api/admin/master/origins/{id}` | Alterar nome |
| 4 | Eliminar origem | DELETE | `/api/admin/master/origins/{id}` | Remoção |

### 1.7 Dados Mestres — Detetado Por
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar detetado-por | GET | `/api/admin/master/detected-by` | Lista |
| 2 | Criar detetado-por | POST | `/api/admin/master/detected-by` | `{name}` |
| 3 | Atualizar detetado-por | PUT | `/api/admin/master/detected-by/{id}` | Alterar |
| 4 | Eliminar detetado-por | DELETE | `/api/admin/master/detected-by/{id}` | Remoção |

### 1.8 Dados Mestres — Departamentos
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar departamentos | GET | `/api/admin/master/departments` | Lista |
| 2 | Criar departamento | POST | `/api/admin/master/departments` | `{name, description}` |
| 3 | Atualizar departamento | PUT | `/api/admin/master/departments/{id}` | Alterar |
| 4 | Eliminar departamento | DELETE | `/api/admin/master/departments/{id}` | Remoção |

### 1.9 Dados Mestres — Atividades
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar atividades | GET | `/api/admin/master/activities` | Lista |
| 2 | Criar atividade | POST | `/api/admin/master/activities` | `{name, department_id}` |
| 3 | Atualizar atividade | PUT | `/api/admin/master/activities/{id}` | Alterar |
| 4 | Eliminar atividade | DELETE | `/api/admin/master/activities/{id}` | Remoção |
| 5 | Filtrar por departamento | GET | `/api/admin/master/activities/filter?department_id=X` | Filtra |

### 1.10 Dados Mestres — Tipos de Erro
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar tipos de erro | GET | `/api/admin/master/error-types` | Lista |
| 2 | Criar tipo de erro | POST | `/api/admin/master/error-types` | `{name, activity_id}` |
| 3 | Atualizar tipo de erro | PUT | `/api/admin/master/error-types/{id}` | Alterar |
| 4 | Eliminar tipo de erro | DELETE | `/api/admin/master/error-types/{id}` | Remoção |
| 5 | Filtrar por atividade | GET | `/api/admin/master/error-types/filter?activity_id=X` | Filtra |

### 1.11 Cursos (Administração)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar cursos | GET | `/api/admin/courses` | Lista paginada |
| 2 | Criar curso | POST | `/api/admin/courses` | `{title, description, level, bank_ids, product_ids}` |
| 3 | Ver detalhes de curso | GET | `/api/admin/courses/{course_id}` | Inclui lições e desafios |
| 4 | Atualizar curso | PUT | `/api/admin/courses/{course_id}` | Alterar dados |
| 5 | Eliminar curso | DELETE | `/api/admin/courses/{course_id}` | Remoção |
| 6 | Ver lição de curso | GET | `/api/admin/courses/{course_id}/lessons/{lesson_id}` | Detalhes da lição |
| 7 | Eliminar lição | DELETE | `/api/admin/courses/{course_id}/lessons/{lesson_id}` | Remoção |
| 8 | Ver desafio de curso | GET | `/api/admin/courses/{course_id}/challenges/{challenge_id}` | Detalhes |
| 9 | Atualizar desafio | PUT | `/api/admin/courses/{course_id}/challenges/{challenge_id}` | Alterar |
| 10 | Eliminar desafio | DELETE | `/api/admin/courses/{course_id}/challenges/{challenge_id}` | Remoção |

### 1.12 Planos de Formação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar planos | GET | `/api/training-plans/` | Todos os planos |
| 2 | Criar plano | POST | `/api/training-plans/` | `{title, description, course_ids, bank_ids, product_ids}` |
| 3 | Ver detalhes | GET | `/api/training-plans/{plan_id}` | Inclui cursos, progresso |
| 4 | Atualizar plano | PUT | `/api/training-plans/{plan_id}` | Alterar dados |
| 5 | Eliminar plano | DELETE | `/api/training-plans/{plan_id}` | Remoção |
| 6 | Atribuir aluno | POST | `/api/training-plans/{plan_id}/assign` | `{user_id}` |
| 7 | Remover aluno | DELETE | `/api/training-plans/{plan_id}/unassign/{student_id}` | Desatribuir |
| 8 | Adicionar formador | POST | `/api/training-plans/{plan_id}/add-trainer` | `{trainer_id}` |
| 9 | Remover formador | DELETE | `/api/training-plans/{plan_id}/remove-trainer/{trainer_id}` | Remover |
| 10 | Listar alunos do plano | GET | `/api/training-plans/{plan_id}/students` | Lista com progresso |
| 11 | Atribuir múltiplos alunos | POST | `/api/training-plans/{plan_id}/assign-multiple` | `{user_ids: []}` |
| 12 | Listar formadores disponíveis | GET | `/api/training-plans/trainers` | Lista |
| 13 | Ver estado de conclusão | GET | `/api/training-plans/{plan_id}/completion-status` | Progresso completo |
| 14 | Finalizar plano | POST | `/api/training-plans/{plan_id}/finalize` | Marca como concluído |

### 1.13 Equipas
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar equipas | GET | `/api/teams` | Lista completa |
| 2 | Criar equipa | POST | `/api/teams` | `{name, description, manager_id}` |
| 3 | Ver equipa | GET | `/api/teams/{team_id}` | Detalhes |
| 4 | Atualizar equipa | PATCH | `/api/teams/{team_id}` | Alterar |
| 5 | Eliminar equipa | DELETE | `/api/teams/{team_id}` | Remoção |
| 6 | Listar membros | GET | `/api/teams/{team_id}/members` | Lista |
| 7 | Adicionar membro | POST | `/api/teams/{team_id}/members` | `{user_id}` |
| 8 | Remover membro | DELETE | `/api/teams/{team_id}/members/{user_id}` | Remove |
| 9 | Listar serviços | GET | `/api/teams/{team_id}/services` | Lista |
| 10 | Adicionar serviço | POST | `/api/teams/{team_id}/services` | `{product_id}` |
| 11 | Remover serviço | DELETE | `/api/teams/{team_id}/services/{product_id}` | Remove |
| 12 | Listar users não atribuídos | GET | `/api/users/unassigned` | Users sem equipa |

### 1.14 Tutoria — Categorias
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar categorias | GET | `/api/tutoria/categories` | Hierarquia |
| 2 | Criar categoria | POST | `/api/tutoria/categories` | `{name, parent_id}` |
| 3 | Atualizar categoria | PATCH | `/api/tutoria/categories/{cat_id}` | Alterar |
| 4 | Eliminar categoria | DELETE | `/api/tutoria/categories/{cat_id}` | Remoção |

### 1.15 Chamados (Suporte)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar chamados | GET | `/api/chamados` | Todos (ADMIN vê todos) |
| 2 | Criar chamado | POST | `/api/chamados` | `{title, description, type, priority, portal}` |
| 3 | Ver chamado | GET | `/api/chamados/{id}` | Detalhes + comentários |
| 4 | Atualizar chamado | PUT | `/api/chamados/{id}` | Alterar status, notas admin |
| 5 | Eliminar chamado | DELETE | `/api/chamados/{id}` | Remoção |
| 6 | Comentar | POST | `/api/chamados/{id}/comments` | `{content}` |

### 1.16 Chat/FAQ
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar FAQs | GET | `/api/chat/faqs` | Todas (ativas + inativas) |
| 2 | Criar FAQ | POST | `/api/chat/faqs` | `{keywords_pt, answer_pt, ...}` |
| 3 | Atualizar FAQ | PATCH | `/api/chat/faqs/{faq_id}` | Alterar |
| 4 | Eliminar FAQ | DELETE | `/api/chat/faqs/{faq_id}` | Remoção |
| 5 | Enviar mensagem ao chatbot | POST | `/api/chat` | `{message, language}` |

### 1.17 Relatórios
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Overview geral | GET | `/api/relatorios/overview` | KPIs globais |
| 2 | Analytics de formações | GET | `/api/relatorios/formacoes` | Cursos, planos, conclusão |
| 3 | Analytics de tutoria | GET | `/api/relatorios/tutoria` | Erros, categorias, tendências |
| 4 | Analytics de equipas | GET | `/api/relatorios/teams` | Performance por equipa |
| 5 | Analytics de membros | GET | `/api/relatorios/members` | Performance individual |
| 6 | Incidentes | GET | `/api/relatorios/incidents` | Lista filtrada |
| 7 | Filtros de incidentes | GET | `/api/relatorios/incidents/filters` | Opções disponíveis |

### 1.18 Relatórios Avançados
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Dashboard resumo | GET | `/api/admin/advanced-reports/dashboard-summary` | KPIs completos |
| 2 | Performance alunos | GET | `/api/admin/advanced-reports/student-performance` | Ranking |
| 3 | Produtividade formadores | GET | `/api/admin/advanced-reports/trainer-productivity` | Métricas |
| 4 | Analytics de cursos | GET | `/api/admin/advanced-reports/course-analytics` | Detalhado |
| 5 | Certificações mensais | GET | `/api/admin/advanced-reports/certifications` | Mensal |
| 6 | MPU analytics | GET | `/api/admin/advanced-reports/mpu-analytics` | Por banco/serviço |

### 1.19 Ratings
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar todas avaliações | GET | `/api/ratings/admin/all` | Com filtros |
| 2 | Resumo por item | GET | `/api/ratings/admin/summary` | Agregado |
| 3 | Avaliações de item específico | GET | `/api/ratings/admin/item/{type}/{id}` | Detalhado |
| 4 | Dashboard de ratings | GET | `/api/ratings/admin/dashboard` | Estatísticas |

### 1.20 Knowledge Matrix
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Matriz completa | GET | `/api/admin/knowledge-matrix` | Alunos x Cursos |

### 1.21 Data Warehouse
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Executar ETL | POST | `/api/dw/etl/run` | Trigger pipeline DW |
| 2 | Snapshot diário | GET | `/api/dw/snapshot/latest` | Último snapshot + trends |
| 3 | Tendência snapshots | GET | `/api/dw/snapshot/trend?days=30` | Série temporal |
| 4 | Formação por mês | GET | `/api/dw/training/by-month` | Certificados mensais |
| 5 | Formação por curso | GET | `/api/dw/training/by-course` | Top cursos |
| 6 | Tutoria por categoria | GET | `/api/dw/tutoria/by-category` | Erros por categoria |
| 7 | Tutoria por mês | GET | `/api/dw/tutoria/by-month` | Tendência mensal |
| 8 | Tutoria por formador | GET | `/api/dw/tutoria/by-trainer` | Performance tutores |
| 9 | Chamados por estado | GET | `/api/dw/chamados/by-status` | Distribuição |
| 10 | Chamados por mês | GET | `/api/dw/chamados/by-month` | Tendência |
| 11 | Chamados por tipo | GET | `/api/dw/chamados/by-type` | Bug vs Melhoria |
| 12 | Erros internos por mês | GET | `/api/dw/internal-errors/by-month` | Tendência |
| 13 | Erros internos por equipa | GET | `/api/dw/internal-errors/by-team` | Distribuição |
| 14 | Overview de equipas | GET | `/api/dw/teams/overview` | Resumo geral |

**Total de operações ADMIN: ~130+**

---

## 2. MANAGER (manager_test@tradehub.com)

### 2.1 Autenticação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Login | POST | `/api/auth/login` | JWT token |
| 2 | Ver perfil | GET | `/api/auth/me` | Dados do manager |

### 2.2 Gestão de Utilizadores (SOMENTE LEITURA)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar utilizadores | GET | `/api/admin/users` | Lista paginada |
| 2 | ~~Criar utilizador~~ | ~~POST~~ | ~~`/api/admin/users`~~ | **403 Forbidden** |
| 3 | ~~Atualizar utilizador~~ | ~~PUT~~ | ~~`/api/admin/users/{id}`~~ | **403 Forbidden** |
| 4 | ~~Eliminar utilizador~~ | ~~DELETE~~ | ~~`/api/admin/users/{id}`~~ | **403 Forbidden** |

### 2.3 Master Data (SOMENTE LEITURA)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar bancos | GET | `/api/admin/banks` | Lista |
| 2 | Listar produtos | GET | `/api/admin/products` | Lista |
| 3 | Listar impactos | GET | `/api/admin/master/impacts` | Lista |
| 4 | Listar origens | GET | `/api/admin/master/origins` | Lista |
| 5 | Listar departamentos | GET | `/api/admin/master/departments` | Lista |
| 6 | Listar atividades | GET | `/api/admin/master/activities` | Lista |
| 7 | Filtrar atividades | GET | `/api/admin/master/activities/filter` | Filtrado |
| 8 | Filtrar tipos de erro | GET | `/api/admin/master/error-types/filter` | Filtrado |
| 9 | ~~Criar/Atualizar/Eliminar~~ | — | — | **403 Forbidden** |

### 2.4 Relatórios (ACESSO COMPLETO)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Reports stats | GET | `/api/admin/reports/stats` | Estatísticas |
| 2 | Reports cursos | GET | `/api/admin/reports/courses` | Analytics cursos |
| 3 | Reports formadores | GET | `/api/admin/reports/trainers` | Produtividade |
| 4 | Reports planos | GET | `/api/admin/reports/training-plans` | Analytics planos |
| 5 | Insights | GET | `/api/admin/reports/insights` | Insights gerais |
| 6 | Dashboard avançado | GET | `/api/admin/advanced-reports/dashboard-summary` | Completo |
| 7 | Student performance | GET | `/api/admin/advanced-reports/student-performance` | Ranking |
| 8 | Trainer productivity | GET | `/api/admin/advanced-reports/trainer-productivity` | Métricas |
| 9 | Knowledge Matrix | GET | `/api/admin/knowledge-matrix` | Matriz |

### 2.5 Tutoria — Aprovações (como Chefe)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Aprovar análise | POST | `/api/tutoria/errors/{id}/approve-chief` | Aprova análise do tutor |
| 2 | Devolver análise | POST | `/api/tutoria/errors/{id}/return-analysis` | Pede correções |
| 3 | Aprovar planos de ação | POST | `/api/tutoria/errors/{id}/approve-plans` | Aprova planos |
| 4 | Aprovar plano individual | POST | `/api/tutoria/plans/{id}/approve` | Aprova |
| 5 | Devolver plano | POST | `/api/tutoria/plans/{id}/return` | Devolve |
| 6 | Validar plano concluído | POST | `/api/tutoria/plans/{id}/validate` | Valida resultado |
| 7 | Devolver item de ação | POST | `/api/tutoria/items/{id}/return` | Devolve item |
| 8 | Avaliar learning sheet | PATCH | `/api/tutoria/learning-sheets/{id}/review` | Revisa |
| 9 | Listar equipa | GET | `/api/tutoria/team` | Membros da equipa |

### 2.6 Equipas (LEITURA)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar equipas | GET | `/api/teams` | Lista |
| 2 | Ver equipa | GET | `/api/teams/{id}` | Detalhes |
| 3 | Ver membros | GET | `/api/teams/{id}/members` | Lista |
| 4 | Ver serviços | GET | `/api/teams/{id}/services` | Lista |
| 5 | ~~Criar/Atualizar/Eliminar~~ | — | — | **403 Forbidden** |

### 2.7 Data Warehouse (LEITURA)
Mesmos endpoints que ADMIN exceto `POST /api/dw/etl/run` (apenas ADMIN).

**Total de operações MANAGER: ~60+**

---

## 3. TRAINER (trainer_test@tradehub.com)

### 3.1 Autenticação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Login | POST | `/api/auth/login` | JWT token |
| 2 | Ver perfil | GET | `/api/auth/me` | Dados do trainer |

### 3.2 Gestão de Cursos (CRUD PRÓPRIO)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar meus cursos | GET | `/api/trainer/courses` | Cursos do próprio trainer |
| 2 | Criar curso | POST | `/api/trainer/courses` | `{title, description, level, bank_ids, product_ids}` |
| 3 | Ver curso | GET | `/api/trainer/courses/{id}` | Detalhes |
| 4 | Atualizar curso | PUT | `/api/trainer/courses/{id}` | Alterar dados |
| 5 | Eliminar curso | DELETE | `/api/trainer/courses/{id}` | Remoção |
| 6 | Listar todos os cursos | GET | `/api/trainer/courses/all` | Todos da plataforma |
| 7 | Ver detalhes de curso | GET | `/api/trainer/courses/details/{id}` | Read-only |
| 8 | Ver lição | GET | `/api/trainer/courses/{id}/lessons/{lesson_id}` | Detalhes |
| 9 | Ver desafio | GET | `/api/trainer/courses/{id}/challenges/{challenge_id}` | Detalhes |

### 3.3 Lições (CRUD)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Criar lição | POST | `/api/trainer/lessons` | `{course_id, title, lesson_type, estimated_minutes}` |
| 2 | Liberar lição a aluno | POST | `/api/lessons/{id}/release` | `{student_id, training_plan_id}` |
| 3 | Aprovar conclusão | POST | `/api/lessons/{id}/approve` | `{student_id, is_approved}` |

### 3.4 Desafios (CRUD)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Criar desafio | POST | `/api/challenges/` | `{course_id, title, type, operations_required, ...}` |
| 2 | Atualizar desafio | PUT | `/api/challenges/{id}` | Alterar dados |
| 3 | Liberar desafio global | POST | `/api/challenges/{id}/release` | Para todos |
| 4 | Liberar para aluno | POST | `/api/challenges/{id}/release/{student_id}` | Individual |
| 5 | Ver alunos elegíveis | GET | `/api/challenges/{id}/eligible-students` | Lista |
| 6 | Submeter SUMMARY | POST | `/api/challenges/submit/summary` | `{challenge_id, student_id, totals...}` |
| 7 | Iniciar COMPLETE | POST | `/api/challenges/submit/complete/start/{id}` | Para aluno |
| 8 | Adicionar parte | POST | `/api/challenges/submit/complete/{sub_id}/part` | Parte n |
| 9 | Finalizar COMPLETE | POST | `/api/challenges/submit/complete/{sub_id}/finish` | Calcula MPU |
| 10 | Ver submissões | GET | `/api/challenges/{id}/submissions` | Lista |
| 11 | Listar pendentes | GET | `/api/challenges/pending-review/list` | Para revisão |
| 12 | Classificar operação | POST | `/api/challenges/operations/{id}/classify` | Tipos de erro |
| 13 | Finalizar revisão | POST | `/api/challenges/submissions/{id}/finalize-review` | Aprovar/Rejeitar |
| 14 | Permitir retry | POST | `/api/challenges/submissions/{id}/allow-retry` | Libera nova tentativa |
| 15 | Finalizar SUMMARY | POST | `/api/challenges/submissions/{id}/finalize-summary` | Calcula resultado |
| 16 | Aprovação manual | POST | `/api/challenges/submissions/{id}/manual-finalize` | Override |

### 3.5 Planos de Formação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar planos | GET | `/api/training-plans/` | Do próprio trainer |
| 2 | Criar plano | POST | `/api/training-plans/` | Com cursos |
| 3 | Atualizar plano | PUT | `/api/training-plans/{id}` | Alterar |
| 4 | Atribuir aluno | POST | `/api/training-plans/{id}/assign` | Individual |
| 5 | Atribuir múltiplos | POST | `/api/training-plans/{id}/assign-multiple` | Batch |
| 6 | Remover aluno | DELETE | `/api/training-plans/{id}/unassign/{student_id}` | Remove |
| 7 | Finalizar plano | POST | `/api/training-plans/{id}/finalize` | Gera certificado |

### 3.6 Finalização
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Estado do curso no plano | GET | `/api/finalization/course/{plan_id}/{course_id}/status` | Progresso |
| 2 | Finalizar curso | POST | `/api/finalization/course/{plan_id}/{course_id}/finalize` | Marca concluído |
| 3 | Estado do plano | GET | `/api/finalization/plan/{plan_id}/status` | Progresso |
| 4 | Finalizar plano | POST | `/api/finalization/plan/{plan_id}/finalize` | + Certificado |

### 3.7 Alunos
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar alunos (detalhado) | GET | `/api/trainer/students` | Com progresso |
| 2 | Listar alunos (simples) | GET | `/api/trainer/students/list` | Apenas nome/email |

### 3.8 Relatórios do Trainer
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Overview | GET | `/api/trainer/reports/overview` | Resumo |
| 2 | Planos | GET | `/api/trainer/reports/plans` | Performance planos |
| 3 | Alunos | GET | `/api/trainer/reports/students` | Performance alunos |
| 4 | Lições | GET | `/api/trainer/reports/lessons` | Progresso lições |
| 5 | Desafios | GET | `/api/trainer/reports/challenges` | Resultados |
| 6 | Stats dashboard | GET | `/api/trainer/stats` | KPIs |

### 3.9 Restrições
| Endpoint | Resultado |
|----------|-----------|
| `POST /api/admin/users` | **403** |
| `DELETE /api/admin/users/{id}` | **403** |
| `POST /api/admin/master/*` | **403** |
| Qualquer endpoint `/api/admin/*` (exceto banks/products GET) | **403** |

**Total de operações TRAINER: ~55+**

---

## 4. TRAINEE / STUDENT (student_test@tradehub.com)

### 4.1 Autenticação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Login | POST | `/api/auth/login` | JWT token |
| 2 | Ver perfil | GET | `/api/auth/me` | Dados do aluno |

### 4.2 Cursos e Matrículas
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar cursos inscritos | GET | `/api/student/courses` | Meus cursos |
| 2 | Ver curso | GET | `/api/student/courses/{id}` | Detalhes (se inscrito) |
| 3 | Matricular-se | POST | `/api/student/enroll/{course_id}` | Auto-matrícula |
| 4 | Dashboard stats | GET | `/api/student/stats` | KPIs pessoais |

### 4.3 Lições
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Ver minhas lições | GET | `/api/lessons/student/my-lessons` | Lista |
| 2 | Iniciar lição | POST | `/api/lessons/{id}/start` | `{enrollment_id}` |
| 3 | Pausar lição | POST | `/api/lessons/{id}/pause` | Timer para |
| 4 | Retomar lição | POST | `/api/lessons/{id}/resume` | Timer continua |
| 5 | Finalizar lição | POST | `/api/lessons/{id}/finish` | Marca como feita |
| 6 | Confirmar presença | POST | `/api/lessons/{id}/confirm` | Confirmação |
| 7 | Ver progresso | GET | `/api/lessons/{id}/progress` | Tempo, estado |
| 8 | Ver estado do timer | GET | `/api/lessons/{id}/timer-state` | Tempo real |

### 4.4 Desafios
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Ver desafios liberados | GET | `/api/challenges/student/released` | Disponíveis para mim |
| 2 | Verificar se liberado | GET | `/api/challenges/{id}/is-released/{student_id}` | Sim/Não |
| 3 | Verificar se posso iniciar | GET | `/api/challenges/{id}/can-start/{student_id}` | Sim/Não |
| 4 | Iniciar COMPLETE (self) | POST | `/api/challenges/submit/complete/start/{id}/self` | Autostart |
| 5 | Iniciar operação | POST | `/api/challenges/submissions/{sub_id}/operations/start` | Começa operação |
| 6 | Finalizar operação | POST | `/api/challenges/operations/{op_id}/finish` | Termina |
| 7 | Submeter para revisão | POST | `/api/challenges/submissions/{sub_id}/submit-for-review` | Envia ao trainer |
| 8 | Ver minhas submissões | GET | `/api/challenges/student/my-submissions` | Histórico |
| 9 | Iniciar retry | POST | `/api/challenges/submissions/{sub_id}/start-retry` | Nova tentativa |

### 4.5 Planos de Formação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Ver meus planos | GET | `/api/training-plans/` | Apenas os atribuídos a mim |
| 2 | Ver detalhes | GET | `/api/training-plans/{id}` | Progresso |
| 3 | Ver estado de conclusão | GET | `/api/training-plans/{id}/completion-status` | Detalhado |

### 4.6 Certificados
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar certificados | GET | `/api/certificates/` | Meus certificados |
| 2 | Ver certificado | GET | `/api/certificates/{id}` | Detalhes |
| 3 | Download PDF | GET | `/api/certificates/{id}/pdf` | Ficheiro PDF |
| 4 | Certificados do plano | GET | `/api/certificates/by-plan/{plan_id}` | Lista |
| 5 | Certificados (student) | GET | `/api/student/certificates` | Lista |

### 4.7 Ratings
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Submeter avaliação | POST | `/api/ratings/submit` | `{type, item_id, stars, comment}` |
| 2 | Verificar se já avaliou | GET | `/api/ratings/check` | Sim/Não |
| 3 | Minhas avaliações | GET | `/api/ratings/my-ratings` | Lista |
| 4 | Check específico | GET | `/api/ratings/check/{type}/{item_id}` | Detalhado |

### 4.8 Chamados
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar meus chamados | GET | `/api/chamados` | Apenas os meus |
| 2 | Criar chamado | POST | `/api/chamados` | `{title, description, type, priority}` |
| 3 | Ver chamado | GET | `/api/chamados/{id}` | Detalhes |
| 4 | Comentar | POST | `/api/chamados/{id}/comments` | `{content}` |
| 5 | ~~Atualizar chamado~~ | ~~PUT~~ | ~~`/api/chamados/{id}`~~ | **403 Forbidden** |
| 6 | ~~Eliminar chamado~~ | ~~DELETE~~ | ~~`/api/chamados/{id}`~~ | **403 Forbidden** |

### 4.9 Relatórios do Aluno
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Overview | GET | `/api/student/reports/overview` | KPIs pessoais |
| 2 | Cursos | GET | `/api/student/reports/courses` | Meus cursos |
| 3 | Lições | GET | `/api/student/reports/lessons` | Progresso |
| 4 | Conquistas | GET | `/api/student/reports/achievements` | Certificados |
| 5 | Dashboard completo | GET | `/api/student/reports/dashboard` | Tudo junto |

### 4.10 Chat
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Enviar mensagem | POST | `/api/chat` | Resposta do bot |
| 2 | Ver FAQs | GET | `/api/chat/faqs` | Apenas ativas |

### 4.11 Restrições (Acesso Negado)
| Endpoint | Resultado |
|----------|-----------|
| `GET /api/admin/users` | **403** |
| `POST /api/admin/master/*` | **403** |
| `PUT /api/chamados/{id}` | **403** |
| `DELETE /api/chamados/{id}` | **403** |
| Qualquer endpoint `/api/admin/*` | **403** |
| Qualquer endpoint `/api/trainer/*` | **403** |

**Total de operações STUDENT: ~40+**

---

## 5. TUTOR (tutor_test@tradehub.com) — TRAINEE + is_tutor=True

### 5.1 Tutoria — Erros
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar erros | GET | `/api/tutoria/errors` | Scoped aos meus tutorados |
| 2 | Registar erro | POST | `/api/tutoria/errors` | `{tutorado_id, category_id, description, date_occurrence, ...}` |
| 3 | Ver detalhes de erro | GET | `/api/tutoria/errors/{id}` | Completo |
| 4 | Atualizar erro | PATCH | `/api/tutoria/errors/{id}` | Alterar campos |
| 5 | Desativar erro | POST | `/api/tutoria/errors/{id}/deactivate` | Inativa |
| 6 | Atualizar análise | PATCH | `/api/tutoria/errors/{id}/analysis` | Campos análise |
| 7 | Submeter análise | POST | `/api/tutoria/errors/{id}/submit-analysis` | Envia ao chefe |
| 8 | Cancelar erro | POST | `/api/tutoria/errors/{id}/cancel` | `{reason}` |
| 9 | Confirmar solução | POST | `/api/tutoria/errors/{id}/confirm-solution` | Marca resolvido |
| 10 | Resolver erro | POST | `/api/tutoria/errors/{id}/resolve` | Finaliza |
| 11 | Verificar resolução | POST | `/api/tutoria/errors/{id}/verify` | Confirma |

### 5.2 Tutoria — Planos de Ação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Criar plano de ação | POST | `/api/tutoria/errors/{id}/plans` | `{analysis_5_why, corrective_action, ...}` |
| 2 | Listar planos de um erro | GET | `/api/tutoria/errors/{id}/plans` | Lista |
| 3 | Listar todos os planos | GET | `/api/tutoria/plans` | Scoped |
| 4 | Ver plano | GET | `/api/tutoria/plans/{id}` | Detalhes |
| 5 | Atualizar plano | PATCH | `/api/tutoria/plans/{id}` | Alterar |
| 6 | Submeter plano | POST | `/api/tutoria/plans/{id}/submit` | Envia para aprovação |
| 7 | Iniciar execução | PATCH | `/api/tutoria/plans/{id}/start` | Muda status |
| 8 | Concluir plano | PATCH | `/api/tutoria/plans/{id}/complete` | Marca concluído |
| 9 | Meus planos | GET | `/api/tutoria/my-plans` | Pessoais |

### 5.3 Tutoria — Items de Ação
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar items | GET | `/api/tutoria/plans/{id}/items` | Do plano |
| 2 | Criar item | POST | `/api/tutoria/plans/{id}/items` | `{type, description, responsible_id, due_date}` |
| 3 | Atualizar item | PATCH | `/api/tutoria/items/{id}` | Alterar status/evidência |

### 5.4 Tutoria — Comentários
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Ver comentários de erro | GET | `/api/tutoria/errors/{id}/comments` | Lista |
| 2 | Adicionar comentário a erro | POST | `/api/tutoria/errors/{id}/comments` | `{content}` |
| 3 | Ver comentários de plano | GET | `/api/tutoria/plans/{id}/comments` | Lista |
| 4 | Adicionar comentário a plano | POST | `/api/tutoria/plans/{id}/comments` | `{content}` |

### 5.5 Tutoria — Learning Sheets
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar learning sheets | GET | `/api/tutoria/learning-sheets` | Todas do tutor |
| 2 | Criar learning sheet | POST | `/api/tutoria/learning-sheets` | `{error_id, tutorado_id, title, ...}` |
| 3 | Submeter sheet | POST | `/api/tutoria/learning-sheets/{id}/submit` | Envia para revisão |
| 4 | Minhas sheets | GET | `/api/tutoria/learning-sheets/mine` | Pessoais |

### 5.6 Tutoria — Dashboard & Notificações
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Dashboard tutoria | GET | `/api/tutoria/dashboard` | KPIs |
| 2 | Listar tutorados | GET | `/api/tutoria/students` | Lista |
| 3 | Notificações | GET | `/api/tutoria/notifications` | Lista |
| 4 | Marcar lida | PATCH | `/api/tutoria/notifications/{id}/read` | Uma |
| 5 | Marcar todas lidas | PATCH | `/api/tutoria/notifications/read-all` | Todas |

### 5.7 Erros Internos (Sensos)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar sensos | GET | `/api/internal-errors/sensos` | Lista |
| 2 | Criar senso | POST | `/api/internal-errors/sensos` | `{name, start_date, end_date}` |
| 3 | Atualizar senso | PATCH | `/api/internal-errors/sensos/{id}` | Alterar |
| 4 | Eliminar senso | DELETE | `/api/internal-errors/sensos/{id}` | Remoção |
| 5 | Dashboard erros internos | GET | `/api/internal-errors/dashboard` | KPIs |

**Total de operações TUTOR: ~45+**

---

## 6. LIBERADOR (liberador_test@tradehub.com) — TRAINEE + is_liberador=True

### 6.1 Erros Internos
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar erros internos | GET | `/api/internal-errors/errors` | Scoped |
| 2 | **Registar erro interno** | POST | `/api/internal-errors/errors` | `{senso_id, gravador_id, description, date_occurrence, ...}` (EXCLUSIVO LIBERADOR) |
| 3 | Ver detalhes | GET | `/api/internal-errors/errors/{id}` | Completo |
| 4 | Listar lookups | GET | `/api/internal-errors/lookups/*` | Impactos, categorias, tipos, departamentos, atividades, bancos |

### 6.2 Todas Operações de Aluno
Acesso a todos os endpoints de STUDENT (cursos, lições, desafios, chamados).

**Total de operações LIBERADOR: ~45+ (student base + erros internos)**

---

## 7. REFERENTE (referente_test@tradehub.com) — TRAINEE + is_referente=True

### 7.1 Tutoria (VISUALIZAÇÃO)
| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Listar erros tutoria | GET | `/api/tutoria/errors` | Scoped à equipa |
| 2 | Ver detalhes de erro | GET | `/api/tutoria/errors/{id}` | Completo |
| 3 | Listar planos | GET | `/api/tutoria/plans` | Scoped |
| 4 | Aprovar análise (como representante do chefe) | POST | `/api/tutoria/errors/{id}/approve-chief` | Se autorizado |

### 7.2 Todas Operações de Aluno
Acesso a todos os endpoints de STUDENT.

**Total de operações REFERENTE: ~42+ (student base + tutoria leitura)**

---

## 8. Endpoints Públicos (SEM AUTENTICAÇÃO)

| # | Operação | Método | Endpoint | Resultado |
|---|----------|--------|----------|-----------|
| 1 | Health check | GET | `/health` | `{status: "healthy"}` |
| 2 | Health check (API) | GET | `/api/health` | `{status: "healthy"}` |
| 3 | API root | GET | `/api` | Mensagem de boas-vindas |
| 4 | Landing page data | GET | `/api/public/landing` | Stats + ratings recentes |
| 5 | KPIs públicos | GET | `/api/stats/kpis` | Números da plataforma |
| 6 | Cursos em destaque | GET | `/api/stats/courses/featured` | Top cursos |
| 7 | Planos em destaque | GET | `/api/stats/training-plans/featured` | Top planos |
| 8 | Verificar email | POST | `/api/auth/verify-email` | Email existe? |
| 9 | Pedir reset password | POST | `/api/auth/forgot-password` | Envia token |
| 10 | Reset password | POST | `/api/auth/reset-password` | Nova password |
| 11 | Validar token reset | GET | `/api/auth/validate-reset-token/{token}` | Token válido? |
| 12 | Registar | POST | `/api/auth/register` | Novo utilizador |

---

## 9. Matriz de Permissões Cruzada

| Operação | ADMIN | MANAGER | TRAINER | STUDENT | TUTOR | LIBERADOR | REFERENTE |
|----------|:-----:|:-------:|:-------:|:-------:|:-----:|:---------:|:---------:|
| **Gestão Users** | CRUD | Read | - | - | - | - | - |
| **Master Data** | CRUD | Read | Read | - | - | - | - |
| **Cursos (admin)** | CRUD | Read | - | - | - | - | - |
| **Cursos (trainer)** | CRUD | - | CRUD | - | - | - | - |
| **Lições** | Release+Approve | - | Release+Approve | Start/Pause/Finish | - | - | - |
| **Desafios** | CRUD+Review | Review list | CRUD+Review | Submit+Start | - | - | - |
| **Planos Formação** | CRUD | Read | CRUD | Read (próprios) | - | - | - |
| **Tutoria Erros** | CRUD | Approve | - | - | CRUD | - | Read |
| **Tutoria Planos** | CRUD | Approve/Validate | - | - | CRUD | - | Read |
| **Erros Internos** | Read | - | - | - | Sensos+Dashboard | **Create** | - |
| **Equipas** | CRUD | Read | - | - | - | - | - |
| **Chamados** | CRUD | Read | Create+Comment | Create+Comment | Create+Comment | Create+Comment | Create+Comment |
| **Chat/FAQ** | CRUD | Read | Read | Read | Read | Read | Read |
| **Relatórios** | Full | Full | Own | Own | Dashboard | - | - |
| **Reports Avançados** | Full | Full | - | - | - | - | - |
| **Knowledge Matrix** | Full | Full | - | - | - | - | - |
| **Data Warehouse** | Full+ETL | Read | - | - | - | - | - |
| **Ratings** | Admin dashboard | Admin dashboard | - | Submit+Check | - | - | - |
| **Certificados** | Full | - | Read | Read (próprios) | - | - | - |
