# QA Guide — MANAGER (Gestor de Equipa)

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Role:** MANAGER
**Data de revisão:** 2026-03-20
**Versão:** 1.0

---

## 1. Visão Geral

### Objetivo do perfil
O MANAGER é o gestor/chefe de equipa. Tem acesso completo de leitura a formações, aprova e devolve análises de incidências e planos de ação da sua equipa, e acede a relatórios detalhados incluindo a performance individual dos seus membros. Não cria conteúdos de formação nem altera dados mestres.

### Identificação no sistema
- **role:** `MANAGER`
- Equivale a `is_team_lead=True` na lógica de aprovação de tutoria
- Função `is_chefe_referente_manager()` retorna `True` para este role
- Função `is_chefe_or_manager()` retorna `True` para este role

### Portais acessíveis
| Portal | Nível de Acesso |
|--------|----------------|
| Formações | Leitura completa; sem criar/editar/eliminar |
| Tutoria | Aprovar/devolver análises; aprovar/devolver/validar planos de ação; rever fichas de aprendizagem |
| Relatórios | Acesso completo incluindo tab exclusiva "A Minha Equipa" |
| Dados Mestres | Apenas leitura |
| Chamados | Criar e comentar (sem gerir estados) |

---

## 2. Permissões e Restrições

| Funcionalidade | Permitido | Bloqueado |
|----------------|-----------|-----------|
| Visualizar cursos, lições, desafios | Sim | — |
| Criar/editar/eliminar cursos | Não | Botões não visíveis; HTTP 403 |
| Visualizar planos de formação | Sim | — |
| Criar/alterar planos de formação | Não | Botões não visíveis; HTTP 403 |
| Aprovar/devolver análises de incidência | Sim | — |
| Preencher formulário de análise de incidência | Sim (editável) | — |
| Cancelar incidência (com motivo) | Sim | — |
| Registar nova incidência | Sim | — |
| Aprovar/devolver planos de ação | Sim | — |
| Validar plano concluído (score + comentário) | Sim | — |
| Devolver itens de ação | Sim | — |
| Rever fichas de aprendizagem | Sim | — |
| Criar/editar dados mestres (bancos, produtos, etc.) | Não | HTTP 403 |
| Criar utilizadores | Não | HTTP 403 |
| Alterar estado de chamados | Não | Só ADMIN |
| Tab "Equipas" nos Relatórios | Sim (exclusivo) | — |
| Tab "A Minha Equipa" nos Relatórios | Sim (exclusivo) | — |

---

## 3. Fluxos de Frontend — Passo a Passo

### Login

**Pré-condição:** Conta MANAGER activa no sistema.

1. Aceder à Landing Page → **"Entrar"**
2. Introduzir Email e Password
3. Clicar em **"Entrar"**
4. **Resultado esperado:** Dashboard carrega; barra superior com 5 portais; Portal Tutoria apresenta secções de aprovação

---

### Visualizar Cursos (apenas leitura)

**Pré-condição:** MANAGER autenticado.

1. **"Formações"** → **"Cursos"**
2. Clicar num curso para ver detalhes, lições e desafios
3. **Resultado esperado:** Detalhes do curso visíveis; sem botões "Editar" nem "Eliminar" activos para o MANAGER
4. Tentar criar curso: botão "+ Novo Curso" não deve aparecer ou deve estar desactivado

---

### Análise de Incidência — Preencher e Submeter para Tutor

**Pré-condição:** Existe incidência no estado `REGISTERED` ou `ANALYSIS`.

1. **"Tutoria"** → **"Análise"**
2. Localizar incidência no estado "Registado" ou "Em Análise"
3. Clicar na incidência → tab **"Análise"**
4. Preencher todos os campos:
   - **Nível Impacto:** BAIXO / MEDIO / ALTO / CRITICO
   - **Detalhe Impacto:** texto descritivo
   - **Origem:** selecionar da lista (ex: Trade_Personas)
   - **Detalhe Origem:** detalhe da origem
   - **Grabador:** selecionar utilizador
   - **Liberador:** selecionar utilizador
   - **Data Solução:** data em que o erro foi corrigido
   - **Recorrência:** SI / NO / PERIODICA
   - **Análise 5 Porquês:** análise de causa raiz
   - **Solução:** descrição da solução aplicada
   - **Resumo Plano Ação:** resumo do que será feito
5. Clicar em **"Guardar"** para guardar rascunho (estado não muda)
6. Clicar em **"Submeter para Tutor"** para avançar
7. **Resultado esperado:** Estado muda para `PENDING_TUTOR_REVIEW`; HTTP 200

---

### Aprovar Análise Submetida por Referente

**Pré-condição:** Existe incidência no estado `PENDING_CHIEF_APPROVAL` (submetida pelo Referente).

1. **"Tutoria"** → **"Análise"** ou **"Erros"**
2. Filtrar/localizar incidências no estado "Pendente de Aprovação do Chefe"
3. Clicar na incidência → rever análise
4. Clicar em **"Aprovar Análise"**
5. **Resultado esperado:** Estado muda para `PENDING_TUTOR_REVIEW`; Referente recebe notificação; HTTP 200

---

### Devolver Análise com Motivo

**Pré-condição:** Existe incidência em `PENDING_CHIEF_APPROVAL` ou `PENDING_TUTOR_REVIEW`.

1. Abrir a incidência → rever análise
2. Clicar em **"Devolver"**
3. Escrever o motivo de devolução (obrigatório)
4. Confirmar
5. **Resultado esperado:** Estado volta para `ANALYSIS`; Referente/Tutor recebe notificação com motivo; HTTP 200

---

### Aprovar Plano de Ação

**Pré-condição:** Existe plano de ação no estado "Submetido".

1. **"Tutoria"** → **"Planos de Ação"**
2. Localizar plano submetido
3. Clicar em **"Aprovar"**
4. **Resultado esperado:** Plano aprovado; tutor pode iniciar execução; HTTP 200

---

### Validar Plano de Ação Concluído

**Pré-condição:** Existe plano de ação no estado "Concluído".

1. **"Tutoria"** → **"Planos de Ação"**
2. Localizar plano concluído
3. Clicar em **"Validar"**
4. Atribuir pontuação (0–5, inteiro) e escrever comentário (máx. 160 caracteres)
5. Confirmar
6. **Resultado esperado:** Plano passa para "Validado"; HTTP 200

---

### Cancelar Incidência com Motivo Obrigatório

**Pré-condição:** Existe incidência activa (não RESOLVED nem CANCELLED).

1. **"Tutoria"** → **"Erros"** → abrir incidência
2. Clicar em **"Cancelar"**
3. Preencher motivo obrigatório
4. Confirmar
5. **Resultado esperado:** Estado muda para `CANCELLED`; motivo registado; HTTP 200

---

### Rever Ficha de Aprendizagem

**Pré-condição:** Existe ficha de aprendizagem no estado "Submetida".

1. **"Tutoria"** → **"Fichas de Aprendizagem"**
2. Localizar ficha submetida
3. Clicar na ficha → escolher resultado → escrever notas
4. Clicar em **"Guardar Revisão"**
5. **Resultado esperado:** Ficha revisada; HTTP 200

---

### Relatório "A Minha Equipa" (exclusivo MANAGER)

**Pré-condição:** MANAGER autenticado; equipa com membros activos.

1. **"Relatórios"** → **"A Minha Equipa"**
2. Ver performance individual de cada membro
3. **Resultado esperado:** Dados por membro visíveis (cursos concluídos, incidências, etc.); HTTP 200

---

### Consultar Dados Mestres (somente leitura)

**Pré-condição:** MANAGER autenticado.

1. Clicar em **"Dados Mestres"** na barra superior
2. Consultar listas de Bancos, Produtos, Equipas, etc.
3. **Resultado esperado:** Dados visíveis; sem botões de criação/edição/eliminação activos

---

## 4. Campos e Validações

### Formulário de Análise de Incidência (editável pelo MANAGER)

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Nível Impacto | Sim | Select | BAIXO / MEDIO / ALTO / CRITICO | "Nível de impacto obrigatório" |
| Detalhe Impacto | Não | Texto Longo | — | — |
| Origem | Sim | Select | Lista de origens configuradas | "Origem obrigatória" |
| Detalhe Origem | Não | Texto Longo | — | — |
| Grabador | Não | Select | Lista de utilizadores | — |
| Liberador | Não | Select | Lista de utilizadores | — |
| Data Solução | Não | Data | Formato válido; não futuro | "Data inválida" |
| Recorrência | Sim | Select | SI / NO / PERIODICA | "Recorrência obrigatória" |
| Análise 5 Porquês | Sim | Texto Longo | — | "Análise obrigatória" |
| Solução | Sim | Texto Longo | — | "Solução obrigatória" |
| Resumo Plano Ação | Não | Texto Longo | — | — |

### Formulário de Validação de Plano de Ação

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Score (result_score) | Sim | Inteiro | 0 a 5 | "Pontuação entre 0 e 5" |
| Comentário (result_comment) | Não | Texto | Máximo 160 caracteres | "Máximo 160 caracteres" |

### Formulário de Cancelamento de Incidência

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Motivo de Cancelamento | Sim | Texto | Não pode estar vazio | "Motivo obrigatório para cancelar" |

---

## 5. Cenários de Teste QA

### CT-MANAGER-01: Login com credenciais válidas
- **Tipo:** Positivo
- **Pré-condição:** Conta MANAGER activa
- **Passos:**
  1. Landing Page → "Entrar" → introduzir email e password → "Entrar"
- **Resultado Esperado:** Dashboard carrega; 5 portais visíveis; HTTP 200
- **Verificações:**
  - [ ] Dashboard sem erros de carregamento
  - [ ] Tab "A Minha Equipa" visível nos Relatórios

---

### CT-MANAGER-02: Tentar criar um curso (bloqueado)
- **Tipo:** Negativo (controlo de acesso)
- **Pré-condição:** MANAGER autenticado
- **Passos:**
  1. Formações → Cursos
  2. Verificar se o botão "+ Novo Curso" está visível
  3. Tentar aceder directamente a `/trainer/courses/new`
- **Resultado Esperado:** Botão não visível ou inactivo; acesso directo por URL retorna redirect ou HTTP 403
- **Verificações:**
  - [ ] Sem botão de criação na interface
  - [ ] HTTP 403 na chamada directa à API de criação de curso

---

### CT-MANAGER-03: Aprovar análise submetida pelo Referente
- **Tipo:** Positivo
- **Pré-condição:** Existe incidência em estado `PENDING_CHIEF_APPROVAL`
- **Passos:**
  1. Tutoria → Análise → localizar incidência "Pendente de Aprovação do Chefe"
  2. Abrir → rever análise → "Aprovar Análise"
- **Resultado Esperado:** Estado muda para `PENDING_TUTOR_REVIEW`; HTTP 200; Tutor recebe notificação
- **Verificações:**
  - [ ] Estado atualizado na lista e nos detalhes
  - [ ] Notificação gerada para o Tutor responsável

---

### CT-MANAGER-04: Devolver análise com motivo
- **Tipo:** Positivo (fluxo de devolução)
- **Pré-condição:** Existe incidência em estado `PENDING_CHIEF_APPROVAL`
- **Passos:**
  1. Tutoria → Análise → abrir incidência pendente
  2. Clicar em "Devolver"
  3. Escrever motivo: "Os 5 Porquês estão incompletos. Detalhar causas 3, 4 e 5."
  4. Confirmar
- **Resultado Esperado:** Estado volta para `ANALYSIS`; motivo visível nos detalhes; Referente notificado; HTTP 200
- **Verificações:**
  - [ ] Estado muda para "Em Análise" ou "Devolvido"
  - [ ] Motivo da devolução visível no histórico da incidência
  - [ ] Referente/Tutor pode reabrir a análise

---

### CT-MANAGER-05: Preencher análise completa e submeter para Tutor
- **Tipo:** Positivo
- **Pré-condição:** Existe incidência no estado `REGISTERED` ou `ANALYSIS`
- **Passos:**
  1. Tutoria → Análise → clicar em incidência
  2. Tab "Análise" → preencher todos os campos obrigatórios
  3. Guardar (estado mantém-se)
  4. "Submeter para Tutor"
- **Resultado Esperado:** Estado muda para `PENDING_TUTOR_REVIEW`; HTTP 200
- **Verificações:**
  - [ ] Guardar sem submeter não muda o estado
  - [ ] Após submeter, estado actualizado
  - [ ] Tutor recebe notificação NEW_ANALYSIS

---

### CT-MANAGER-06: Cancelar incidência sem motivo (bloqueado)
- **Tipo:** Negativo
- **Pré-condição:** Existe incidência activa
- **Passos:**
  1. Tutoria → Erros → abrir incidência
  2. Clicar em "Cancelar"
  3. Deixar o campo de motivo vazio
  4. Tentar confirmar
- **Resultado Esperado:** Validação bloqueia a submissão; mensagem "Motivo obrigatório para cancelar"; HTTP 422
- **Verificações:**
  - [ ] Botão de confirmação inactivo ou erro visível
  - [ ] Estado da incidência não alterado

---

### CT-MANAGER-07: Cancelar incidência com motivo válido
- **Tipo:** Positivo
- **Pré-condição:** Existe incidência activa (não RESOLVED nem CANCELLED)
- **Passos:**
  1. Tutoria → Erros → abrir incidência → "Cancelar"
  2. Escrever motivo: "Incidência duplicada — ver referência #1234"
  3. Confirmar
- **Resultado Esperado:** Estado muda para `CANCELLED`; motivo registado; HTTP 200
- **Verificações:**
  - [ ] Estado visível como "Cancelado"
  - [ ] Motivo visível nos detalhes da incidência

---

### CT-MANAGER-08: Aprovar plano de ação
- **Tipo:** Positivo
- **Pré-condição:** Existe plano de ação no estado "Submetido"
- **Passos:**
  1. Tutoria → Planos de Ação → localizar plano submetido
  2. Clicar em "Aprovar"
- **Resultado Esperado:** Plano aprovado; Tutor pode iniciar execução; HTTP 200
- **Verificações:**
  - [ ] Estado do plano muda para "Aprovado"
  - [ ] Tutor recebe notificação PLAN_APPROVED

---

### CT-MANAGER-09: Validar plano com score inválido (6)
- **Tipo:** Negativo / Edge Case
- **Pré-condição:** Existe plano de ação no estado "Concluído"
- **Passos:**
  1. Tutoria → Planos de Ação → plano concluído → "Validar"
  2. Introduzir score: 6
  3. Tentar confirmar
- **Resultado Esperado:** Erro de validação; HTTP 422
- **Verificações:**
  - [ ] Mensagem "Pontuação entre 0 e 5" visível
  - [ ] Formulário não submete

---

### CT-MANAGER-10: Validar plano com comentário de 160 caracteres exactos
- **Tipo:** Edge Case
- **Pré-condição:** Existe plano de ação no estado "Concluído"
- **Passos:**
  1. Tutoria → Planos de Ação → plano concluído → "Validar"
  2. Score: 5
  3. Comentário com exactamente 160 caracteres (verificar contador)
  4. Confirmar
- **Resultado Esperado:** Comentário aceite; plano validado; HTTP 200
- **Verificações:**
  - [ ] Contador de caracteres mostra 160/160
  - [ ] Plano passa para estado "Validado"

---

### CT-MANAGER-11: Escalamento Referente → Chefe — fluxo completo
- **Tipo:** Positivo (fluxo end-to-end)
- **Pré-condição:** Referente submeteu análise; incidência em `PENDING_CHIEF_APPROVAL`
- **Passos:**
  1. MANAGER: Tutoria → Análise → localizar incidência
  2. Verificar que a análise foi preenchida pelo Referente
  3. Clicar em "Aprovar Análise"
  4. Verificar que o Tutor recebe notificação
- **Resultado Esperado:** Estado avança para `PENDING_TUTOR_REVIEW`; fluxo correcto conforme REGISTERED → ANALYSIS → PENDING_CHIEF_APPROVAL → PENDING_TUTOR_REVIEW
- **Verificações:**
  - [ ] Histórico de estados da incidência registado correctamente
  - [ ] Notificação enviada ao Tutor

---

### CT-MANAGER-12: Tab "A Minha Equipa" — dados correctos
- **Tipo:** Positivo
- **Pré-condição:** MANAGER com equipa activa e membros com actividade
- **Passos:**
  1. Relatórios → "A Minha Equipa"
  2. Verificar dados de um membro específico
- **Resultado Esperado:** Performance do membro exibida correctamente; dados de outras equipas não visíveis; HTTP 200
- **Verificações:**
  - [ ] Apenas membros da equipa do MANAGER visíveis
  - [ ] Métricas coerentes com actividade registada

---

### CT-MANAGER-13: Tentar aceder a criação de master data
- **Tipo:** Negativo
- **Pré-condição:** MANAGER autenticado
- **Passos:**
  1. Dados Mestres → tentar encontrar botão "+ Novo" em Bancos
  2. Tentar aceder directamente a `/admin/master-data/banks/new`
- **Resultado Esperado:** Sem botões de criação na interface; HTTP 403 em acesso directo
- **Verificações:**
  - [ ] Interface exibe dados mas sem opções de edição
  - [ ] API retorna HTTP 403

---

### CT-MANAGER-14: Acesso sem sessão activa
- **Tipo:** Edge Case
- **Pré-condição:** Token JWT expirado ou removido
- **Passos:**
  1. Eliminar token do sessionStorage
  2. Tentar navegar para /tutoria/analysis
- **Resultado Esperado:** Redirect para login; HTTP 401 na API
- **Verificações:**
  - [ ] Redirect para login ocorre
  - [ ] Nenhum dado privado exposto

---

### CT-MANAGER-15: Dark mode — formulário de análise legível
- **Tipo:** Edge Case / Visual
- **Pré-condição:** MANAGER autenticado
- **Passos:**
  1. Activar dark mode
  2. Abrir formulário de análise de incidência (tab Análise)
  3. Verificar todos os campos
- **Resultado Esperado:** Todos os campos, selects, labels legíveis em modo escuro
- **Verificações:**
  - [ ] Contraste adequado em todos os inputs
  - [ ] Selectores de Nível Impacto, Origem, Recorrência legíveis
  - [ ] Botões "Guardar" e "Submeter para Tutor" claramente visíveis

---

### CT-MANAGER-16: Notificações — receber e marcar como lidas
- **Tipo:** Positivo
- **Pré-condição:** Existem notificações não lidas (ex: análises submetidas)
- **Passos:**
  1. Tutoria → "Notificações" (ícone sino)
  2. Verificar lista de notificações
  3. Clicar em "Marcar todas lidas"
- **Resultado Esperado:** Contador de notificações no ícone zera; lista marcada como lida; HTTP 200
- **Verificações:**
  - [ ] Contador desaparece após marcar como lidas
  - [ ] Notificações continuam visíveis como "lidas" na lista

---

## 6. Checklist de Validação

### Autenticação
- [ ] Login com credenciais válidas redireciona para Dashboard
- [ ] Login com credenciais inválidas exibe mensagem de erro
- [ ] Sessão expirada redireciona para login

### Controlo de Acesso
- [ ] Botões de criação de cursos/lições/desafios não visíveis
- [ ] Botões de criação/edição em Dados Mestres não visíveis
- [ ] API retorna HTTP 403 para operações de escrita em formações
- [ ] Tab "Dados Mestres" mostra dados mas sem edição

### Tutoria — Análises
- [ ] Formulário de análise editável para MANAGER
- [ ] Guardar rascunho não altera estado da incidência
- [ ] Submeter para Tutor avança para PENDING_TUTOR_REVIEW
- [ ] Aprovar análise do Referente avança para PENDING_TUTOR_REVIEW
- [ ] Devolver análise retorna para ANALYSIS com motivo registado
- [ ] Cancelar incidência sem motivo bloqueado

### Tutoria — Planos de Ação
- [ ] Aprovar plano notifica o Tutor
- [ ] Devolver plano com comentário funcional
- [ ] Validar plano com score 0–5 aceite
- [ ] Score 6+ rejeitado com mensagem de erro
- [ ] Comentário >160 caracteres rejeitado

### Relatórios
- [ ] Tab "A Minha Equipa" exclusiva e com dados correctos
- [ ] Relatórios de outras equipas não visíveis

### Dark Mode e i18n
- [ ] Dark mode: formulário de análise legível
- [ ] Mudança de idioma actualiza textos do portal de tutoria
