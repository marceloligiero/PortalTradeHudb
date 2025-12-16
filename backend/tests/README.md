"""
Testes Automatizados - Portal Trade DataHub
=============================================

Este diretório contém os testes automatizados do backend.

## Estrutura

- test_auth.py - Testes de autenticação
- test_users.py - Testes de gerenciamento de usuários
- test_courses.py - Testes de cursos
- test_challenges.py - Testes do sistema de desafios MPU

## Executar Testes

```bash
# Instalar pytest
pip install pytest pytest-asyncio httpx

# Executar todos os testes
pytest

# Executar com cobertura
pytest --cov=app --cov-report=html

# Executar testes específicos
pytest tests/test_auth.py
```

## Dependências

```
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```
