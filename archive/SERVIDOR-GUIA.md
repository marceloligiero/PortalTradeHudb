# 🚀 TradeHub Formações - Guia de Inicialização do Servidor

## 📋 Informações do Servidor

**IP do Servidor:** 192.168.1.78  
**Hostname:** PT-L163820

---

## 🎯 URLs de Acesso

### 🔗 Acesso Local (nesta máquina)
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Documentação API:** http://localhost:8000/docs

### 🌐 Acesso via Rede (de outras máquinas)
- **Frontend:** http://192.168.1.78:5173
- **Backend API:** http://192.168.1.78:8000
- **Documentação API:** http://192.168.1.78:8000/docs

---

## 🔐 Credenciais de Acesso

### Administrador
- **Email:** admin@tradehub.com
- **Senha:** admin123
- **Permissões:** Acesso total ao sistema

### Formador (Trainer)
- **Email:** trainer@tradehub.com
- **Senha:** trainer123
- **Permissões:** Criar cursos e lições

### Formando (Student)
- **Email:** student@tradehub.com
- **Senha:** student123
- **Permissões:** Acesso aos cursos atribuídos

---

## ▶️ Como Iniciar o Servidor

### Método 1: Scripts Automáticos (Recomendado)

1. **Iniciar Backend:**
   - Duplo clique em: `start-backend.bat`
   - Aguarde a mensagem "Application startup complete"

2. **Iniciar Frontend:**
   - Duplo clique em: `start-frontend.bat`
   - Aguarde a mensagem "Local: http://localhost:5173"

### Método 2: Linha de Comando

#### Backend:
```powershell
cd "c:\Portal Trade DataHub\backend"
python main.py
```

#### Frontend:
```powershell
cd "c:\Portal Trade DataHub\frontend"
npm run dev
```

---

## ⏹️ Como Parar o Servidor

1. Feche as janelas do terminal/cmd que estão executando o backend e frontend
2. Ou pressione `CTRL+C` em cada janela

---

## 🔧 Configurações de Rede

### Backend (main.py)
```python
uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```
- `0.0.0.0` = Aceita conexões de qualquer IP da rede
- `8000` = Porta do backend

### Frontend (.env)
```
VITE_API_BASE_URL=http://192.168.1.78:8000
```
- Aponta para o backend no IP do servidor

---

## 🛡️ Firewall

**⚠️ IMPORTANTE:** Certifique-se que o Windows Firewall permite conexões nas portas:
- **8000** (Backend - FastAPI)
- **5173** (Frontend - Vite)

### Comando para liberar portas (executar como Administrador):
```powershell
netsh advfirewall firewall add rule name="TradeHub Backend" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="TradeHub Frontend" dir=in action=allow protocol=TCP localport=5173
```

---

## 🗄️ Banco de Dados

- **Servidor:** PT-L163820\SQLEXPRESS
- **Database:** TradeDataHub
- **Autenticação:** Windows (Trusted Connection)
- **Driver:** ODBC Driver 18 for SQL Server

---

## 📊 Verificação de Status

### Testar Backend:
```powershell
curl http://192.168.1.78:8000/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Testar Frontend:
- Abrir navegador em: http://192.168.1.78:5173
- Deve carregar a página de login

---

## 🐛 Resolução de Problemas

### Backend não inicia
1. Verificar se Python está instalado: `python --version`
2. Verificar dependências: `pip list | findstr fastapi`
3. Verificar conexão com banco de dados
4. Ver logs no terminal para erros

### Frontend não inicia
1. Verificar se Node.js está instalado: `node --version`
2. Reinstalar dependências: `npm install`
3. Limpar cache: `npm cache clean --force`
4. Deletar `node_modules` e rodar `npm install` novamente

### Erro 405 Method Not Allowed
- Reiniciar o backend (fechar e abrir novamente)
- Verificar se as rotas estão corretas no código
- Limpar cache do navegador (CTRL+F5)

### Não consegue acessar de outras máquinas
1. Verificar IP do servidor: `ipconfig`
2. Verificar firewall (ver seção acima)
3. Testar ping: `ping 192.168.1.78`
4. Verificar se ambos estão na mesma rede

---

## 📝 Notas Importantes

- ✅ Backend configurado para aceitar conexões de rede (0.0.0.0)
- ✅ Frontend configurado com IP fixo do servidor
- ✅ CORS habilitado para aceitar requisições de diferentes origens
- ⚠️ Este é um ambiente de desenvolvimento - Para produção, use HTTPS e senhas seguras
- ⚠️ O IP 192.168.1.78 pode mudar se o servidor receber novo IP do roteador

---

## 🔄 Reinicialização Automática

Para configurar inicialização automática do servidor quando o Windows inicia:

1. Pressione `Win+R` e digite `shell:startup`
2. Copie os arquivos `start-backend.bat` e `start-frontend.bat` para esta pasta
3. Na próxima inicialização, o servidor subirá automaticamente

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs nos terminais do backend e frontend
2. Consultar documentação da API em: http://192.168.1.78:8000/docs
3. Verificar o arquivo STATUS.txt no diretório raiz do projeto

---

**Última Atualização:** 14/12/2025  
**Versão:** 2.0.0
