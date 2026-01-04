# 🚀 TradeHub - Guia de Inicialização VPS

Script unificado para gerenciar o TradeHub no VPS de forma simples.

## 📋 Uso Rápido

```bash
# No VPS, execute:
cd /var/www/tradehub
chmod +x start-vps.sh

# Ver status atual
./start-vps.sh status

# Atualização completa (código + dependências + build)
./start-vps.sh update

# Atualização rápida (código + dependências, sem rebuild)
./start-vps.sh quick

# Atualizar apenas frontend
./start-vps.sh frontend

# Reiniciar serviços
./start-vps.sh restart

# Parar serviços
./start-vps.sh stop
```

## 🎯 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `status` | Mostra status dos serviços e últimos logs |
| `update` | Atualização completa: pull + deps + build + restart |
| `quick` | Atualização rápida: pull + deps + restart (sem rebuild frontend) |
| `frontend` | Atualiza apenas o frontend (pull + build) |
| `restart` | Reinicia todos os serviços |
| `stop` | Para todos os serviços |
| `start` | Inicia todos os serviços |

## 💡 Casos de Uso

### Deploy de novas mudanças no código
```bash
./start-vps.sh update
```

### Reiniciar após crash do backend
```bash
./start-vps.sh quick
```

### Atualizar apenas mudanças no frontend
```bash
./start-vps.sh frontend
```

### Ver se está tudo funcionando
```bash
./start-vps.sh status
```

## ⚡ O que cada comando faz

### `update` (Recomendado para deploy completo)
1. ✅ Pull do código do GitHub
2. ✅ Atualiza dependências Python (incluindo SQLAlchemy)
3. ✅ Build do frontend (Vite)
4. ✅ Reinicia backend com PM2
5. ✅ Mostra status final

### `quick` (Rápido para mudanças só no backend)
1. ✅ Pull do código do GitHub
2. ✅ Atualiza dependências Python
3. ✅ Reinicia backend
4. ⏭️ Não faz build do frontend

### `frontend` (Só mudanças no frontend)
1. ✅ Pull do código do GitHub
2. ✅ Build do frontend
3. ⏭️ Não reinicia backend

## 🔍 Verificação de Status

O comando `status` mostra:
- Estado dos serviços PM2 (online/stopped)
- Uso de memória
- Número de restarts
- Últimas 20 linhas do log do backend

## 📝 Notas

- **Permissões**: Execute `chmod +x start-vps.sh` na primeira vez
- **SQLAlchemy**: O script sempre atualiza para versão compatível com Python 3.13
- **PM2**: Os serviços são gerenciados pelo PM2 (auto-restart em caso de crash)
- **Nginx**: Não precisa reiniciar, serve os arquivos estáticos automaticamente

## 🌐 URLs

- **Frontend**: https://srv1242193.hstgr.cloud
- **Backend API**: https://srv1242193.hstgr.cloud/api
- **Domínio**: srv1242193.hstgr.cloud
