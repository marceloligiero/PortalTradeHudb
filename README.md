# 🎓 Portal TradeHub

Sistema completo de gestão de formações e cursos online com funcionalidades avançadas de gestão de utilizadores, planos de treino, e certificados.

## 🌟 Características

- **Gestão de Utilizadores** - Sistema completo de CRUD com ativação/desativação
- **Planos de Treino** - Criação e gestão de módulos e lições
- **Sistema de Certificados** - Geração automática de certificados após conclusão
- **Dashboard Administrativo** - Estatísticas e gestão completa
- **Autenticação Segura** - Sistema robusto com bcrypt e JWT
- **Design Moderno** - Interface premium com Tailwind CSS e Framer Motion

## 🛠️ Stack Tecnológico

### Backend
- **Python 3.13**
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy 2.0** - ORM para banco de dados
- **MySQL 8.4** - Banco de dados
- **Uvicorn** - Servidor ASGI
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Type-safety
- **Vite 5** - Build tool
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **React Router** - Navegação

### DevOps
- **PM2** - Gerenciador de processos
- **Nginx** - Servidor web e proxy reverso
- **Certbot** - Certificados SSL

## 🚀 Deploy no VPS

### Informações do Servidor

- **IP**: 72.60.188.172
- **Domínio**: srv1242193.hstgr.cloud
- **OS**: Ubuntu 25.10
- **URLs**:
  - Frontend: https://srv1242193.hstgr.cloud
  - Backend API: https://srv1242193.hstgr.cloud/api

### Script Unificado de Deploy

O projeto inclui um script unificado para facilitar o gerenciamento no VPS.

#### Comandos Disponíveis

```bash
# No VPS
cd /var/www/tradehub

# Ver status atual
./start-vps.sh status

# Deploy completo (pull + deps + build + restart)
./start-vps.sh update

# Atualização rápida (sem rebuild do frontend)
./start-vps.sh quick

# Atualizar apenas frontend
./start-vps.sh frontend

# Reiniciar serviços
./start-vps.sh restart

# Parar serviços
./start-vps.sh stop
```

#### O que cada comando faz

| Comando | Ações |
|---------|-------|
| `update` | Pull do código + Atualiza deps Python + Build frontend + Restart PM2 |
| `quick` | Pull do código + Atualiza deps Python + Restart backend |
| `frontend` | Pull do código + Build frontend |
| `status` | Mostra status PM2 + últimos 20 logs |
| `restart` | Reinicia todos os serviços |
| `stop` | Para todos os serviços |

### Deploy Manual (Passo a Passo)

#### 1. Primeiro Deploy (Configuração Inicial)

```bash
# Conectar ao VPS
ssh root@72.60.188.172

# Clonar repositório
cd /var/www
git clone https://github.com/marceloligiero/PortalTradeHudb.git tradehub
cd tradehub

# Backend - Instalar dependências
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend - Build
cd ../frontend
npm install
npm run build

# Configurar PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configurar Nginx (se ainda não estiver)
sudo ln -s /etc/nginx/sites-available/tradehub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 2. Deploys Subsequentes

Simplesmente use o script:
```bash
./start-vps.sh update
```

## 🔧 Desenvolvimento Local

### Pré-requisitos

- Python 3.13+
- Node.js 18+
- MySQL 8.0+

### Configuração

1. **Clone o repositório**
```bash
git clone https://github.com/marceloligiero/PortalTradeHudb.git
cd PortalTradeHudb
```

2. **Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Criar arquivo .env
echo "DATABASE_URL=mysql+pymysql://root:password@localhost/tradehub_db" > .env

# Iniciar
uvicorn main:app --reload
```

3. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Acesso**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Docs API: http://localhost:8000/docs

## 📁 Estrutura do Projeto

```
PortalTradeHudb/
├── backend/              # Backend FastAPI
│   ├── app/
│   │   ├── models.py    # Modelos SQLAlchemy
│   │   ├── routes/      # Endpoints da API
│   │   └── ...
│   ├── main.py          # Ponto de entrada
│   └── requirements.txt
├── frontend/            # Frontend React
│   ├── src/
│   │   ├── pages/       # Páginas
│   │   ├── components/  # Componentes
│   │   └── lib/         # Utilidades
│   ├── index.html
│   └── package.json
├── deploy/              # Scripts e configs de deploy
├── database/            # Scripts SQL
├── start-vps.sh        # Script unificado
└── README.md
```

## 🔐 Credenciais Padrão

**Admin**
- Email: admin@tradehub.com
- Password: admin123

> ⚠️ **Importante**: Altere a senha padrão em produção!

## 🐛 Troubleshooting

### Backend não inicia (SQLAlchemy error)

Problema: Python 3.13 incompatível com SQLAlchemy < 2.0.40

**Solução:**
```bash
cd /var/www/tradehub/backend
source .venv/bin/activate
pip install 'sqlalchemy>=2.0.40' --upgrade
pm2 restart tradehub-backend
```

Ou simplesmente:
```bash
./start-vps.sh quick
```

### Frontend não atualiza

**Solução:**
```bash
./start-vps.sh frontend
```

### Ver logs de erros

```bash
# Backend
pm2 logs tradehub-backend

# Backend (últimas 50 linhas)
pm2 logs tradehub-backend --lines 50

# Status
pm2 status
```

### Reiniciar tudo

```bash
./start-vps.sh restart
```

## 📊 Monitoramento

### PM2 Status
```bash
pm2 status
```

Mostra:
- Status (online/stopped)
- Uso de CPU/memória
- Uptime
- Número de restarts

### Logs em Tempo Real
```bash
pm2 logs
```

## 🔄 Workflow de Desenvolvimento

1. **Fazer mudanças localmente**
2. **Testar localmente**
3. **Commit e push**
```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

4. **Deploy no VPS**
```bash
ssh root@72.60.188.172
cd /var/www/tradehub
./start-vps.sh update
```

## 📝 Scripts Úteis

### Resetar senha de admin
```bash
cd /var/www/tradehub/backend
source .venv/bin/activate
python reset_admin_password.py
```

### Verificar conexão com banco
```bash
cd /var/www/tradehub/backend
source .venv/bin/activate
python test_db_connection.py
```

## 🔗 Links Úteis

- **Repositório**: https://github.com/marceloligiero/PortalTradeHudb
- **Frontend Produção**: https://srv1242193.hstgr.cloud
- **API Produção**: https://srv1242193.hstgr.cloud/api
- **API Docs**: https://srv1242193.hstgr.cloud/api/docs

## 📦 Dependências Principais

### Backend
- fastapi==0.109.0
- sqlalchemy>=2.0.40 (compatível com Python 3.13)
- uvicorn[standard]==0.27.0
- pymysql==1.1.0
- bcrypt (para hashing de senhas)
- python-jose (JWT)

### Frontend
- react@18.3.1
- vite@5.4.21
- typescript@5.6.3
- tailwindcss@3.4.17
- framer-motion@11.15.0

## 🎯 Roadmap

- [ ] Sistema de notificações
- [ ] Chat em tempo real
- [ ] Integração com payment gateway
- [ ] App mobile (React Native)
- [ ] Análise avançada de progresso
- [ ] Gamificação

## 👥 Contribuição

Este é um projeto privado. Para contribuir, contacte o administrador.

## 📄 Licença

Propriedade privada. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para TradeHub**
