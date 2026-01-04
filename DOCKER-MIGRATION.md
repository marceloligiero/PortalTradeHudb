# 🐳 Guia de Migração para Docker

Este guia mostra como migrar o TradeHub de PM2 para Docker na VPS.

## 📋 Pré-requisitos

Docker instalado na VPS (veja instruções no README.md)

## 🔄 Processo de Migração

### 1. Backup dos Dados Atuais

```bash
# Conectar ao VPS
ssh root@72.60.188.172

# Fazer backup do banco de dados
mysqldump -u root -p tradehub_db > /root/tradehub_backup_$(date +%Y%m%d).sql

# Fazer backup do código (opcional, já está no GitHub)
tar -czf /root/tradehub_code_backup.tar.gz /var/www/tradehub
```

### 2. Parar Serviços PM2

```bash
cd /var/www/tradehub

# Ver o que está rodando
pm2 status

# Parar todos os serviços
pm2 stop all

# Opcional: Remover do PM2 (não deletar os processos ainda)
# pm2 delete all
```

### 3. Atualizar Código com Arquivos Docker

```bash
cd /var/www/tradehub

# Pull das mudanças
git pull origin main

# Verificar se todos os arquivos Docker foram baixados
ls -la | grep -E "docker|Dockerfile|.env"
```

### 4. Configurar Variáveis de Ambiente

```bash
# Copiar exemplo e editar
cp .env.example .env
nano .env
```

Configure:
```env
MYSQL_ROOT_PASSWORD=SuaSenhaMySQLSegura123
MYSQL_DATABASE=tradehub_db
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
```

### 5. Primeira Execução com Docker

```bash
# Dar permissão de execução
chmod +x docker-deploy.sh

# Iniciar containers
./docker-deploy.sh start

# Ver status
./docker-deploy.sh status

# Ver logs em tempo real
./docker-deploy.sh logs
```

### 6. Restaurar Banco de Dados (se necessário)

```bash
# Se você fez backup, restaure os dados
./docker-deploy.sh restore /root/tradehub_backup_YYYYMMDD.sql
```

### 7. Atualizar Nginx (Host)

O Docker já expõe na porta 80, mas se você tem Nginx no host fazendo proxy, atualize:

```bash
# Editar configuração do Nginx
sudo nano /etc/nginx/sites-available/tradehub
```

Mude para:
```nginx
server {
    listen 80;
    server_name srv1242193.hstgr.cloud;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Configurar SSL com Certbot

```bash
# Atualizar certificados
sudo certbot --nginx -d srv1242193.hstgr.cloud
```

### 9. Verificar Funcionamento

```bash
# Status dos containers
./docker-deploy.sh status

# Testar frontend
curl -I https://srv1242193.hstgr.cloud

# Testar backend
curl https://srv1242193.hstgr.cloud/api/health

# Ver logs
./docker-deploy.sh logs backend
```

### 10. Limpar PM2 (Opcional)

Se tudo estiver funcionando:

```bash
# Remover processos do PM2
pm2 delete all

# Desinstalar PM2 (opcional)
# npm uninstall -g pm2
```

## 🚀 Comandos Após Migração

```bash
# Ver status
./docker-deploy.sh status

# Ver logs
./docker-deploy.sh logs

# Atualizar aplicação (pull + rebuild + restart)
./docker-deploy.sh update

# Reiniciar
./docker-deploy.sh restart

# Fazer backup do banco
./docker-deploy.sh backup

# Parar tudo
./docker-deploy.sh stop
```

## 🔧 Troubleshooting

### Containers não iniciam

```bash
# Ver logs detalhados
docker compose logs

# Verificar se portas estão em uso
sudo netstat -tulpn | grep -E "80|3306|8000"

# Parar PM2 se ainda estiver rodando
pm2 stop all
```

### Erro de conexão com banco

```bash
# Verificar se o container do banco está rodando
docker compose ps

# Ver logs do MySQL
docker compose logs db

# Verificar variáveis de ambiente
cat .env
```

### Aplicação não acessa

```bash
# Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# Verificar se Docker está expondo porta 80
docker compose ps

# Verificar logs do frontend
docker compose logs frontend
```

## 📊 Comparação PM2 vs Docker

| Comando PM2 | Comando Docker |
|-------------|----------------|
| `pm2 start` | `./docker-deploy.sh start` |
| `pm2 stop` | `./docker-deploy.sh stop` |
| `pm2 restart` | `./docker-deploy.sh restart` |
| `pm2 status` | `./docker-deploy.sh status` |
| `pm2 logs` | `./docker-deploy.sh logs` |
| `pm2 monit` | `docker stats` |

## 🎯 Vantagens Após Migração

✅ **Isolamento completo** - Cada serviço em seu container  
✅ **Fácil rollback** - Voltar versões rapidamente  
✅ **Portabilidade** - Funciona igual em qualquer ambiente  
✅ **Escalabilidade** - Fácil adicionar mais instâncias  
✅ **Menos conflitos** - Dependências isoladas  

## 📝 Próximos Passos

1. Testar todas as funcionalidades
2. Configurar backups automáticos
3. Monitorar recursos com `docker stats`
4. Considerar usar Docker Swarm ou Kubernetes para produção avançada

---

**Pronto!** Seu TradeHub agora está rodando com Docker! 🐳
