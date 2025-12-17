# 📋 CHANGELOG - Portal Trade DataHub

## [2.0.0] - 2024-12-14

### 🆕 Adicionado
- Sistema de paginação em todos os endpoints de listagem (máx 100 itens/página)
- Componente Toast para notificações visuais no frontend
- Componente LoadingSpinner para feedback de carregamento
- Sistema de auditoria completo (`app/audit.py`)
  - Logs de login (sucesso e falha)
  - Logs de criação/deleção de usuários
  - Logs de validação de trainers
  - Arquivo `audit.log` com todas as ações críticas
- Suite completa de testes automatizados
  - Testes de autenticação
  - Testes de gerenciamento de usuários
  - Testes de paginação
  - Testes de permissões
  - Configuração pytest com fixtures
- Script de geração de evidências de testes (`run_tests.py`)
- Relatório HTML de evidências de testes
- Documentação expandida e atualizada

### 🔒 Segurança
- Hash bcrypt real para senha do admin (não mais plaintext)
- Instrução para geração de SECRET_KEY forte
- Variáveis de ambiente atualizadas no docker-compose.yml
- Validação de senhas com mínimo 6 caracteres
- Truncamento automático de senhas para limites do bcrypt

### 📊 Performance
- Paginação implementada em:
  - GET /api/admin/users
  - GET /api/trainer/courses
  - GET /api/training-plans (preparado para paginação)
- Limite de 100 itens por página para prevenir sobrecarga
- Queries otimizadas com offset/limit

### 🎨 UX/UI
- Toast notifications para feedback de ações
- Loading spinners durante operações assíncronas
- Animações CSS para toasts (slide-in)
- Melhor feedback visual em todas as operações

### 🧹 Limpeza
- Removidos 20+ arquivos de teste obsoletos:
  - `test_*.py` do backend root
  - `check_*.py`, `debug_*.py`
  - `test_register.html`, `test_user.json`
  - Scripts de migração SQL antigos
  - Arquivos de teste da pasta database
- Organização melhorada da estrutura de pastas
- Diretório `tests/` criado com estrutura adequada

### 📖 Documentação
- README.md completamente reescrito
  - Badges de versão e tecnologias
  - Documentação de todas as melhorias v2.0
  - Guias de instalação detalhados
  - Troubleshooting expandido
  - Exemplos de uso da API
- CHANGELOG.md criado
- Documentação de testes em `backend/tests/README.md`
- Comentários adicionados no código

### 🔧 Configuração
- `.env.example` atualizado com instruções de segurança
- `docker-compose.yml` corrigido (SECRET_KEY vs JWT_SECRET_KEY)
- `requirements.txt` atualizado com dependências de teste
  - pytest==7.4.3
  - pytest-asyncio==0.21.1
  - httpx==0.25.2

### 🐛 Correções
- Variáveis de ambiente alinhadas entre código e docker-compose
- Imports organizados e otimizados
- Warnings de SQLAlchemy suprimidos apropriadamente

---

## [1.0.0] - 2024-11-XX

### Inicial
- Sistema de autenticação JWT
- CRUD completo de usuários, cursos, lições
- Sistema de desafios MPU (SUMMARY e COMPLETE)
- Planos de formação
- Certificados digitais
- Dashboards por role (Admin, Trainer, Student)
- Internacionalização (pt-PT, es, en)
- Docker deployment
- SQL Server integration

---

### Notas de Versão

**v2.0.0** é uma major release com melhorias significativas em segurança, performance, testes e UX. 

**Breaking Changes:** Nenhuma. Totalmente compatível com v1.0.0.

**Migração:** Não requer migração de dados. Apenas atualizar código e reiniciar serviços.

**Recomendações:**
1. Gerar nova SECRET_KEY forte
2. Atualizar hash da senha admin no banco
3. Executar suite de testes
4. Revisar logs de auditoria

---

**Mantido por:** Santander Digital Services  
**Data de Release:** 14 de Dezembro de 2024
