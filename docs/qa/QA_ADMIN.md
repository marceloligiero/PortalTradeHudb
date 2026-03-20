# QA Guide — ADMIN

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Role:** ADMIN
**Data de revisão:** 2026-03-20
**Versão:** 1.0

---

## 1. Visão Geral

### Objetivo do perfil
O ADMIN tem controlo total sobre todos os módulos do sistema. É responsável pela configuração inicial, gestão de utilizadores, aprovação de formadores, manutenção de dados mestres e supervisão geral da plataforma.

### Identificação no sistema
- **role:** `ADMIN`
- Não requer flags adicionais
- Acesso irrestrito a todos os endpoints da API

### Portais acessíveis
| Portal | Nível de Acesso |
|--------|----------------|
| Formações | Leitura + Escrita + Eliminação |
| Tutoria | Leitura + Escrita + Aprovação + Eliminação |
| Relatórios | Acesso completo (básicos + avançados + equipas) |
| Dados Mestres | CRUD completo (utilizadores, bancos, produtos, equipas, categorias, impactos, origens, etc.) |
| Chamados | CRUD completo + gestão de estados |

---

## 2. Permissões e Restrições

| Funcionalidade | Permitido | Bloqueado |
|----------------|-----------|-----------|
| Criar utilizadores (todos os roles e flags) | Sim | — |
| Editar/eliminar utilizadores | Sim | — |
| Aprovar/rejeitar formadores | Sim | — |
| CRUD Bancos / Produtos / Equipas | Sim | — |
| CRUD Categorias / Impactos / Origens / Departamentos / Atividades / Tipos de Erro | Sim | — |
| Criar/editar/eliminar cursos, lições, desafios | Sim | — |
| Criar/atribuir/finalizar planos de formação | Sim | — |
| Rever e aprovar/reprovar submissões de desafio | Sim | — |
| Aprovar análises de tutoria | Sim | — |
| Aprovar/devolver/validar planos de ação | Sim | — |
| Criar/editar/eliminar censos | Sim | — |
| Rever fichas de aprendizagem | Sim | — |
| Gerir chamados (alterar estado, eliminar) | Sim | — |
| Relatórios avançados + Equipas | Sim | — |
| Executar ETL do Data Warehouse | Sim | — |
| Ver dados de outras equipas no relatório | Sim | Apenas ADMIN e MANAGER veem a tab Equipas |

---

## 3. Fluxos de Frontend — Passo a Passo

### Autenticação

**Pré-condição:** Conta ADMIN activa no sistema.

1. Abrir o browser e navegar para `https://tradedatahub.local`
2. Clicar em **"Entrar"** (canto superior direito da Landing Page)
3. Preencher **Email** e **Password**
4. Clicar em **"Entrar"**
5. **Resultado esperado:** Redirecionamento para o Dashboard de administrador; barra superior mostra 5 portais (Formações, Tutoria, Relatórios, Dados Mestres, Chamados)

---

### Aprovação de Formadores

**Pré-condição:** Existe pelo menos um formador com conta pendente de aprovação.

1. Clicar em **"Formações"** na barra superior
2. No menu lateral, clicar em **"Formadores"**
3. Localizar o formador com estado "Pendente"
4. Clicar em **"Aprovar"** (verde) para aprovar, ou **"Rejeitar"** (vermelho) para rejeitar
5. **Resultado esperado:** Estado do formador atualiza imediatamente; formador aprovado passa a poder criar cursos

---

### Gestão de Utilizadores (CRUD)

**Pré-condição:** Utilizador ADMIN autenticado.

**Criar utilizador:**
1. Clicar em **"Dados Mestres"** → **"Utilizadores"**
2. Clicar em **"+ Novo Utilizador"**
3. Preencher: Nome, Email, Password, Role (ADMIN/MANAGER/TRAINER/TRAINEE)
4. Definir flags: `is_trainer`, `is_tutor`, `is_team_lead`, `is_liberador`, `is_referente` conforme necessário
5. Clicar em **"Criar"**
6. **Resultado esperado:** Utilizador aparece na lista; HTTP 201

**Editar utilizador:**
1. Na lista, clicar no ícone de edição ao lado do utilizador
2. Alterar campos e/ou flags
3. Clicar em **"Guardar"**
4. **Resultado esperado:** Dados atualizados; HTTP 200

**Eliminar utilizador:**
1. Na lista, clicar no ícone de lixeira
2. Confirmar no diálogo de confirmação
3. **Resultado esperado:** Utilizador removido da lista; HTTP 204

---

### Gestão de Master Data — Bancos

**Pré-condição:** Utilizador ADMIN autenticado, portal Dados Mestres aberto.

1. Clicar em **"Dados Mestres"** → **"Bancos"**
2. Clicar em **"+ Novo"**
3. Preencher: Código, Nome, País
4. Clicar em **"Criar"**
5. **Resultado esperado:** Banco aparece na lista; disponível nos formulários de registo de incidência

**Editar banco:**
1. Clicar no ícone de edição → alterar campos → **"Guardar"**

**Eliminar banco:**
1. Clicar no ícone de lixeira → confirmar
2. **Resultado esperado:** Banco removido; formulários de incidência não o mostram

---

### Gestão de Cursos, Lições e Desafios

**Pré-condição:** Portal Formações aberto.

**Criar curso:**
1. Clicar em **"Cursos"** → **"+ Novo Curso"**
2. Preencher: Título, Descrição, Nível (BASIC/INTERMEDIATE/ADVANCED), Bancos, Produtos
3. Clicar em **"Criar"**
4. **Resultado esperado:** Curso aparece na lista

**Adicionar lição:**
1. Clicar no curso → secção "Lições" → **"+ Nova Lição"**
2. Preencher: Título, Tipo (THEORETICAL/PRACTICAL), Tempo Estimado (minutos)
3. Clicar em **"Criar"**

**Adicionar desafio:**
1. Dentro do curso → secção "Desafios" → **"+ Novo Desafio"**
2. Preencher: Título, Tipo (COMPLETE/SUMMARY), Operações Requeridas, Tempo Limite, MPU Alvo, Máximo Erros
3. Clicar em **"Criar"**

---

### Gestão de Planos de Formação

**Pré-condição:** Existem cursos criados no sistema.

1. Clicar em **"Planos de Formação"** → **"+ Novo Plano"**
2. Preencher: Título, Descrição, Data Início, Data Fim, Cursos, Bancos, Produtos
3. Clicar em **"Criar"**
4. Abrir o plano → secção "Alunos" → **"+ Atribuir Aluno"** → selecionar aluno → **"Atribuir"**
5. **Resultado esperado:** Aluno inscrito nos cursos do plano automaticamente

---

### Revisão de Submissões de Desafio

**Pré-condição:** Existe pelo menos uma submissão pendente de revisão.

1. Clicar em **"Revisões Pendentes"**
2. Clicar na submissão
3. Para cada operação (desafio COMPLETE): clicar no ícone de classificação → selecionar tipo de erro → guardar
4. Clicar em **"Finalizar Revisão"** → escolher **Aprovar** ou **Reprovar** + escrever feedback
5. **Resultado esperado:** Submissão classificada; aluno recebe notificação

---

### Portal de Tutoria — Aprovação de Análise

**Pré-condição:** Existe uma incidência no estado `PENDING_TUTOR_REVIEW`.

1. Clicar em **"Tutoria"** → **"Erros"**
2. Localizar incidência no estado correspondente
3. Clicar na incidência para abrir detalhes
4. Verificar análise (5 Porquês, solução proposta)
5. Clicar em **"Aprovar Análise"** ou **"Devolver"** (com motivo)
6. **Resultado esperado:** Estado atualiza para `APPROVED` ou `ANALYSIS` (se devolvido); HTTP 200

---

### Portal de Tutoria — Validar Plano de Ação Concluído

**Pré-condição:** Existe um plano de ação no estado "Concluído".

1. Clicar em **"Tutoria"** → **"Planos de Ação"**
2. Localizar o plano com estado "Concluído"
3. Clicar no plano → **"Validar"**
4. Atribuir pontuação (0–5, inteiro) e comentário (máx. 160 caracteres)
5. Confirmar
6. **Resultado esperado:** Plano passa para "Validado"

---

### Portal de Chamados — Gestão Completa

**Pré-condição:** Existem chamados criados por utilizadores.

1. Clicar em **"Chamados"** na barra superior
2. No quadro Kanban, localizar o chamado
3. Clicar no chamado → alterar estado no dropdown → atribuir responsável → adicionar notas → **"Guardar"**
4. Para eliminar: clicar em **"Eliminar"** → confirmar
5. **Resultado esperado:** Estado do chamado atualiza; utilizador que criou vê o novo estado

---

## 4. Campos e Validações

### Formulário de Criação de Utilizador

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Nome | Sim | Texto | Mínimo 2 caracteres | "Nome obrigatório" |
| Email | Sim | Email | Formato válido; único no sistema | "Email já existe" / "Formato inválido" |
| Password | Sim | Password | Mínimo 8 caracteres | "Password muito curta" |
| Role | Sim | Select | ADMIN/MANAGER/TRAINER/TRAINEE | "Role obrigatório" |
| is_trainer | Não | Boolean | Apenas relevante para TRAINEE | — |
| is_tutor | Não | Boolean | Apenas relevante para TRAINEE | — |
| is_team_lead | Não | Boolean | — | — |
| is_referente | Não | Boolean | — | — |

### Formulário de Criação de Banco

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Código | Sim | Texto | Único; máx. 10 caracteres | "Código já existe" |
| Nome | Sim | Texto | Mínimo 2 caracteres | "Nome obrigatório" |
| País | Não | Texto | — | — |

### Formulário de Validação de Plano de Ação

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Score (result_score) | Sim | Inteiro | 0 a 5 | "Pontuação entre 0 e 5" |
| Comentário (result_comment) | Não | Texto | Máximo 160 caracteres | "Máximo 160 caracteres" |

---

## 5. Cenários de Teste QA

### CT-ADMIN-01: Login com credenciais válidas
- **Tipo:** Positivo
- **Pré-condição:** Conta ADMIN activa no sistema
- **Passos:**
  1. Aceder à URL do sistema
  2. Clicar em "Entrar"
  3. Introduzir email e password correctos
  4. Clicar em "Entrar"
- **Resultado Esperado:** Redirecionamento para Dashboard; barra superior com 5 portais visíveis; HTTP 200 (token JWT emitido)
- **Verificações:**
  - [ ] Dashboard do ADMIN carrega sem erros
  - [ ] Menu lateral exibe todas as secções
  - [ ] Token JWT armazenado em sessionStorage (não em localStorage)

---

### CT-ADMIN-02: Login com credenciais inválidas
- **Tipo:** Negativo
- **Pré-condição:** Nenhuma
- **Passos:**
  1. Aceder à URL do sistema
  2. Introduzir email inexistente ou password errada
  3. Clicar em "Entrar"
- **Resultado Esperado:** Mensagem de erro visível; sem redirecionamento; HTTP 401
- **Verificações:**
  - [ ] Mensagem "Credenciais inválidas" ou equivalente exibida
  - [ ] Campos de formulário mantêm o foco
  - [ ] Nenhum token JWT emitido

---

### CT-ADMIN-03: Criar utilizador TUTOR (TRAINEE + is_tutor=True)
- **Tipo:** Positivo
- **Pré-condição:** ADMIN autenticado
- **Passos:**
  1. Dados Mestres → Utilizadores → "+ Novo Utilizador"
  2. Preencher: Nome "Ana Silva", Email único, Password "Secure123!"
  3. Selecionar Role: TRAINEE
  4. Ativar flag is_tutor
  5. Clicar em "Criar"
- **Resultado Esperado:** Utilizador criado com role TRAINEE e flag is_tutor; aparece na lista; HTTP 201
- **Verificações:**
  - [ ] Utilizador visível na lista com role "TRAINEE"
  - [ ] Flag is_tutor apresentada como ativa
  - [ ] Utilizador pode fazer login imediatamente

---

### CT-ADMIN-04: Criar utilizador com email duplicado
- **Tipo:** Negativo
- **Pré-condição:** Existe um utilizador com email "teste@banco.pt"
- **Passos:**
  1. Dados Mestres → Utilizadores → "+ Novo Utilizador"
  2. Introduzir Email: "teste@banco.pt" (já existente)
  3. Preencher restantes campos válidos
  4. Clicar em "Criar"
- **Resultado Esperado:** Erro de validação exibido; utilizador não criado; HTTP 400 ou 422
- **Verificações:**
  - [ ] Mensagem "Email já existe" ou equivalente visível
  - [ ] Lista de utilizadores não alterada

---

### CT-ADMIN-05: Aprovar formador pendente
- **Tipo:** Positivo
- **Pré-condição:** Existe formador com conta no estado "Pendente de aprovação"
- **Passos:**
  1. Formações → Formadores
  2. Localizar formador com estado "Pendente"
  3. Clicar em "Aprovar"
- **Resultado Esperado:** Formador passa para estado "Aprovado"; pode fazer login e criar cursos; HTTP 200
- **Verificações:**
  - [ ] Estado do formador muda na lista
  - [ ] Formador aprovado consegue aceder ao portal Formações

---

### CT-ADMIN-06: CRUD de Banco — criar e eliminar
- **Tipo:** Positivo + Edge Case
- **Pré-condição:** ADMIN autenticado
- **Passos (criar):**
  1. Dados Mestres → Bancos → "+ Novo"
  2. Código: "BCO01", Nome: "Banco Teste", País: "PT"
  3. Clicar em "Criar"
- **Passos (eliminar):**
  4. Localizar "Banco Teste" na lista
  5. Clicar no ícone de lixeira → confirmar
- **Resultado Esperado:** Banco criado (HTTP 201) e depois eliminado (HTTP 204)
- **Verificações:**
  - [ ] Banco aparece na lista após criação
  - [ ] Banco disponível nos formulários de registo de incidência
  - [ ] Após eliminação, banco não aparece na lista nem nos formulários

---

### CT-ADMIN-07: Criar curso com lição e desafio COMPLETE
- **Tipo:** Positivo
- **Pré-condição:** ADMIN autenticado; existem bancos e produtos no sistema
- **Passos:**
  1. Formações → Cursos → "+ Novo Curso"
  2. Preencher: Título "Câmbio FX", Descrição, Nível ADVANCED, Banco "BCO01"
  3. Criar curso
  4. Abrir curso → "+ Nova Lição": Título "Introdução FX", Tipo THEORETICAL, Tempo 60 min
  5. Criar lição
  6. "+ Novo Desafio": Título "Desafio FX", Tipo COMPLETE, 50 operações, 120 min, MPU 1.5, Máx Erros 3
  7. Criar desafio
- **Resultado Esperado:** Curso, lição e desafio criados e visíveis nos detalhes do curso; HTTP 201 em cada criação
- **Verificações:**
  - [ ] Curso aparece na lista
  - [ ] Lição e desafio visíveis dentro do curso

---

### CT-ADMIN-08: Rever submissão de desafio COMPLETE — Reprovar
- **Tipo:** Positivo (fluxo de reprovação)
- **Pré-condição:** Existe uma submissão no estado "Pendente de Revisão"
- **Passos:**
  1. Formações → Revisões Pendentes
  2. Clicar na submissão
  3. Para cada operação com erro, clicar em "Classificar" → selecionar tipo (ex: Metodologia)
  4. Clicar em "Finalizar Revisão"
  5. Selecionar "Reprovar" + escrever feedback "Tempo acima do limite"
  6. Confirmar
- **Resultado Esperado:** Submissão marcada como Reprovada; aluno recebe notificação; HTTP 200
- **Verificações:**
  - [ ] Estado da submissão muda para "Reprovado"
  - [ ] Feedback visível na submissão do aluno
  - [ ] Aluno vê opção de nova tentativa (se permitido)

---

### CT-ADMIN-09: Aprovar análise de incidência
- **Tipo:** Positivo
- **Pré-condição:** Existe incidência em estado PENDING_TUTOR_REVIEW
- **Passos:**
  1. Tutoria → Erros
  2. Filtrar por estado "Pendente de Revisão do Tutor"
  3. Clicar na incidência
  4. Rever análise (5 Porquês, solução)
  5. Clicar em "Aprovar Análise"
- **Resultado Esperado:** Estado da incidência muda para APPROVED; HTTP 200
- **Verificações:**
  - [ ] Estado visível como "Aprovado" na lista e nos detalhes
  - [ ] Histórico de transições registado

---

### CT-ADMIN-10: Validar plano de ação com score inválido
- **Tipo:** Negativo / Edge Case
- **Pré-condição:** Existe plano de ação no estado "Concluído"
- **Passos:**
  1. Tutoria → Planos de Ação
  2. Abrir plano concluído → "Validar"
  3. Introduzir score: 6 (fora do intervalo 0–5)
  4. Tentar confirmar
- **Resultado Esperado:** Erro de validação; score rejeitado; plano não validado; HTTP 422
- **Verificações:**
  - [ ] Mensagem "Pontuação entre 0 e 5" visível
  - [ ] Formulário não submete

---

### CT-ADMIN-11: Validar plano com result_comment acima de 160 caracteres
- **Tipo:** Negativo / Edge Case
- **Pré-condição:** Existe plano de ação no estado "Concluído"
- **Passos:**
  1. Tutoria → Planos de Ação → abrir plano concluído → "Validar"
  2. Introduzir score: 4
  3. Introduzir comentário com 161+ caracteres
  4. Tentar confirmar
- **Resultado Esperado:** Erro de validação; comentário rejeitado; HTTP 422
- **Verificações:**
  - [ ] Contador de caracteres visível no campo
  - [ ] Mensagem de erro exibida

---

### CT-ADMIN-12: Gerir chamado — alterar estado e eliminar
- **Tipo:** Positivo
- **Pré-condição:** Existe pelo menos um chamado criado por outro utilizador
- **Passos:**
  1. Chamados → localizar o chamado no Kanban
  2. Clicar no chamado → alterar estado para "Em Andamento" → atribuir a si próprio → "Guardar"
  3. Voltar ao chamado → clicar "Eliminar" → confirmar
- **Resultado Esperado:** Estado atualizado e depois chamado eliminado; HTTP 200 + HTTP 204
- **Verificações:**
  - [ ] Estado visível como "Em Andamento" antes da eliminação
  - [ ] Após eliminar, chamado não aparece no Kanban

---

### CT-ADMIN-13: Acesso à tab Equipas nos Relatórios
- **Tipo:** Positivo
- **Pré-condição:** ADMIN autenticado; existem equipas configuradas
- **Passos:**
  1. Relatórios → menu lateral → "Equipas"
  2. Verificar dados por equipa
- **Resultado Esperado:** Tab Equipas visível e com dados; HTTP 200
- **Verificações:**
  - [ ] Tab "Equipas" existe e é clicável
  - [ ] Dados de performance por equipa exibidos

---

### CT-ADMIN-14: Acesso sem sessão activa (sessão expirada)
- **Tipo:** Edge Case
- **Pré-condição:** Utilizador já esteve autenticado; token expirado ou removido do sessionStorage
- **Passos:**
  1. Abrir DevTools → Application → sessionStorage → eliminar o token JWT
  2. Tentar navegar para uma página protegida (ex: /admin/users)
- **Resultado Esperado:** Redirecionamento automático para a página de login; HTTP 401 na chamada à API
- **Verificações:**
  - [ ] URL redireccionada para /login ou landing page
  - [ ] Nenhum dado privado exposto antes do redirect

---

### CT-ADMIN-15: Dark mode — formulários legíveis
- **Tipo:** Edge Case / Visual
- **Pré-condição:** ADMIN autenticado
- **Passos:**
  1. Clicar no ícone sol/lua (canto superior direito) para activar o modo escuro
  2. Navegar pelo formulário de criação de utilizador
  3. Navegar pelo formulário de validação de plano
  4. Navegar pelos relatórios avançados
- **Resultado Esperado:** Todos os campos, labels, tabelas e mensagens de erro legíveis em dark mode
- **Verificações:**
  - [ ] Contraste suficiente em todos os campos de texto
  - [ ] Tabelas com alternância de cor de linha visível
  - [ ] Dropdowns e selects com fundo e texto contrastantes

---

### CT-ADMIN-16: Criar Equipa e adicionar membros
- **Tipo:** Positivo
- **Pré-condição:** Existem utilizadores do tipo TRAINEE sem equipa atribuída
- **Passos:**
  1. Dados Mestres → Equipas → "+ Nova Equipa"
  2. Preencher: Nome "Equipa FX", Descrição, Manager (selecionar utilizador MANAGER)
  3. Criar
  4. Abrir equipa → "+ Adicionar Membro" → selecionar TRAINEE → confirmar
  5. "+ Adicionar Serviço" → selecionar produto
- **Resultado Esperado:** Equipa criada com membro e serviço; HTTP 201
- **Verificações:**
  - [ ] Equipa visível na lista
  - [ ] Membro aparece dentro da equipa
  - [ ] Serviço associado à equipa

---

### CT-ADMIN-17: Devolver análise de incidência com motivo
- **Tipo:** Positivo (fluxo de devolução)
- **Pré-condição:** Existe incidência em estado PENDING_TUTOR_REVIEW com análise submetida
- **Passos:**
  1. Tutoria → Erros → abrir incidência pendente
  2. Clicar em "Devolver"
  3. Escrever motivo: "A análise 5 Porquês está incompleta — preencher os 5 níveis"
  4. Confirmar
- **Resultado Esperado:** Estado muda para ANALYSIS; tutor recebe notificação de devolução; HTTP 200
- **Verificações:**
  - [ ] Estado visível como "Em Análise" ou "Devolvido"
  - [ ] Motivo da devolução visível nos detalhes
  - [ ] Tutor pode editar e resubmeter a análise

---

## 6. Checklist de Validação

### Autenticação e Segurança
- [ ] Login com credenciais válidas redireciona para Dashboard do ADMIN
- [ ] Login com credenciais inválidas exibe mensagem de erro sem detalhe técnico
- [ ] Token JWT armazenado em sessionStorage (não localStorage)
- [ ] Sessão expirada redireciona para login
- [ ] Acesso a rota protegida sem token retorna HTTP 401

### Gestão de Utilizadores
- [ ] CRUD completo de utilizadores funcional (Criar, Ler, Editar, Eliminar)
- [ ] Email duplicado rejeitado na criação
- [ ] Flags (is_tutor, is_referente, is_team_lead) guardadas correctamente
- [ ] Formador aprovado/rejeitado actualiza estado imediatamente

### Dados Mestres
- [ ] CRUD de Bancos, Produtos, Equipas, Categorias funcional
- [ ] Bancos eliminados não aparecem nos formulários de incidência
- [ ] Cascading Banco → Departamento → Actividade → Tipo Erro funciona

### Cursos e Formações
- [ ] Curso criado visível na lista e nos planos
- [ ] Lições e desafios adicionáveis e elimináveis dentro de um curso
- [ ] Plano finalizado gera certificado (quando seleccionado)

### Tutoria
- [ ] Análise aprovada actualiza estado para APPROVED
- [ ] Análise devolvida retorna para ANALYSIS com motivo registado
- [ ] Plano validado com score 0–5 aceite; score 6+ rejeitado
- [ ] Plano validado com comentário >160 caracteres rejeitado

### Chamados
- [ ] ADMIN pode alterar estado de qualquer chamado
- [ ] ADMIN pode eliminar chamados
- [ ] Comentários visíveis por todos os participantes

### Relatórios
- [ ] Tab Equipas visível e com dados
- [ ] Relatórios avançados com filtros funcionais

### Dark Mode e i18n
- [ ] Dark mode activo: todos os formulários legíveis
- [ ] Mudança de idioma (PT/EN/ES) actualiza todos os textos visíveis
- [ ] Formulários e mensagens de erro traduzidos nos 3 idiomas
