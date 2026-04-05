# Manual de Ações por Portal — PortalTradeHub

> **Documento de referência operacional** — Lista completa de todas as ações disponíveis em cada portal, com a role necessária e o utilizador real da base de dados a usar em cada passo.

---

## Índice

1. [Utilizadores da Base de Dados](#utilizadores-da-base-de-dados)
2. [Sistema de Roles e Flags](#sistema-de-roles-e-flags)
3. [Autenticação (Login / Registo)](#autenticação)
4. [Portal de Formações — Estudante](#portal-de-formações--estudante)
5. [Portal de Formações — Formador](#portal-de-formações--formador)
6. [Portal de Formações — Admin / Gestor](#portal-de-formações--admin--gestor)
7. [Portal de Tutoria](#portal-de-tutoria)
8. [Portal de Relatórios](#portal-de-relatórios)
9. [Portal de Dados Mestres](#portal-de-dados-mestres)
10. [Portal de Chamados](#portal-de-chamados)
11. [Hierarquia Organizacional](#hierarquia-organizacional)

---

## Utilizadores da Base de Dados

### Credenciais por Perfil

| Utilizador | Email | Palavra-passe | Role / Flags |
|---|---|---|---|
| **Administrador** | admin@tradehub.com | `admin123` | ADMIN |
| **Formadora** | ana.silva@banco.pt | `Demo1234!` | USUARIO + `is_formador=True` |
| **Formador** | carlos.santos@banco.pt | `Demo1234!` | USUARIO + `is_formador=True` |
| **Chefe de Equipa + Tutora** | maria.pereira@banco.pt | `Demo1234!` | USUARIO + `is_chefe_equipe=True` + `is_tutor=True` |
| **Tutor** | joao.costa@banco.pt | `Demo1234!` | USUARIO + `is_tutor=True` |
| **Gerente** | antonio.faria@banco.pt | `Demo1234!` | USUARIO + `is_gerente=True` |
| **Estudante 1** | paula.ferreira@banco.pt | `Demo1234!` | TRAINEE (estudante básico) |
| **Estudante 2** | rui.oliveira@banco.pt | `Demo1234!` | TRAINEE |
| **Estudante 3** | sofia.rodrigues@banco.pt | `Demo1234!` | TRAINEE |
| **Estudante 4** | pedro.lima@banco.pt | `Demo1234!` | TRAINEE |
| **Estudante 5** | ines.martins@banco.pt | `Demo1234!` | TRAINEE |
| **Gestor de Equipa (teste)** | manager_test@tradehub.com | `Test1234!` | CHEFE_EQUIPE |
| **Formador (teste)** | trainer_test@tradehub.com | `Test1234!` | FORMADOR + `is_formador=True` |
| **Tutor (teste)** | tutor_test@tradehub.com | `Test1234!` | USUARIO + `is_tutor=True` |
| **Estudante (teste)** | student_test@tradehub.com | `Test1234!` | USUARIO |
| **Liberador (teste)** | liberador_test@tradehub.com | `Test1234!` | USUARIO + `is_liberador=True` |
| **Referente (teste)** | referente_test@tradehub.com | `Test1234!` | USUARIO + `is_referente=True` |
| **Chefe (teste)** | chefe_test@tradehub.com | `Test1234!` | CHEFE_EQUIPE + `is_chefe_equipe=True` |

---

## Sistema de Roles e Flags

O controlo de acesso é feito pelas **flags booleanas**, não pela coluna `role`. A mesma pessoa pode ter múltiplas flags activas.

| Flag | Quem tem | Pode fazer |
|---|---|---|
| `is_admin` | admin@tradehub.com | Tudo |
| `is_diretor` | — | Ler tudo; sem edições destrutivas |
| `is_gerente` | antonio.faria@banco.pt | Gerir equipas e relatórios da área |
| `is_chefe_equipe` | maria.pereira, manager_test, chefe_test | Gerir equipa própria, ver dados da equipa |
| `is_formador` | ana.silva, carlos.santos, trainer_test | Criar e gerir cursos e planos de formação |
| `is_tutor` | maria.pereira, joao.costa, tutor_test | Tutoria operacional de erros |
| `is_liberador` | liberador_test | Aprovar/libertar operações |
| `is_referente` | referente_test | Representante de equipa |

### Níveis de Acesso Compostos

| Nível | Inclui |
|---|---|
| `is_gestor_or_above` | ADMIN + DIRETOR + GERENTE |
| `can_manage_teams` | ADMIN + GERENTE + CHEFE_EQUIPE |
| `is_tutor_or_above` (tutoria) | TUTOR + GERENTE + ADMIN |
| `is_manager` (tutoria) | ADMIN + DIRETOR + GERENTE + TUTOR |
| `is_chefe_referente_manager` | CHEFE_EQUIPE + REFERENTE + GERENTE + ADMIN |

---

## Autenticação

### Acção 1 — Fazer Login

**Role necessária:** Qualquer utilizador registado e activo
**Utilizador de exemplo:** paula.ferreira@banco.pt

1. Aceder à página inicial: `http://portaltradedatahub`
2. Clicar em **Entrar** na navbar ou navegar para `/login`
3. Preencher o campo **Email** com `paula.ferreira@banco.pt`
4. Preencher o campo **Palavra-passe** com `Demo1234!`
5. Clicar em **Entrar**
6. O sistema redireciona automaticamente para o dashboard da role do utilizador

---

### Acção 2 — Registar Nova Conta

**Role necessária:** Público (sem autenticação)

1. Aceder a `/register`
2. Preencher **Nome Completo**, **Email** e **Palavra-passe**
3. Seleccionar o tipo de conta:
   - **Estudante** (USUARIO) → activo imediatamente
   - **Formador** → fica `is_pending=True` até aprovação do admin
   - **Gerente / Chefe de Equipa** → fica pendente
4. Clicar em **Criar Conta**
5. Se conta pendente: aguardar aprovação em **Dados Mestres → Validação de Formadores**

---

### Acção 3 — Recuperar Palavra-passe

**Role necessária:** Público

1. Aceder a `/forgot-password`
2. Introduzir o email da conta (ex.: `rui.oliveira@banco.pt`)
3. Clicar em **Enviar link**
4. Verificar o email recebido e clicar no link de reset
5. Definir nova palavra-passe em `/reset-password?token=...`

---

## Portal de Formações — Estudante

> **Utilizadores:** paula.ferreira, rui.oliveira, sofia.rodrigues, pedro.lima, ines.martins, student_test
> **Acesso:** Qualquer utilizador autenticado e activo
> **URL base:** `http://portaltradedatahub/`

---

### Acção 4 — Ver Dashboard do Estudante

**Role:** Qualquer autenticado
**Utilizador:** paula.ferreira@banco.pt

1. Fazer login com `paula.ferreira@banco.pt` / `Demo1234!`
2. O sistema abre automaticamente o **Dashboard do Estudante**
3. Visualizar os KPIs: inscrições activas, planos de formação, lições iniciadas, horas de estudo, certificados, submissões de desafios, MPU médio, taxa de conclusão
4. Na secção **Meus Planos Activos**, ver o(s) plano(s) com barra de progresso e dias restantes
5. Clicar em **Ver Plano** para aceder ao detalhe

---

### Acção 5 — Ver e Inscrever-se em Cursos

**Role:** Qualquer autenticado
**Utilizador:** rui.oliveira@banco.pt

1. No menu lateral, clicar em **Cursos** (`/courses` ou `/my-courses`)
2. A lista mostra todos os cursos disponíveis com nome, formador, banco associado, número de lições e desafios
3. Para ver o detalhe de um curso: clicar no nome do curso
4. No detalhe do curso (`/courses/{id}`):
   - Ver as lições disponíveis
   - Ver os desafios associados
   - Clicar em **Inscrever-me** para se auto-inscrever
5. O sistema confirma a inscrição e o curso aparece em **Meus Cursos**

---

### Acção 6 — Ver os Meus Planos de Formação

**Role:** Qualquer autenticado
**Utilizador:** sofia.rodrigues@banco.pt

1. No menu lateral, clicar em **Os Meus Planos** (`/my-plans`)
2. A lista mostra todos os planos de formação atribuídos ao utilizador, com:
   - Nome do plano e formador responsável
   - Progresso percentual com barra visual
   - Data de início e fim
   - Estado: A Decorrer, Atrasado, Concluído, Aguardando confirmação
3. Clicar num plano para ver o detalhe (`/training-plan/{id}`)
4. No detalhe: ver os cursos incluídos, o progresso por curso e as datas esperadas

---

### Acção 7 — Consumir uma Lição

**Role:** Qualquer autenticado (deve estar inscrito no curso)
**Utilizador:** pedro.lima@banco.pt

1. Navegar para um curso em que esteja inscrito: **Meus Cursos** → seleccionar curso
2. Clicar no nome de uma lição disponível
3. O sistema abre a vista de lição (`/lessons/{id}/view`)
4. Consumir o conteúdo: texto, vídeo embebido, link para materiais
5. No final, clicar **Marcar como Concluída**
6. O progresso do curso é actualizado automaticamente

---

### Acção 8 — Executar um Desafio

**Role:** Qualquer autenticado (deve estar inscrito no curso)
**Utilizador:** ines.martins@banco.pt

1. No menu lateral, clicar em **Os Meus Desafios** (`/my-challenges`)
2. A lista mostra todos os desafios disponíveis para o utilizador
3. Verificar o estado de cada desafio:
   - **Disponível** → pode executar
   - **Submetido** → aguarda revisão do formador
   - **Aprovado / Reprovado** → ver feedback
4. Clicar em **Iniciar Desafio** num desafio disponível
5. No ecrã de execução (`/challenges/{id}/execute`):
   - Para **Execução Resumo**: preencher os campos de resumo e submeter
   - Para **Execução Completa**: preencher cada operação/linha individualmente, linha a linha
6. Clicar em **Submeter** → o desafio passa para **Aguardando Revisão**

---

### Acção 9 — Ver Resultado de um Desafio

**Role:** Qualquer autenticado
**Utilizador:** paulo.ferreira@banco.pt

1. Em **Os Meus Desafios**, localizar um desafio com estado **Aprovado** ou **Reprovado**
2. Clicar em **Ver Resultado**
3. O sistema abre a página de resultado (`/challenges/result/{submissionId}`)
4. Ver a pontuação, feedback do formador, erros cometidos e indicação de retry (se reprovado)

---

### Acção 10 — Ver Certificados

**Role:** Qualquer autenticado
**Utilizador:** sofia.rodrigues@banco.pt

1. No menu lateral, clicar em **Certificados** (`/certificates`)
2. A lista mostra todos os certificados emitidos com data, curso/plano associado
3. Clicar num certificado para ver a versão completa (`/certificates/{id}`)
4. O certificado mostra: nome do utilizador, curso concluído, data, formador responsável, número de cursos e lições concluídas

---

### Acção 11 — Ver Relatórios Pessoais

**Role:** Qualquer autenticado
**Utilizador:** rui.oliveira@banco.pt

1. No menu lateral, clicar em **Relatórios** (`/reports`)
2. O ecrã mostra:
   - **Visão Geral:** cursos totais/concluídos, horas de estudo, certificados, actividade recente
   - **Por Curso:** progresso percentual, data de inscrição, estado de conclusão, duração estimada
   - **Por Lição:** total de lições, concluídas, em progresso, taxa de conclusão
   - **Conquistas:** certificados como achievements com data e link

---

## Portal de Formações — Formador

> **Utilizadores:** ana.silva@banco.pt, carlos.santos@banco.pt, trainer_test@tradehub.com
> **Acesso:** Utilizadores com flag `is_formador=True`
> **URL base:** `http://portaltradedatahub/`

---

### Acção 12 — Ver Dashboard do Formador

**Role:** `is_formador=True`
**Utilizador:** ana.silva@banco.pt

1. Fazer login com `ana.silva@banco.pt` / `Demo1234!`
2. O Dashboard do Formador abre automaticamente
3. Visualizar KPIs:
   - Cursos criados, lições, planos activos/totais
   - Estudantes atribuídos, desafios, submissões pendentes
   - Taxa de aprovação, MPU médio, certificados emitidos
4. Ver a secção de **Actividade Recente** (últimos 7 dias)

---

### Acção 13 — Criar um Curso

**Role:** `is_formador=True` ou ADMIN
**Utilizador:** carlos.santos@banco.pt

1. No menu lateral, clicar em **Cursos** → **Novo Curso** (`/course/new`)
2. Preencher o formulário:
   - **Título do Curso** (ex.: "Liquidação de Títulos — Nível I")
   - **Descrição** — resumo do conteúdo
   - **Nível de dificuldade:** Principiante / Intermédio / Especialista
   - **Duração estimada** (em minutos)
   - **Bancos associados** — seleccionar da lista (ex.: BBVA, Santander)
   - **Produtos associados** — seleccionar da lista
3. Clicar em **Guardar Curso**
4. O curso fica visível em "Os Meus Cursos" com estado rascunho

---

### Acção 14 — Editar um Curso Existente

**Role:** `is_formador=True` (apenas cursos próprios) ou ADMIN
**Utilizador:** ana.silva@banco.pt

1. Em **Cursos**, localizar o curso a editar
2. Clicar nos três pontos (**⋮**) ou no botão **Editar**
3. Navega para `/courses/{id}/edit`
4. Alterar os campos necessários (título, descrição, bancos/produtos associados)
5. Clicar em **Guardar Alterações**

---

### Acção 15 — Adicionar uma Lição a um Curso

**Role:** `is_formador=True` ou ADMIN
**Utilizador:** carlos.santos@banco.pt

1. Abrir o detalhe do curso (`/courses/{id}`)
2. Na secção **Lições**, clicar em **Adicionar Lição** (`/courses/{id}/lessons/new`)
3. Preencher o formulário:
   - **Título da Lição** (ex.: "Tipos de Mercado de Capitais")
   - **Conteúdo** — texto em markdown com a matéria
   - **URL do Vídeo** (opcional — YouTube, Vimeo ou directo)
   - **URL de Materiais** (opcional — link para PDF/ficheiro)
   - **Duração estimada** (minutos)
   - **Ordem** — posição dentro do curso
4. Clicar em **Guardar Lição**

**Nota:** Adicionar uma lição a um curso num plano de formação já concluído reabre automaticamente esse plano.

---

### Acção 16 — Adicionar um Desafio a um Curso

**Role:** `is_formador=True` ou ADMIN
**Utilizador:** ana.silva@banco.pt

1. No detalhe do curso (`/courses/{id}`)
2. Na secção **Desafios**, clicar em **Adicionar Desafio** (`/courses/{id}/challenges/new`)
3. Preencher o formulário:
   - **Título** (ex.: "Desafio — Liquidação T+2")
   - **Descrição / Enunciado**
   - **Tipo:** Resumo ou Completo
   - **Pontuação máxima**
   - **Flags KPI** (ex.: is_mpu_challenge, is_final_challenge)
4. Clicar em **Guardar Desafio**

---

### Acção 17 — Criar um Plano de Formação

**Role:** `is_formador=True` ou ADMIN
**Utilizador:** trainer_test@tradehub.com

1. No menu lateral, clicar em **Planos de Formação** → **Novo Plano** (`/training-plan/new`)
2. Preencher o formulário:
   - **Título do Plano** (ex.: "Onboarding — Equipa Custódia Q2")
   - **Data de Início** e **Data de Fim**
   - **Estudante(s):** seleccionar da lista de utilizadores activos (USUARIO/FORMADOR)
     - Ex.: seleccionar `paula.ferreira@banco.pt`
   - **Cursos incluídos:** seleccionar os cursos que fazem parte do plano
   - **Bancos e Produtos** associados ao plano
   - **Formadores adicionais** (opcional)
3. Clicar em **Criar Plano**
4. O plano fica visível em "Os Meus Planos" para o formador e em "Os Meus Planos" do estudante

---

### Acção 18 — Gerir Plano de Formação — Adicionar Formador

**Role:** `is_formador=True` (plano próprio) ou ADMIN
**Utilizador:** trainer_test@tradehub.com

1. Abrir o detalhe do plano (`/training-plan/{id}`)
2. Na secção **Formadores**, clicar em **Adicionar Formador**
3. Seleccionar um utilizador com flag `is_formador=True` da lista:
   - Ex.: `ana.silva@banco.pt`
4. Clicar em **Confirmar**

**Nota Importante:** O sistema valida que o utilizador tem `is_formador=True` (não apenas pela coluna role). Utilizadores com `is_formador=True` mas `role=USUARIO` (como carlos.santos) aparecem na lista e podem ser adicionados.

---

### Acção 19 — Gerir Plano de Formação — Remover Formador

**Role:** `is_formador=True` (plano próprio) ou ADMIN
**Utilizador:** trainer_test@tradehub.com

1. No detalhe do plano, localizar o formador adicional a remover
2. Clicar no botão **Remover** junto ao nome do formador
3. Confirmar a remoção no diálogo

**Nota:** O formador primário (criador do plano) **não pode ser removido**.

---

### Acção 20 — Rever uma Submissão de Desafio

**Role:** `is_formador=True` ou ADMIN
**Utilizador:** ana.silva@banco.pt

1. No menu lateral, clicar em **Submissões Pendentes** (`/pending-reviews`)
2. A lista mostra todas as submissões a aguardar revisão dos estudantes dos planos do formador
3. Clicar em **Rever** numa submissão
4. O ecrã de revisão (`/submissions/{id}/review`) mostra:
   - A resposta do estudante (campo a campo)
   - Os valores correctos esperados
5. Para cada campo/linha:
   - Marcar como **Correcto** ou **Incorrecto**
   - Adicionar comentário de feedback (obrigatório se incorrecto)
6. Escolher o resultado final: **Aprovado** ou **Reprovado**
7. Clicar em **Submeter Revisão**

---

### Acção 21 — Executar um Desafio como Formador (Demonstração)

**Role:** `is_formador=True`
**Utilizador:** carlos.santos@banco.pt

1. Navegar para o desafio a demonstrar (`/courses/{id}/challenges/{cid}`)
2. Clicar em **Executar** → escolher modo:
   - **Resumo** (`/challenges/{cid}/execute/summary`): preencher campos de sumário
   - **Completo** (`/challenges/{cid}/execute/complete`): preencher linha a linha
3. Submeter a execução de demonstração

---

### Acção 22 — Ver Estudantes Atribuídos

**Role:** `is_formador=True` ou ADMIN
**Utilizador:** trainer_test@tradehub.com

1. No menu lateral, clicar em **Estudantes** (`/students`)
2. A lista mostra todos os estudantes dos planos criados/atribuídos ao formador
3. Para cada estudante: ver número de planos, progresso geral, cursos concluídos, MPU
4. Clicar num estudante para ver o detalhe

---

### Acção 23 — Ver Relatórios do Formador

**Role:** `is_formador=True`
**Utilizador:** ana.silva@banco.pt

1. No menu lateral, clicar em **Relatórios** (`/reports`)
2. Ver os separadores:
   - **Progresso dos Planos:** estado e % de conclusão de cada plano
   - **Desempenho por Estudante:** MPU médio, cursos concluídos, horas de estudo
   - **Desafios:** taxa de aprovação, tempo médio de resposta
3. Filtrar por plano, data ou estudante específico

---

## Portal de Formações — Admin / Gestor

> **Utilizadores Admin:** admin@tradehub.com
> **Utilizadores Gestor:** antonio.faria@banco.pt (GERENTE), manager_test@tradehub.com (CHEFE_EQUIPE)
> **Acesso:** `ADMIN_MANAGER_ROLES` = ADMIN, DIRETOR, GERENTE, CHEFE_EQUIPE

---

### Acção 24 — Ver Dashboard do Administrador

**Role:** ADMIN ou ADMIN_MANAGER_ROLES
**Utilizador:** admin@tradehub.com

1. Fazer login com `admin@tradehub.com` / `admin123`
2. Dashboard Admin abre automaticamente
3. Visualizar KPIs globais:
   - Total de utilizadores, formadores, estudantes
   - Cursos activos, planos, submissões, taxa de aprovação
   - MPU médio, certificados emitidos, bancos, produtos
4. Ver gráficos de actividade recente (últimos 7 dias)
5. Acesso rápido a: Gerir Cursos, Gerir Utilizadores, Validação de Formadores

---

### Acção 25 — Gerir Utilizadores — Listar

**Role:** ADMIN, DIRETOR, GERENTE, CHEFE_EQUIPE
**Utilizador:** antonio.faria@banco.pt

1. No menu lateral, navegar para **Dados Mestres** → **Utilizadores** (`/master-data/users`)
2. A lista mostra todos os utilizadores com: nome, email, role, flags activas, estado
3. Usar o campo de pesquisa para filtrar por nome ou email
4. Filtrar por role ou estado (activo/pendente/inactivo)

---

### Acção 26 — Gerir Utilizadores — Criar Utilizador

**Role:** ADMIN apenas
**Utilizador:** admin@tradehub.com

1. Em **Dados Mestres → Utilizadores**, clicar em **Novo Utilizador**
2. Preencher o formulário:
   - **Nome Completo** (ex.: "Beatriz Sousa")
   - **Email** (ex.: `beatriz.sousa@banco.pt`)
   - **Palavra-passe** (ex.: `Banco2024!`)
   - **Role** — seleccionar da lista
   - **Flags** — activar as necesárias: is_formador, is_tutor, is_gerente, etc.
3. Clicar em **Criar Utilizador**
4. O utilizador fica activo imediatamente (sem pendência)

---

### Acção 27 — Gerir Utilizadores — Editar/Activar/Desactivar

**Role:** ADMIN apenas
**Utilizador:** admin@tradehub.com

1. Em **Dados Mestres → Utilizadores**, localizar o utilizador (ex.: `rui.oliveira@banco.pt`)
2. Clicar no botão **Editar** (ícone lápis)
3. Alterar os campos necessários:
   - Nome, email, flags de role
   - Activar/desactivar conta com o toggle **Activo**
4. Clicar em **Guardar Alterações**

---

### Acção 28 — Gerir Utilizadores — Eliminar Utilizador

**Role:** ADMIN apenas (não pode auto-eliminar)
**Utilizador:** admin@tradehub.com

1. Em **Dados Mestres → Utilizadores**, localizar o utilizador a eliminar
2. Clicar no botão **Eliminar** (ícone lixo)
3. Confirmar no diálogo de confirmação (acção irreversível)
4. O sistema elimina em cascata: progresso de lições, inscrições, certificados, submissões, atribuições a planos

---

### Acção 29 — Aprovar / Rejeitar Formador Pendente

**Role:** ADMIN apenas
**Utilizador:** admin@tradehub.com

1. Navegar para **Dados Mestres → Validação de Formadores** (`/master-data/trainer-validation`)
2. A lista mostra todos os utilizadores com `is_pending=True`
3. Para **Aprovar:**
   1. Clicar em **Aprovar** junto ao utilizador
   2. O sistema define `is_pending=False` e regista `validated_at`
   3. O utilizador fica activo e pode fazer login
4. Para **Rejeitar:**
   1. Clicar em **Rejeitar**
   2. O sistema elimina permanentemente a conta pendente

---

### Acção 30 — Ver e Gerir Todos os Planos de Formação (Admin)

**Role:** ADMIN, GERENTE ou `ADMIN_MANAGER_ROLES`
**Utilizador:** admin@tradehub.com

1. No menu lateral, clicar em **Planos de Formação** (`/training-plans`)
2. Ver a lista completa de todos os planos de todos os formadores
3. Clicar num plano para ver o detalhe (`/admin/training-plan/{id}`):
   - Todos os estudantes inscritos e o seu progresso
   - Cursos incluídos e estado de conclusão por estudante
   - Desafios e submissões
   - Calendário e datas
4. Como Admin é possível editar qualquer plano de qualquer formador

---

### Acção 31 — Gerir Cursos (Admin) — Eliminar Curso

**Role:** ADMIN apenas
**Utilizador:** admin@tradehub.com

1. Navegar para **Cursos** (`/courses`)
2. Abrir o detalhe do curso a eliminar
3. Clicar em **Eliminar Curso**
4. Confirmar a eliminação

---

### Acção 32 — Ver Relatórios Avançados

**Role:** `ADMIN_MANAGER_ROLES` (ADMIN, DIRETOR, GERENTE, CHEFE_EQUIPE)
**Utilizador:** antonio.faria@banco.pt

1. No menu superior ou no menu de Relatórios, navegar para **Relatórios Avançados** (`/advanced-reports`)
2. Na barra de separadores, seleccionar a dimensão de análise:
   - **Visão Geral:** métricas globais da plataforma
   - **Formadores:** comparativo de desempenho por formador
   - **Cursos:** análise por curso — inscrições, conclusões, duração média
   - **Desafios:** taxa de aprovação por desafio
   - **Certificados:** emissão ao longo do tempo
3. Usar os filtros de data e banco para refinar os dados
4. Ver os gráficos e tabelas com os dados filtrados

---

### Acção 33 — Ver Matriz de Conhecimento

**Role:** `ADMIN_MANAGER_ROLES`
**Utilizador:** admin@tradehub.com

1. No menu lateral, clicar em **Matriz de Conhecimento** (`/knowledge-matrix`)
2. O ecrã mostra a matriz de competências: estudantes × competências / cursos
3. Filtrar por equipa, formador ou banco
4. Identificar gaps de formação: células a vermelho indicam competências em falta

---

### Acção 34 — Ver Avaliações (Ratings)

**Role:** `ADMIN_MANAGER_ROLES`
**Utilizador:** antonio.faria@banco.pt

1. No menu lateral, clicar em **Avaliações** (`/ratings`)
2. Ver a classificação média dos cursos e planos
3. Secção **Top Cursos:** ranking por avaliação dos estudantes
4. Secção **Comentários Recentes:** feedback textual dos estudantes

---

## Portal de Tutoria

> **URL base:** `http://portaltradedatahub/tutoria`
> **Layout:** Sidebar dedicado da Tutoria com links para todas as secções
> **Acesso:** Todos os utilizadores autenticados (com vistas diferentes por role)

---

### Acção 35 — Aceder ao Portal de Tutoria

**Role:** Qualquer autenticado
**Utilizador:** maria.pereira@banco.pt

1. Fazer login com `maria.pereira@banco.pt` / `Demo1234!`
2. No menu superior (navbar), clicar em **Tutoria** → `/tutoria`
3. O Dashboard da Tutoria abre com:
   - Contagem de erros por estado, planos por estado, taxa de recorrência
   - Erros em atraso, impacto financeiro estimado
4. O sidebar esquerdo mostra os links disponíveis para a role

---

### Acção 36 — Registar um Erro / Incidente

**Role:** Qualquer autenticado
**Utilizador:** paula.ferreira@banco.pt

1. No sidebar da Tutoria, clicar em **Registar Erro** (`/tutoria/errors/new`)
2. Preencher o formulário:
   - **Data de Ocorrência** (ex.: 2026-04-05)
   - **Categoria de Erro** — seleccionar da lista (ex.: "Erro de Liquidação")
   - **Impacto** — seleccionar nível de impacto (1 a 5)
   - **Origem do Incidente** — seleccionar (ex.: "Operador", "Sistema")
   - **Banco Associado** — seleccionar (ex.: Santander)
   - **Descrição** — detalhar o que aconteceu
   - **Responsável (Gravador)** — utilizador que cometeu o erro (pode ser o próprio ou outro se for chefe/tutor)
   - **Código de Referência** (opcional)
3. Clicar em **Registar Erro**
4. O erro fica com estado **REGISTADO** e aparece na lista de erros

---

### Acção 37 — Ver Lista de Erros

**Role:** Qualquer autenticado (resultados filtrados por role)
**Utilizador:** joao.costa@banco.pt (Tutor — vê todos os erros dos seus tutorados)

1. No sidebar, clicar em **Erros** (`/tutoria/errors`) — visão de gestor/tutor
   - **OU** clicar em **Os Meus Erros** (`/tutoria/my-errors`) — visão do estudante básico
2. A lista mostra: código de referência, data, categoria, impacto, responsável, estado, datas de resolução
3. Filtrar por: estado, impacto, categoria, banco, data
4. Clicar num erro para ver o detalhe

---

### Acção 38 — Analisar um Erro (Chefe / Referente / Gestor)

**Role:** `is_chefe_equipe`, `is_referente`, `is_gerente`, ou ADMIN
**Utilizador:** maria.pereira@banco.pt (Chefe + Tutor)

1. No sidebar, clicar em **Análise** (`/tutoria/analysis`)
2. Seleccionar um erro com estado **REGISTADO**
3. Abrir o detalhe do erro (`/tutoria/errors/{id}`)
4. Clicar em **Iniciar Análise** → o estado muda para **EM ANÁLISE**
5. Preencher os campos de análise:
   - **Porquê 1 a 5** (metodologia 5 Porquês)
   - **Solução proposta**
   - **Planos de acção sugeridos**
6. Clicar em **Guardar Rascunho** (mantém EM ANÁLISE) ou **Submeter Análise**
7. Se `is_referente` sem chefe: submissão vai para **AGUARDANDO APROVAÇÃO DO CHEFE**
8. Se chefe ou acima: vai directamente para **AGUARDANDO REVISÃO DO TUTOR**

---

### Acção 39 — Aprovar Análise (Chefe de Equipa)

**Role:** `is_chefe_equipe`, `is_gerente`, ou ADMIN
**Utilizador:** chefe_test@tradehub.com

1. Localizar um erro com estado **AGUARDANDO APROVAÇÃO DO CHEFE**
2. Abrir o detalhe
3. Rever a análise submetida pelo referente
4. Clicar em **Aprovar Análise** → estado muda para **AGUARDANDO REVISÃO DO TUTOR**
   - **OU** **Devolver** com comentário → estado volta para **EM ANÁLISE**

---

### Acção 40 — Revisão do Tutor

**Role:** `is_tutor`, `is_gerente`, ou ADMIN
**Utilizador:** joao.costa@banco.pt

1. No sidebar, clicar em **Revisão Tutor** (`/tutoria/tutor-review`)
2. Ver lista de erros em estado **AGUARDANDO REVISÃO DO TUTOR**
3. Abrir o detalhe de um erro
4. Rever a análise dos 5 Porquês e os planos propostos
5. Editar os campos de solução se necessário
6. Clicar em **Aprovar Planos** → estado muda para **APROVADO**; lições de aprendizagem criadas automaticamente se origem for `Trade_Personas`
   - **OU** **Devolver ao Chefe** com comentário → estado volta para **EM ANÁLISE**

---

### Acção 41 — Confirmar Solução e Resolver Erro

**Role:** is_chefe_referente_manager para confirmar; is_tutor_or_above para resolver
**Utilizador:** maria.pereira@banco.pt → confirmar; joao.costa@banco.pt → resolver

1. Após aprovação dos planos, o chefe recebe notificação
2. Chefe abre o erro e confirma datas de solução: **Confirmar Solução**
3. O estado muda para **AGUARDANDO REVISÃO DO TUTOR**
4. Tutor abre o erro, verifica que a solução foi implementada
5. Clicar em **Resolver** → estado muda para **RESOLVIDO**

---

### Acção 42 — Cancelar / Eliminar um Erro

**Role:** `is_chefe_equipe`, `is_gerente`, ou ADMIN
**Utilizador:** admin@tradehub.com

1. Abrir o detalhe do erro
2. Clicar em **Cancelar/Eliminar Erro**
3. Preencher obrigatoriamente o motivo de cancelamento
4. Confirmar → erro passa para estado **CANCELADO**

Para eliminação lógica permanente (soft-delete):
- Apenas ADMIN pode usar a acção **Desactivar** com motivo obrigatório

---

### Acção 43 — Criar Plano de Acção para um Erro

**Role:** ADMIN ou `is_tutor=True`
**Utilizador:** joao.costa@banco.pt

1. No detalhe do erro, clicar em **Criar Plano de Acção** (`/tutoria/errors/{id}/plans/new`)
2. Preencher o formulário:
   - **Título do Plano** (ex.: "Formação em Procedimentos de Liquidação")
   - **Descrição do objectivo**
   - **Responsável** — utilizador que executa o plano
   - **Data de início e fim**
   - **Itens de Acção:**
     - Para cada item: descrição, responsável, data limite, evidência esperada
3. Clicar em **Criar Plano** → estado do plano: **RASCUNHO**

---

### Acção 44 — Gerir Plano de Acção — Submeter / Aprovar / Concluir

**Role:** Varia por etapa
**Utilizador:** joao.costa@banco.pt (tutor) + admin@tradehub.com (aprovação)

**Fluxo completo:**

1. **(Tutor) Submeter para aprovação:** No detalhe do plano (`/tutoria/plans/{id}`), clicar em **Submeter** → estado: **AGUARDANDO APROVAÇÃO**
   - Se ADMIN submeter: aprovação automática → estado: **APROVADO**

2. **(Admin) Aprovar:** Em **Planos** → abrir plano em **AGUARDANDO APROVAÇÃO** → clicar **Aprovar** → estado: **APROVADO**
   - **OU** clicar **Devolver** com comentário → estado: **DEVOLVIDO**

3. **(Responsável) Iniciar execução:** O utilizador responsável abre o plano → clica **Iniciar** → estado: **EM EXECUÇÃO**

4. **(Responsável) Actualizar itens de acção:**
   - Abrir cada item da lista
   - Preencher **Evidência** (texto ou link)
   - Marcar como **Feito**

5. **(Responsável) Concluir plano:** Quando todos os itens estão feitos → clicar **Concluir** com pontuação e comentário final → estado: **CONCLUÍDO**

6. **(Gestor) Validar plano:** Gestor/tutor abre o plano **CONCLUÍDO** → verifica itens → clica **Validar** → estado: **VALIDADO**

---

### Acção 45 — Criar Plano Side-by-Side (Acompanhamento Tutor)

**Role:** `is_tutor`, `is_chefe_equipe`, ADMIN, DIRETOR, ou GERENTE
**Utilizador:** maria.pereira@banco.pt

1. No sidebar, clicar em **Side-by-Side** (`/tutoria/side-by-side`)
2. Clicar em **Novo Acompanhamento**
3. Preencher:
   - **Tutorado** — seleccionar o estudante (ex.: `paula.ferreira@banco.pt`)
   - **Data e hora** do acompanhamento
   - **Observações** do tutor
   - **Itens de acompanhamento** com critérios observados
4. Clicar em **Criar Plano Side-by-Side**

---

### Acção 46 — Gerir Fichas de Aprendizagem (Tutor)

**Role:** `is_tutor`, `is_gerente`, ou ADMIN
**Utilizador:** joao.costa@banco.pt

1. No sidebar, clicar em **Fichas de Aprendizagem** (`/tutoria/learning-sheets`)
2. Ver todas as fichas criadas (automaticamente ou manualmente)
3. Para **criar manualmente:**
   1. Clicar em **Nova Ficha**
   2. Seleccionar o tutorado (ex.: `rui.oliveira@banco.pt`)
   3. Preencher o conteúdo da ficha: tema, objectivos, material de apoio
   4. Clicar em **Criar Ficha**
4. Fichas submetidas pelo tutorado aparecem com estado **SUBMETIDO** → abrir e clicar **Rever** → preencher resultado e feedback → **Confirmar Revisão**

---

### Acção 47 — Submeter Reflexão numa Ficha de Aprendizagem (Estudante)

**Role:** Dono da ficha (tutorado)
**Utilizador:** rui.oliveira@banco.pt

1. No sidebar, clicar em **As Minhas Fichas** (`/tutoria/my-learning-sheets`)
2. Abrir uma ficha com estado **PENDENTE**
3. Preencher o campo **Reflexão** (o que aprendeu, como vai aplicar)
4. Clicar em **Submeter Reflexão** → estado muda para **SUBMETIDO** e o tutor é notificado

---

### Acção 48 — Gerir Erros Internos (Portal Tutoria)

**Role:** `is_tutor`, `is_admin`, `is_liberador`, gestores (`is_gerente`, `is_chefe_equipe`)
**Utilizador:** joao.costa@banco.pt

1. No sidebar, clicar em **Erros Internos** (`/tutoria/internal-errors`)
2. Para **registar novo erro interno:**
   1. Clicar em **Registar Erro Interno** (`/tutoria/internal-errors/new`)
   2. Preencher:
      - **Senso (Censo)** associado
      - **Gravador** — quem cometeu o erro (ex.: `paula.ferreira@banco.pt`)
      - **Liberador** — quem deve libertar (ex.: `liberador_test@tradehub.com`)
      - **Impacto, Categoria, Tipo de Erro, Departamento, Actividade, Banco**
      - **Descrição** e **Código de Referência**
      - **Pesos:** peso_liberador, peso_gravador, peso_tutor (valores numéricos)
      - **Análise 5 Porquês** (opcional neste passo)
   3. Clicar em **Registar**
3. Para ver detalhes: clicar no erro (`/tutoria/internal-errors/{id}`) → ver avaliação do tutor, pesos, fichas de aprendizagem associadas

---

### Acção 49 — Gerir Censos (Sensos)

**Role:** Qualquer autenticado
**Utilizador:** maria.pereira@banco.pt

1. No sidebar, clicar em **Censos** (`/tutoria/censos`)
2. Ver lista de censos activos
3. Para **criar um novo censo:**
   1. Clicar em **Novo Censo**
   2. Preencher: título, período de referência, departamento associado
   3. Guardar
4. Associar erros internos ao censo criado

---

### Acção 50 — Gerir Cápsulas Formativas (Tutor)

**Role:** `is_tutor`, `is_gerente`, ou ADMIN
**Utilizador:** joao.costa@banco.pt

1. No sidebar, clicar em **Cápsulas** (`/tutoria/capsulas`)
2. Ver lista de cápsulas formativas criadas pelo tutor
3. Para **criar nova cápsula:**
   1. Clicar em **Nova Cápsula**
   2. Preencher: título, descrição, objectivo formativo
   3. Guardar
4. Para **adicionar desafio à cápsula:**
   1. Abrir a cápsula (`/tutoria/capsulas/{id}`)
   2. Clicar em **Adicionar Desafio**
   3. Preencher: enunciado, tipo de execução, KPIs
   4. Guardar → o sistema cria automaticamente um curso wrapper + desafio
5. Para **adicionar lição:** seguir o mesmo processo que no portal de formações

---

### Acção 51 — Gerir Feedback de Liberadores (Tutor)

**Role:** `is_tutor` ou ADMIN para gerir; `is_liberador` para responder
**Utilizador:** joao.costa@banco.pt (criar) + liberador_test@tradehub.com (responder)

1. **(Tutor) Criar inquérito de feedback:**
   1. No sidebar, clicar em **Feedback** (`/tutoria/feedback`)
   2. Clicar em **Novo Inquérito**
   3. Preencher perguntas e seleccionar liberadores destinatários
   4. Publicar inquérito

2. **(Liberador) Responder ao inquérito:**
   1. Fazer login com `liberador_test@tradehub.com` / `Test1234!`
   2. No sidebar, clicar em **Responder Feedback** (`/tutoria/feedback/respond`)
   3. Ver os inquéritos pendentes
   4. Preencher as respostas e submeter

3. **(Tutor) Ver resultados:** `/relatorios/feedback-dashboard` — dashboard de análise das respostas

---

### Acção 52 — Ver Notificações da Tutoria

**Role:** Qualquer autenticado
**Utilizador:** paula.ferreira@banco.pt

1. No sidebar, clicar em **Notificações** (`/tutoria/notifications`)
2. Ver lista das últimas 50 notificações: alterações de estado de erros, planos, fichas
3. Clicar numa notificação → navega para o item relacionado
4. Clicar em **Marcar como lida** numa notificação individual
5. Clicar em **Marcar todas como lidas** para limpar o contador

---

## Portal de Relatórios

> **URL base:** `http://portaltradedatahub/relatorios`
> **Acesso:** Todos os autenticados (dados filtrados por role)

---

### Acção 53 — Ver Visão Geral (Overview)

**Role:** Qualquer autenticado
**Utilizador:** rui.oliveira@banco.pt

1. Fazer login e navegar para `/relatorios`
2. O Dashboard Overview mostra KPIs de todos os portais:
   - Utilizadores totais, equipas, planos de formação
   - Erros registados, certificados emitidos, MPU médio
3. Dados filtrados automaticamente pela role:
   - Estudante: vê apenas os seus dados
   - Chefe de Equipa: vê dados da equipa
   - Admin/Gerente: vê todos os dados

---

### Acção 54 — Ver Relatório de Formações

**Role:** Qualquer autenticado (role-scoped)
**Utilizador:** antonio.faria@banco.pt

1. No sidebar do portal de Relatórios, clicar em **Formações** (`/relatorios/formacoes`)
2. Ver:
   - Taxa de inscrição, planos por estado (activo/atrasado/concluído)
   - Taxa de aprovação de desafios, horas de estudo acumuladas
   - Certificados emitidos no período
3. Usar filtros de data e equipa para refinar

---

### Acção 55 — Ver Relatório de Tutoria

**Role:** Qualquer autenticado (role-scoped)
**Utilizador:** maria.pereira@banco.pt

1. No sidebar, clicar em **Tutoria** (`/relatorios/tutoria`)
2. Ver:
   - Erros por severidade e estado
   - Planos por estado (rascunho, aprovado, concluído)
   - Taxa de recorrência de erros
   - Tendência mensal

---

### Acção 56 — Ver Relatório de Equipas

**Role:** `is_gestor_or_above` (ADMIN, DIRETOR, GERENTE)
**Utilizador:** admin@tradehub.com

1. No sidebar, clicar em **Equipas** (`/relatorios/teams`)
2. Ver métricas agregadas por equipa:
   - Número de membros, erros registados, conclusão de planos, MPU médio
3. Gerentes vêem apenas a sua equipa; Admins vêem todas

---

### Acção 57 — Ver Relatório de Membros

**Role:** `is_gestor_or_above`
**Utilizador:** antonio.faria@banco.pt

1. No sidebar, clicar em **Membros** (`/relatorios/members`)
2. Ver análise detalhada por membro da equipa:
   - Erros cometidos, conclusão de planos, MPU médio, certificados
3. Ordenar por qualquer coluna

---

### Acção 58 — Ver Relatório de Incidentes

**Role:** `is_gestor_or_above`
**Utilizador:** admin@tradehub.com

1. No sidebar, clicar em **Incidentes** (`/relatorios/incidents`)
2. Aplicar filtros:
   - **Data:** intervalo de início e fim
   - **Impacto:** nível 1 a 5
   - **Origem:** Operador, Sistema, etc.
   - **Banco, Departamento, Categoria, Produto**
3. Ver tabela completa de incidentes com todos os campos
4. Exportar dados (se disponível)

---

### Acção 59 — Ver Relatório Tutoria Detalhado

**Role:** Qualquer autenticado (role-scoped)
**Utilizador:** joao.costa@banco.pt

1. No sidebar, clicar em **Relatório Tutoria** (`/relatorios/tutoria-report`)
2. Ver análise em 10 dimensões:
   - Impacto financeiro, soluções pendentes, escalados, por origem/impacto
   - Tempo de resolução, tendência mensal, itens de acção, pesos médios, taxa de recorrência

---

### Acção 60 — Ver Dashboard de Feedback

**Role:** `is_tutor` ou ADMIN
**Utilizador:** joao.costa@banco.pt

1. No sidebar, clicar em **Dashboard Feedback** (`/relatorios/feedback-dashboard`)
2. Ver análise agregada das respostas dos liberadores aos inquéritos de feedback
3. Ver estatísticas de participação, médias por pergunta, tendências

---

### Acção 61 — Ver Relatórios Avançados

**Role:** `ADMIN_MANAGER_ROLES`
**Utilizador:** admin@tradehub.com

1. No sidebar, clicar em **Reports Avançados** (`/relatorios/advanced-reports`)
2. Ver separadores: Visão Geral, Formadores, Cursos, Desafios, Certificados
3. Filtrar por período, banco, formador
4. Ver gráficos e tabelas detalhadas

---

## Portal de Dados Mestres

> **URL base:** `http://portaltradedatahub/master-data`
> **Acesso:** ADMIN, GERENTE, DIRETOR

---

### Acção 62 — Gerir Bancos

**Role:** ADMIN para criar/editar/eliminar; `ADMIN_TRAINER_MANAGER_ROLES` para listar
**Utilizador:** admin@tradehub.com

1. Navegar para **Dados Mestres** (`/master-data`) — separador **Bancos** activo por defeito
2. Ver lista de todos os bancos cadastrados
3. Para **criar banco:**
   1. Clicar em **Novo Banco**
   2. Preencher: **Nome** (ex.: "Millennium BCP"), **País** (ex.: "PT")
   3. O código é gerado automaticamente (ex.: "PT001")
   4. Clicar em **Guardar**
4. Para **editar:** clicar no ícone lápis → alterar campos (excepto código) → **Guardar**
5. Para **eliminar:** ícone lixo → confirmar; bloqueado se existirem cursos associados

---

### Acção 63 — Gerir Produtos / Serviços

**Role:** ADMIN para CRUD; outros roles para listar
**Utilizador:** admin@tradehub.com

1. Navegar para `/master-data/products`
2. Ver lista de produtos/serviços
3. Para **criar produto:**
   1. Clicar em **Novo Produto**
   2. Preencher: **Nome** (ex.: "Custódia de Valores"), **Descrição**
   3. Código gerado automaticamente (ex.: "PROD001")
   4. Clicar em **Guardar**
4. Para **editar / eliminar:** seguir o mesmo padrão dos Bancos

---

### Acção 64 — Gerir Equipas e Membros

**Role:** ADMIN para criar/editar/eliminar; ADMIN, GERENTE, CHEFE_EQUIPE para listar
**Utilizador:** admin@tradehub.com

1. Navegar para `/master-data/teams`
2. Ver lista de equipas com membros e serviços
3. Para **criar equipa:**
   1. Clicar em **Nova Equipa**
   2. Preencher: **Nome**, **Descrição**, **Produto/Serviço**, **Departamento**, **Gestor**
   3. Clicar em **Criar**
4. Para **adicionar membro:**
   1. Abrir o detalhe da equipa
   2. Clicar em **Adicionar Membro**
   3. Seleccionar o utilizador da lista (ex.: `paula.ferreira@banco.pt`)
   4. Confirmar
5. Para **remover membro:** ícone ×  junto ao nome → confirmar
6. Para **associar produto/serviço:** botão **+ Serviço** → seleccionar da lista → guardar
7. Para **editar equipa:** ícone lápis → alterar nome, descrição, gestor → **Guardar**
8. Para **eliminar equipa:** ícone lixo → remova M:N membros/serviços automaticamente

---

### Acção 65 — Gerir Categorias de Erro

**Role:** ADMIN apenas
**Utilizador:** admin@tradehub.com

1. Navegar para `/master-data/categories`
2. Para **criar categoria:**
   1. Clicar em **Nova Categoria**
   2. Preencher: **Nome** (ex.: "Erro de Liquidação"), **Descrição**, **Activa: Sim/Não**
   3. Guardar
3. Para **editar / desactivar (soft-delete):** seguir padrão padrão

---

### Acção 66 — Gerir Níveis de Impacto

**Role:** ADMIN
**Utilizador:** admin@tradehub.com

1. Navegar para `/master-data/impacts`
2. Gerir os níveis de impacto dos erros: 1 (baixo) a 5 (crítico)
3. Para cada nível: editar o **Nome** e **Descrição**

---

### Acção 67 — Gerir Origens, Tipologias e Classificações

**Role:** ADMIN
**Utilizador:** admin@tradehub.com

Navegar para os respectivos separadores em Dados Mestres:

| Separador | URL | O que gere |
|---|---|---|
| Origens | `/master-data/origins` | Origem do incidente (Operador, Sistema, Fornecedor...) |
| Detectado Por | `/master-data/detected-by` | Quem detectou o incidente |
| Tipos de Erro | `/master-data/error-types` | Tipologia do erro |
| Departamentos | `/master-data/departments` | Departamentos da organização |
| Actividades | `/master-data/activities` | Actividades/eventos operacionais |
| FAQs | `/master-data/faqs` | Conteúdo das FAQs públicas |

Em cada separador: **Novo registo** → preencher campos → Guardar; **Editar** (ícone lápis); **Eliminar** (ícone lixo)

---

### Acção 68 — Gerir Hierarquia Organizacional

**Role:** ADMIN para CRUD; qualquer autenticado para listar
**Utilizador:** admin@tradehub.com

1. Navegar para `/master-data` e seleccionar o separador adequado (ou endpoint directo)
2. A hierarquia é uma árvore de nós: `GET /api/org/tree` retorna a estrutura completa
3. Para **criar nó:**
   - Preencher: **Nome**, **Descrição**, **Nó pai** (opcional), **Posição**, **Equipa** linkada
4. Para **mover nó:** drag-and-drop ou edição de `parent_id` e `position`
5. Para **adicionar membro ao nó:** POST `/api/org/nodes/{id}/members` com `user_id`
6. Para **ver auditoria:** o sistema regista todas as alterações à hierarquia

---

## Portal de Chamados

> **URL base:** `http://portaltradedatahub/chamados`
> **Acesso:** Todos os autenticados
> **Layout:** Sem sidebar — Kanban board em ecrã completo

---

### Acção 69 — Ver o Kanban de Chamados

**Role:** Qualquer autenticado
**Utilizador:** rui.oliveira@banco.pt

1. Fazer login e navegar para **Chamados** no menu superior ou `/chamados`
2. O ecrã mostra um Kanban board com colunas por estado:
   - **Aberto, Em Progresso, Resolvido, Fechado**
3. Visualização filtrada por role:
   - Utilizador básico: vê apenas os seus próprios chamados
   - Admin / Gestor: vê todos os chamados
4. O ChatBot está disponível na página para ajuda imediata

---

### Acção 70 — Criar um Chamado

**Role:** Qualquer autenticado
**Utilizador:** sofia.rodrigues@banco.pt

1. No ecrã de Chamados, clicar em **+ Novo Chamado** (coluna **Aberto**)
2. Preencher o formulário:
   - **Título** (ex.: "Erro ao carregar página de certificados")
   - **Tipo:**
     - **BUG** — problema/erro no sistema
     - **MELHORIA** — sugestão de nova funcionalidade
   - **Prioridade:** Baixa / Média / Alta / Crítica
   - **Descrição detalhada** — passos para reproduzir, comportamento esperado vs. actual
3. Clicar em **Submeter Chamado**
4. O chamado aparece na coluna **Aberto** do Kanban

---

### Acção 71 — Comentar num Chamado

**Role:** Qualquer autenticado
**Utilizador:** pedro.lima@banco.pt

1. No Kanban, clicar num chamado para abrir o detalhe
2. Na secção de comentários, escrever a mensagem (ex.: "Este erro também acontece em Firefox")
3. Clicar em **Enviar Comentário**
4. O comentário aparece em histórico cronológico

---

### Acção 72 — Actualizar Estado de um Chamado (Admin)

**Role:** ADMIN apenas
**Utilizador:** admin@tradehub.com

1. No Kanban, clicar num chamado
2. Clicar em **Editar**
3. Alterar:
   - **Estado:** Aberto → Em Progresso → Resolvido → Fechado
   - **Prioridade**
   - **Atribuído a:** seleccionar utilizador responsável
   - **Notas do Admin:** adicionar observações internas
4. Clicar em **Guardar**
5. O card move-se automaticamente para a coluna do novo estado

---

### Acção 73 — Eliminar um Chamado (Admin)

**Role:** ADMIN apenas
**Utilizador:** admin@tradehub.com

1. Abrir o detalhe do chamado
2. Clicar em **Eliminar**
3. Confirmar → eliminação permanente (hard-delete)

---

## Apêndice — Referência Rápida por Role

### O que pode fazer cada utilizador

#### admin@tradehub.com (ADMIN)
Todos os portais sem restrições. É o único que pode:
- Criar utilizadores directamente (sem registo)
- Aprovar/rejeitar formadores pendentes
- Eliminar utilizadores, cursos, chamados
- Desactivar erros de tutoria
- Verificar erros concluídos (→ VERIFICADO)
- Gerir todos os dados mestres (CRUD completo)
- Aprovar planos de acção
- Actualizar e eliminar chamados

#### ana.silva@banco.pt / carlos.santos@banco.pt (FORMADOR)
- Portal de Formações: todas as acções de formador (cursos próprios, planos, lições, desafios)
- Portal Tutoria: registar e ver erros, criar comentários, ver notificações
- Portal Relatórios: visão filtrada à sua actividade
- **Não acede:** Dados Mestres (escrita), aprovação de formadores, gerência de utilizadores

#### maria.pereira@banco.pt (CHEFE_EQUIPE + TUTOR)
- Portal de Formações: visão de estudante avançado
- Portal Tutoria: **gestão completa** — analisar erros, aprovar análises, criar/gerir planos, fichas de aprendizagem, cápsulas, side-by-side, feedback
- Portal Relatórios: visão da equipa (membros, incidentes da equipa)
- **Não acede (escrita):** Dados Mestres estruturais

#### joao.costa@banco.pt (TUTOR)
- Porto Tutoria: análise e revisão de erros, aprovação de planos, fichas de aprendizagem, cápsulas, feedback
- Portal Relatórios: visão de tutoria detalhada
- Mesmas restrições da chefe de equipa

#### antonio.faria@banco.pt (GERENTE)
- Portal de Formações: visão completa (dashboard gestor, relatórios avançados, matriz de conhecimento)
- Portal Relatórios: todos os relatórios (teams, members, incidents, advanced)
- Portal Tutoria: aprovação de análises e planos, cancelar erros
- Portal Dados Mestres: **apenas leitura** (listagens); não pode criar/editar/eliminar

#### paula.ferreira, rui.oliveira, sofia.rodrigues, pedro.lima, ines.martins (TRAINEE)
- Portal de Formações: dashboard estudante, cursos, lições, desafios, certificados, relatórios pessoais
- Portal Tutoria: registar erros (os seus), ver os seus planos, fichas de aprendizagem, notificações
- Portal Chamados: criar e ver os seus chamados, comentar
- **Não acede:** Dados Mestres, relatórios de equipas, gestão de utilizadores

#### liberador_test@tradehub.com (LIBERADOR)
- Portal Tutoria: registar erros internos, responder inquéritos de feedback
- Portal Chamados: criar chamados e comentar
- Acesso à lista de erros internos da tutoria

#### referente_test@tradehub.com (REFERENTE)
- Portal Tutoria: submeter análises de erros (aguarda aprovação do chefe), criar planos de acção, gerir itens de acção
- Mesmas capacidades de estudante básico nos restantes portais

---

*Documento gerado em 2026-04-05. Utilizadores e palavras-passe referem-se ao ambiente de desenvolvimento/demo.*
