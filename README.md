````markdown
# Portal Trade DataHub

Consolidated README merging project overview, installation instructions, server guide and changelog.

---

## Visão Geral

Portal Trade DataHub é uma plataforma para gestão de formações (cursos, lições, planos e desafios) desenvolvida para o Trade DataHub / Santander Digital Services.

- Backend: FastAPI + SQLAlchemy
- Frontend: React + Vite + TypeScript
- Banco: SQL Server (ODBC)
- Autenticação: JWT

---

## Instalação e Inicialização (Desenvolvimento)

### Pré-requisitos

- Node.js 18+ e npm
- Python 3.10+
- SQL Server (ou equivalente) acessível conforme `backend/.env`

### Backend (Windows - PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# editar .env com credenciais e SECRET_KEY
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Start único (recomendado para dev)

PowerShell:
```powershell
.\start-all.ps1
```

Linux/macOS:
```bash
./start-all.sh
```

---

## Changelog (resumo)

Principais pontos (v2.0.0): paginação, auditoria, testes automatizados, melhorias de UX e segurança.

Changelog completo: `archive/CHANGELOG.md`.

---

## Guia de Servidor (resumo)

- Exemplo de IP do servidor: `192.168.1.78`
- Frontend: `http://localhost:5173` ou `http://192.168.1.78:5173`
- Backend: `http://localhost:8000` ou `http://192.168.1.78:8000`

Abra portas `8000` e `5173` no firewall quando necessário.

Guia completo: `SERVIDOR-GUIA.md`.

---

## Organização e limpeza

- Arquivos de teste e scripts antigos foram movidos para `archive/removed_files/`.
- Testes integrados e guias mantidos em `backend/tests/`.

---

## Links úteis

- API docs (rodando): `http://localhost:8000/docs`
- Guia do servidor: `SERVIDOR-GUIA.md`
- Arquivos arquivados: `archive/`

---

## Suporte

Se precisar que eu empurre a branch de limpeza para o repositório remoto, compacte o `archive/`, ou continue a limpeza (ex.: remover `backend/tests/README.md` ou limpar `__pycache__`), diga qual ação prefere.

````
# 🎓 Portal Trade DataHub - Sistema de Gestão de Formações

![Version](https://img.shields.io/badge/version-2.0.0-red)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![React](https://img.shields.io/badge/react-18.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)

Sistema completo de gestão de formações para Trade DataHub da **Santander Digital Services**.

---

## 📋 Visão Geral

Portal moderno e profissional para gestão de formações bancárias com:

### ✨ Funcionalidades Principais

- ✅ **Autenticação JWT** com 3 tipos de usuários (Admin, Trainer, Student)
- ✅ **Gestão de Cursos** e Lições com materiais e vídeos
- ✅ **Planos de Formação** personalizados por banco e produto
- ✅ **Sistema de Desafios MPU** (Movimentos Por Unidade) com métricas de performance
- ✅ **Certificados Digitais** automáticos em PDF
- ✅ **Dashboards Específicos** para cada perfil de usuário
- ✅ **Sistema de Auditoria** para rastreamento de ações críticas
- ✅ **Paginação Inteligente** para listas grandes
- ✅ **Internacionalização** (pt-PT, es, en)
- ✅ **Testes Automatizados** com cobertura de código

### 🆕 Melhorias Implementadas (v2.0)

- 🔐 **Segurança Aprimorada**: Senhas com hash bcrypt, SECRET_KEY forte
- 📊 **Paginação**: Endpoints otimizados com limite de 100 itens por página
- 🎨 **UX Melhorada**: Componentes de Loading e Toast para feedback visual
- 📝 **Auditoria Completa**: Logs de todas as ações críticas (login, CRUD)
- 🧪 **Testes Automatizados**: Suite completa de testes unitários e de integração
- 📖 **Documentação Atualizada**: Guias completos e evidências de testes

---

## 🚀 Instalação Rápida

### Opção 1: Docker (Recomendado)

```bash
# 1. Configurar ambiente
cp backend/.env.example backend/.env
# Edite .env e gere SECRET_KEY forte:
# python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Iniciar (Windows)
.\start-docker.ps1

# Ou (Linux/Mac)
bash start-docker.sh

# 3. Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:8000/docs
```

### Opção 2: Local (Desenvolvimento)

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

> Alternativa: usar o script único de inicialização em desenvolvimento

PowerShell (Windows):
```powershell
.\start-all.ps1
```

Linux / macOS:
```bash
./start-all.sh
```


---

## 📚 Documentação Completa

Para documentação detalhada, veja:
- [**API Documentation**](http://localhost:8000/docs) - Swagger interativo
- [**SERVIDOR-GUIA.md**](SERVIDOR-GUIA.md) - Guia do servidor
- [**backend/tests/README.md**](backend/tests/README.md) - Guia de testes

---

## 🏗️ Arquitetura

```
Portal Trade DataHub/
├── frontend/           # React 18 + TypeScript + Tailwind
├── backend/            # FastAPI + SQLAlchemy + SQL Server
├── database/           # Scripts SQL
└── docs/               # Documentação
```

**Stack:**
- Backend: Python 3.11, FastAPI, SQLAlchemy, SQL Server
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Auth: JWT (python-jose + passlib bcrypt)
- Deploy: Docker + Docker Compose

---

## 👥 Roles e Permissões

### ADMIN
Gerencia todo o sistema, valida trainers, cria cursos e planos

### TRAINER (Formador)
Cria cursos, lições, desafios MPU, gerencia formandos
⚠️ Requer validação do Admin

### STUDENT (Formando)
Acessa cursos, realiza desafios, visualiza certificados

---

## 🔐 Credenciais Padrão

**Admin:**
- Email: `admin@tradehub.com`
- Senha: `admin123`

*Outros usuários devem se registrar via interface*

---

## 📊 Sistema MPU (Movimentos Por Unidade)

Métrica de performance:
```
MPU = Total de Operações / Tempo em Minutos
```

**Tipos de Desafio:**
- **SUMMARY**: Entrada resumida (totais)
- **COMPLETE**: Entrada detalhada (por partes)

---

## 🧪 Testes

```bash
cd backend

# Executar testes
pytest -v

# Gerar relatório de evidências
python tests/run_tests.py
# Abre: test_evidence_report.html
```

**Cobertura:** Autenticação, CRUD, Paginação, Permissões, Auditoria

---

## 📝 Auditoria

Todas as ações críticas são registradas em `backend/audit.log`:
- LOGIN_SUCCESS / LOGIN_FAILED
- USER_CREATED / USER_DELETED
- TRAINER_VALIDATED

---

## 🌐 Servidor de Produção

**IP**: 192.168.1.78  
**URLs:**
- Frontend: http://192.168.1.78:5173
- Backend: http://192.168.1.78:8000

Veja [SERVIDOR-GUIA.md](SERVIDOR-GUIA.md)

---

## 🔧 Configuração

### Variáveis de Ambiente Críticas

**Backend (.env):**
```env
DATABASE_URL=mssql+pyodbc://sa:Password@localhost/TradeHub?driver=ODBC+Driver+17+for+SQL+Server
SECRET_KEY=<GERE_UMA_CHAVE_FORTE>
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### Backend
```bash
# Verificar Python e dependências
python --version
pip list

# Testar DB
python -c "import pyodbc; print(pyodbc.drivers())"
```

### Frontend
```bash
# Limpar cache
rm -rf node_modules
npm install
```

---

## 📄 Licença

Propriedade privada - Santander Digital Services © 2024

---

**Desenvolvido com ❤️ para Santander Digital Services**
