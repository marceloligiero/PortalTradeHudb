# QA Guide — TUTOR

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Role:** TRAINEE com flag `is_tutor=True`
**Data de revisão:** 2026-03-20
**Versão:** 1.0

---

## 1. Visão Geral

### Objetivo do perfil
O TUTOR é um aluno (TRAINEE) com responsabilidades adicionais no módulo de tutoria. Gere incidências dos seus tutorados, realiza a análise dos 5 Porquês, cria planos de ação, aprova planos, resolve incidências, e gere erros internos, censos e fichas de aprendizagem.

### Identificação no sistema
- **role:** `TRAINEE`
- **flag:** `is_tutor = True`
- Função `_is_tutor_or_admin()` retorna `True`
- Função `is_tutor_or_above()` retorna `True`

### Portais acessíveis
| Portal | Nível de Acesso |
|--------|----------------|
| Formações | Acesso completo como aluno (cursos, lições, desafios, planos, certificados) |
| Tutoria | Registar + analisar + criar planos + aprovar planos + resolver; erros internos; censos; fichas |
| Relatórios | Dashboard pessoal + formações + tutoria |
| Chamados | Criar e comentar |

---

## 2. Permissões e Restrições

| Funcionalidade | Permitido | Bloqueado |
|----------------|-----------|-----------|
| Registar incidência (para qualquer utilizador) | Sim | — |
| Analisar incidência (5 Porquês) | Sim | — |
| Submeter análise para aprovação do Chefe | Sim | — |
| Confirmar solução e resolver incidência | Sim | — |
| Criar plano de ação (CORRECTIVO, PREVENTIVO, MELHORIA) | Sim (com restrições MELHORIA) | — |
| Criar plano MELHORIA para origem ≠ Trade_Personas | Não | Validação bloqueante |
| Responsável de plano MELHORIA deve ser Tutor | Obrigatório | Validação bloqueante |
| Aprovar planos de ação submetidos | Sim | — |
| Devolver planos de ação | Sim | — |
| Criar/editar/eliminar censos | Sim | — |
| Criar fichas de aprendizagem | Sim | — |
| Submeter fichas para revisão | Sim | — |
| Avaliar erros internos (pesos, 5 Porquês) | Sim | — |
| Criar planos de ação para erros internos | Sim | — |
| Criar/editar utilizadores | Não | HTTP 403 |
| CRUD de master data | Não | HTTP 403 |
| Ver dados de outras equipas nos relatórios | Não | Tab "Equipas" não visível |

---

## 3. Fluxos de Frontend — Passo a Passo

### Login

**Pré-condição:** Conta TRAINEE com is_tutor=True activa.

1. Landing Page → **"Entrar"**
2. Introduzir Email e Password
3. Clicar em **"Entrar"**
4. **Resultado esperado:** Dashboard do Aluno carrega; barra superior inclui "Tutoria" com menu expandido

---

### Registar Nova Incidência

**Pré-condição:** TUTOR autenticado; existem bancos e departamentos configurados.

1. **"Tutoria"** → **"Erros"** → **"+ Novo Erro"**
2. Preencher o formulário:
   - **Tutorado:** selecionar o aluno/membro da equipa (obrigatório)
   - **Categoria:** selecionar da lista (obrigatório)
   - **Banco:** selecionar (obrigatório)
   - **Produto/Serviço:** selecionar
   - **Data de Ocorrência:** data passada (obrigatório)
   - **Descrição:** detalhe do erro (obrigatório)
   - **Impacto:** nível de impacto
   - **Origem:** selecionar da lista
   - **Detetado Por:** selecionar
   - **Departamento:** selecionar (obrigatório)
   - **Atividade:** dependente do Departamento
   - **Tipo de Erro:** dependente da Atividade
   - **Referência, Moeda, Montante, Severidade:** preencher se aplicável
3. Clicar em **"Registar"**
4. **Resultado esperado:** Incidência criada com estado `REGISTERED`; chefe/manager notificado; HTTP 201

---

### Analisar Incidência (5 Porquês)

**Pré-condição:** Existe incidência no estado `REGISTERED` ou `ANALYSIS` associada a tutorado do Tutor.

1. **"Tutoria"** → **"Erros"** → clicar na incidência
2. Tab **"Análise"** → preencher:
   - **Nível Impacto**
   - **Origem**
   - **Grabador, Liberador**
   - **Data Solução**
   - **Recorrência**
   - **Análise 5 Porquês** (mínimo preenchimento de porquê_1 a porquê_5)
   - **Solução**
   - **Resumo Plano Ação**
3. Clicar em **"Guardar"** (estado mantém-se como rascunho)
4. Clicar em **"Submeter Análise"**
5. **Resultado esperado:** Estado muda para `PENDING_CHIEF_APPROVAL`; Manager notificado; HTTP 200

---

### Criar Plano de Ação CORRECTIVO

**Pré-condição:** Análise da incidência aprovada; incidência em estado `APPROVED`.

1. Nos detalhes da incidência → **"+ Novo Plano de Ação"**
2. Preencher:
   - **Análise 5 Porquês** (rever/complementar)
   - **Correção Imediata**
   - **Ação Corretiva**
   - **Ação Preventiva**
   - **Tipo do Plano:** CORRECTIVO
   - **Responsável:** selecionar utilizador
   - **Prazo:** data limite
   - **5W2H:** O Quê, Porquê, Onde, Quando, Quem, Como, Quanto
3. Clicar em **"Criar"**
4. Dentro do plano → **"+ Novo Item"** → preencher Tipo, Descrição, Responsável, Prazo → **"Adicionar"**
5. Clicar em **"Submeter Plano"**
6. **Resultado esperado:** Plano criado e submetido; Chefe notificado; HTTP 201 + HTTP 200

---

### Criar Plano de Ação MELHORIA (válido — Origem Trade_Personas)

**Pré-condição:** Análise aprovada; Origem da incidência é `Trade_Personas`.

1. Nos detalhes da incidência → **"+ Novo Plano de Ação"**
2. Preencher todos os campos
3. **Tipo do Plano:** MELHORIA
4. **Responsável:** selecionar um utilizador com is_tutor=True (obrigatório)
5. Clicar em **"Criar"**
6. **Resultado esperado:** Plano MELHORIA criado; HTTP 201

---

### Criar Plano MELHORIA para Origem Incorrecta (edge case)

**Pré-condição:** Análise aprovada; Origem da incidência é diferente de `Trade_Personas` (ex: "Operações").

1. Nos detalhes da incidência → **"+ Novo Plano de Ação"**
2. Selecionar Tipo: MELHORIA
3. Tentar criar
4. **Resultado esperado:** Validação bloqueante activa; opção MELHORIA inactiva ou erro exibido; HTTP 422

---

### Aprovar Plano de Ação (Revisão Tutor)

**Pré-condição:** Existe plano de ação submetido que requer revisão do Tutor.

1. **"Tutoria"** → **"Revisão Tutor"**
2. Localizar o plano submetido
3. Rever items de ação
4. Clicar em **"Aprovar"**
5. **Resultado esperado:** Plano aprovado; executor do plano pode iniciar; HTTP 200

---

### Devolver Plano de Ação

**Pré-condição:** Existe plano de ação submetido.

1. **"Tutoria"** → **"Revisão Tutor"** → abrir plano
2. Clicar em **"Devolver"**
3. Escrever comentário com as correções necessárias
4. Confirmar
5. **Resultado esperado:** Plano devolvido; executor notificado; HTTP 200

---

### Confirmar Solução e Resolver Incidência

**Pré-condição:** Planos de ação concluídos; incidência em estado `APPROVED`.

1. Abrir incidência → **"Confirmar Solução"**
2. Depois, clicar em **"Resolver"**
3. (Opcional) **"Verificar"**
4. **Resultado esperado:** Estado muda para `RESOLVED`; HTTP 200

---

### Criar Ficha de Aprendizagem

**Pré-condição:** Existe incidência (qualquer estado activo).

1. Nos detalhes da incidência → **"Criar Ficha de Aprendizagem"**
2. Preencher: Título, Resumo do Erro, Causa Raiz, Procedimento Correto, Aprendizagens Chave, Material de Referência, É obrigatória? (Sim/Não)
3. Clicar em **"Criar"**
4. Na ficha criada → **"Submeter"**
5. **Resultado esperado:** Ficha criada e submetida para revisão do Chefe; HTTP 201 + HTTP 200

---

### Gerir Censos

**Pré-condição:** TUTOR autenticado.

1. **"Tutoria"** → Secção "Erros Internos" → **"Censos"**
2. **"+ Novo Censo"** → Preencher: Nome, Data Início, Data Fim → **"Criar"**
3. Para editar: ícone de edição ao lado do censo
4. Para eliminar: ícone de lixeira → confirmar
5. **Resultado esperado:** Censo criado/editado/eliminado; HTTP 201 / 200 / 204

---

### Avaliar Erro Interno

**Pré-condição:** Existe erro interno no escopo do Tutor.

1. **"Tutoria"** → Secção "Erros Internos" → **"Erros Internos"**
2. Clicar no erro interno
3. Preencher: Peso Liberador, Peso Gravador, Peso Tutor, 5 Porquês, Avaliação do Tutor
4. Clicar em **"Guardar"**
5. **Resultado esperado:** Avaliação guardada; HTTP 200

---

## 4. Campos e Validações

### Formulário de Registo de Incidência

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Tutorado | Sim | Select | Utilizador activo | "Tutorado obrigatório" |
| Categoria | Sim | Select | Lista de categorias activas | "Categoria obrigatória" |
| Banco | Sim | Select | Lista de bancos activos | "Banco obrigatório" |
| Produto | Não | Select | Dependente do Banco | — |
| Data de Ocorrência | Sim | Data | Não pode ser futura | "Data inválida" |
| Descrição | Sim | Texto Longo | Mínimo de texto | "Descrição obrigatória" |
| Impacto | Não | Select | Lista de impactos | — |
| Origem | Não | Select | Lista de origens | — |
| Departamento | Sim | Select | Lista de departamentos | "Departamento obrigatório" |
| Atividade | Não | Select | Dependente do Departamento (cascata) | — |
| Tipo de Erro | Não | Select | Dependente da Atividade (cascata) | — |

### Formulário de Criação de Plano de Ação

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Tipo do Plano | Sim | Select | CORRECTIVO / PREVENTIVO / MELHORIA | "Tipo obrigatório" |
| Tipo MELHORIA | Condicional | — | Só permitido se Origem = Trade_Personas | "Plano de Melhoria apenas para origem Trade_Personas" |
| Responsável (MELHORIA) | Condicional | Select | Must be is_tutor=True | "Responsável de Melhoria deve ser Tutor" |
| Prazo | Sim | Data | Não pode ser passada | "Data inválida" |
| 5W2H — O Quê | Sim | Texto | — | "Campo obrigatório" |
| 5W2H — Responsável | Sim | Texto | — | "Campo obrigatório" |

### Formulário de Validação de Score

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Score (result_score) | Sim | Inteiro | 0 a 5 | "Pontuação entre 0 e 5" |
| Comentário (result_comment) | Não | Texto | Máximo 160 caracteres | "Máximo 160 caracteres" |

---

## 5. Cenários de Teste QA

### CT-TUTOR-01: Login com credenciais válidas
- **Tipo:** Positivo
- **Pré-condição:** Conta TRAINEE com is_tutor=True activa
- **Passos:**
  1. Landing Page → "Entrar" → email + password → "Entrar"
- **Resultado Esperado:** Dashboard do Aluno carrega; portal Tutoria com menu completo (Erros, Revisão Tutor, Planos, Erros Internos, Censos, Fichas); HTTP 200
- **Verificações:**
  - [ ] Menu de Tutoria exibe todas as secções do Tutor
  - [ ] Dashboard de formações também acessível

---

### CT-TUTOR-02: Registar incidência com todos os campos obrigatórios
- **Tipo:** Positivo
- **Pré-condição:** Existem banco, departamento e tutorado configurados
- **Passos:**
  1. Tutoria → Erros → "+ Novo Erro"
  2. Tutorado: selecionar aluno, Banco: "BCO01", Departamento: "Câmbio", Data: hoje-1, Descrição: "Operação realizada no banco errado"
  3. Clicar em "Registar"
- **Resultado Esperado:** Incidência criada com estado REGISTERED; chefe/manager notificado; HTTP 201
- **Verificações:**
  - [ ] Incidência visível na lista de Erros
  - [ ] Estado inicial: "Registado"
  - [ ] Notificação enviada ao Manager/Chefe

---

### CT-TUTOR-03: Registar incidência sem campo obrigatório (Banco em branco)
- **Tipo:** Negativo
- **Pré-condição:** TUTOR autenticado
- **Passos:**
  1. Tutoria → Erros → "+ Novo Erro"
  2. Preencher todos os campos excepto Banco
  3. Clicar em "Registar"
- **Resultado Esperado:** Validação impede submissão; mensagem "Banco obrigatório"; HTTP 422
- **Verificações:**
  - [ ] Campo Banco destacado como inválido
  - [ ] Formulário não submete
  - [ ] Nenhuma incidência criada

---

### CT-TUTOR-04: Analisar incidência — preencher 5 Porquês e submeter
- **Tipo:** Positivo
- **Pré-condição:** Existe incidência no estado REGISTERED do Tutor
- **Passos:**
  1. Tutoria → Erros → clicar na incidência
  2. Tab "Análise" → preencher todos os campos incluindo Análise 5 Porquês
  3. "Guardar" (estado mantém-se REGISTERED)
  4. "Submeter Análise"
- **Resultado Esperado:** Estado muda para PENDING_CHIEF_APPROVAL; Manager recebe notificação NEW_ERROR; HTTP 200
- **Verificações:**
  - [ ] Estado actualizado na lista
  - [ ] Notificação gerada para o Manager

---

### CT-TUTOR-05: Criar plano CORRECTIVO após aprovação de análise
- **Tipo:** Positivo
- **Pré-condição:** Incidência em estado APPROVED com análise aprovada
- **Passos:**
  1. Abrir incidência → "+ Novo Plano de Ação"
  2. Tipo: CORRECTIVO, Responsável: qualquer utilizador, Prazo: +30 dias
  3. Preencher 5W2H mínimo
  4. Criar
  5. Adicionar 1 item de ação
  6. "Submeter Plano"
- **Resultado Esperado:** Plano CORRECTIVO criado e submetido; Chefe notificado; HTTP 201
- **Verificações:**
  - [ ] Plano visível em "Planos de Ação"
  - [ ] Estado: "Submetido"

---

### CT-TUTOR-06: Criar plano MELHORIA para incidência com Origem Trade_Personas
- **Tipo:** Positivo
- **Pré-condição:** Incidência aprovada com Origem = Trade_Personas; existe utilizador is_tutor=True
- **Passos:**
  1. Abrir incidência com Origem=Trade_Personas → "+ Novo Plano de Ação"
  2. Tipo: MELHORIA
  3. Responsável: selecionar utilizador com is_tutor=True
  4. Criar
- **Resultado Esperado:** Plano MELHORIA criado; HTTP 201
- **Verificações:**
  - [ ] Tipo "MELHORIA" visível e aceite
  - [ ] Responsável com is_tutor visível no plano

---

### CT-TUTOR-07: Criar plano MELHORIA para incidência com Origem ≠ Trade_Personas
- **Tipo:** Negativo / Edge Case
- **Pré-condição:** Incidência aprovada com Origem = "Operações" (não Trade_Personas)
- **Passos:**
  1. Abrir incidência → "+ Novo Plano de Ação"
  2. Tentar selecionar Tipo: MELHORIA
- **Resultado Esperado:** Opção MELHORIA inactiva ou erro de validação; HTTP 422 se tentado via API directamente
- **Verificações:**
  - [ ] Interface não permite selecionar MELHORIA para esta incidência
  - [ ] Mensagem explicativa exibida (ex: "Tipo Melhoria apenas disponível para Origem Trade_Personas")

---

### CT-TUTOR-08: Criar plano MELHORIA com responsável sem is_tutor
- **Tipo:** Negativo / Edge Case
- **Pré-condição:** Incidência aprovada com Origem = Trade_Personas; tentativa de usar utilizador sem is_tutor
- **Passos:**
  1. Abrir incidência → "+ Novo Plano de Ação"
  2. Tipo: MELHORIA
  3. Responsável: selecionar utilizador sem is_tutor (ex: um TRAINEE simples)
  4. Tentar criar
- **Resultado Esperado:** Validação bloqueante; mensagem "Responsável de Melhoria deve ser Tutor"; HTTP 422
- **Verificações:**
  - [ ] Formulário não submete
  - [ ] Mensagem de erro clara e específica

---

### CT-TUTOR-09: Aprovar plano de ação via Revisão Tutor
- **Tipo:** Positivo
- **Pré-condição:** Existe plano de ação no estado "Submetido" para revisão do Tutor
- **Passos:**
  1. Tutoria → "Revisão Tutor" → localizar plano
  2. Rever items → "Aprovar"
- **Resultado Esperado:** Plano aprovado; HTTP 200
- **Verificações:**
  - [ ] Estado do plano muda para "Aprovado"
  - [ ] Executor do plano pode iniciar a execução

---

### CT-TUTOR-10: Devolver plano de ação com comentário
- **Tipo:** Positivo
- **Pré-condição:** Existe plano submetido
- **Passos:**
  1. Tutoria → "Revisão Tutor" → abrir plano
  2. "Devolver" → escrever comentário → confirmar
- **Resultado Esperado:** Plano devolvido; executor notificado com comentário; HTTP 200
- **Verificações:**
  - [ ] Estado muda para "Devolvido"
  - [ ] Comentário visível nos detalhes do plano

---

### CT-TUTOR-11: Criar censo e eliminar censo
- **Tipo:** Positivo
- **Pré-condição:** TUTOR autenticado
- **Passos:**
  1. Tutoria → "Censos" → "+ Novo Censo"
  2. Nome: "Censo Q1 2026", Data Início: 01/01/2026, Data Fim: 31/03/2026 → Criar
  3. Localizar o censo → ícone de lixeira → confirmar
- **Resultado Esperado:** Censo criado (HTTP 201) e eliminado (HTTP 204)
- **Verificações:**
  - [ ] Censo aparece na lista após criação
  - [ ] Após eliminar, censo não aparece

---

### CT-TUTOR-12: Criar ficha de aprendizagem e submeter
- **Tipo:** Positivo
- **Pré-condição:** Existe incidência activa
- **Passos:**
  1. Abrir incidência → "Criar Ficha de Aprendizagem"
  2. Preencher: Título, Resumo do Erro, Causa Raiz, Procedimento Correto, Aprendizagens Chave
  3. Criar
  4. Na ficha → "Submeter"
- **Resultado Esperado:** Ficha criada e submetida; Chefe/Manager notificado; HTTP 201 + HTTP 200
- **Verificações:**
  - [ ] Ficha visível em "Minhas Fichas"
  - [ ] Estado: "Submetida"

---

### CT-TUTOR-13: Confirmar solução e resolver incidência
- **Tipo:** Positivo
- **Pré-condição:** Planos de ação concluídos; incidência em estado APPROVED
- **Passos:**
  1. Abrir incidência → "Confirmar Solução" → "Resolver"
- **Resultado Esperado:** Estado muda para RESOLVED; HTTP 200
- **Verificações:**
  - [ ] Estado "Resolvido" visível na lista
  - [ ] Incidência não aparece em erros abertos

---

### CT-TUTOR-14: Acesso a rota de ADMIN (bloqueado)
- **Tipo:** Negativo
- **Pré-condição:** TUTOR autenticado
- **Passos:**
  1. Tentar navegar directamente para `/admin/users`
- **Resultado Esperado:** Redirect ou HTTP 403
- **Verificações:**
  - [ ] "Dados Mestres" não visível na barra superior
  - [ ] URL directa redireccionada

---

### CT-TUTOR-15: Sessão expirada durante registo de incidência
- **Tipo:** Edge Case
- **Pré-condição:** TUTOR com formulário de incidência aberto; token expirado
- **Passos:**
  1. Abrir "+ Novo Erro" e preencher parcialmente
  2. Eliminar token do sessionStorage
  3. Tentar guardar
- **Resultado Esperado:** HTTP 401; redirect para login; dados de formulário perdidos (aceitável)
- **Verificações:**
  - [ ] Redirect para login ocorre
  - [ ] Nenhuma incidência parcial criada

---

### CT-TUTOR-16: Dark mode — portal de tutoria legível
- **Tipo:** Edge Case / Visual
- **Pré-condição:** TUTOR autenticado
- **Passos:**
  1. Activar dark mode
  2. Abrir formulário de registo de incidência
  3. Abrir formulário de criação de plano de ação
  4. Abrir ecrã de revisão de planos (Revisão Tutor)
- **Resultado Esperado:** Todos os campos e opções legíveis em modo escuro
- **Verificações:**
  - [ ] Selectores Banco, Departamento, Tipo Plano legíveis
  - [ ] Botões de aprovação/devolução claramente visíveis
  - [ ] Mensagens de erro em dark mode legíveis

---

### CT-TUTOR-17: Cascading Banco → Departamento → Actividade → Tipo Erro
- **Tipo:** Positivo / Edge Case
- **Pré-condição:** Sistema com cascata de dados mestres configurada
- **Passos:**
  1. Abrir formulário de nova incidência
  2. Selecionar Banco "BCO01"
  3. Verificar que Departamento é filtrado por Banco
  4. Selecionar Departamento "Câmbio"
  5. Verificar que Actividade é filtrada por Departamento
  6. Selecionar Actividade
  7. Verificar que Tipo de Erro é filtrado por Actividade
- **Resultado Esperado:** Cada selecção actualiza a lista do campo seguinte correctamente
- **Verificações:**
  - [ ] Selecção de Banco filtra Departamentos
  - [ ] Selecção de Departamento filtra Actividades
  - [ ] Selecção de Actividade filtra Tipos de Erro
  - [ ] Sem opções "fantasma" de outras entidades

---

## 6. Checklist de Validação

### Autenticação
- [ ] Login com is_tutor=True exibe menu completo de Tutoria
- [ ] Sessão expirada redireciona para login

### Registo de Incidências
- [ ] Campos obrigatórios (Data, Banco, Departamento, Descrição) bloqueiam submissão se vazios
- [ ] Cascading Banco → Departamento → Actividade → Tipo Erro funcional
- [ ] Incidência criada com estado REGISTERED
- [ ] Notificação enviada ao Manager/Chefe

### Análise e Submissão
- [ ] Guardar análise não muda estado
- [ ] Submeter análise avança para PENDING_CHIEF_APPROVAL
- [ ] Manager recebe notificação

### Planos de Ação
- [ ] Plano CORRECTIVO e PREVENTIVO criáveis para qualquer origem
- [ ] Plano MELHORIA apenas para Origem = Trade_Personas
- [ ] Responsável de plano MELHORIA deve ter is_tutor=True
- [ ] Items de ação adicionáveis e submetíveis

### Revisão Tutor
- [ ] Aprovação de planos notifica o executor
- [ ] Devolução com comentário registada no histórico

### Erros Internos e Censos
- [ ] CRUD de censos funcional
- [ ] Avaliação de erros internos guardada correctamente
- [ ] Criação de fichas de aprendizagem e submissão funcional

### Resolução
- [ ] Confirmar Solução + Resolver muda estado para RESOLVED

### Dark Mode e i18n
- [ ] Dark mode: formulários de tutoria legíveis
- [ ] Idioma PT/EN/ES actualiza todas as labels de tutoria
