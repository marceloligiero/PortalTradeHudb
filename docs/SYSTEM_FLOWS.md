# Fluxos do Sistema — PortalTradeHub

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Data:** 2026-03-19
**Total de Fluxos Documentados:** 15

---

## Índice

1. [Autenticação e Registo](#1-autenticação-e-registo)
2. [Reset de Password](#2-reset-de-password)
3. [Validação de Formador](#3-validação-de-formador)
4. [Criação e Gestão de Cursos](#4-criação-e-gestão-de-cursos)
5. [Plano de Formação Completo](#5-plano-de-formação-completo)
6. [Lições — Ciclo de Vida](#6-lições--ciclo-de-vida)
7. [Desafios — Tipo COMPLETE](#7-desafios--tipo-complete)
8. [Desafios — Tipo SUMMARY](#8-desafios--tipo-summary)
9. [Finalização e Certificação](#9-finalização-e-certificação)
10. [Tutoria — Gestão de Erros](#10-tutoria--gestão-de-erros)
11. [Tutoria — Planos de Ação](#11-tutoria--planos-de-ação)
12. [Erros Internos (Sensos)](#12-erros-internos-sensos)
13. [Chamados (Suporte)](#13-chamados-suporte)
14. [Equipas](#14-equipas)
15. [Ratings (Avaliações)](#15-ratings-avaliações)

---

## 1. Autenticação e Registo

### Descrição
O sistema usa JWT (JSON Web Tokens) com bcrypt para hashing de passwords. Rate limiting de 5 tentativas/minuto no login.

### Fluxo de Registo
```
Utilizador → POST /api/auth/register
  ├─ Validação: email único, password forte, role válida
  ├─ Se role=TRAINER → is_pending=True (aguarda aprovação do admin)
  ├─ Se role=TRAINEE/MANAGER → conta ativa imediatamente
  └─ Resposta: dados do user + JWT token
```

### Fluxo de Login
```
Utilizador → POST /api/auth/login {username, password}
  ├─ Verificar email existe
  ├─ Verificar password (bcrypt)
  ├─ Verificar is_active=True
  ├─ Gerar JWT com claim "sub" = email
  └─ Resposta: {access_token, token_type, user}
```

### Fluxo de Verificação (/me)
```
GET /api/auth/me [com Bearer token]
  ├─ Decodifica JWT
  ├─ Busca user por email
  ├─ Verifica is_active
  └─ Resposta: dados completos do user
```

### Atores: Todos
### Endpoints: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`

---

## 2. Reset de Password

### Descrição
Fluxo seguro de recuperação de password em 4 etapas, com token temporário.

### Fluxo Completo
```
1. POST /api/auth/verify-email {email}
   └─ Resposta genérica (não revela se email existe)

2. POST /api/auth/forgot-password {email}
   ├─ Rate limit: 3/minuto
   ├─ Gera token aleatório com expiração (1h)
   ├─ Guarda na tabela password_reset_tokens
   └─ (Em produção: envia email com link)

3. GET /api/auth/validate-reset-token/{token}
   ├─ Verifica token existe
   ├─ Verifica não expirou
   ├─ Verifica não foi usado
   └─ Resposta: {valid: true/false}

4. POST /api/auth/reset-password {token, new_password}
   ├─ Valida token
   ├─ Hash nova password (bcrypt)
   ├─ Atualiza user.hashed_password
   ├─ Marca token como usado
   └─ Resposta: {success: true}
```

### Atores: Utilizador não autenticado
### Endpoints: 4 endpoints em `/api/auth/`

---

## 3. Validação de Formador

### Descrição
Quando um TRAINER se regista, fica pendente (is_pending=True) até o ADMIN aprovar.

### Fluxo
```
1. Trainer regista-se → POST /api/auth/register {role: "TRAINER"}
   └─ Criado com is_pending=True, is_trainer=True

2. Admin lista pendentes → GET /api/admin/pending-trainers
   └─ Lista de trainers com is_pending=True

3a. Admin aprova → POST /api/admin/validate-trainer/{user_id}
    ├─ is_pending → False
    ├─ validated_at → now()
    └─ Trainer pode agora criar cursos

3b. Admin rejeita → POST /api/admin/reject-trainer/{user_id}
    └─ Trainer desativado ou removido
```

### Atores: TRAINER (registo), ADMIN (aprovação)
### Estado: PENDING → APPROVED ou REJECTED

---

## 4. Criação e Gestão de Cursos

### Descrição
Cursos são a unidade principal de formação. Contêm lições (teóricas/práticas) e desafios (avaliações). Podem estar associados a bancos e produtos.

### Fluxo de Criação (Trainer)
```
1. Trainer cria curso → POST /api/trainer/courses
   {title, description, level, bank_ids: [1,2], product_ids: [3]}
   └─ Cria Course + CourseBank M2M + CourseProduct M2M

2. Trainer adiciona lições → POST /api/trainer/lessons
   {course_id, title, lesson_type: "THEORETICAL", estimated_minutes: 30}
   └─ Cada lição tem order_index para sequenciamento

3. Trainer cria desafios → POST /api/challenges/
   {course_id, title, challenge_type: "COMPLETE",
    operations_required: 100, time_limit_minutes: 60, target_mpu: 1.5}
   └─ Desafio associado ao curso

4. Curso pronto para uso em planos de formação
```

### Fluxo de Gestão (Admin)
```
Admin pode:
├─ Listar todos → GET /api/admin/courses
├─ Ver detalhes → GET /api/admin/courses/{id} (inclui lições e desafios)
├─ Editar → PUT /api/admin/courses/{id}
├─ Eliminar → DELETE /api/admin/courses/{id}
├─ Eliminar lição → DELETE /api/admin/courses/{cid}/lessons/{lid}
└─ Eliminar desafio → DELETE /api/admin/courses/{cid}/challenges/{chid}
```

### Atores: TRAINER (cria), ADMIN (gere), STUDENT (visualiza)
### Modelo: Course → [Lessons] → [Challenges]

---

## 5. Plano de Formação Completo

### Descrição
Um Plano de Formação agrupa vários cursos, é atribuído a alunos e gerido por formadores. Representa o percurso formativo completo.

### Fluxo Completo
```
1. CRIAR PLANO
   Trainer/Admin → POST /api/training-plans/
   {title, description, course_ids: [1,2,3], bank_ids: [1], product_ids: [2],
    start_date, end_date}
   └─ Cria TrainingPlan + TrainingPlanCourse + TrainingPlanBank + TrainingPlanProduct

2. ADICIONAR FORMADORES
   → POST /api/training-plans/{id}/add-trainer {trainer_id}
   └─ Cria TrainingPlanTrainer (pode ter múltiplos)

3. ATRIBUIR ALUNOS
   → POST /api/training-plans/{id}/assign {user_id}
   ou
   → POST /api/training-plans/{id}/assign-multiple {user_ids: [1,2,3]}
   └─ Cria TrainingPlanAssignment + auto-enrollment nos cursos

4. EXECUÇÃO (fluxo dos cursos/lições/desafios)
   └─ Ver fluxos 6, 7 e 8

5. MONITORIZAR PROGRESSO
   → GET /api/training-plans/{id}/completion-status
   └─ Retorna: % completo, cursos done, lições done, desafios done

6. FINALIZAR CURSOS INDIVIDUALMENTE
   → POST /api/finalization/course/{plan_id}/{course_id}/finalize
   └─ Marca TrainingPlanCourse.status = "COMPLETED"

7. FINALIZAR PLANO
   → POST /api/finalization/plan/{plan_id}/finalize
   {generate_certificate: true}
   ├─ Verifica todos os cursos concluídos
   ├─ Marca plano como COMPLETED
   └─ Gera Certificate (se solicitado)

8. REMOVER ALUNOS/FORMADORES (se necessário)
   → DELETE /api/training-plans/{id}/unassign/{student_id}
   → DELETE /api/training-plans/{id}/remove-trainer/{trainer_id}
```

### Estados do Plano
```
PENDING → IN_PROGRESS → COMPLETED
                     → DELAYED (se passou end_date)
```

### Atores: ADMIN/TRAINER (cria, gere), STUDENT (executa)
### Modelos: TrainingPlan → TrainingPlanCourse, TrainingPlanAssignment, TrainingPlanTrainer

---

## 6. Lições — Ciclo de Vida

### Descrição
Cada lição tem um timer que controla o tempo real gasto. O fluxo depende do tipo (THEORETICAL vs PRACTICAL) e de quem inicia (TRAINER vs TRAINEE).

### Fluxo Completo
```
1. LIBERAR LIÇÃO
   Trainer → POST /api/lessons/{id}/release
   {student_id, training_plan_id, enrollment_id}
   └─ LessonProgress: status → "RELEASED", is_released=True

2. INICIAR LIÇÃO
   Student → POST /api/lessons/{id}/start
   {enrollment_id, training_plan_id}
   └─ status → "IN_PROGRESS", started_at = now(), timer começa

3. PAUSAR LIÇÃO (opcional, pode ser múltiplas vezes)
   Student → POST /api/lessons/{id}/pause
   {enrollment_id, pause_reason}
   └─ status → "PAUSED", cria LessonPause, acumula tempo

4. RETOMAR LIÇÃO
   Student → POST /api/lessons/{id}/resume
   {enrollment_id}
   └─ status → "IN_PROGRESS", resume timer

5. FINALIZAR LIÇÃO
   Student/Trainer → POST /api/lessons/{id}/finish
   {enrollment_id}
   ├─ Calcula actual_time_minutes
   ├─ Calcula MPU = estimated / actual
   └─ status → "COMPLETED"

6. CONFIRMAR PRESENÇA
   Student → POST /api/lessons/{id}/confirm
   {enrollment_id}
   └─ student_confirmed=True, student_confirmed_at=now()

7. APROVAR CONCLUSÃO
   Trainer → POST /api/lessons/{id}/approve
   {student_id, enrollment_id, is_approved}
   └─ is_approved=True/False
```

### Estados
```
NOT_STARTED → RELEASED → IN_PROGRESS → PAUSED → IN_PROGRESS → COMPLETED
                                                            → (approved/rejected)
```

### MPU (Minutes Per Unit)
```
MPU = estimated_minutes / actual_time_minutes
MPU% = (actual / estimated) × 100

MPU > 1.0 = mais rápido que o estimado (bom)
MPU < 1.0 = mais lento que o estimado
```

### Atores: TRAINER (release, approve), STUDENT (start, pause, resume, finish, confirm)

---

## 7. Desafios — Tipo COMPLETE

### Descrição
Desafio COMPLETE simula operações reais. O aluno executa operações uma a uma, com timer, e o formador classifica erros.

### Fluxo Completo
```
1. CRIAR DESAFIO
   Trainer → POST /api/challenges/
   {course_id, title, challenge_type: "COMPLETE",
    operations_required: 100, time_limit_minutes: 60,
    target_mpu: 1.5, max_errors: 5}

2. LIBERAR DESAFIO
   Trainer → POST /api/challenges/{id}/release  (global)
   ou
   Trainer → POST /api/challenges/{id}/release/{student_id}  (individual)

3. INICIAR SUBMISSÃO
   Student → POST /api/challenges/submit/complete/start/{id}/self
   ou
   Trainer → POST /api/challenges/submit/complete/start/{id}
   {student_id, training_plan_id}
   └─ Cria ChallengeSubmission (status="IN_PROGRESS")

4. EXECUTAR OPERAÇÕES (loop)
   Student → POST /api/challenges/submissions/{sub_id}/operations/start
   └─ Cria ChallengeOperation (started_at=now())

   Student → POST /api/challenges/operations/{op_id}/finish
   └─ completed_at=now(), duration calculada

5. SUBMETER PARA REVISÃO
   Student → POST /api/challenges/submissions/{sub_id}/submit-for-review
   └─ status → "PENDING_REVIEW"

6. REVISÃO (TRAINER)
   Trainer → GET /api/challenges/pending-review/list
   Trainer → POST /api/challenges/operations/{op_id}/classify
   {errors: [{error_type: "METHODOLOGY", description: "..."}]}
   └─ Cria OperationError para cada erro

7. FINALIZAR REVISÃO
   Trainer → POST /api/challenges/submissions/{sub_id}/finalize-review
   {is_approved: true/false, feedback: "..."}
   ├─ Calcula MPU = operations / time
   ├─ Compara com target_mpu
   └─ is_approved=true/false

8. RETRY (se reprovado e permitido)
   Trainer → POST /api/challenges/submissions/{sub_id}/allow-retry
   Student → POST /api/challenges/submissions/{sub_id}/start-retry
   └─ retry_count++, nova submissão
```

### KPIs Calculados
```
Volume = total_operations (vs operations_required)
MPU = operations / time_minutes (vs target_mpu)
Erros = errors_count (vs max_errors)
Resultado = PASS se todos os KPIs atingidos
```

### Estados da Submissão
```
IN_PROGRESS → PENDING_REVIEW → APPROVED / REJECTED
                              → (retry allowed) → IN_PROGRESS (retry)
```

### Atores: TRAINER (cria, libera, revisa), STUDENT (executa, submete)

---

## 8. Desafios — Tipo SUMMARY

### Descrição
Desafio SUMMARY é uma avaliação condensada onde o formador regista os totais diretamente (sem operações individuais).

### Fluxo Completo
```
1. CRIAR DESAFIO SUMMARY
   Trainer → POST /api/challenges/
   {course_id, title, challenge_type: "SUMMARY", ...}

2. LIBERAR
   (mesmo fluxo do COMPLETE)

3. SUBMETER RESUMO
   Trainer → POST /api/challenges/submit/summary
   {challenge_id, student_id, training_plan_id,
    total_operations: 150, total_time_minutes: 45,
    errors_count: 3,
    error_methodology: 1, error_knowledge: 1,
    error_detail: 0, error_procedure: 1}

4. FINALIZAR RESUMO
   Trainer → POST /api/challenges/submissions/{sub_id}/finalize-summary
   └─ Calcula MPU, compara KPIs, aprova/rejeita
```

### Atores: TRAINER (regista e finaliza), STUDENT (passivo — é avaliado)

---

## 9. Finalização e Certificação

### Descrição
A finalização é o processo de marcar cursos e planos como concluídos, gerando opcionalmente certificados PDF.

### Fluxo de Finalização
```
1. VERIFICAR ESTADO DO CURSO NO PLANO
   → GET /api/finalization/course/{plan_id}/{course_id}/status
   └─ Retorna: lições done, desafios done, % completo

2. FINALIZAR CURSO
   Trainer → POST /api/finalization/course/{plan_id}/{course_id}/finalize
   ├─ Verifica todas as lições aprovadas
   ├─ Verifica todos os desafios aprovados
   └─ TrainingPlanCourse.status → "COMPLETED"

3. VERIFICAR ESTADO DO PLANO
   → GET /api/finalization/plan/{plan_id}/status
   └─ Retorna: cursos done, % geral, ready_to_finalize

4. FINALIZAR PLANO + CERTIFICADO
   Trainer → POST /api/finalization/plan/{plan_id}/finalize
   {generate_certificate: true, notes: "..."}
   ├─ Verifica todos os cursos finalizados
   ├─ TrainingPlan.status → "COMPLETED"
   ├─ Gera Certificate com número único
   │   ├─ certificate_number (auto-generated)
   │   ├─ student_name, training_plan_title
   │   ├─ total_hours (soma das lições)
   │   ├─ courses_completed (count)
   │   ├─ average_mpu (média dos desafios)
   │   └─ average_approval_rate (% aprovação)
   └─ Retorna: {success, certificate_id}
```

### Certificado
```
Student → GET /api/certificates/          (lista)
Student → GET /api/certificates/{id}      (detalhes)
Student → GET /api/certificates/{id}/pdf  (download PDF)
Student → GET /api/certificates/by-plan/{plan_id}  (por plano)
```

### Atores: TRAINER/ADMIN (finalização), STUDENT (consulta certificados)

---

## 10. Tutoria — Gestão de Erros

### Descrição
O módulo de Tutoria gere erros operacionais. O Tutor regista erros dos seus tutorados, analisa causas, e o Chefe (Manager) aprova.

### Fluxo Completo do Erro
```
1. REGISTAR ERRO
   Tutor → POST /api/tutoria/errors
   {tutorado_id, category_id, bank_id, product_id,
    date_occurrence, description,
    impact_id, origin_id, detected_by_id,
    department_id, activity_id, error_type_id,
    reference_code, currency, amount, severity}
   └─ Status: REGISTERED

2. ANÁLISE (5 Porquês)
   Tutor → PATCH /api/tutoria/errors/{id}/analysis
   {analysis_5_why: "1. Porque... 2. Porque...",
    is_recurrent, recurrence_type, solution}
   └─ Enriquece o registo

3. SUBMETER ANÁLISE
   Tutor → POST /api/tutoria/errors/{id}/submit-analysis
   └─ Status: PENDING_CHIEF_APPROVAL
   └─ Notificação enviada ao chefe

4a. CHEFE APROVA
    Manager → POST /api/tutoria/errors/{id}/approve-chief
    └─ Status: ANALYSIS_APPROVED

4b. CHEFE DEVOLVE
    Manager → POST /api/tutoria/errors/{id}/return-analysis
    {reason: "Precisa mais detalhe no 5 porquês"}
    └─ Status: RETURNED (volta ao passo 2)

5. CRIAR PLANOS DE AÇÃO (ver fluxo 11)

6. APROVAÇÃO DOS PLANOS
   Manager → POST /api/tutoria/errors/{id}/approve-plans
   └─ Status: PLANS_APPROVED

7. CONFIRMAÇÃO DA SOLUÇÃO
   Tutor → POST /api/tutoria/errors/{id}/confirm-solution
   └─ solution_confirmed=True

8. RESOLUÇÃO
   Tutor → POST /api/tutoria/errors/{id}/resolve
   └─ Status: RESOLVED

9. VERIFICAÇÃO FINAL (opcional)
   Tutor → POST /api/tutoria/errors/{id}/verify
   └─ Status: VERIFIED
```

### Estados do Erro
```
REGISTERED → PENDING_CHIEF_APPROVAL → ANALYSIS_APPROVED → PLANS_APPROVED
         ↓                          ↑                                    ↓
      RETURNED ←————————————————————                           RESOLVED → VERIFIED
         ↓
      CANCELLED
```

### Operações Alternativas
```
- DESATIVAR: POST /api/tutoria/errors/{id}/deactivate → is_active=False
- CANCELAR:  POST /api/tutoria/errors/{id}/cancel {reason} → Status: CANCELLED
```

### Atores
- **Tutor**: Regista, analisa, submete, confirma, resolve
- **Manager/Chefe**: Aprova, devolve
- **Referente**: Visualiza, pode aprovar em nome do chefe

---

## 11. Tutoria — Planos de Ação

### Descrição
Cada erro de tutoria pode ter múltiplos planos de ação (corretivo, preventivo, melhoria), cada um com items de ação específicos.

### Fluxo do Plano
```
1. CRIAR PLANO
   Tutor → POST /api/tutoria/errors/{error_id}/plans
   {analysis_5_why, immediate_correction, corrective_action,
    preventive_action, plan_type: "CORRECTIVO",
    responsible_id, deadline,
    what, why, where_field, when_deadline, who, how, how_much}
   └─ Status: OPEN

2. ADICIONAR ITEMS DE AÇÃO
   Tutor → POST /api/tutoria/plans/{plan_id}/items
   {type: "CORRETIVA", description: "...",
    responsible_id, due_date}
   └─ TutoriaActionItem (Status: PENDENTE)

3. SUBMETER PLANO
   Tutor → POST /api/tutoria/plans/{plan_id}/submit
   └─ Status: SUBMITTED

4a. CHEFE APROVA
    Manager → POST /api/tutoria/plans/{plan_id}/approve
    └─ Status: APPROVED

4b. CHEFE DEVOLVE
    Manager → POST /api/tutoria/plans/{plan_id}/return
    └─ Status: RETURNED (volta ao passo 1)

5. INICIAR EXECUÇÃO
   Tutor → PATCH /api/tutoria/plans/{plan_id}/start
   └─ Status: IN_PROGRESS, started_at=now()

6. EXECUTAR ITEMS
   Tutor → PATCH /api/tutoria/items/{item_id}
   {status: "CONCLUIDO", evidence_text: "Evidência da correção"}

   Manager pode devolver:
   Manager → POST /api/tutoria/items/{item_id}/return
   {reviewer_comment: "Falta evidência"}
   └─ Item status: DEVOLVIDO

7. CONCLUIR PLANO
   Tutor → PATCH /api/tutoria/plans/{plan_id}/complete
   └─ Status: COMPLETED, completed_at=now()

8. VALIDAÇÃO FINAL
   Manager → POST /api/tutoria/plans/{plan_id}/validate
   {result_score: 4, result_comment: "Bem executado"}
   └─ Status: VALIDATED
```

### Estados do Plano
```
OPEN → SUBMITTED → APPROVED → IN_PROGRESS → COMPLETED → VALIDATED
                 ↑          ↓
              RETURNED ←————
```

### Estados dos Items
```
PENDENTE → EM_ANDAMENTO → CONCLUIDO
                        ↑
                   DEVOLVIDO
```

### Learning Sheets
```
Tutor → POST /api/tutoria/learning-sheets
{error_id, tutorado_id, title, error_summary,
 root_cause, correct_procedure, key_learnings,
 reference_material, is_mandatory}

Tutor → POST /api/tutoria/learning-sheets/{id}/submit
Manager → PATCH /api/tutoria/learning-sheets/{id}/review
{tutor_outcome: "FEEDBACK_DIRETO", tutor_notes: "..."}
```

### Comentários (em qualquer etapa)
```
POST /api/tutoria/errors/{id}/comments {content}
POST /api/tutoria/plans/{id}/comments {content}
```

### Atores
- **Tutor**: Cria planos, items, learning sheets, executa
- **Manager**: Aprova, devolve, valida, review sheets

---

## 12. Erros Internos (Sensos)

### Descrição
Erros Internos são registados dentro de "Sensos" (períodos de auditoria). O Liberador regista, o Tutor avalia e cria planos de ação.

### Fluxo Completo
```
1. CRIAR SENSO (período de auditoria)
   Tutor → POST /api/internal-errors/sensos
   {name: "Senso Q1 2026", start_date, end_date}
   └─ Status: ATIVO

2. REGISTAR ERRO INTERNO
   Liberador → POST /api/internal-errors/errors
   {senso_id, gravador_id, liberador_id,
    description, date_occurrence,
    impact_id, category_id, error_type_id,
    department_id, activity_id, bank_id,
    reference_code}
   └─ Status: PENDENTE

3. AVALIAR ERRO (Tutor)
   Tutor → PATCH /api/internal-errors/errors/{id}
   {peso_liberador: 8, peso_gravador: 5, peso_tutor: 7,
    why_1: "Porque...", why_2: "Porque...",
    tutor_evaluation: "Falta de conhecimento do procedimento"}
   └─ Status: AVALIADO

4. CRIAR PLANO DE AÇÃO
   Tutor → POST /api/internal-errors/errors/{id}/action-plan
   {description: "Plano para corrigir o erro"}
   └─ Status: PLANO_CRIADO

5. ADICIONAR ITEMS
   Tutor → POST /api/internal-errors/errors/{id}/action-plan/items
   {items: [{description, type: "CORRETIVA", responsible_id, due_date}]}

6. EXECUTAR ITEMS
   Tutor → PATCH /api/internal-errors/action-items/{id}
   {status: "CONCLUIDO"}

7. CRIAR LEARNING SHEET
   Tutor → POST /api/internal-errors/errors/{id}/learning-sheet
   {tutorado_id, error_summary, impact_description,
    actions_taken, lessons_learned, recommendations}

8. ALUNO LÊ LEARNING SHEET
   Student → GET /api/internal-errors/my-learning-sheets
   Student → POST /api/internal-errors/learning-sheets/{id}/mark-read
   └─ is_read=True, read_at=now()
```

### Estados do Erro Interno
```
PENDENTE → AGUARDANDO_GRAVADOR → AVALIADO → PLANO_CRIADO → CONCLUIDO
```

### Lookups Disponíveis
```
GET /api/internal-errors/lookups/impacts
GET /api/internal-errors/lookups/categories
GET /api/internal-errors/lookups/error-types
GET /api/internal-errors/lookups/departments
GET /api/internal-errors/lookups/activities
GET /api/internal-errors/lookups/banks
```

### Atores
- **Liberador**: Regista erros internos
- **Tutor**: Avalia, cria planos, cria learning sheets
- **Student**: Lê learning sheets

---

## 13. Chamados (Suporte)

### Descrição
Sistema de tickets para reportar bugs e sugerir melhorias. Qualquer utilizador autenticado pode criar, apenas ADMIN pode gerir.

### Fluxo Completo
```
1. CRIAR CHAMADO
   Qualquer user → POST /api/chamados
   {title: "Bug no relatório",
    description: "Quando clico em...",
    type: "BUG",           // BUG ou MELHORIA
    priority: "ALTA",      // BAIXA, MEDIA, ALTA, CRITICA
    portal: "RELATORIOS",  // FORMACOES, TUTORIA, RELATORIOS, DADOS_MESTRES, GERAL
    attachments: [{...}]}  // Screenshots em base64
   └─ Status: ABERTO

2. ADICIONAR COMENTÁRIOS
   Qualquer user → POST /api/chamados/{id}/comments
   {content: "Consegui reproduzir o bug"}

3. ADMIN ATUALIZA
   Admin → PUT /api/chamados/{id}
   {status: "EM_ANDAMENTO",
    assigned_to_id: 35,    // Atribuir a um utilizador
    admin_notes: "Bug confirmado, a investigar"}

4. ADMIN RESOLVE
   Admin → PUT /api/chamados/{id}
   {status: "CONCLUIDO"}
   └─ completed_at = now()

5. ADMIN ELIMINA (se necessário)
   Admin → DELETE /api/chamados/{id}
```

### Estados
```
ABERTO → EM_ANDAMENTO → EM_REVISAO → CONCLUIDO
```

### Visibilidade
```
ADMIN → vê todos os chamados
STUDENT/TRAINER → vê apenas os próprios
```

### Atores
- **Qualquer user**: Cria, comenta, visualiza (próprios)
- **ADMIN**: Gere, atribui, atualiza estado, elimina

---

## 14. Equipas

### Descrição
Equipas organizam utilizadores e são associadas a produtos/serviços. Geridas exclusivamente pelo ADMIN.

### Fluxo de Gestão
```
1. CRIAR EQUIPA
   Admin → POST /api/teams
   {name: "Equipa Alpha", description: "Equipa de operações", manager_id: 33}
   └─ Cria Team

2. ADICIONAR MEMBROS
   Admin → POST /api/teams/{id}/members
   {user_id: 37}
   └─ Cria TeamMember + atualiza user.team_id

3. ADICIONAR SERVIÇOS
   Admin → POST /api/teams/{id}/services
   {product_id: 5}
   └─ Cria TeamService

4. VISUALIZAR
   Admin/Manager → GET /api/teams/{id}          (detalhes)
   Admin/Manager → GET /api/teams/{id}/members   (membros)
   Admin/Manager → GET /api/teams/{id}/services   (serviços)

5. GERIR
   Admin → PATCH /api/teams/{id}                  (atualizar)
   Admin → DELETE /api/teams/{id}/members/{uid}    (remover membro)
   Admin → DELETE /api/teams/{id}/services/{pid}   (remover serviço)
   Admin → DELETE /api/teams/{id}                  (eliminar equipa)

6. USERS NÃO ATRIBUÍDOS
   Admin → GET /api/users/unassigned
   └─ Lista users sem equipa (para atribuir)
```

### Atores
- **ADMIN**: CRUD completo
- **MANAGER**: Leitura

---

## 15. Ratings (Avaliações)

### Descrição
Alunos avaliam cursos, lições, desafios, formadores e planos de formação com estrelas (0-5) e comentários.

### Fluxo
```
1. SUBMETER RATING
   Student → POST /api/ratings/submit
   {rating_type: "COURSE",    // COURSE, LESSON, CHALLENGE, TRAINER, TRAINING_PLAN
    course_id: 5,             // FK correspondente ao tipo
    stars: 4,
    comment: "Muito bom curso"}
   └─ Cria ou atualiza Rating (upsert)

2. VERIFICAR SE JÁ AVALIOU
   Student → GET /api/ratings/check?rating_type=COURSE&course_id=5
   ou
   Student → GET /api/ratings/check/COURSE/5
   └─ {exists: true/false, rating: {...}}

3. LISTAR MINHAS AVALIAÇÕES
   Student → GET /api/ratings/my-ratings
   └─ Todas as avaliações do aluno

4. ADMIN — VER TODAS
   Admin → GET /api/ratings/admin/all?rating_type=COURSE
   └─ Lista com filtros

5. ADMIN — RESUMO POR ITEM
   Admin → GET /api/ratings/admin/summary
   └─ Média, total, distribuição por estrelas

6. ADMIN — AVALIAÇÕES DE ITEM ESPECÍFICO
   Admin → GET /api/ratings/admin/item/COURSE/5
   └─ Todas as avaliações desse curso

7. ADMIN — DASHBOARD
   Admin → GET /api/ratings/admin/dashboard
   └─ NPS, top rated, bottom rated, trends
```

### Tipos de Rating
| Tipo | Entidade | FK |
|------|----------|-----|
| COURSE | Curso | course_id |
| LESSON | Lição | lesson_id |
| CHALLENGE | Desafio | challenge_id |
| TRAINER | Formador | trainer_id |
| TRAINING_PLAN | Plano | training_plan_id |

### Atores
- **STUDENT**: Submete, consulta
- **ADMIN/MANAGER**: Dashboard, relatórios

---

## Diagrama de Dependências entre Fluxos

```
                    ┌─────────────────┐
                    │  Autenticação    │
                    │  (Fluxo 1)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
   ┌──────────▼──┐  ┌───────▼───┐  ┌───────▼──────┐
   │ Validação   │  │  Master   │  │   Equipas    │
   │ Formador    │  │  Data     │  │  (Fluxo 14)  │
   │ (Fluxo 3)  │  │  (ADMIN)  │  └──────────────┘
   └──────┬──────┘  └───────────┘
          │
   ┌──────▼─────────┐
   │  Cursos         │
   │  (Fluxo 4)      │
   └──────┬──────────┘
          │
   ┌──────▼──────────┐     ┌───────────────┐
   │ Plano Formação   │────▶│ Atribuição     │
   │  (Fluxo 5)       │     │  Alunos        │
   └──┬──────┬────────┘     └───────────────┘
      │      │
      │      │
┌─────▼──┐  ┌▼────────────┐
│ Lições  │  │  Desafios    │
│(Fluxo 6)│  │(Fluxos 7/8) │
└────┬────┘  └──────┬──────┘
     │               │
     └───────┬───────┘
             │
   ┌─────────▼──────────┐
   │  Finalização +     │
   │  Certificação      │
   │  (Fluxo 9)         │
   └─────────┬──────────┘
             │
   ┌─────────▼──────────┐
   │  Ratings            │
   │  (Fluxo 15)         │
   └─────────────────────┘


   ┌────────────────────┐
   │  Tutoria            │     ┌──────────────────┐
   │  (Fluxos 10/11)     │────▶│ Learning Sheets   │
   └────────────────────┘     └──────────────────┘

   ┌────────────────────┐
   │  Erros Internos     │     ┌──────────────────┐
   │  (Fluxo 12)         │────▶│ Learning Sheets   │
   └────────────────────┘     └──────────────────┘

   ┌────────────────────┐
   │  Chamados           │
   │  (Fluxo 13)         │   (independente)
   └────────────────────┘
```

---

## Resumo Quantitativo

| Fluxo | Endpoints | Estados | Roles Envolvidas |
|-------|-----------|---------|------------------|
| Autenticação | 3 | — | Todos |
| Reset Password | 4 | — | Público |
| Validação Formador | 3 | 2 | TRAINER, ADMIN |
| Cursos | 15 | — | TRAINER, ADMIN, STUDENT |
| Planos Formação | 17 | 4 | TRAINER, ADMIN, STUDENT |
| Lições | 11 | 5 | TRAINER, STUDENT |
| Desafios COMPLETE | 20 | 4 | TRAINER, STUDENT |
| Desafios SUMMARY | 5 | 3 | TRAINER |
| Finalização | 5 | — | TRAINER, ADMIN |
| Tutoria Erros | 15 | 7 | TUTOR, MANAGER, REFERENTE |
| Tutoria Planos | 15 | 6 | TUTOR, MANAGER |
| Erros Internos | 15 | 5 | TUTOR, LIBERADOR, STUDENT |
| Chamados | 6 | 4 | Todos, ADMIN (gestão) |
| Equipas | 12 | — | ADMIN, MANAGER |
| Ratings | 8 | — | STUDENT, ADMIN |
| **TOTAL** | **~154** | **~40** | **7 roles** |
