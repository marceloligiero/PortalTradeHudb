# QA Guide — STUDENT / TRAINEE (Aluno)

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Role:** TRAINEE (sem flags adicionais is_tutor, is_referente, is_team_lead)
**Data de revisão:** 2026-03-20
**Versão:** 1.0

---

## 1. Visão Geral

### Objetivo do perfil
O STUDENT/TRAINEE é o utilizador básico da plataforma. Realiza formações (lições, desafios), consulta os seus planos e certificados, regista as suas próprias incidências operacionais e cria chamados de suporte.

### Identificação no sistema
- **role:** `TRAINEE`
- **flags:** todas `False` (sem is_tutor, is_referente, is_team_lead, is_liberador)
- Conta pode ser criada por auto-registo na Landing Page
- Conta activa imediatamente após registo (sem aprovação)

### Portais acessíveis
| Portal | Nível de Acesso |
|--------|----------------|
| Formações | Dashboard pessoal; planos atribuídos; cursos; lições; desafios; certificados; relatórios pessoais |
| Tutoria | Registar incidências próprias; consultar os seus erros, planos, fichas e progresso |
| Relatórios | Dashboard pessoal e visão geral (formações + tutoria) |
| Chamados | Criar e comentar (sem gerir) |
| Dados Mestres | Sem acesso |

---

## 2. Permissões e Restrições

| Funcionalidade | Permitido | Bloqueado |
|----------------|-----------|-----------|
| Auto-registo na plataforma | Sim | — |
| Ver os seus próprios cursos e lições | Sim | — |
| Iniciar/pausar/retomar/finalizar lições | Sim | — |
| Confirmar presença em lição | Sim | — |
| Iniciar e submeter desafios COMPLETE | Sim | — |
| Nova tentativa em desafio reprovado (se permitido) | Sim | — |
| Ver os seus planos de formação | Sim | — |
| Download de certificados próprios | Sim | — |
| Registar incidência operacional própria | Sim | — |
| Ver as suas incidências (Meus Erros) | Sim | — |
| Ver os seus planos de ação (Meus Planos) | Sim | — |
| Ver as suas fichas de aprendizagem (Minhas Fichas) | Sim | — |
| Submeter reflexão em ficha de aprendizagem | Sim | — |
| Analisar incidências de outros | Não | HTTP 403 |
| Cancelar incidências | Não | HTTP 403 |
| Criar/gerir planos de ação | Não | HTTP 403 |
| Criar cursos/lições/desafios | Não | HTTP 403 |
| Criar/editar utilizadores | Não | HTTP 403 |
| CRUD de master data | Não | HTTP 403 |
| Ver dados de outros alunos | Não | — |
| Alterar estado de chamados | Não | Apenas ADMIN |

---

## 3. Fluxos de Frontend — Passo a Passo

### Registo e Login

**Registo (primeiro acesso):**
1. Aceder à Landing Page → **"Criar Conta"**
2. Preencher: Nome Completo, Email, Password
3. Selecionar Role: **"Formando"**
4. Clicar em **"Registar"**
5. **Resultado esperado:** Conta criada e activa imediatamente; redirect para o Dashboard do Aluno

**Login:**
1. Landing Page → **"Entrar"** → Email + Password → **"Entrar"**
2. **Resultado esperado:** Dashboard do Aluno carrega com KPIs pessoais

---

### Executar uma Lição

**Pré-condição:** Formador libertou uma lição para o aluno; lição aparece em "Minhas Lições".

1. **"Formações"** → **"Minhas Lições"**
2. Localizar a lição com estado "Disponível"
3. Clicar em **"Iniciar"** — timer começa
4. (Opcional) Clicar em **"Pausar"** → escrever motivo → **"Confirmar"**
5. Clicar em **"Retomar"** — timer continua
6. Quando terminar, clicar em **"Finalizar"** — tempo total calculado
7. Clicar em **"Confirmar Presença"** — formador notificado
8. **Resultado esperado:** Lição marcada como "Concluída Pendente de Aprovação"; HTTP 200

---

### Executar um Desafio COMPLETE

**Pré-condição:** Formador libertou desafio COMPLETE; aparece em "Meus Desafios".

1. **"Formações"** → **"Meus Desafios"**
2. Clicar no desafio → **"Iniciar Desafio"**
3. Para cada operação:
   - **"Iniciar Operação"** — timer começa
   - Executar a operação real no sistema bancário
   - **"Finalizar Operação"** — timer para
4. Repetir até atingir o número requerido de operações
5. Clicar em **"Submeter para Revisão"**
6. Aguardar o formador classificar as operações
7. **Resultado esperado:** Submissão criada no estado "Pendente de Revisão"; HTTP 201

---

### Ver Planos de Formação Atribuídos

**Pré-condição:** Formador/ADMIN atribuiu o aluno a um plano.

1. **"Formações"** → **"Planos de Formação"**
2. Ver lista de planos com progresso (% de conclusão)
3. Clicar num plano → ver cursos e estado de cada um
4. **Resultado esperado:** Planos visíveis com progresso actualizado

---

### Descarregar Certificado

**Pré-condição:** Plano de formação finalizado com certificado gerado.

1. **"Formações"** → **"Certificados"**
2. Clicar no certificado
3. Clicar em **"Download PDF"**
4. **Resultado esperado:** Ficheiro PDF descarregado para o computador

---

### Registar Incidência Operacional

**Pré-condição:** STUDENT autenticado; existem bancos e departamentos configurados.

1. **"Tutoria"** na barra superior → **"Meus Erros"** → **"+ Registar Erro"**
2. Preencher o formulário:
   - **Data do Erro** (obrigatório): data da ocorrência
   - **Banco** (obrigatório): selecionar da lista
   - **Oficina** (obrigatório): número da oficina
   - **Departamento** (obrigatório): selecionar da lista
   - **Actividad**: dependente do Departamento
   - **Tipo Error**: dependente da Actividade
   - **Descrição** (obrigatório): detalhar a incidência
   - Referências de transacção (opcionais): Referência, Divisa, Importe, Cliente Final → adicionar com "+ Ref"
3. Clicar em **"Guardar"**
4. **Resultado esperado:** Incidência criada com estado `REGISTERED`; chefe/referente notificado; HTTP 201

---

### Ver os Meus Erros e Planos

**Pré-condição:** STUDENT com incidências registadas.

1. **"Tutoria"** → **"Meus Erros"**: lista de incidências registadas pelo aluno
2. **"Tutoria"** → **"Meus Planos"**: lista de planos de ação onde o aluno é responsável
3. **"Tutoria"** → **"O Meu Progresso"**: dashboard com métricas pessoais

---

### Submeter Reflexão em Ficha de Aprendizagem

**Pré-condição:** Existe uma ficha de aprendizagem atribuída ao aluno.

1. **"Tutoria"** → **"Minhas Fichas"**
2. Clicar na ficha
3. Escrever reflexão/resposta no campo de texto
4. Clicar em **"Submeter"** ou **"Marcar como Lida"**
5. **Resultado esperado:** Reflexão registada; HTTP 200

---

### Criar Chamado de Suporte

**Pré-condição:** STUDENT autenticado.

1. **"Chamados"** → **"+ Novo Chamado"**
2. Preencher: Título, Descrição, Tipo (Bug/Melhoria), Prioridade (Baixa/Média/Alta/Crítica), Portal
3. (Opcional) Anexar screenshot
4. Clicar em **"Criar"**
5. **Resultado esperado:** Chamado criado no estado "Aberto"; HTTP 201

---

## 4. Campos e Validações

### Formulário de Registo de Conta

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Nome Completo | Sim | Texto | Mínimo 2 caracteres | "Nome obrigatório" |
| Email | Sim | Email | Formato válido; único no sistema | "Email já registado" / "Formato inválido" |
| Password | Sim | Password | Mínimo 8 caracteres | "Password muito curta" |
| Role | Sim | Select | Formando / Formador | "Role obrigatório" |

### Formulário de Registo de Incidência

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Data do Erro | Sim | Data | Não pode ser futura; formato válido | "Data obrigatória" / "Data inválida" |
| Banco | Sim | Select | Lista de bancos activos | "Banco obrigatório" |
| Oficina | Sim | Texto/Número | Não vazio | "Oficina obrigatória" |
| Departamento | Sim | Select | Lista de departamentos activos | "Departamento obrigatório" |
| Actividade | Não | Select | Dependente do Departamento (cascata) | — |
| Tipo de Erro | Não | Select | Dependente da Actividade (cascata) | — |
| Descrição | Sim | Texto Longo | Não vazio | "Descrição obrigatória" |
| Referência | Não | Texto | — | — |
| Divisa | Não | Select | Lista de moedas | — |
| Importe | Não | Decimal | Maior que 0 se preenchido | "Valor inválido" |

### Formulário de Criação de Chamado

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Título | Sim | Texto | Mínimo 3 caracteres | "Título obrigatório" |
| Descrição | Sim | Texto Longo | — | "Descrição obrigatória" |
| Tipo | Sim | Select | Bug / Melhoria | "Tipo obrigatório" |
| Prioridade | Sim | Select | Baixa / Média / Alta / Crítica | "Prioridade obrigatória" |
| Portal | Sim | Select | Lista de portais | "Portal obrigatório" |

---

## 5. Cenários de Teste QA

### CT-STUDENT-01: Auto-registo e login imediato
- **Tipo:** Positivo
- **Pré-condição:** Nenhuma
- **Passos:**
  1. Landing Page → "Criar Conta"
  2. Nome: "João Silva", Email: único, Password: "Secure123!"
  3. Role: "Formando" → "Registar"
  4. De imediato, fazer login com as mesmas credenciais
- **Resultado Esperado:** Conta activa; login bem-sucedido; Dashboard do Aluno carrega; HTTP 200
- **Verificações:**
  - [ ] Sem necessidade de aprovação por admin
  - [ ] Dashboard mostra KPIs a zero (sem cursos ainda)

---

### CT-STUDENT-02: Registo com email já existente
- **Tipo:** Negativo
- **Pré-condição:** Existe utilizador com email "existente@banco.pt"
- **Passos:**
  1. "Criar Conta" → Email: "existente@banco.pt" → preencher restantes campos → "Registar"
- **Resultado Esperado:** Erro de validação; conta não criada; HTTP 400 ou 422
- **Verificações:**
  - [ ] Mensagem "Email já registado" ou equivalente visível
  - [ ] Formulário mantém foco no campo Email

---

### CT-STUDENT-03: Executar lição completa (Iniciar → Finalizar → Confirmar Presença)
- **Tipo:** Positivo
- **Pré-condição:** Formador libertou uma lição para o aluno
- **Passos:**
  1. Formações → "Minhas Lições" → localizar lição disponível
  2. "Iniciar" → aguardar alguns segundos
  3. "Pausar" → motivo: "Pausa de 5 min" → confirmar
  4. "Retomar"
  5. "Finalizar"
  6. "Confirmar Presença"
- **Resultado Esperado:** Lição marcada como concluída pendente de aprovação; tempo total registado; formador notificado; HTTP 200
- **Verificações:**
  - [ ] Estado da lição: "Concluída — Pendente de Aprovação"
  - [ ] Tempo total registado correctamente (inclui pausa)
  - [ ] Formador vê a lição para aprovação

---

### CT-STUDENT-04: Iniciar desafio COMPLETE e submeter para revisão
- **Tipo:** Positivo
- **Pré-condição:** Formador libertou desafio COMPLETE com 5 operações requeridas
- **Passos:**
  1. Formações → "Meus Desafios" → clicar no desafio → "Iniciar Desafio"
  2. Para cada uma das 5 operações: "Iniciar Operação" → executar → "Finalizar Operação"
  3. "Submeter para Revisão"
- **Resultado Esperado:** Submissão criada; estado "Pendente de Revisão"; formador notificado; HTTP 201
- **Verificações:**
  - [ ] 5 operações registadas na submissão
  - [ ] Tempos individuais por operação registados
  - [ ] Estado visível como "Pendente de Revisão"

---

### CT-STUDENT-05: Tentar submeter desafio sem executar operações
- **Tipo:** Negativo / Edge Case
- **Pré-condição:** Desafio COMPLETE iniciado mas sem operações concluídas
- **Passos:**
  1. "Iniciar Desafio"
  2. Sem iniciar nenhuma operação, tentar clicar em "Submeter para Revisão"
- **Resultado Esperado:** Submissão bloqueada; mensagem de validação; HTTP 400 ou 422
- **Verificações:**
  - [ ] Botão "Submeter para Revisão" inactivo ou desabilitado
  - [ ] Nenhuma submissão criada

---

### CT-STUDENT-06: Registar incidência com todos os campos obrigatórios
- **Tipo:** Positivo
- **Pré-condição:** Existem banco e departamento configurados
- **Passos:**
  1. Tutoria → "Meus Erros" → "+ Registar Erro"
  2. Data do Erro: ontem, Banco: selecionar, Oficina: "101", Departamento: selecionar
  3. Descrição: "Efectuei operação de câmbio no banco incorrecto"
  4. "Guardar"
- **Resultado Esperado:** Incidência criada com estado REGISTERED; HTTP 201; chefe/referente notificado
- **Verificações:**
  - [ ] Incidência visível em "Meus Erros"
  - [ ] Estado: "Registado"
  - [ ] Notificação enviada ao chefe/referente da equipa

---

### CT-STUDENT-07: Registar incidência com campos obrigatórios em branco
- **Tipo:** Negativo
- **Pré-condição:** STUDENT autenticado; formulário de registo aberto
- **Passos:**
  1. Tutoria → "Meus Erros" → "+ Registar Erro"
  2. Deixar os campos Banco, Oficina e Descrição em branco
  3. Data do Erro: ontem, Departamento: selecionar
  4. Tentar "Guardar"
- **Resultado Esperado:** Validação bloqueia; campos em falta destacados com erro; HTTP 422
- **Verificações:**
  - [ ] Mensagem "Banco obrigatório" visível
  - [ ] Mensagem "Oficina obrigatória" visível
  - [ ] Mensagem "Descrição obrigatória" visível
  - [ ] Formulário não submete

---

### CT-STUDENT-08: Registar incidência com data futura
- **Tipo:** Negativo / Edge Case
- **Pré-condição:** STUDENT autenticado
- **Passos:**
  1. Tutoria → "+ Registar Erro"
  2. Data do Erro: data de amanhã
  3. Preencher restantes campos obrigatórios → "Guardar"
- **Resultado Esperado:** Validação bloqueia data futura; HTTP 422
- **Verificações:**
  - [ ] Mensagem "Data inválida" ou "Data não pode ser futura"
  - [ ] Campo data destacado como inválido

---

### CT-STUDENT-09: Tentar analisar incidência de outro aluno (bloqueado)
- **Tipo:** Negativo (controlo de acesso)
- **Pré-condição:** Existe incidência criada por outro utilizador
- **Passos:**
  1. Tentar aceder directamente a `/tutoria/errors/{id}/analyze` (id de incidência de outro aluno)
- **Resultado Esperado:** HTTP 403; nenhuma análise efectuada
- **Verificações:**
  - [ ] Menu de Tutoria não exibe "Análise" nem "Erros" da equipa
  - [ ] API retorna HTTP 403

---

### CT-STUDENT-10: Tentar aceder a Dados Mestres
- **Tipo:** Negativo
- **Pré-condição:** STUDENT autenticado
- **Passos:**
  1. Verificar se "Dados Mestres" aparece na barra superior
  2. Tentar navegar directamente para `/admin/master-data`
- **Resultado Esperado:** Portal não visível; redirect ou HTTP 403
- **Verificações:**
  - [ ] "Dados Mestres" ausente da barra de navegação
  - [ ] URL directa redireccionada para Dashboard ou página de erro

---

### CT-STUDENT-11: Criar chamado de suporte
- **Tipo:** Positivo
- **Pré-condição:** STUDENT autenticado
- **Passos:**
  1. "Chamados" → "+ Novo Chamado"
  2. Título: "Erro no carregamento de lições", Tipo: Bug, Prioridade: Alta, Portal: Formações
  3. Descrição: "A lista de lições não carrega após o login"
  4. "Criar"
- **Resultado Esperado:** Chamado criado no estado "Aberto"; HTTP 201; apenas o aluno e o ADMIN o vêem
- **Verificações:**
  - [ ] Chamado visível na lista do aluno
  - [ ] Estado: "Aberto"
  - [ ] Sem opção de alterar estado (apenas comentar)

---

### CT-STUDENT-12: Tentar alterar estado de chamado (bloqueado)
- **Tipo:** Negativo
- **Pré-condição:** STUDENT com chamado criado
- **Passos:**
  1. Abrir o chamado próprio
  2. Verificar se existe dropdown de estado ou botão de mudança de estado
- **Resultado Esperado:** Sem opção de alterar estado; apenas comentar; HTTP 403 em tentativa via API
- **Verificações:**
  - [ ] Dropdown de estado não visível para STUDENT
  - [ ] API de actualização de estado retorna HTTP 403

---

### CT-STUDENT-13: Nova tentativa em desafio reprovado
- **Tipo:** Positivo
- **Pré-condição:** Formador reprovou submissão e permitiu nova tentativa
- **Passos:**
  1. Formações → "Meus Desafios" → localizar desafio reprovado com "Nova Tentativa Disponível"
  2. Clicar em "Iniciar Nova Tentativa"
  3. Executar operações novamente
  4. "Submeter para Revisão"
- **Resultado Esperado:** Nova submissão criada; anterior marcada como substituída; formador notificado; HTTP 201
- **Verificações:**
  - [ ] Botão "Iniciar Nova Tentativa" visível após reprovação com permissão
  - [ ] Nova submissão no estado "Pendente de Revisão"

---

### CT-STUDENT-14: Login com credenciais inválidas
- **Tipo:** Negativo
- **Pré-condição:** Nenhuma
- **Passos:**
  1. Landing Page → "Entrar"
  2. Email: "naoexiste@banco.pt", Password: "errada123"
  3. "Entrar"
- **Resultado Esperado:** Mensagem de erro visível; sem redirect; HTTP 401
- **Verificações:**
  - [ ] Mensagem "Credenciais inválidas" ou equivalente
  - [ ] Sem token emitido
  - [ ] Sem exposição de informação sobre existência do email

---

### CT-STUDENT-15: Sessão expirada durante execução de lição
- **Tipo:** Edge Case
- **Pré-condição:** STUDENT com lição em progresso; token expirado
- **Passos:**
  1. Iniciar lição (timer a correr)
  2. Eliminar token JWT do sessionStorage
  3. Tentar clicar em "Finalizar"
- **Resultado Esperado:** HTTP 401; redirect para login; lição mantém estado "Em Progresso" no servidor
- **Verificações:**
  - [ ] Redirect para login ocorre
  - [ ] Lição não marcada como concluída sem confirmação
  - [ ] Após novo login, lição pode ser retomada

---

### CT-STUDENT-16: Dark mode — formulários do aluno legíveis
- **Tipo:** Edge Case / Visual
- **Pré-condição:** STUDENT autenticado
- **Passos:**
  1. Activar dark mode (ícone sol/lua)
  2. Abrir formulário de registo de incidência
  3. Abrir formulário de criação de chamado
  4. Navegar pela lista de lições e desafios
- **Resultado Esperado:** Todos os campos, botões, listas e mensagens legíveis em dark mode
- **Verificações:**
  - [ ] Campos de texto com contraste adequado
  - [ ] Selectores de Banco, Departamento, Prioridade legíveis
  - [ ] Botões "Guardar", "Criar", "Submeter" claramente visíveis

---

### CT-STUDENT-17: Avaliar curso após conclusão
- **Tipo:** Positivo
- **Pré-condição:** STUDENT concluiu um curso
- **Passos:**
  1. Após conclusão, aparece opção de avaliar
  2. Selecionar 4 estrelas
  3. Escrever comentário: "Curso muito completo e bem estruturado"
  4. Clicar em "Submeter"
- **Resultado Esperado:** Avaliação registada; HTTP 201
- **Verificações:**
  - [ ] Avaliação visível no histórico do aluno
  - [ ] Dados incorporados nos dashboards de relatórios (para ADMIN/MANAGER)

---

## 6. Checklist de Validação

### Autenticação e Registo
- [ ] Auto-registo activa conta imediatamente
- [ ] Email duplicado rejeitado com mensagem clara
- [ ] Login com credenciais inválidas exibe erro sem detalhes técnicos
- [ ] Sessão expirada redireciona para login

### Formações
- [ ] Lições liberadas pelo formador aparecem em "Minhas Lições"
- [ ] Ciclo completo de lição (Iniciar → Pausar → Retomar → Finalizar → Confirmar Presença) funcional
- [ ] Desafio COMPLETE com registo de operações funcional
- [ ] Submissão sem operações bloqueada
- [ ] Nova tentativa em desafio reprovado funcional (quando permitida)
- [ ] Certificados acessíveis e descarregáveis

### Registo de Incidências
- [ ] Campo Data do Erro: data futura rejeitada
- [ ] Campos obrigatórios (Data, Banco, Oficina, Departamento, Descrição) bloqueiam se vazios
- [ ] Cascata Banco → Departamento → Actividade → Tipo Erro funcional
- [ ] Incidência criada com estado REGISTERED
- [ ] Notificação enviada ao chefe/referente da equipa

### Controlo de Acesso
- [ ] "Dados Mestres" ausente da barra de navegação
- [ ] Análise de incidências de outros bloqueada (HTTP 403)
- [ ] Criação de cursos/planos bloqueada
- [ ] Alterar estado de chamados bloqueado

### Tutoria — Vista Pessoal
- [ ] "Meus Erros" mostra apenas as incidências do aluno
- [ ] "Meus Planos" mostra apenas os planos do aluno
- [ ] "Minhas Fichas" mostra as fichas atribuídas ao aluno
- [ ] "O Meu Progresso" com métricas pessoais correctas

### Chamados
- [ ] Criar chamado funcional com todos os campos obrigatórios
- [ ] Aluno vê apenas os seus próprios chamados
- [ ] Sem opção de alterar estado

### Dark Mode e i18n
- [ ] Dark mode activo: todos os formulários legíveis
- [ ] Mudança de idioma (PT/EN/ES) actualiza textos visíveis
- [ ] Mensagens de erro traduzidas nos 3 idiomas
