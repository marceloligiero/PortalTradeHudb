# Documentação Completa das Rotas da API TradeHub

## Índice

1. [Autenticação](#autenticação)
2. [Admin](#admin)
3. [Student](#student)
4. [Trainer](#trainer)
5. [Training Plans](#training-plans)
6. [Challenges](#challenges)
7. [Lessons](#lessons)
8. [Certificates](#certificates)
9. [Finalization](#finalization)
10. [Stats](#stats)
11. [Health Check](#health-check)

---

## Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/login` | Login de usuário | ❌ |
| POST | `/api/auth/register` | Registro de novo usuário | ❌ |
| GET | `/api/auth/me` | Obter dados do usuário logado | ✅ |

### Exemplos de Request

#### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

#### POST /api/auth/register
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "full_name": "Nome Completo",
  "role": "student" // ou "trainer"
}
```

---

## Admin

### Usuários

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/users` | Listar todos os usuários |
| POST | `/api/admin/users` | Criar novo usuário |
| GET | `/api/admin/users/{user_id}` | Obter usuário por ID |
| PUT | `/api/admin/users/{user_id}` | Atualizar usuário |
| DELETE | `/api/admin/users/{user_id}` | Deletar usuário |

### Trainers (Formadores)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/trainers` | Listar todos os formadores |
| GET | `/api/admin/pending-trainers` | Listar formadores pendentes de validação |
| POST | `/api/admin/validate-trainer/{user_id}` | Validar formador |
| POST | `/api/admin/reject-trainer/{user_id}` | Rejeitar formador |

### Students (Alunos)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/students` | Listar todos os alunos |

### Cursos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/courses` | Listar todos os cursos |
| POST | `/api/admin/courses` | Criar novo curso |
| GET | `/api/admin/courses/{course_id}` | Obter curso por ID |
| DELETE | `/api/admin/courses/{course_id}` | Deletar curso |
| GET | `/api/admin/courses/{course_id}/lessons/{lesson_id}` | Obter lição de curso |
| DELETE | `/api/admin/courses/{course_id}/lessons/{lesson_id}` | Deletar lição de curso |
| GET | `/api/admin/courses/{course_id}/challenges/{challenge_id}` | Obter desafio de curso |
| PUT | `/api/admin/courses/{course_id}/challenges/{challenge_id}` | Atualizar desafio |
| DELETE | `/api/admin/courses/{course_id}/challenges/{challenge_id}` | Deletar desafio |

### Bancos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/banks` | Listar todos os bancos |
| POST | `/api/admin/banks` | Criar novo banco |
| PUT | `/api/admin/banks/{bank_id}` | Atualizar banco |
| DELETE | `/api/admin/banks/{bank_id}` | Deletar banco |

### Produtos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/products` | Listar todos os produtos |
| POST | `/api/admin/products` | Criar novo produto |
| PUT | `/api/admin/products/{product_id}` | Atualizar produto |
| DELETE | `/api/admin/products/{product_id}` | Deletar produto |

### Relatórios Admin

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/reports/stats` | Estatísticas gerais |
| GET | `/api/admin/reports/courses` | Relatório de cursos |
| GET | `/api/admin/reports/trainers` | Relatório de formadores |
| GET | `/api/admin/reports/training-plans` | Relatório de planos de formação |

### Relatórios Avançados

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/advanced-reports/dashboard-summary` | Resumo do dashboard |
| GET | `/api/admin/advanced-reports/student-performance` | Performance dos alunos |
| GET | `/api/admin/advanced-reports/trainer-productivity` | Produtividade dos formadores |
| GET | `/api/admin/advanced-reports/course-analytics` | Análise de cursos |
| GET | `/api/admin/advanced-reports/certifications` | Relatório de certificações |
| GET | `/api/admin/advanced-reports/mpu-analytics` | Análise MPU |

---

## Student

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/student/courses` | Listar cursos do aluno |
| POST | `/api/student/enroll/{course_id}` | Inscrever em curso |
| GET | `/api/student/certificates` | Listar certificados do aluno |
| GET | `/api/student/stats` | Estatísticas do aluno |

### Relatórios do Aluno

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/student/reports/dashboard` | Dashboard do aluno |
| GET | `/api/student/reports/overview` | Visão geral |
| GET | `/api/student/reports/courses` | Cursos do aluno |
| GET | `/api/student/reports/lessons` | Lições do aluno |
| GET | `/api/student/reports/achievements` | Conquistas do aluno |

---

## Trainer

### Cursos do Formador

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/trainer/courses` | Listar cursos do formador |
| POST | `/api/trainer/courses` | Criar novo curso |
| GET | `/api/trainer/courses/all` | Listar todos os cursos (com filtros) |
| GET | `/api/trainer/courses/{course_id}` | Obter curso por ID |
| PUT | `/api/trainer/courses/{course_id}` | Atualizar curso |
| DELETE | `/api/trainer/courses/{course_id}` | Deletar curso |
| GET | `/api/trainer/courses/details/{course_id}` | Detalhes completos do curso |
| GET | `/api/trainer/courses/{course_id}/lessons/{lesson_id}` | Obter lição |
| GET | `/api/trainer/courses/{course_id}/challenges/{challenge_id}` | Obter desafio |

### Lições

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/trainer/lessons` | Criar nova lição |

### Planos de Formação do Formador

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/trainer/training-plans` | Listar planos de formação |
| POST | `/api/trainer/training-plans` | Criar plano de formação |

### Relatórios do Formador

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/trainer/reports/overview` | Visão geral |
| GET | `/api/trainer/reports/students` | Relatório de alunos |
| GET | `/api/trainer/reports/lessons` | Relatório de lições |
| GET | `/api/trainer/reports/plans` | Relatório de planos |
| GET | `/api/trainer/stats` | Estatísticas do formador |

---

## Training Plans (Planos de Formação)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/training-plans/` | Listar planos de formação |
| POST | `/api/training-plans/` | Criar plano de formação |
| GET | `/api/training-plans/{plan_id}` | Obter plano por ID |
| PUT | `/api/training-plans/{plan_id}` | Atualizar plano |
| DELETE | `/api/training-plans/{plan_id}` | Deletar plano |
| POST | `/api/training-plans/{plan_id}/assign` | Atribuir aluno ao plano |
| DELETE | `/api/training-plans/{plan_id}/unassign/{student_id}` | Remover aluno do plano |
| GET | `/api/training-plans/{plan_id}/students` | Listar alunos do plano |
| GET | `/api/training-plans/{plan_id}/completion-status` | Status de conclusão |
| POST | `/api/training-plans/{plan_id}/finalize` | Finalizar plano |
| GET | `/api/training-plans/trainers` | Listar formadores disponíveis |
| GET | `/api/training-plans/test` | Endpoint de teste |
| POST | `/api/training-plans/test` | Endpoint de teste (POST) |

---

## Challenges (Desafios)

### CRUD de Desafios

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/challenges/` | Criar novo desafio |
| GET | `/api/challenges/{challenge_id}` | Obter desafio por ID |
| PUT | `/api/challenges/{challenge_id}` | Atualizar desafio |
| GET | `/api/challenges/course/{course_id}` | Listar desafios de um curso |

### Liberação de Desafios

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/challenges/{challenge_id}/release` | Liberar desafio para todos |
| POST | `/api/challenges/{challenge_id}/release/{student_id}` | Liberar desafio para aluno específico |
| GET | `/api/challenges/{challenge_id}/is-released/{student_id}` | Verificar se desafio está liberado |
| GET | `/api/challenges/{challenge_id}/can-start/{student_id}` | Verificar se pode iniciar desafio |
| GET | `/api/challenges/{challenge_id}/eligible-students` | Listar alunos elegíveis |
| GET | `/api/challenges/{challenge_id}/eligible-students/debug` | Debug de elegibilidade |

### Submissões

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/challenges/{challenge_id}/submissions` | Listar submissões do desafio |
| GET | `/api/challenges/submissions/{submission_id}` | Obter submissão por ID |
| GET | `/api/challenges/submissions/{submission_id}/operations` | Listar operações da submissão |
| POST | `/api/challenges/submissions/{submission_id}/operations/start` | Iniciar operação |
| POST | `/api/challenges/submissions/{submission_id}/submit-for-review` | Submeter para revisão |
| POST | `/api/challenges/submissions/{submission_id}/finalize-review` | Finalizar revisão |
| POST | `/api/challenges/submissions/{submission_id}/manual-finalize` | Finalização manual |
| POST | `/api/challenges/submissions/{submission_id}/allow-retry` | Permitir nova tentativa |
| POST | `/api/challenges/submissions/{submission_id}/start-retry` | Iniciar nova tentativa |

### Fluxo Completo de Submissão

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/challenges/submit/complete/start/{challenge_id}` | Iniciar submissão completa |
| POST | `/api/challenges/submit/complete/start/{challenge_id}/self` | Iniciar submissão própria |
| POST | `/api/challenges/submit/complete/{submission_id}/part` | Submeter parte |
| POST | `/api/challenges/submit/complete/{submission_id}/finish` | Finalizar submissão |
| POST | `/api/challenges/submit/summary` | Resumo da submissão |

### Operações

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/challenges/operations/{operation_id}/classify` | Classificar operação |
| POST | `/api/challenges/operations/{operation_id}/finish` | Finalizar operação |

### Área do Aluno

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/challenges/student/released` | Desafios liberados para o aluno |
| GET | `/api/challenges/student/my-submissions` | Minhas submissões |

### Revisão

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/challenges/pending-review/list` | Lista de pendentes para revisão |

---

## Lessons (Lições)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/lessons/student/my-lessons` | Minhas lições |
| GET | `/api/lessons/{lesson_id}/detail` | Detalhes da lição |
| GET | `/api/lessons/{lesson_id}/progress` | Progresso da lição |
| GET | `/api/lessons/{lesson_id}/timer-state` | Estado do temporizador |
| POST | `/api/lessons/{lesson_id}/start` | Iniciar lição |
| POST | `/api/lessons/{lesson_id}/pause` | Pausar lição |
| POST | `/api/lessons/{lesson_id}/resume` | Retomar lição |
| POST | `/api/lessons/{lesson_id}/finish` | Finalizar lição |
| POST | `/api/lessons/{lesson_id}/confirm` | Confirmar lição |
| POST | `/api/lessons/{lesson_id}/release` | Liberar lição |
| POST | `/api/lessons/{lesson_id}/approve` | Aprovar lição |

---

## Certificates (Certificados)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/certificates/` | Listar todos os certificados |
| GET | `/api/certificates/{certificate_id}` | Obter certificado por ID |
| GET | `/api/certificates/{certificate_id}/pdf` | Download do PDF do certificado |
| GET | `/api/certificates/by-plan/{plan_id}` | Certificados por plano |

---

## Finalization (Finalização)

### Finalização de Curso

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/finalization/course/{training_plan_id}/{course_id}/status` | Status de finalização do curso |
| POST | `/api/finalization/course/{training_plan_id}/{course_id}/finalize` | Finalizar curso |

### Finalização de Plano

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/finalization/plan/{training_plan_id}/status` | Status de finalização do plano |
| GET | `/api/finalization/plan/{training_plan_id}/calculate-status` | Calcular status |
| POST | `/api/finalization/plan/{training_plan_id}/finalize` | Finalizar plano |

---

## Stats (Estatísticas)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/stats/kpis` | KPIs gerais |
| GET | `/api/stats/courses/featured` | Cursos em destaque |
| GET | `/api/stats/training-plans/featured` | Planos em destaque |

---

## Health Check

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Rota raiz |
| GET | `/health` | Verificação de saúde da API |

---

## Documentação Swagger

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |
| GET | `/openapi.json` | OpenAPI JSON Schema |

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 204 | Sem conteúdo (deletado) |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Proibido |
| 404 | Não encontrado |
| 422 | Erro de validação |
| 500 | Erro interno do servidor |

---

## Autenticação

Todas as rotas (exceto login, register e health) requerem autenticação via JWT.

### Header de Autenticação
```
Authorization: Bearer <token>
```

### Roles disponíveis
- `admin` - Acesso total
- `trainer` - Gerenciar cursos, lições e alunos
- `student` - Acessar cursos e submeter desafios

---

## Notas

1. Todas as datas são retornadas em formato ISO 8601
2. IDs são integers
3. Paginação disponível via query params `skip` e `limit`
4. Filtros disponíveis variam por endpoint

---

*Documentação gerada automaticamente - Última atualização: Janeiro 2025*
