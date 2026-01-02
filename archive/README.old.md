````markdown
# 🎓 Portal Trade DataHub - Sistema de Formações

Sistema completo de gestão de formações para Trade DataHub da Santander Digital Services.

## 📋 Visão Geral

Portal moderno de gestão de formações com:
- ✅ **Autenticação JWT** com 3 tipos de usuários (Admin, Trainer, Student)
- ✅ **Gestão de Cursos** e Lições
- ✅ **Planos de Formação** personalizados
- ✅ **Sistema de Desafios** com métricas MPU
- ✅ **Certificados** digitais automáticos
- ✅ **Dashboard** específico para cada perfil
- ✅ **Banco de Dados SQL Server** com modelo relacional completo

## 🏗️ Arquitetura

```
Portal Trade DataHub/
├── frontend/           # React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/ # Componentes reutilizáveis
│   │   ├── pages/      # Páginas da aplicação
│   │   ├── services/   # API calls
│   │   ├── stores/     # Zustand stores
│   │   └── lib/        # Utilitários
│   └── package.json
│
├── backend/            # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── routes/     # Endpoints da API
│   │   ├── models.py   # Modelos SQLAlchemy
│   │   ├── schemas.py  # Schemas Pydantic
│   │   ├── auth.py     # Autenticação JWT
│   │   └── database.py # Configuração DB
│   ├── main.py
│   └── requirements.txt
│
└── database/           # Scripts SQL
    └── init_data.sql   # Dados iniciais
```

## 🚀 Como Executar

### Opção 1: Docker Compose (Recomendado para Servidor)

**Pré-requisitos:**
- Docker
- Docker Compose

```bash
# Copiar arquivo de configuração
cp .env.example .env
# Editar .env com suas credenciais

# No Windows:
.\start-docker.ps1

# No Linux/Mac:
bash start-docker.sh
```

A aplicação estará disponível em:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **SQL Server:** localhost:1433

Para parar os serviços:
```bash
docker-compose down
```

Para ver os logs:
```bash
docker-compose logs -f
```

---

### Opção 2: Instalação Local (Desenvolvimento)

**Pré-requisitos:**
- Node.js 18+
- Python 3.10+
- SQL Server 2019+

#### 1. Configurar Banco de Dados

```sql
-- Usar os scripts da pasta database/
-- Depois rodar:
sqlcmd -S localhost -U sa -i database/init_data.sql
```

#### 2. Backend (FastAPI)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
# Editar .env com suas credenciais do SQL Server

# Executar
uvicorn main:app --reload
```

Backend estará em: **http://localhost:8000**

#### 3. Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env

# Executar
npm run dev
```

Frontend estará em: **http://localhost:3000**

## 👥 Usuários de Teste

### Administrador
- **Email:** admin@tradehub.com
- **Senha:** admin123
- **Permissões:** Gestão completa do sistema

### Formador (Trainer)
- **Email:** trainer@tradehub.com
- **Senha:** trainer123
- **Permissões:** Criar cursos, lições e desafios

### Aluno (Student)
- **Email:** student@tradehub.com
- **Senha:** student123
- **Permissões:** Acessar cursos e completar formações

## 📊 Modelo de Dados

### Entidades Principais

- **Users** - Usuários do sistema (Admin, Trainer, Student)
- **Banks** - Bancos parceiros
- **Products** - Produtos financeiros
- **Courses** - Cursos de formação
- **Lessons** - Lições de cada curso
- **Enrollments** - Inscrições dos alunos
- **LessonProgress** - Progresso nas lições
- **TrainingPlans** - Planos de formação
- **Challenges** - Desafios práticos
- **Certificates** - Certificados emitidos

## 🎯 Funcionalidades por Perfil

### 👨‍💼 Administrador
- Gerenciar usuários (CRUD completo)
- Gerenciar bancos e produtos
- Visualizar todos os cursos
- Relatórios gerais do sistema

### 👨‍🏫 Formador (Trainer)
- Criar e gerenciar cursos
- Criar lições e conteúdos
- Criar desafios para alunos
- Acompanhar progresso dos alunos
- Aprovar/reprovar desafios

## 🌍 Idiomas Suportados

O sistema suporta 3 idiomas com seletor automático no header:

- 🇵🇹 **Português (Portugal)** - pt-PT
- 🇪🇸 **Español** - es
- 🇬🇧 **English** - en

Os arquivos de tradução estão em `frontend/src/i18n/locales/`

### Terminologia

- **Formador** → Instrutor/Trainer
- **Formando** → Aluno/Student
- **Formações** → Cursos/Courses

## 📈 Métricas MPU

O sistema calcula automaticamente:
- **MPU** (Minutos Por Unidade): Tempo gasto por operação
- **MPU Percentage**: Percentual em relação ao tempo esperado
- **Aprovação**: Baseada em MPU e precisão

## 🔐 Segurança

- Autenticação JWT com tokens Bearer
- Senhas criptografadas com Bcrypt
- Proteção de rotas por role (RBAC)
- CORS configurado
- Validação de dados com Pydantic

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navegação
- **Zustand** - State management
- **Axios** - HTTP client
- **React Query** - Data fetching
- **Lucide React** - Ícones

### Backend
- **FastAPI** - Framework Python
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **PyODBC** - SQL Server driver
- **Python-Jose** - JWT
- **Passlib** - Password hashing
- **Uvicorn** - ASGI server

### Database
- **SQL Server 2019+**
- **Stored Procedures**
- **Indexes** otimizados

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual

### Student
- `GET /api/student/courses` - Meus cursos
- `POST /api/student/enroll/{course_id}` - Inscrever

### Trainer
- `GET /api/trainer/courses` - Listar cursos
- `POST /api/trainer/courses` - Criar curso
- `POST /api/trainer/lessons` - Criar lição

### Admin
- `GET /api/admin/users` - Listar usuários
- `POST /api/admin/users` - Criar usuário
- `GET /api/admin/banks` - Listar bancos
- `GET /api/admin/products` - Listar produtos

## 📄 Licença

MIT License

## 👨‍💻 Desenvolvido por

Santander Digital Services - Trade DataHub Team

---

**Versão:** 2.0.0  
**Última Atualização:** Dezembro 2025

````