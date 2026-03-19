# Guia do Liberador (LIBERADOR)

**Sistema:** PortalTradeHub — Gestão de Formações, Tutoria, Relatórios e Suporte
**Role:** TRAINEE com flag **is_liberador=True**
**Acesso:** Tudo do Aluno + registo de erros internos dentro de censos/sensos de auditoria.

> **Nota:** O Liberador é um aluno com a responsabilidade adicional de registar erros internos. Tem acesso a tudo descrito no Guia do Aluno (STUDENT) mais as funcionalidades abaixo.

---

## 1. Login no Sistema

1. Abrir o browser e aceder ao endereço do sistema
2. Clicar em **"Entrar"**
3. Preencher **Email** e **Password**
4. Clicar em **"Entrar"**
5. Vai para o **Dashboard do Aluno** (portal de Formações)

---

## 2. Acesso como Aluno

O Liberador tem acesso a todas as funcionalidades do aluno:
- Dashboard, Planos de Formação, Meus Cursos, Meus Desafios, Minhas Lições, Certificados, Relatórios
- Ver o **Guia do Aluno (STUDENT)** para detalhes destas funcionalidades

---

## 3. Portal de Tutoria — Erros Internos (Funcionalidade Exclusiva)

Clicar em **"Tutoria"** na barra superior.

**Menu lateral visível para o Liberador:**
- Dashboard
- Erros
- Meus Erros
- Meus Planos
- O Meu Progresso
- **Erros Internos** (secção)
- Erros Internos
- Censos
- Minhas Fichas
- Notificações

### 3.1 Dashboard Tutoria

- **Menu lateral:** Clicar em **"Dashboard"**
- KPIs pessoais da tutoria

### 3.2 Erros Internos

- **Menu lateral:** Secção **"Erros Internos"** → clicar em **"Erros Internos"**
- Vê a lista de erros internos do seu escopo

### 3.3 Registar Erro Interno (OPERAÇÃO PRINCIPAL)

Esta é a funcionalidade exclusiva do Liberador: registar erros internos durante os censos de auditoria.

**Passo a passo:**

1. No menu lateral, secção **"Erros Internos"**, clicar em **"Erros Internos"**
2. Clicar no botão **"+ Novo Erro Interno"**
3. Preencher o formulário:

   | Campo | O que preencher |
   |-------|----------------|
   | **Censo** | Selecionar o censo (período de auditoria) ativo |
   | **Gravador** | Quem cometeu o erro (selecionar da lista de membros) |
   | **Descrição** | Detalhar o que aconteceu |
   | **Data de Ocorrência** | Quando o erro foi cometido |
   | **Impacto** | Selecionar nível de impacto (da lista) |
   | **Categoria** | Selecionar a categoria do erro |
   | **Tipo de Erro** | Selecionar o tipo específico |
   | **Departamento** | Departamento onde ocorreu |
   | **Atividade** | Atividade relacionada |
   | **Banco** | Banco associado (se aplicável) |
   | **Referência** | Código de referência (ex: nº da operação) |

4. Clicar em **"Registar"**
5. O erro é criado com estado **"Pendente"**

> **Nota:** Após registo, o Tutor é responsável por avaliar o erro e criar planos de ação. O Liberador não avalia, apenas regista.

### 3.4 Ver Detalhes de Erro Interno

1. Na lista de erros internos, clicar num erro
2. Vê toda a informação registada
3. Pode acompanhar o estado: Pendente → Avaliado → Plano Criado → Concluído

### 3.5 Censos

- **Menu lateral:** Secção **"Erros Internos"** → clicar em **"Censos"**
- Vê a lista de censos (períodos de auditoria)
- Pode consultar detalhes de cada censo

### 3.6 Valores de Referência (Lookups)

Ao registar erros internos, os valores dos campos de seleção (Impactos, Categorias, Tipos de Erro, Departamentos, Atividades, Bancos) são carregados automaticamente a partir dos dados mestres do sistema.

---

## 4. Tutoria — Funcionalidades de Aluno

Dentro do portal de Tutoria, o Liberador também tem acesso a:

### 4.1 Meus Erros

- **Menu lateral:** Clicar em **"Meus Erros"**
- Erros de tutoria que lhe que dizem respeito (como aluno/tutorado)

### 4.2 Meus Planos

- **Menu lateral:** Clicar em **"Meus Planos"**
- Planos de ação que lhe foram atribuídos

### 4.3 O Meu Progresso

- **Menu lateral:** Clicar em **"O Meu Progresso"**
- Dashboard pessoal de tutoria

### 4.4 Minhas Fichas de Aprendizagem

- **Menu lateral:** Clicar em **"Minhas Fichas"**
- Fichas de aprendizagem atribuídas

**Marcar ficha como lida:**
1. Clicar na ficha
2. Clicar em **"Marcar como Lida"**

### 4.5 Notificações

- **Menu lateral:** Clicar em **"Notificações"** (ícone sino)
- Vê notificações relevantes
- Clicar em **"Marcar todas lidas"**

---

## 5. Portal de Chamados

Clicar em **"Chamados"** na barra superior.

**Criar chamado de suporte:**
1. Clicar em **"+ Novo Chamado"**
2. Preencher: Título, Descrição, Tipo (Bug/Melhoria), Prioridade, Portal
3. Clicar em **"Criar"**

**Comentar:** Abrir chamado → escrever → **"Enviar"**

---

## 6. Funcionalidades Globais

### 6.1 Alternar Tema

- Ícone **sol/lua** no canto superior direito

### 6.2 Alterar Idioma

- Avatar → escolher **PT**, **EN** ou **ES**

### 6.3 Logout

- Avatar → **"Sair"**

### 6.4 Chatbot

- Botão flutuante (canto inferior direito)

---

## 7. Fluxo Típico do Liberador

```
1. Chefe/Admin cria um Censo (período de auditoria)
         ↓
2. Liberador acede a Tutoria → Erros Internos
         ↓
3. Liberador clica em "+ Novo Erro Interno"
         ↓
4. Preenche: Censo, Gravador, Descrição, Data, Impacto, Categoria, Tipo, etc.
         ↓
5. Regista o erro → estado "Pendente"
         ↓
6. Tutor avalia → cria plano de ação → executa → conclui
         ↓
7. Liberador acompanha o estado na lista de erros
```

---

## 8. Resumo de Permissões LIBERADOR

| Módulo | Pode Fazer |
|--------|------------|
| **Tudo do Aluno** | Cursos, lições, desafios, certificados, chamados |
| **Erros Internos** | **Registar** (operação exclusiva), ver lista, ver detalhes |
| Censos | Consultar (leitura) |
| Lookups | Consultar (impactos, categorias, tipos, departamentos, atividades, bancos) |
| Tutoria — Meus Erros | Ver erros que lhe dizem respeito |
| Tutoria — Meus Planos | Ver planos atribuídos |
| Fichas de Aprendizagem | Ver e marcar como lida |
| Notificações | Ver, marcar como lidas |
