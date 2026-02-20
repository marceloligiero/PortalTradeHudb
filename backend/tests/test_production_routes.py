#!/usr/bin/env python3
"""
Script para testar todas as rotas da API na VPS em produção.
Execute: python tests/test_production_routes.py

Testa todas as rotas da API TradeHub com relatório detalhado.
"""

import requests
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum


class TestStatus(Enum):
    PASSED = "✅ PASSED"
    FAILED = "❌ FAILED"
    SKIPPED = "⏭️ SKIPPED"
    WARNING = "⚠️ WARNING"


@dataclass
class TestResult:
    endpoint: str
    method: str
    status: TestStatus
    status_code: Optional[int] = None
    expected_codes: List[int] = field(default_factory=list)
    message: str = ""
    response_time: float = 0.0


class APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.results: List[TestResult] = []
        self.admin_token: Optional[str] = None
        self.trainer_token: Optional[str] = None
        self.student_token: Optional[str] = None
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })
    
    def test(self, method: str, endpoint: str, expected_codes: List[int], 
             data: Optional[Dict] = None, auth_token: Optional[str] = None,
             description: str = "") -> TestResult:
        """Executa um teste de API"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        try:
            start_time = datetime.now()
            
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Método não suportado: {method}")
            
            elapsed = (datetime.now() - start_time).total_seconds()
            
            if response.status_code in expected_codes:
                status = TestStatus.PASSED
                message = description or f"Status {response.status_code}"
            else:
                status = TestStatus.FAILED
                message = f"Esperado {expected_codes}, recebido {response.status_code}"
            
            result = TestResult(
                endpoint=endpoint,
                method=method.upper(),
                status=status,
                status_code=response.status_code,
                expected_codes=expected_codes,
                message=message,
                response_time=elapsed
            )
            
        except requests.exceptions.Timeout:
            result = TestResult(
                endpoint=endpoint,
                method=method.upper(),
                status=TestStatus.FAILED,
                message="Timeout após 30 segundos",
                expected_codes=expected_codes
            )
        except requests.exceptions.ConnectionError as e:
            result = TestResult(
                endpoint=endpoint,
                method=method.upper(),
                status=TestStatus.FAILED,
                message=f"Erro de conexão: {str(e)[:50]}",
                expected_codes=expected_codes
            )
        except Exception as e:
            result = TestResult(
                endpoint=endpoint,
                method=method.upper(),
                status=TestStatus.FAILED,
                message=f"Erro: {str(e)[:50]}",
                expected_codes=expected_codes
            )
        
        self.results.append(result)
        return result
    
    def login(self, email: str, password: str) -> Optional[str]:
        """Tenta fazer login e retorna o token"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
        except Exception as e:
            print(f"Erro no login ({email}): {e}")
        return None
    
    def run_all_tests(self, admin_email: str = None, admin_password: str = None,
                      trainer_email: str = None, trainer_password: str = None,
                      student_email: str = None, student_password: str = None):
        """Executa todos os testes"""
        
        print("=" * 70)
        print("🧪 TESTES DE API - TRADEHUB")
        print(f"📍 URL: {self.base_url}")
        print(f"📅 Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # ============================================================
        # HEALTH CHECK
        # ============================================================
        print("\n📋 HEALTH CHECK")
        print("-" * 50)
        
        self.test("GET", "/", [200], description="Rota raiz")
        self.test("GET", "/health", [200], description="Health check")
        self.test("GET", "/docs", [200], description="Swagger UI")
        self.test("GET", "/redoc", [200], description="ReDoc")
        self.test("GET", "/openapi.json", [200], description="OpenAPI Schema")
        
        # ============================================================
        # AUTENTICAÇÃO
        # ============================================================
        print("\n📋 AUTENTICAÇÃO")
        print("-" * 50)
        
        # Testes sem autenticação
        self.test("POST", "/api/auth/login", [401, 400, 422], 
                  data={"email": "invalid@test.com", "password": "wrong"},
                  description="Login inválido")
        
        self.test("GET", "/api/auth/me", [401], 
                  description="Me sem auth")
        
        # Tentar login com credenciais fornecidas
        if admin_email and admin_password:
            print(f"\n🔐 Tentando login admin: {admin_email}")
            self.admin_token = self.login(admin_email, admin_password)
            if self.admin_token:
                print(f"   ✅ Login admin OK")
            else:
                print(f"   ❌ Login admin falhou")
        
        if trainer_email and trainer_password:
            print(f"\n🔐 Tentando login trainer: {trainer_email}")
            self.trainer_token = self.login(trainer_email, trainer_password)
            if self.trainer_token:
                print(f"   ✅ Login trainer OK")
            else:
                print(f"   ❌ Login trainer falhou")
        
        if student_email and student_password:
            print(f"\n🔐 Tentando login student: {student_email}")
            self.student_token = self.login(student_email, student_password)
            if self.student_token:
                print(f"   ✅ Login student OK")
            else:
                print(f"   ❌ Login student falhou")
        
        # ============================================================
        # ROTAS ADMIN
        # ============================================================
        print("\n📋 ROTAS ADMIN")
        print("-" * 50)
        
        if self.admin_token:
            self.test("GET", "/api/auth/me", [200], 
                      auth_token=self.admin_token, description="Me com auth")
            
            self.test("GET", "/api/admin/users", [200], 
                      auth_token=self.admin_token, description="Listar usuários")
            
            self.test("GET", "/api/admin/trainers", [200], 
                      auth_token=self.admin_token, description="Listar trainers")
            
            self.test("GET", "/api/admin/pending-trainers", [200], 
                      auth_token=self.admin_token, description="Trainers pendentes")
            
            self.test("GET", "/api/admin/students", [200], 
                      auth_token=self.admin_token, description="Listar estudantes")
            
            self.test("GET", "/api/admin/courses", [200], 
                      auth_token=self.admin_token, description="Listar cursos")
            
            self.test("GET", "/api/admin/banks", [200], 
                      auth_token=self.admin_token, description="Listar bancos")
            
            self.test("GET", "/api/admin/products", [200], 
                      auth_token=self.admin_token, description="Listar produtos")
            
            # Relatórios
            self.test("GET", "/api/admin/reports/stats", [200], 
                      auth_token=self.admin_token, description="Stats gerais")
            
            self.test("GET", "/api/admin/reports/courses", [200], 
                      auth_token=self.admin_token, description="Relatório cursos")
            
            self.test("GET", "/api/admin/reports/trainers", [200], 
                      auth_token=self.admin_token, description="Relatório trainers")
            
            self.test("GET", "/api/admin/reports/training-plans", [200], 
                      auth_token=self.admin_token, description="Relatório planos")
            
            # Relatórios avançados
            self.test("GET", "/api/admin/advanced-reports/dashboard-summary", [200], 
                      auth_token=self.admin_token, description="Dashboard summary")
            
            self.test("GET", "/api/admin/advanced-reports/student-performance", [200], 
                      auth_token=self.admin_token, description="Student performance")
            
            self.test("GET", "/api/admin/advanced-reports/trainer-productivity", [200], 
                      auth_token=self.admin_token, description="Trainer productivity")
            
            self.test("GET", "/api/admin/advanced-reports/course-analytics", [200], 
                      auth_token=self.admin_token, description="Course analytics")
            
            self.test("GET", "/api/admin/advanced-reports/certifications", [200], 
                      auth_token=self.admin_token, description="Certifications")
            
            self.test("GET", "/api/admin/advanced-reports/mpu-analytics", [200], 
                      auth_token=self.admin_token, description="MPU analytics")
        else:
            print("   ⏭️ Testes admin pulados (sem token)")
        
        # ============================================================
        # ROTAS STUDENT
        # ============================================================
        print("\n📋 ROTAS STUDENT")
        print("-" * 50)
        
        token = self.student_token or self.admin_token
        if token:
            self.test("GET", "/api/student/courses", [200, 403], 
                      auth_token=token, description="Cursos do aluno")
            
            self.test("GET", "/api/student/stats", [200, 403], 
                      auth_token=token, description="Stats do aluno")
            
            self.test("GET", "/api/student/certificates", [200, 403], 
                      auth_token=token, description="Certificados")
            
            self.test("GET", "/api/student/reports/dashboard", [200, 403], 
                      auth_token=token, description="Dashboard aluno")
            
            self.test("GET", "/api/student/reports/overview", [200, 403], 
                      auth_token=token, description="Overview aluno")
        else:
            print("   ⏭️ Testes student pulados (sem token)")
        
        # ============================================================
        # ROTAS TRAINER
        # ============================================================
        print("\n📋 ROTAS TRAINER")
        print("-" * 50)
        
        token = self.trainer_token or self.admin_token
        if token:
            self.test("GET", "/api/trainer/courses", [200, 403], 
                      auth_token=token, description="Cursos do trainer")
            
            self.test("GET", "/api/trainer/courses/all", [200, 403], 
                      auth_token=token, description="Todos os cursos")
            
            self.test("GET", "/api/trainer/stats", [200, 403], 
                      auth_token=token, description="Stats trainer")
            
            self.test("GET", "/api/trainer/training-plans", [200, 403], 
                      auth_token=token, description="Planos trainer")
            
            self.test("GET", "/api/trainer/reports/overview", [200, 403], 
                      auth_token=token, description="Overview trainer")
            
            self.test("GET", "/api/trainer/reports/students", [200, 403], 
                      auth_token=token, description="Relatório alunos")
        else:
            print("   ⏭️ Testes trainer pulados (sem token)")
        
        # ============================================================
        # ROTAS TRAINING PLANS
        # ============================================================
        print("\n📋 ROTAS TRAINING PLANS")
        print("-" * 50)
        
        if self.admin_token:
            self.test("GET", "/api/training-plans/", [200], 
                      auth_token=self.admin_token, description="Listar planos")
            
            self.test("GET", "/api/training-plans/trainers", [200], 
                      auth_token=self.admin_token, description="Trainers disponíveis")
            
            self.test("GET", "/api/training-plans/999999", [404], 
                      auth_token=self.admin_token, description="Plano não encontrado")
        else:
            print("   ⏭️ Testes training plans pulados (sem token)")
        
        # ============================================================
        # ROTAS CHALLENGES
        # ============================================================
        print("\n📋 ROTAS CHALLENGES")
        print("-" * 50)
        
        if self.student_token or self.admin_token:
            token = self.student_token or self.admin_token
            
            self.test("GET", "/api/challenges/student/released", [200, 403], 
                      auth_token=token, description="Desafios liberados")
            
            self.test("GET", "/api/challenges/student/my-submissions", [200, 403], 
                      auth_token=token, description="Minhas submissões")
        
        if self.trainer_token or self.admin_token:
            token = self.trainer_token or self.admin_token
            
            self.test("GET", "/api/challenges/pending-review/list", [200, 403], 
                      auth_token=token, description="Pendentes revisão")
        
        if not (self.student_token or self.trainer_token or self.admin_token):
            print("   ⏭️ Testes challenges pulados (sem token)")
        
        # ============================================================
        # ROTAS LESSONS
        # ============================================================
        print("\n📋 ROTAS LESSONS")
        print("-" * 50)
        
        token = self.student_token or self.admin_token
        if token:
            self.test("GET", "/api/lessons/student/my-lessons", [200, 403], 
                      auth_token=token, description="Minhas lições")
        else:
            print("   ⏭️ Testes lessons pulados (sem token)")
        
        # ============================================================
        # ROTAS CERTIFICATES
        # ============================================================
        print("\n📋 ROTAS CERTIFICATES")
        print("-" * 50)
        
        if self.admin_token:
            self.test("GET", "/api/certificates/", [200], 
                      auth_token=self.admin_token, description="Listar certificados")
        else:
            print("   ⏭️ Testes certificates pulados (sem token)")
        
        # ============================================================
        # ROTAS STATS
        # ============================================================
        print("\n📋 ROTAS STATS")
        print("-" * 50)
        
        if self.admin_token:
            self.test("GET", "/api/stats/kpis", [200], 
                      auth_token=self.admin_token, description="KPIs")
            
            self.test("GET", "/api/stats/courses/featured", [200], 
                      auth_token=self.admin_token, description="Cursos destaque")
            
            self.test("GET", "/api/stats/training-plans/featured", [200], 
                      auth_token=self.admin_token, description="Planos destaque")
        else:
            print("   ⏭️ Testes stats pulados (sem token)")
        
        # ============================================================
        # RELATÓRIO FINAL
        # ============================================================
        self.print_summary()
    
    def print_summary(self):
        """Imprime resumo dos testes"""
        print("\n" + "=" * 70)
        print("📊 RESUMO DOS TESTES")
        print("=" * 70)
        
        passed = len([r for r in self.results if r.status == TestStatus.PASSED])
        failed = len([r for r in self.results if r.status == TestStatus.FAILED])
        skipped = len([r for r in self.results if r.status == TestStatus.SKIPPED])
        warnings = len([r for r in self.results if r.status == TestStatus.WARNING])
        
        print(f"\n✅ Passou:  {passed}")
        print(f"❌ Falhou:  {failed}")
        print(f"⏭️ Pulado:  {skipped}")
        print(f"⚠️ Avisos:  {warnings}")
        print(f"\n📊 Total:   {len(self.results)}")
        
        if failed > 0:
            print("\n" + "-" * 50)
            print("❌ TESTES QUE FALHARAM:")
            print("-" * 50)
            for result in self.results:
                if result.status == TestStatus.FAILED:
                    print(f"  {result.method:7} {result.endpoint}")
                    print(f"         Status: {result.status_code}")
                    print(f"         Esperado: {result.expected_codes}")
                    print(f"         Mensagem: {result.message}")
                    print()
        
        # Lista detalhada
        print("\n" + "-" * 50)
        print("📋 DETALHES:")
        print("-" * 50)
        
        for result in self.results:
            status_icon = result.status.value.split()[0]
            time_str = f"{result.response_time:.2f}s" if result.response_time > 0 else "-"
            code_str = str(result.status_code) if result.status_code else "-"
            print(f"{status_icon} {result.method:6} {result.endpoint:50} [{code_str:3}] {time_str}")
        
        # Taxa de sucesso
        if len(self.results) > 0:
            success_rate = (passed / len(self.results)) * 100
            print(f"\n📈 Taxa de Sucesso: {success_rate:.1f}%")
        
        print("=" * 70)


def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Testa todas as rotas da API TradeHub")
    parser.add_argument("--url", default="https://srv1242193.hstgr.cloud", 
                        help="URL base da API")
    parser.add_argument("--admin-email", help="Email do admin")
    parser.add_argument("--admin-password", help="Senha do admin")
    parser.add_argument("--trainer-email", help="Email do trainer")
    parser.add_argument("--trainer-password", help="Senha do trainer")
    parser.add_argument("--student-email", help="Email do student")
    parser.add_argument("--student-password", help="Senha do student")
    
    args = parser.parse_args()
    
    tester = APITester(args.url)
    tester.run_all_tests(
        admin_email=args.admin_email,
        admin_password=args.admin_password,
        trainer_email=args.trainer_email,
        trainer_password=args.trainer_password,
        student_email=args.student_email,
        student_password=args.student_password
    )


if __name__ == "__main__":
    main()
