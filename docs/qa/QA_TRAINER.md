# QA Guide — TRAINER (Formador)

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Role:** TRAINER (is_trainer=True ou role=TRAINER)
**Data de revisão:** 2026-03-20
**Versão:** 1.0

---

## 1. Visão Geral

### Objetivo do perfil
O TRAINER é responsável pela criação e gestão de conteúdos de formação: cursos, lições, desafios e planos de formação. Acompanha o progresso dos alunos e revê as submissões de desafios.

### Identificação no sistema
- **role:** `TRAINER` com flag `is_trainer=True`
- Conta requer **aprovação prévia pelo ADMIN** antes de poder aceder ao sistema
- Não tem acesso a master data nem a gestão de utilizadores

### Portais acessíveis
| Portal | Nível de Acesso |
|--------|----------------|
| Formações | CRUD dos seus próprios cursos; lições; desafios; planos; revisões; alunos; relatórios |
| Tutoria | Leitura geral (sem aprovação de análises a menos que tenha is_tutor) |
| Relatórios | Dashboard próprio + formações gerais |
| Chamados | Criar e comentar (sem gestão) |
| Dados Mestres | Sem acesso |

---

## 2. Permissões e Restrições

| Funcionalidade | Permitido | Bloqueado |
|----------------|-----------|-----------|
| Criar/editar/eliminar os seus próprios cursos | Sim | — |
| Editar cursos de outros formadores | Não | HTTP 403 |
| Criar lições nos seus cursos | Sim | — |
| Liberar lições para alunos específicos | Sim | — |
| Aprovar conclusão de lições | Sim | — |
| Criar desafios COMPLETE e SUMMARY | Sim | — |
| Liberar desafios para alunos | Sim | — |
| Rever e classificar submissões de desafio | Sim | — |
| Criar planos de formação | Sim | — |
| Atribuir alunos a planos | Sim | — |
| Finalizar planos + gerar certificados | Sim | — |
| Criar/editar utilizadores | Não | HTTP 403 |
| CRUD de master data (bancos, produtos, etc.) | Não | HTTP 403 |
| Aprovar análises de tutoria (sem is_tutor) | Não | HTTP 403 |
| Ver relatórios de outras equipas (tab Equipas) | Não | Tab não visível |

---

## 3. Fluxos de Frontend — Passo a Passo

### Registo e Login

**Primeiro acesso — Registo:**
1. Aceder à Landing Page → clicar em **"Criar Conta"**
2. Preencher: Nome Completo, Email, Password
3. Selecionar Role: **"Formador"**
4. Clicar em **"Registar"**
5. **Resultado esperado:** Conta criada no estado "Pendente"; mensagem a informar que o admin tem de aprovar

**Login após aprovação:**
1. Aceder à Landing Page → **"Entrar"**
2. Introduzir Email e Password
3. Clicar em **"Entrar"**
4. **Resultado esperado:** Dashboard do Formador carrega; menu lateral exibe: Dashboard, Cursos, Planos de Formação, Revisões Pendentes, Alunos, Relatórios

---

### Criar Curso com Lição e Desafio

**Pré-condição:** TRAINER autenticado e aprovado; existem bancos e produtos no sistema.

1. Clicar em **"Formações"** → **"Cursos"** → **"+ Novo Curso"**
2. Preencher: Título, Descrição, Nível (BASIC/INTERMEDIATE/ADVANCED), Bancos, Produtos
3. Clicar em **"Criar"**
4. Abrir o curso criado → secção "Lições" → **"+ Nova Lição"**
5. Preencher: Título, Tipo (THEORETICAL ou PRACTICAL), Tempo Estimado (minutos)
6. Clicar em **"Criar"**
7. Dentro do curso → secção "Desafios" → **"+ Novo Desafio"**
8. Preencher: Título, Tipo **COMPLETE**, Operações Requeridas (ex: 50), Tempo Limite (ex: 60 min), MPU Alvo (ex: 1.5), Máximo Erros (ex: 3)
9. Clicar em **"Criar"**
10. **Resultado esperado:** Curso com lição e desafio visíveis na página de detalhes

---

### Liberar Lição para Aluno (definir started_by)

**Pré-condição:** Curso com lição criado; existe aluno inscrito no curso/plano.

1. Abrir o curso → clicar na lição
2. Na página de gestão da lição, ver a lista de alunos inscritos
3. Ao lado do aluno desejado, clicar em **"Liberar"**
4. **Resultado esperado:** Estado da lição para esse aluno muda para "Liberada"; o aluno pode iniciar a lição; campo `started_by` registado com o ID do formador

---

### Criar Plano de Formação e Atribuir Alunos

**Pré-condição:** Existem cursos criados; existem alunos no sistema.

1. **"Planos de Formação"** → **"+ Novo Plano"**
2. Preencher: Título, Descrição, Data Início, Data Fim, Cursos (selecionar os cursos do plano), Bancos, Produtos
3. Clicar em **"Criar"**
4. Abrir o plano → secção "Alunos" → **"+ Atribuir"**
5. Selecionar um ou mais alunos → **"Atribuir"**
6. **Resultado esperado:** Alunos inscritos automaticamente nos cursos do plano; progresso visível como 0%

---

### Rever Submissão de Desafio COMPLETE — Aprovar

**Pré-condição:** Existe submissão de aluno no estado "Pendente de Revisão".

1. **"Revisões Pendentes"** → clicar na submissão
2. Ver cada operação registada pelo aluno
3. Para operações com erro: clicar no ícone de classificação → selecionar tipo de erro (Metodologia / Conhecimento / Detalhe / Procedimento)
4. Clicar em **"Finalizar Revisão"**
5. Selecionar **"Aprovar"** + escrever feedback positivo
6. Confirmar
7. **Resultado esperado:** Submissão marcada como "Aprovada"; aluno recebe notificação; HTTP 200

---

### Rever Submissão de Desafio COMPLETE — Reprovar

**Pré-condição:** Existe submissão de aluno no estado "Pendente de Revisão".

1. **"Revisões Pendentes"** → clicar na submissão
2. Classificar erros nas operações com problemas
3. **"Finalizar Revisão"** → selecionar **"Reprovar"** + escrever feedback com motivo claro
4. (Opcional) Clicar em **"Permitir Repetição"** para dar nova tentativa ao aluno
5. **Resultado esperado:** Submissão marcada como "Reprovada"; aluno recebe notificação; HTTP 200

---

### Finalizar Plano e Gerar Certificado

**Pré-condição:** Todos os cursos do plano estão concluídos para um aluno.

1. Abrir o plano → verificar que todos os cursos têm ícone verde
2. Clicar em **"Finalizar Plano"**
3. Marcar a opção **"Gerar Certificado"**
4. Confirmar
5. **Resultado esperado:** Plano marcado como finalizado; certificado PDF gerado para o aluno

---

### Relatórios do Formador

**Pré-condição:** TRAINER autenticado com pelo menos um plano activo.

1. Clicar em **"Relatórios"** no menu lateral
2. Navegar pelas tabs: Overview, Planos, Alunos, Lições, Desafios
3. **Resultado esperado:** Dados do próprio formador (não de outros formadores)

---

## 4. Campos e Validações

### Formulário de Criação de Curso

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Título | Sim | Texto | Mínimo 3 caracteres | "Título obrigatório" |
| Descrição | Sim | Texto Longo | — | "Descrição obrigatória" |
| Nível | Sim | Select | BASIC / INTERMEDIATE / ADVANCED | "Nível obrigatório" |
| Bancos | Não | Multiselect | — | — |
| Produtos | Não | Multiselect | — | — |

### Formulário de Criação de Lição

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Título | Sim | Texto | Mínimo 3 caracteres | "Título obrigatório" |
| Tipo | Sim | Select | THEORETICAL / PRACTICAL | "Tipo obrigatório" |
| Tempo Estimado | Sim | Inteiro | Maior que 0, em minutos | "Tempo inválido" |

### Formulário de Criação de Desafio

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Título | Sim | Texto | Mínimo 3 caracteres | "Título obrigatório" |
| Tipo | Sim | Select | COMPLETE / SUMMARY | "Tipo obrigatório" |
| Operações Requeridas | Sim | Inteiro | Maior que 0 | "Número de operações inválido" |
| Tempo Limite | Sim | Inteiro | Maior que 0, em minutos | "Tempo inválido" |
| MPU Alvo | Sim | Decimal | Maior que 0 | "MPU inválido" |
| Máximo Erros | Sim | Inteiro | Maior ou igual a 0 | "Valor inválido" |

### Formulário de Criação de Plano

| Campo | Obrigatório | Tipo | Validação | Mensagem de Erro |
|-------|-------------|------|-----------|-----------------|
| Título | Sim | Texto | Mínimo 3 caracteres | "Título obrigatório" |
| Descrição | Não | Texto Longo | — | — |
| Data Início | Sim | Data | Formato válido | "Data inválida" |
| Data Fim | Sim | Data | Posterior a Data Início | "Data fim deve ser posterior ao início" |
| Cursos | Sim | Multiselect | Mínimo 1 curso | "Selecionar pelo menos um curso" |

---

## 5. Cenários de Teste QA

### CT-TRAINER-01: Registo de Formador e aprovação pelo ADMIN
- **Tipo:** Positivo (fluxo completo)
- **Pré-condição:** Sistema acessível; existe conta ADMIN activa
- **Passos:**
  1. Aceder à Landing Page → "Criar Conta"
  2. Preencher dados com Role "Formador" → "Registar"
  3. Verificar que aparece mensagem "Conta pendente de aprovação"
  4. Login como ADMIN → Formadores → Aprovar o novo formador
  5. Login como Formador aprovado
- **Resultado Esperado:** Formador consegue autenticar e ver o Dashboard; HTTP 200
- **Verificações:**
  - [ ] Conta pendente não permite login antes de aprovação
  - [ ] Após aprovação, login bem-sucedido
  - [ ] Dashboard exibe KPIs do formador (não do admin)

---

### CT-TRAINER-02: Login sem aprovação (conta pendente)
- **Tipo:** Negativo
- **Pré-condição:** Formador registado mas não aprovado pelo ADMIN
- **Passos:**
  1. Tentar fazer login com as credenciais do formador pendente
- **Resultado Esperado:** Login rejeitado com mensagem "Conta pendente de aprovação" ou equivalente; HTTP 401 ou 403
- **Verificações:**
  - [ ] Mensagem de erro clara (não "Credenciais inválidas")
  - [ ] Nenhum token emitido

---

### CT-TRAINER-03: Criar curso e adicionar lição THEORETICAL
- **Tipo:** Positivo
- **Pré-condição:** TRAINER aprovado e autenticado
- **Passos:**
  1. Formações → Cursos → "+ Novo Curso"
  2. Título: "Câmbio Spot", Descrição: "Operações de câmbio à vista", Nível: BASIC
  3. Criar
  4. Abrir curso → "+ Nova Lição"
  5. Título: "Conceitos Básicos", Tipo: THEORETICAL, Tempo: 45 min
  6. Criar
- **Resultado Esperado:** Curso e lição criados; lição visível dentro do curso; HTTP 201
- **Verificações:**
  - [ ] Curso aparece na lista do formador
  - [ ] Lição visível na secção "Lições" do curso
  - [ ] Tipo da lição exibido como "Teórica"

---

### CT-TRAINER-04: Criar desafio COMPLETE e liberar para aluno
- **Tipo:** Positivo
- **Pré-condição:** Existe curso com alunos inscritos via plano
- **Passos:**
  1. Abrir curso → "Desafios" → "+ Novo Desafio"
  2. Tipo: COMPLETE, Operações: 30, Tempo: 60 min, MPU: 1.0, Máx Erros: 5
  3. Criar
  4. Clicar no desafio → "Liberar" ao lado do aluno específico
- **Resultado Esperado:** Desafio criado e liberado para o aluno; aluno vê o desafio em "Meus Desafios"
- **Verificações:**
  - [ ] Desafio visível no curso
  - [ ] Aluno recebe notificação de desafio disponível
  - [ ] Estado do aluno para esse desafio: "Disponível"

---

### CT-TRAINER-05: Liberar lição para aluno sem alunos inscritos no curso
- **Tipo:** Edge Case
- **Pré-condição:** Existe um curso sem alunos atribuídos
- **Passos:**
  1. Abrir o curso sem alunos → clicar na lição
  2. Verificar a lista de alunos na gestão da lição
- **Resultado Esperado:** Lista de alunos vazia; botão "Liberar" não aparece ou está inactivo; nenhuma acção destructiva possível
- **Verificações:**
  - [ ] Mensagem "Nenhum aluno inscrito" ou lista vazia exibida
  - [ ] Sem erros de interface

---

### CT-TRAINER-06: Rever submissão COMPLETE — Aprovar
- **Tipo:** Positivo
- **Pré-condição:** Existe submissão de aluno no estado "Pendente de Revisão"
- **Passos:**
  1. Revisões Pendentes → selecionar submissão
  2. Rever operações (sem erros detectados)
  3. "Finalizar Revisão" → "Aprovar" → feedback "Excelente trabalho!"
  4. Confirmar
- **Resultado Esperado:** Submissão aprovada; aluno notificado; HTTP 200
- **Verificações:**
  - [ ] Estado da submissão muda para "Aprovado"
  - [ ] Feedback do formador visível na vista do aluno

---

### CT-TRAINER-07: Rever submissão COMPLETE — Reprovar + Permitir Repetição
- **Tipo:** Positivo (fluxo de reprovação)
- **Pré-condição:** Existe submissão pendente de revisão com erros
- **Passos:**
  1. Revisões Pendentes → selecionar submissão
  2. Classificar erros detectados (Metodologia)
  3. "Finalizar Revisão" → "Reprovar" → feedback detalhado → confirmar
  4. Clicar em "Permitir Repetição"
- **Resultado Esperado:** Submissão reprovada; aluno pode submeter nova tentativa; HTTP 200
- **Verificações:**
  - [ ] Aluno vê botão "Iniciar Nova Tentativa" no seu portal
  - [ ] Feedback de reprovação visível

---

### CT-TRAINER-08: Submissão de desafio sem operações concluídas (aluno tenta submeter)
- **Tipo:** Edge Case
- **Pré-condição:** Aluno iniciou desafio COMPLETE mas não executou nenhuma operação
- **Passos:**
  1. (Como aluno) Iniciar desafio
  2. Sem iniciar nenhuma operação, tentar submeter
- **Resultado Esperado:** Submissão bloqueada com mensagem de validação; HTTP 400 ou 422
- **Verificações:**
  - [ ] Botão "Submeter para Revisão" inactivo ou mensagem de erro exibida
  - [ ] Nenhuma submissão criada no sistema

---

### CT-TRAINER-09: Criar plano e atribuir múltiplos alunos
- **Tipo:** Positivo
- **Pré-condição:** TRAINER autenticado; existem ≥2 alunos sem plano
- **Passos:**
  1. Planos de Formação → "+ Novo Plano"
  2. Título: "Plano FX Q1", Data Início: hoje, Data Fim: +90 dias, Cursos: [Câmbio Spot]
  3. Criar
  4. Abrir plano → "Alunos" → "+ Atribuir" → selecionar 2 alunos → "Atribuir"
- **Resultado Esperado:** 2 alunos inscritos no plano; progresso 0% para cada um; HTTP 200
- **Verificações:**
  - [ ] Ambos os alunos visíveis na lista do plano
  - [ ] Cada aluno vê o plano em "Meus Planos de Formação"

---

### CT-TRAINER-10: Finalizar plano e gerar certificado
- **Tipo:** Positivo
- **Pré-condição:** Todos os cursos do plano estão concluídos para um aluno
- **Passos:**
  1. Abrir plano → verificar ícones verdes em todos os cursos
  2. Clicar "Finalizar Plano" → marcar "Gerar Certificado" → confirmar
- **Resultado Esperado:** Certificado gerado e disponível para download; aluno vê certificado em "Certificados"; HTTP 200
- **Verificações:**
  - [ ] Certificado listado em "Certificados" do aluno
  - [ ] Download PDF funcional

---

### CT-TRAINER-11: Tentar editar curso de outro formador
- **Tipo:** Negativo (controlo de acesso)
- **Pré-condição:** Existe um curso criado por outro formador
- **Passos:**
  1. Formações → Cursos → localizar curso de outro formador
  2. Tentar clicar em "Editar"
- **Resultado Esperado:** Botão "Editar" não visível ou bloqueado; HTTP 403 se tentado via API
- **Verificações:**
  - [ ] Interface não exibe opção de edição em cursos alheios
  - [ ] Chamada directa à API retorna HTTP 403

---

### CT-TRAINER-12: Tentar aceder a Dados Mestres
- **Tipo:** Negativo (controlo de acesso)
- **Pré-condição:** TRAINER autenticado
- **Passos:**
  1. Tentar navegar directamente para `/admin/master-data` ou equivalente
  2. Verificar se "Dados Mestres" aparece na barra superior
- **Resultado Esperado:** Portal "Dados Mestres" não visível; acesso directo via URL retorna redirect ou HTTP 403
- **Verificações:**
  - [ ] "Dados Mestres" ausente da barra de navegação superior
  - [ ] URL directa redireccionada para Dashboard ou página de erro

---

### CT-TRAINER-13: Criar desafio com operações requeridas = 0
- **Tipo:** Negativo / Edge Case
- **Pré-condição:** TRAINER autenticado
- **Passos:**
  1. Dentro de um curso → "+ Novo Desafio"
  2. Preencher Tipo: COMPLETE, Operações Requeridas: 0
  3. Tentar criar
- **Resultado Esperado:** Erro de validação; desafio não criado; HTTP 422
- **Verificações:**
  - [ ] Mensagem "Número de operações inválido" ou equivalente visível
  - [ ] Formulário não submete

---

### CT-TRAINER-14: Sessão expirada durante revisão
- **Tipo:** Edge Case
- **Pré-condição:** TRAINER com sessão aberta numa revisão pendente
- **Passos:**
  1. Abrir revisão de submissão
  2. Eliminar token JWT do sessionStorage (DevTools)
  3. Tentar guardar a classificação de um erro
- **Resultado Esperado:** API retorna HTTP 401; frontend redireciona para login; dados não perdidos do servidor
- **Verificações:**
  - [ ] Redirect para login ocorre
  - [ ] Submissão mantém estado "Pendente de Revisão" (não corrompida)

---

### CT-TRAINER-15: Dark mode — formulário de desafio legível
- **Tipo:** Edge Case / Visual
- **Pré-condição:** TRAINER autenticado
- **Passos:**
  1. Activar dark mode (ícone sol/lua)
  2. Abrir formulário de criação de desafio
  3. Abrir formulário de criação de lição
  4. Abrir ecrã de revisão de submissão
- **Resultado Esperado:** Todos os campos, labels, botões e validações legíveis em modo escuro
- **Verificações:**
  - [ ] Campos de texto com fundo e texto contrastantes
  - [ ] Classificação de erros (ícones) visíveis
  - [ ] Botões Aprovar/Reprovar claramente distinguíveis

---

### CT-TRAINER-16: Relatórios do Formador — dados exclusivos
- **Tipo:** Positivo
- **Pré-condição:** TRAINER com pelo menos um plano e aluno activos
- **Passos:**
  1. Relatórios → navegar tabs: Overview, Planos, Alunos, Lições, Desafios
  2. Verificar que os dados correspondem apenas aos cursos/planos do próprio formador
- **Resultado Esperado:** Dados correctos e exclusivos do formador; HTTP 200
- **Verificações:**
  - [ ] Métricas de alunos correspondem aos alunos inscritos pelo formador
  - [ ] Dados de outros formadores não visíveis

---

## 6. Checklist de Validação

### Autenticação
- [ ] Registo de formador cria conta no estado "Pendente"
- [ ] Login antes de aprovação é rejeitado com mensagem clara
- [ ] Login após aprovação redireciona para Dashboard do Formador
- [ ] Sessão expirada redireciona para login sem expor dados

### Gestão de Cursos
- [ ] CRUD dos próprios cursos funcional
- [ ] Edição de cursos de outros formadores bloqueada
- [ ] Lição adicionada visível dentro do curso
- [ ] Desafio COMPLETE e SUMMARY criados correctamente

### Lições
- [ ] "Liberar" para aluno específico actualiza estado da lição
- [ ] Aluno sem inscrição não aparece na lista de libertação
- [ ] Aprovar conclusão de lição notifica o aluno

### Desafios e Revisões
- [ ] Submissão COMPLETE revisível com classificação de erros por operação
- [ ] Aprovar submissão notifica o aluno
- [ ] Reprovar submissão + permitir repetição funcional
- [ ] Desafio sem operações não submetível pelo aluno

### Planos e Certificados
- [ ] Plano com data fim anterior ao início rejeitado
- [ ] Atribuição de múltiplos alunos funcional
- [ ] Finalização do plano com opção de certificado funcional

### Controlo de Acesso
- [ ] "Dados Mestres" não visível na barra de navegação
- [ ] Cursos de outros formadores não editáveis
- [ ] API retorna HTTP 403 para recursos de outros formadores

### Dark Mode e i18n
- [ ] Dark mode activo: formulários de cursos/lições/desafios legíveis
- [ ] Mudança de idioma actualiza labels dos formulários
