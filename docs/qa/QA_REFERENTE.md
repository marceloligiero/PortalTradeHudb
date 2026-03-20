# QA Guide — REFERENTE

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Role:** TRAINEE com flag `is_referente=True`
**Data de revisão:** 2026-03-20
**Versão:** 1.0

---

## 1. Visão Geral

### Objetivo do perfil
O REFERENTE representa o chefe de equipa no módulo de tutoria. Pode preencher a análise das incidências da equipa e submetê-las para aprovação do Chefe/Manager (fluxo escalante). O Referente nunca aprova directamente — a sua submissão coloca a incidência em `PENDING_CHIEF_APPROVAL`, aguardando o Manager.

### Identificação no sistema
- **role:** `TRAINEE`
- **flag:** `is_referente = True`
- Função `is_chefe_referente_manager()` retorna `True`
- Função `is_referente_user()` retorna `True`
- **Diferença crítica vs Manager:** O Referente sempre escala para o Chefe (`PENDING_CHIEF_APPROVAL`). O Manager submete directamente para o Tutor (`PENDING_TUTOR_REVIEW`).

### Portais acessíveis
| Portal | Nível de Acesso |
|--------|----------------|
| Formações | Acesso completo como aluno (cursos, lições, desafios, planos, certificados) |
| Tutoria | Visualizar erros da equipa; preencher análise; submeter para Chefe; ver planos/fichas |
| Relatórios | Dashboard pessoal + formações + tutoria (visão equipa) |
| Chamados | Criar e comentar |

---

## 2. Permissões e Restrições

| Funcionalidade | Permitido | Bloqueado |
|----------------|-----------|-----------|
| Visualizar erros da equipa | Sim | — |
| Preencher formulário de análise | Sim (editável) | — |
| Submeter análise (escala para Chefe) | Sim | — |
| Aprovar directamente análises (sem passar pelo Chefe) | Não | Fluxo sempre passa por PENDING_CHIEF_APPROVAL |
| Cancelar incidências | Não | HTTP 403 |
| Criar novas incidências | Não (o Referente não regista incidências — apenas visualiza) | HTTP 403 |
| Ver planos de ação (leitura) | Sim | — |
| Criar planos de ação | Não | HTTP 403 |
| Ver fichas de aprendizagem (leitura) | Sim | — |
| Criar fichas de aprendizagem | Não | HTTP 403 |
| CRUD de master data | Não | HTTP 403 |
| Criar utilizadores | Não | HTTP 403 |
| Alterar estado de chamados | Não | Apenas ADMIN |
| Tab "A Minha Equipa" nos Relatórios | Não | Exclusiva de MANAGER |

---

## 3. Fluxos de Frontend — Passo a Passo

### Login

**Pré-condição:** Conta TRAINEE com is_referente=True activa.

1. Landing Page → **"Entrar"**
2. Introduzir Email e Password
3. Clicar em **"Entrar"**
4. **Resultado esperado:** Dashboard do Aluno carrega; barra superior inclui "Tutoria" com menu de Referente (Dashboard, Erros, Análise, Planos de Ação, Relatório, Fichas de Aprendizagem, Notificações)

---

### Consultar Erros da Equipa

**Pré-condição:** Existem incidências associadas à equipa do Referente.

1. **"Tutoria"** → **"Erros"**
2. Ver lista de erros da equipa (todos os estados)
3. Clicar num erro para ver detalhes completos
4. **Resultado esperado:** Lista e detalhes visíveis; sem botões de edição de dados do erro (apenas análise editável)

---

### Preencher Análise e Submeter para Chefe

**Pré-condição:** Existe incidência no estado `REGISTERED` ou `ANALYSIS` da equipa.

1. **"Tutoria"** → **"Análise"**
2. Localizar incidência no estado "Registado" ou "Em Análise"
3. Clicar na incidência → tab **"Análise"**
4. Preencher **todos** os campos do formulário:
   - **Nível Impacto:** BAIXO / MEDIO / ALTO / CRITICO
   - **Detalhe Impacto:** texto descritivo do impacto operacional
   - **Origem:** selecionar da lista (ex: Trade_Personas)
   - **Detalhe Origem:** detalhe específico
   - **Grabador:** selecionar operador responsável pelo registo
   - **Liberador:** selecionar operador que liberou a operação
   - **Data Solução:** data de correcção (se já resolvido)
   - **Solução Confirmada:** marcar se confirmada
   - **Recorrência:** SI / NO / PERIODICA
   - **Análise 5 Porquês:** preencher os 5 níveis de causa raiz
   - **Solução:** descrever a solução proposta
   - **Resumo Plano Ação:** indicar as linhas do plano
5. Clicar em **"Guardar"** para salvar rascunho (sem mudar estado)
6. Verificar que o estado continua "Registado" ou "Em Análise"
7. Clicar em **"Submeter para Tutor"**
8. **Resultado esperado:** Estado muda para `PENDING_CHIEF_APPROVAL` (não para PENDING_TUTOR_REVIEW); Manager/Chefe recebe notificação; HTTP 200

---

### Diferença de Fluxo Referente vs Manager

**Pré-condição:** Comparar o comportamento da submissão entre os dois roles.

- **Referente submete:** Estado vai para `PENDING_CHIEF_APPROVAL`
- **Manager submete:** Estado vai directamente para `PENDING_TUTOR_REVIEW`

Esta diferença é **crítica** para o QA verificar:

1. Como Referente: submeter análise → verificar que estado é `PENDING_CHIEF_APPROVAL`
2. Como Manager: submeter análise → verificar que estado é `PENDING_TUTOR_REVIEW`

---

### Consultar Planos de Ação (apenas leitura)

**Pré-condição:** Existem planos de ação da equipa.

1. **"Tutoria"** → **"Planos de Ação"**
2. Ver lista de planos
3. Clicar num plano para ver detalhes, items, responsáveis, prazos
4. **Resultado esperado:** Detalhes visíveis; sem botões de edição nem criação de planos

---

### Consultar Fichas de Aprendizagem (apenas leitura)

**Pré-condição:** Existem fichas de aprendizagem da equipa.

1. **"Tutoria"** → **"Fichas de Aprendizagem"**
2. Ver lista e detalhes das fichas
3. **Resultado esperado:** Fichas visíveis; sem opção de criação ou edição

---

### Portal de Formações (como Aluno)

**Pré-condição:** REFERENTE autenticado; tem planos de formação atribuídos.

1. **"Formações"** → navegar por: Dashboard, Planos, Meus Cursos, Meus Desafios, Minhas Lições, Certificados
2. **Resultado esperado:** Acesso idêntico ao de um STUDENT; ver CT-STUDENT para detalhes

---

### Notificações

**Pré-condição:** Existem notificações não lidas.

1. **"Tutoria"** → **"Notificações"** (ícone sino)
2. Ver lista de notificações relevantes (análise devolvida, etc.)
3. Clicar em **"Marcar todas lidas"**
4. **Resultado esperado:** Contador de notificações zera; HTTP 200

---

## 4. Campos e Validações

### Formulário de Análise de Incidência (editável pelo Referente)

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Nível Impacto | Sim | Select | BAIXO / MEDIO / ALTO / CRITICO | "Nível de impacto obrigatório" |
| Detalhe Impacto | Não | Texto Longo | — | — |
| Origem | Sim | Select | Lista de origens | "Origem obrigatória" |
| Detalhe Origem | Não | Texto Longo | — | — |
| Grabador | Não | Select | Lista de utilizadores | — |
| Liberador | Não | Select | Lista de utilizadores | — |
| Data Solução | Não | Data | Não pode ser futura | "Data inválida" |
| Solução Confirmada | Não | Boolean | — | — |
| Recorrência | Sim | Select | SI / NO / PERIODICA | "Recorrência obrigatória" |
| Análise 5 Porquês | Sim | Texto Longo | Mínimo de texto | "Análise obrigatória" |
| Solução | Sim | Texto Longo | — | "Solução obrigatória" |
| Resumo Plano Ação | Não | Texto Longo | — | — |

---

## 5. Cenários de Teste QA

### CT-REFERENTE-01: Login com credenciais válidas
- **Tipo:** Positivo
- **Pré-condição:** Conta TRAINEE com is_referente=True activa
- **Passos:**
  1. Landing Page → "Entrar" → email + password → "Entrar"
- **Resultado Esperado:** Dashboard do Aluno carrega; Portal Tutoria com menu de Referente visível; HTTP 200
- **Verificações:**
  - [ ] Menu de Tutoria exibe: Dashboard, Erros, Análise, Planos de Ação, Relatório, Fichas, Notificações
  - [ ] Menu de Tutoria NÃO exibe: "Revisão Tutor", "Erros Internos", "Censos"
  - [ ] Portal de Formações acessível como aluno

---

### CT-REFERENTE-02: Consultar erros da equipa (leitura)
- **Tipo:** Positivo
- **Pré-condição:** Existem incidências da equipa em vários estados
- **Passos:**
  1. Tutoria → "Erros"
  2. Clicar num erro para ver detalhes completos
  3. Verificar os detalhes: descrição, análise, planos, comentários
- **Resultado Esperado:** Detalhes visíveis; sem botões destrutivos; HTTP 200
- **Verificações:**
  - [ ] Lista de erros da equipa exibida
  - [ ] Detalhes completos de cada erro acessíveis
  - [ ] Sem botão "Cancelar" ou "Eliminar" activos

---

### CT-REFERENTE-03: Preencher análise completa e guardar rascunho
- **Tipo:** Positivo
- **Pré-condição:** Existe incidência no estado REGISTERED ou ANALYSIS da equipa
- **Passos:**
  1. Tutoria → Análise → clicar na incidência
  2. Tab "Análise" → preencher todos os campos obrigatórios
  3. Clicar em "Guardar"
  4. Verificar o estado da incidência
- **Resultado Esperado:** Análise guardada como rascunho; estado da incidência NÃO muda; HTTP 200
- **Verificações:**
  - [ ] Campos guardados correctamente (abrir novamente e verificar)
  - [ ] Estado da incidência mantém-se "Registado" ou "Em Análise"
  - [ ] Nenhuma notificação enviada ao Chefe

---

### CT-REFERENTE-04: Submeter análise para o Chefe (escala para PENDING_CHIEF_APPROVAL)
- **Tipo:** Positivo
- **Pré-condição:** Análise preenchida; incidência em REGISTERED ou ANALYSIS
- **Passos:**
  1. Tutoria → Análise → abrir incidência com análise rascunhada
  2. Clicar em "Submeter para Tutor"
  3. Verificar o novo estado
- **Resultado Esperado:** Estado muda para PENDING_CHIEF_APPROVAL (NÃO para PENDING_TUTOR_REVIEW); Manager/Chefe recebe notificação; HTTP 200
- **Verificações:**
  - [ ] Estado é exactamente "PENDING_CHIEF_APPROVAL"
  - [ ] Estado NÃO é "PENDING_TUTOR_REVIEW"
  - [ ] Notificação enviada ao Manager

---

### CT-REFERENTE-05: Verificar diferença de fluxo vs Manager
- **Tipo:** Positivo (comparação de comportamento)
- **Pré-condição:** Existe uma conta MANAGER e uma conta REFERENTE
- **Passos (Referente):**
  1. Login como Referente → submeter análise de incidência A
  2. Verificar estado → deve ser PENDING_CHIEF_APPROVAL
- **Passos (Manager):**
  3. Login como Manager → submeter análise de incidência B
  4. Verificar estado → deve ser PENDING_TUTOR_REVIEW
- **Resultado Esperado:** Os dois roles produzem estados diferentes após submeter análise
- **Verificações:**
  - [ ] Incidência A em PENDING_CHIEF_APPROVAL
  - [ ] Incidência B em PENDING_TUTOR_REVIEW
  - [ ] Diferença documentada no histórico de estados

---

### CT-REFERENTE-06: Tentar cancelar incidência (bloqueado)
- **Tipo:** Negativo
- **Pré-condição:** Existe incidência activa da equipa
- **Passos:**
  1. Tutoria → Erros → abrir incidência
  2. Verificar se existe botão "Cancelar"
  3. Tentar aceder a endpoint de cancelamento via API directamente
- **Resultado Esperado:** Botão "Cancelar" não visível; API retorna HTTP 403
- **Verificações:**
  - [ ] Interface não exibe botão de cancelamento para o Referente
  - [ ] POST directo à API de cancelamento retorna HTTP 403

---

### CT-REFERENTE-07: Tentar criar nova incidência (bloqueado)
- **Tipo:** Negativo
- **Pré-condição:** REFERENTE autenticado; na secção de Erros
- **Passos:**
  1. Tutoria → Erros
  2. Verificar se existe botão "+ Novo Erro" (ou equivalente)
  3. Tentar criar incidência via API directamente
- **Resultado Esperado:** Botão de criação não visível para Referente; API retorna HTTP 403
- **Verificações:**
  - [ ] Menu "Erros" mostra apenas a lista (sem botão de criação)
  - [ ] Chamada directa à API retorna HTTP 403

---

### CT-REFERENTE-08: Tentar criar plano de ação (bloqueado)
- **Tipo:** Negativo
- **Pré-condição:** REFERENTE autenticado; na secção de Planos de Ação
- **Passos:**
  1. Tutoria → Planos de Ação
  2. Verificar se existe botão "+ Novo Plano"
  3. Tentar criar plano via API
- **Resultado Esperado:** Botão de criação não visível; API retorna HTTP 403
- **Verificações:**
  - [ ] Interface mostra apenas lista de planos (leitura)
  - [ ] HTTP 403 em tentativa de criação

---

### CT-REFERENTE-09: Ver planos de ação (leitura)
- **Tipo:** Positivo
- **Pré-condição:** Existem planos de ação da equipa
- **Passos:**
  1. Tutoria → "Planos de Ação"
  2. Clicar num plano para ver detalhes
  3. Ver items, responsáveis, prazos, estado
- **Resultado Esperado:** Detalhes completos visíveis em modo leitura; sem botões de edição; HTTP 200
- **Verificações:**
  - [ ] Lista de planos exibida
  - [ ] Detalhes de items, responsáveis e prazos visíveis
  - [ ] Sem botão "Editar" nem "Eliminar" activos

---

### CT-REFERENTE-10: Análise devolvida pelo Chefe — resubmeter
- **Tipo:** Positivo (fluxo de resubmissão)
- **Pré-condição:** Referente submeteu análise; Chefe devolveu com motivo; incidência voltou para ANALYSIS
- **Passos:**
  1. Tutoria → Análise → localizar incidência devolvida
  2. Verificar motivo da devolução nos comentários
  3. Corrigir a análise (ex: completar os 5 Porquês)
  4. Guardar
  5. "Submeter para Tutor" novamente
- **Resultado Esperado:** Estado volta a PENDING_CHIEF_APPROVAL; Chefe notificado novamente; HTTP 200
- **Verificações:**
  - [ ] Motivo de devolução visível antes de corrigir
  - [ ] Após resubmissão, estado é PENDING_CHIEF_APPROVAL

---

### CT-REFERENTE-11: Acesso a formações como aluno
- **Tipo:** Positivo
- **Pré-condição:** REFERENTE com plano de formação atribuído
- **Passos:**
  1. "Formações" → "Meus Cursos" → clicar num curso
  2. "Minhas Lições" → verificar lições liberadas
  3. "Certificados" → verificar certificados obtidos
- **Resultado Esperado:** Acesso completo como aluno às formações; HTTP 200
- **Verificações:**
  - [ ] Cursos inscritos visíveis
  - [ ] Lições liberadas disponíveis para iniciar
  - [ ] Certificados listados

---

### CT-REFERENTE-12: Tentar aceder a Dados Mestres
- **Tipo:** Negativo
- **Pré-condição:** REFERENTE autenticado
- **Passos:**
  1. Verificar se "Dados Mestres" aparece na barra superior
  2. Tentar navegar directamente para `/admin/master-data`
- **Resultado Esperado:** Portal "Dados Mestres" não visível; redirect ou HTTP 403
- **Verificações:**
  - [ ] "Dados Mestres" ausente da barra de navegação
  - [ ] URL directa redireccionada

---

### CT-REFERENTE-13: Submeter análise sem campos obrigatórios
- **Tipo:** Negativo
- **Pré-condição:** Incidência em REGISTERED; formulário de análise parcialmente preenchido
- **Passos:**
  1. Tutoria → Análise → abrir incidência
  2. Preencher apenas Nível Impacto (omitir Recorrência e Análise 5 Porquês)
  3. Tentar "Submeter para Tutor"
- **Resultado Esperado:** Validação bloqueia submissão; campos obrigatórios destacados; HTTP 422
- **Verificações:**
  - [ ] Mensagens de erro para campos em falta
  - [ ] Estado da incidência não alterado

---

### CT-REFERENTE-14: Acesso sem sessão activa
- **Tipo:** Edge Case
- **Pré-condição:** Token JWT expirado
- **Passos:**
  1. Eliminar token do sessionStorage
  2. Tentar navegar para /tutoria/analysis
- **Resultado Esperado:** Redirect para login; HTTP 401 na API
- **Verificações:**
  - [ ] Redirect para login ocorre
  - [ ] Nenhum dado privado exposto

---

### CT-REFERENTE-15: Dark mode — formulário de análise legível
- **Tipo:** Edge Case / Visual
- **Pré-condição:** REFERENTE autenticado
- **Passos:**
  1. Activar dark mode (ícone sol/lua)
  2. Abrir formulário de análise (tab Análise de uma incidência)
  3. Verificar todos os campos
- **Resultado Esperado:** Todos os campos, labels, selectores e mensagens legíveis em modo escuro
- **Verificações:**
  - [ ] Contraste adequado em todos os inputs
  - [ ] Selector de Nível Impacto, Origem, Recorrência legíveis
  - [ ] Botões "Guardar" e "Submeter para Tutor" claramente visíveis

---

### CT-REFERENTE-16: Notificações da equipa
- **Tipo:** Positivo
- **Pré-condição:** Existem notificações não lidas (ex: análise devolvida pelo Chefe)
- **Passos:**
  1. Tutoria → "Notificações"
  2. Verificar lista de notificações relevantes
  3. Clicar em "Marcar todas lidas"
- **Resultado Esperado:** Contador zera; HTTP 200
- **Verificações:**
  - [ ] Notificações de devolução visíveis
  - [ ] "Marcar todas lidas" funciona

---

## 6. Checklist de Validação

### Autenticação
- [ ] Login com is_referente=True exibe menu correcto de Tutoria
- [ ] Sessão expirada redireciona para login

### Controlo de Acesso
- [ ] Cancelar incidência bloqueado (botão ausente + HTTP 403)
- [ ] Criar nova incidência bloqueado
- [ ] Criar plano de ação bloqueado
- [ ] "Dados Mestres" não visível na barra de navegação
- [ ] "Revisão Tutor", "Erros Internos" e "Censos" ausentes do menu

### Análise
- [ ] Formulário de análise editável para Referente
- [ ] Guardar rascunho não altera estado
- [ ] Submeter análise coloca em PENDING_CHIEF_APPROVAL (não PENDING_TUTOR_REVIEW)
- [ ] Campos obrigatórios validados antes de submeter
- [ ] Após devolução pelo Chefe, Referente pode resubmeter

### Fluxo de Escalamento
- [ ] Referente → submeter → PENDING_CHIEF_APPROVAL
- [ ] Manager → submeter → PENDING_TUTOR_REVIEW
- [ ] Diferença de fluxo verificada em ambiente real

### Leitura de Planos e Fichas
- [ ] Planos de ação visíveis em modo leitura
- [ ] Fichas de aprendizagem visíveis em modo leitura
- [ ] Sem opções de edição nos planos/fichas

### Formações (como Aluno)
- [ ] Cursos, lições, desafios, certificados acessíveis como aluno

### Dark Mode e i18n
- [ ] Dark mode: formulário de análise legível
- [ ] Mudança de idioma actualiza labels do portal de tutoria
