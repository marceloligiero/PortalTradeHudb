# Guia do Administrador (ADMIN)

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Role:** ADMIN
**Acesso:** Total — controlo completo de todos os módulos do sistema

---

## 1. Login no Sistema

1. Abrir o browser e aceder ao endereço do sistema (ex: `https://tradedatahub.local`)
2. Na **Landing Page**, clicar no botão **"Entrar"** no canto superior direito
3. Preencher:
   - **Email:** o seu email de administrador
   - **Password:** a sua password
4. Clicar no botão **"Entrar"**
5. Será redirecionado para o **Dashboard** de administrador

> **Nota:** Se esqueceu a password, clique em **"Esqueceu a password?"** e siga as instruções por email.

---

## 2. Navegação Principal

Após login, verá uma barra de navegação superior (header) com 5 portais:

| Portal | O que faz |
|--------|-----------|
| **Formações** | Dashboard, cursos, planos, desafios, validações, relatórios |
| **Tutoria** | Gestão de erros, planos de ação, learning sheets, categorias |
| **Relatórios** | Dashboards analíticos: overview, formações, tutoria, equipas, incidentes |
| **Dados Mestres** | Bancos, produtos, equipas, categorias, impactos, origens, utilizadores |
| **Chamados** | Tickets de suporte (bugs/melhorias) |

Clique em cada portal na barra superior para alternar entre eles.

---

## 3. Portal de Formações

### 3.1 Dashboard

- **Menu lateral:** Clicar em **"Dashboard"** (ícone casa)
- Mostra KPIs gerais: total de cursos, alunos, planos ativos, taxa de conclusão

### 3.2 Validação de Formadores

- **Menu lateral:** Clicar em **"Formadores"** (ícone escudo)
- Vê a lista de formadores pendentes de aprovação
- Para **aprovar** um formador: clicar no botão **"Aprovar"** (verde) ao lado do nome
- Para **rejeitar** um formador: clicar no botão **"Rejeitar"** (vermelho)

### 3.3 Gestão de Cursos

- **Menu lateral:** Clicar em **"Cursos"**
- Vê a lista de todos os cursos do sistema

**Criar um novo curso:**
1. Clicar no botão **"+ Novo Curso"** no topo da página
2. Preencher: Título, Descrição, Nível (BASIC/INTERMEDIATE/ADVANCED)
3. Selecionar **Bancos** e **Produtos** associados
4. Clicar em **"Criar"**

**Ver/Editar um curso:**
1. Clicar no nome do curso na lista
2. Na página de detalhes pode ver lições e desafios
3. Clicar em **"Editar"** para alterar dados do curso

**Adicionar lição a um curso:**
1. Dentro do curso, clicar em **"+ Nova Lição"**
2. Preencher: Título, Tipo (THEORETICAL/PRACTICAL), Tempo Estimado (minutos)
3. Clicar em **"Criar"**

**Adicionar desafio a um curso:**
1. Dentro do curso, clicar em **"+ Novo Desafio"**
2. Preencher: Título, Tipo (COMPLETE ou SUMMARY), Operações Requeridas, Tempo Limite, MPU alvo, Máximo de Erros
3. Clicar em **"Criar"**

**Eliminar curso/lição/desafio:**
- Clicar no ícone de lixeira ao lado do item

### 3.4 Planos de Formação

- **Menu lateral:** Clicar em **"Planos de Formação"**
- Vê a lista de todos os planos

**Criar plano:**
1. Clicar em **"+ Novo Plano"**
2. Preencher: Título, Descrição, Data Início, Data Fim
3. Selecionar **Cursos** que farão parte do plano
4. Selecionar **Bancos** e **Produtos** associados
5. Clicar em **"Criar"**

**Atribuir alunos ao plano:**
1. Clicar no nome do plano para abrir os detalhes
2. Na secção **"Alunos"**, clicar em **"+ Atribuir Aluno"**
3. Selecionar o(s) aluno(s) da lista
4. Clicar em **"Atribuir"**

**Adicionar formador ao plano:**
1. Nos detalhes do plano, secção **"Formadores"**
2. Clicar em **"+ Adicionar Formador"**
3. Selecionar o formador

**Finalizar plano (gerar certificado):**
1. Verificar que todos os cursos estão concluídos (ícone verde)
2. Clicar em **"Finalizar Plano"**
3. Opção de gerar certificado PDF aparece — marcar se desejado
4. Confirmar

### 3.5 Revisões Pendentes

- **Menu lateral:** Clicar em **"Revisões Pendentes"**
- Vê submissões de desafios que aguardam revisão
- Clicar numa submissão para revê-la

**Rever submissão COMPLETE:**
1. Clicar na submissão
2. Para cada operação, classificar erros: clicar no ícone de **classificação** e selecionar o tipo de erro (Metodologia, Conhecimento, Detalhe, Procedimento)
3. Após classificar todas as operações, clicar em **"Finalizar Revisão"**
4. Escolher: **Aprovar** ou **Reprovar** + deixar feedback

**Rever submissão SUMMARY:**
1. Clicar na submissão
2. Ver os totais registados pelo formador
3. Clicar em **"Finalizar"** para calcular resultado

### 3.6 Relatórios (Portal Formações)

- **Menu lateral:** Clicar em **"Relatórios"**
- Vê estatísticas gerais, cursos, formadores, planos, insights

### 3.7 Relatórios Avançados

- **Menu lateral:** Clicar em **"Relatórios Avançados"**
- Dashboard completo: performance de alunos, produtividade de formadores, analytics de cursos, certificações mensais, MPU analytics

### 3.8 Matriz de Conhecimento

- **Menu lateral:** Clicar em **"Matriz de Conhecimento"**
- Tabela cruzada: Alunos x Cursos — vê quem completou o quê

### 3.9 Avaliações (Ratings)

- **Menu lateral:** Clicar em **"Avaliações"**
- Dashboard com NPS, items mais avaliados, tendências
- Filtrar por tipo (Curso, Lição, Desafio, Formador, Plano)

---

## 4. Portal de Tutoria

Clicar em **"Tutoria"** na barra superior.

### 4.1 Dashboard Tutoria

- **Menu lateral:** Clicar em **"Dashboard"**
- KPIs: erros registados, em aberto, resolvidos, etc.

### 4.2 Erros de Tutoria

- **Menu lateral:** Clicar em **"Erros"**
- Vê todos os erros registados por todos os tutores

**Registar novo erro:**
1. Clicar em **"+ Novo Erro"**
2. Preencher: Tutorado, Categoria, Banco, Produto, Data de Ocorrência, Descrição, Impacto, Origem, Detetado Por, Departamento, Atividade, Tipo de Erro, Referência, Moeda, Montante, Severidade
3. Clicar em **"Registar"**

**Ver detalhes de um erro:**
1. Clicar no erro na lista
2. Vê toda a informação, análise, planos de ação, comentários

**Aprovar análise (como chefe):**
1. Nos detalhes do erro, quando a análise está submetida
2. Clicar em **"Aprovar Análise"** ou **"Devolver"** (com motivo)

**Aprovar planos de ação:**
1. Nos detalhes do erro, quando os planos estão submetidos
2. Clicar em **"Aprovar Planos"**

### 4.3 Análise

- **Menu lateral:** Clicar em **"Análise"**
- Vê erros que requerem análise ou aprovação

### 4.4 Planos de Ação

- **Menu lateral:** Clicar em **"Planos de Ação"**
- Lista de todos os planos de ação
- Clicar num plano para ver detalhes

**Aprovar plano:**
- Clicar em **"Aprovar"** no plano submetido

**Devolver plano:**
- Clicar em **"Devolver"** + escrever comentário

**Validar plano concluído:**
- Clicar em **"Validar"** + atribuir pontuação e comentário

### 4.5 Erros Internos

- **Menu lateral:** Secção **"Erros Internos"** → clicar em **"Erros Internos"**
- Vê a lista de erros internos registados pelos liberadores

### 4.6 Censos (Sensos)

- **Menu lateral:** Clicar em **"Censos"**
- Gerir períodos de auditoria

**Criar censo:**
1. Clicar em **"+ Novo Censo"**
2. Preencher: Nome, Data Início, Data Fim
3. Clicar em **"Criar"**

### 4.7 Learning Sheets (Fichas de Aprendizagem)

- **Menu lateral:** Clicar em **"Fichas de Aprendizagem"**
- Vê todas as fichas do sistema
- Pode rever fichas submetidas

### 4.8 Categorias (Administração)

- **Menu lateral:** Secção **"Administração"** → clicar em **"Categorias"**
- Gerir categorias de tutoria (hierárquicas)

**Criar categoria:**
1. Clicar em **"+ Nova Categoria"**
2. Preencher: Nome, Categoria Pai (se subcategoria)
3. Clicar em **"Criar"**

### 4.9 Chat FAQs (Administração)

- **Menu lateral:** Secção **"Administração"** → clicar em **"Chat FAQs"**
- Gerir perguntas e respostas do chatbot

**Criar FAQ:**
1. Clicar em **"+ Nova FAQ"**
2. Preencher: Palavras-chave (PT, EN, ES), Respostas (PT, EN, ES)
3. Clicar em **"Criar"**

### 4.10 Notificações

- **Menu lateral:** Clicar em **"Notificações"** (ícone sino, com contador)
- Vê todas as notificações da tutoria
- Clicar em **"Marcar todas lidas"** para limpar

---

## 5. Portal de Relatórios

Clicar em **"Relatórios"** na barra superior.

### 5.1 Overview

- **Menu lateral:** Clicar em **"Overview"**
- KPIs globais do sistema

### 5.2 Formações

- **Menu lateral:** Clicar em **"Formações"**
- Analytics detalhados de cursos, planos, conclusões

### 5.3 Tutoria

- **Menu lateral:** Clicar em **"Tutoria"**
- Analytics de erros, categorias, tendências

### 5.4 Equipas

- **Menu lateral:** Clicar em **"Equipas"**
- Performance por equipa (apenas visível para ADMIN)

### 5.5 Incidentes

- **Menu lateral:** Secção **"Exportações"** → clicar em **"Incidentes"**
- Lista filtrada de incidentes com opções de exportação

---

## 6. Portal de Dados Mestres

Clicar em **"Dados Mestres"** na barra superior.

### 6.1 Bancos

- **Menu lateral:** Clicar em **"Bancos"** (1.ª opção, selecionada por defeito)
- Lista de bancos

**Criar banco:**
1. Clicar em **"+ Novo"**
2. Preencher: Código, Nome, País
3. Clicar em **"Criar"**

**Editar:** Clicar no ícone de edição ao lado do banco
**Eliminar:** Clicar no ícone de lixeira

### 6.2 Produtos/Serviços

- **Menu lateral:** Clicar em **"Produtos"**
- Mesma lógica de CRUD: Criar, Editar, Eliminar

### 6.3 Equipas

- **Menu lateral:** Clicar em **"Equipas"**

**Criar equipa:**
1. Clicar em **"+ Nova Equipa"**
2. Preencher: Nome, Descrição, Manager
3. Clicar em **"Criar"**

**Adicionar membros:**
1. Clicar na equipa
2. Clicar em **"+ Adicionar Membro"**
3. Selecionar utilizador da lista de não atribuídos
4. Confirmar

**Adicionar serviços:**
1. Dentro da equipa, clicar em **"+ Adicionar Serviço"**
2. Selecionar o produto/serviço

### 6.4 Categorias

- Gerir categorias de tutoria (mesmo que no Portal Tutoria)

### 6.5 Impactos / Origens / Detetado Por / Departamentos / Atividades / Tipos de Erro

- **Menu lateral:** Clicar na opção correspondente
- Todas têm a mesma lógica: **Listar**, **Criar (+)**, **Editar** (lápis), **Eliminar** (lixeira)

### 6.6 FAQs

- Gerir perguntas do chatbot (mesmo que no Portal Tutoria → Chat FAQs)

### 6.7 Utilizadores

- **Menu lateral:** Clicar em **"Utilizadores"**
- Lista paginada de todos os utilizadores do sistema

**Criar utilizador:**
1. Clicar em **"+ Novo Utilizador"**
2. Preencher: Nome, Email, Password, Role (ADMIN/MANAGER/TRAINER/TRAINEE)
3. Selecionar flags: is_trainer, is_tutor, is_team_lead, is_liberador, is_referente
4. Clicar em **"Criar"**

**Editar utilizador:**
1. Clicar no ícone de edição
2. Alterar campos desejados (nome, role, flags, ativo/inativo)
3. Clicar em **"Guardar"**

**Eliminar utilizador:**
1. Clicar no ícone de lixeira
2. Confirmar a eliminação no diálogo

---

## 7. Portal de Chamados

Clicar em **"Chamados"** na barra superior.

### 7.1 Quadro Kanban

- Vê todos os chamados do sistema organizados por estado: **Aberto**, **Em Andamento**, **Em Revisão**, **Concluído**

**Criar chamado:**
1. Clicar em **"+ Novo Chamado"**
2. Preencher: Título, Descrição, Tipo (Bug/Melhoria), Prioridade (Baixa/Média/Alta/Crítica), Portal
3. Opção de anexar screenshots
4. Clicar em **"Criar"**

**Gerir chamado (ADMIN):**
1. Clicar no chamado no kanban
2. Alterar estado: selecionar o novo estado no dropdown
3. Atribuir a alguém: selecionar no campo **"Atribuído a"**
4. Adicionar notas de admin no campo de texto
5. Clicar em **"Guardar"**

**Comentar:**
1. Abrir o chamado
2. Escrever no campo de comentário
3. Clicar em **"Enviar"**

**Eliminar chamado:**
1. Abrir o chamado
2. Clicar no botão **"Eliminar"** (vermelho)
3. Confirmar

---

## 8. Funcionalidades Globais

### 8.1 Alternar Tema (Claro/Escuro)

- No canto superior direito, clicar no ícone **sol/lua** para alternar

### 8.2 Alterar Idioma

1. Clicar no seu avatar (canto superior direito)
2. No dropdown, secção **"Idioma"**, clicar em **PT**, **EN** ou **ES**

### 8.3 Logout

1. Clicar no seu avatar (canto superior direito)
2. Clicar em **"Sair"**

### 8.4 Chatbot

- Disponível como botão flutuante (canto inferior direito) em todos os portais
- Clicar para abrir e escrever uma pergunta
- O chatbot responde com base nas FAQs configuradas

---

## 9. Resumo de Permissões ADMIN

| Módulo | Pode Fazer |
|--------|------------|
| Utilizadores | Criar, ler, editar, eliminar |
| Master Data (todos) | Criar, ler, editar, eliminar |
| Cursos | Criar, ler, editar, eliminar |
| Lições | Criar, liberar, aprovar, eliminar |
| Desafios | Criar, liberar, rever, eliminar |
| Planos de Formação | Criar, atribuir, finalizar, eliminar |
| Tutoria (Erros) | Criar, aprovar análises, aprovar planos |
| Tutoria (Planos Ação) | Aprovar, devolver, validar |
| Erros Internos | Ver, gerir censos |
| Equipas | Criar, gerir membros e serviços, eliminar |
| Chamados | Criar, gerir, atualizar estado, eliminar |
| Chat/FAQs | Criar, editar, eliminar |
| Relatórios | Acesso total (básicos + avançados) |
| Matriz de Conhecimento | Acesso total |
| Ratings | Dashboard administrativo |
| Data Warehouse | Acesso total + executar ETL |
| Certificados | Acesso total |
