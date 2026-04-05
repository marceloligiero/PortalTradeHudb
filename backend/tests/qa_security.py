"""
QA Security & Authorization test suite — PortalTradeHub
Runs via: python3 /tmp/qa_security.py   (inside Docker at localhost:8000)
         or: python3 qa_security.py     (from host at localhost:8100)
"""
import sys, warnings, requests
warnings.filterwarnings("ignore")

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
RESULTS = []


def login(email, password):
    r = requests.post(f"{BASE}/api/auth/login",
                      data={"username": email, "password": password}, timeout=10)
    return r.json().get("access_token") if r.status_code == 200 else None


def hdr(token):
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


def chk(label, method, path, token, expected, **kwargs):
    url = f"{BASE}{path}"
    try:
        r = getattr(requests, method)(url, headers=hdr(token), timeout=10, **kwargs)
        code = r.status_code
    except Exception as e:
        code = -1
    ok = code in expected if isinstance(expected, list) else code == expected
    RESULTS.append({"label": label, "method": method.upper(), "path": path,
                    "got": code, "expected": expected, "pass": ok})
    return ok


# ── Get tokens ────────────────────────────────────────────────────────────────
print("Authenticating roles...")
tokens = {}
CREDS = {
    "ADMIN":   ("admin@tradehub.com",           "admin123"),
    "USUARIO": ("student_test@tradehub.com",    "Test1234!"),
    "MANAGER": ("manager_test@tradehub.com",    "Test1234!"),
    "TRAINER": ("trainer_test@tradehub.com",    "Test1234!"),
    "TUTOR":   ("tutor_test@tradehub.com",      "Test1234!"),
}
for role, (email, pw) in CREDS.items():
    t = login(email, pw)
    tokens[role] = t
    print(f"  {role:10}: {'OK' if t else 'FAIL — user missing'}")

if not tokens["ADMIN"]:
    print("\nERROR: ADMIN login failed. Aborting.\n")
    sys.exit(1)

print()

# ── 1. PUBLIC — no auth ───────────────────────────────────────────────────────
chk("Public health",            "get", "/health",             None, 200)
chk("Public API health",        "get", "/api/health",         None, 200)
chk("Public landing",           "get", "/api/public/landing", None, 200)
chk("Public stats KPIs",        "get", "/api/stats/kpis",     None, 200)
chk("Public featured courses",  "get", "/api/stats/courses/featured", None, 200)
chk("Public featured plans",    "get", "/api/stats/training-plans/featured", None, 200)

# ── 2. AUTH ───────────────────────────────────────────────────────────────────
chk("Auth me ADMIN",          "get",  "/api/auth/me", tokens["ADMIN"], 200)
chk("Auth me unauthenticated","get",  "/api/auth/me", None,            401)
chk("Auth me bad token",      "get",  "/api/auth/me", "bad.jwt.token", 401)
chk("Auth login wrong pwd",   "post", "/api/auth/login", None, 401,
    data={"username": "admin@tradehub.com", "password": "WRONG_PASSWORD"})
chk("Auth login no payload",  "post", "/api/auth/login", None, 422)
chk("Auth register duplicate","post", "/api/auth/register", None, [400, 409, 422],
    json={"email": "admin@tradehub.com", "password": "test", "full_name": "X", "role": "USUARIO"})

# ── 3. ADMIN — CRUD + authorization ──────────────────────────────────────────
chk("Admin users ADMIN",     "get",    "/api/admin/users",    tokens["ADMIN"],   200)
chk("Admin users MANAGER",   "get",    "/api/admin/users",    tokens["MANAGER"], [200, 403])
chk("Admin users STUDENT",   "get",    "/api/admin/users",    tokens["USUARIO"], 403)
chk("Admin users no auth",   "get",    "/api/admin/users",    None,              401)
chk("Admin banks GET ADMIN",     "get",  "/api/admin/banks", tokens["ADMIN"],   200)
chk("Admin banks GET TRAINER",   "get",  "/api/admin/banks", tokens["TRAINER"], 200)
chk("Admin banks GET STUDENT",   "get",  "/api/admin/banks", tokens["USUARIO"], 200)
chk("Admin banks POST STUDENT",  "post", "/api/admin/banks", tokens["USUARIO"], 403,
    json={"name": "HackBank", "code": "HK"})
chk("Admin banks DELETE STUDENT","delete","/api/admin/banks/1", tokens["USUARIO"], 403)
chk("Admin products STUDENT",    "post","/api/admin/products", tokens["USUARIO"], 403,
    json={"name": "X", "code": "X"})
chk("Admin impacts STUDENT",     "post","/api/admin/master/impacts", tokens["USUARIO"], 403,
    json={"name": "X"})
chk("Admin origins STUDENT",     "post","/api/admin/master/origins", tokens["USUARIO"], 403,
    json={"name": "X"})
chk("Admin validate trainer STUDENT","post","/api/admin/validate-trainer/999", tokens["USUARIO"], 403)
chk("Admin validate trainer ADMIN",  "post","/api/admin/validate-trainer/999", tokens["ADMIN"], [200, 404])
chk("Admin delete non-existent",     "delete","/api/admin/banks/999999", tokens["ADMIN"], 404)
chk("Admin TRAINER cannot del user", "delete","/api/admin/users/9999",  tokens["TRAINER"], [403, 404])

# ── 4. RELATÓRIOS ─────────────────────────────────────────────────────────────
for ep in ["/api/relatorios/overview", "/api/relatorios/formacoes", "/api/relatorios/tutoria"]:
    chk(f"Rel {ep[-12:]} ADMIN",   "get", ep, tokens["ADMIN"],   200)
    chk(f"Rel {ep[-12:]} STUDENT", "get", ep, tokens["USUARIO"], 200)
    chk(f"Rel {ep[-12:]} no auth", "get", ep, None,              401)

chk("Rel teams ADMIN",     "get", "/api/relatorios/teams", tokens["ADMIN"],   200)
chk("Rel teams MANAGER",   "get", "/api/relatorios/teams", tokens["MANAGER"], [200, 403])
chk("Rel teams STUDENT",   "get", "/api/relatorios/teams", tokens["USUARIO"], 403)
chk("Rel incidents ADMIN", "get", "/api/relatorios/incidents", tokens["ADMIN"],   200)
chk("Rel incidents STUDENT","get","/api/relatorios/incidents", tokens["USUARIO"], [200, 403])
chk("Rel analytics ADMIN", "get", "/api/relatorios/tutoria/analytics", tokens["ADMIN"],   200)
chk("Rel analytics STUDENT","get","/api/relatorios/tutoria/analytics", tokens["USUARIO"], [200, 403])
chk("Rel members ADMIN",    "get", "/api/relatorios/members", tokens["ADMIN"],   [200, 403])
chk("Rel members STUDENT",  "get", "/api/relatorios/members", tokens["USUARIO"], 403)
chk("Rel incidents no auth","get", "/api/relatorios/incidents", None, 401)

# ── 5. DATA WAREHOUSE ─────────────────────────────────────────────────────────
DW_EPS = [
    "/api/dw/snapshot/latest", "/api/dw/snapshot/trend",
    "/api/dw/training/by-month", "/api/dw/training/by-course",
    "/api/dw/tutoria/by-month", "/api/dw/tutoria/by-category", "/api/dw/tutoria/by-trainer",
    "/api/dw/chamados/by-status", "/api/dw/chamados/by-month", "/api/dw/chamados/by-type",
    "/api/dw/internal-errors/by-month", "/api/dw/internal-errors/by-team",
    "/api/dw/teams/overview",
]
for ep in DW_EPS:
    name = ep.split("/")[-1]
    chk(f"DW ADMIN {name}",   "get", ep, tokens["ADMIN"],   200)
    chk(f"DW STUDENT {name}", "get", ep, tokens["USUARIO"], 403)
    chk(f"DW noauth {name}",  "get", ep, None,              401)

chk("DW ETL ADMIN",   "post", "/api/dw/etl/run", tokens["ADMIN"],   [200, 202])
chk("DW ETL STUDENT", "post", "/api/dw/etl/run", tokens["USUARIO"], 403)
chk("DW ETL no auth", "post", "/api/dw/etl/run", None,              401)

# ── 6. CHAMADOS ───────────────────────────────────────────────────────────────
chk("Chamados GET ADMIN",    "get",    "/api/chamados",      tokens["ADMIN"],   200)
chk("Chamados GET STUDENT",  "get",    "/api/chamados",      tokens["USUARIO"], 200)
chk("Chamados GET no auth",  "get",    "/api/chamados",      None,              401)
chk("Chamados POST STUDENT", "post",   "/api/chamados",      tokens["USUARIO"], [200, 201, 422],
    json={"title": "t", "description": "d", "portal": "GERAL", "type": "BUG"})
chk("Chamados DELETE no auth",  "delete", "/api/chamados/9999", None,            401)
chk("Chamados DELETE STUDENT",  "delete", "/api/chamados/9999", tokens["USUARIO"], [403, 404])

# ── 7. TEAMS ──────────────────────────────────────────────────────────────────
chk("Teams GET ADMIN",     "get",    "/api/teams", tokens["ADMIN"],   200)
chk("Teams GET STUDENT",   "get",    "/api/teams", tokens["USUARIO"], 200)
chk("Teams GET no auth",   "get",    "/api/teams", None,              401)
chk("Teams POST ADMIN",    "post",   "/api/teams", tokens["ADMIN"],   [200, 201, 422])
chk("Teams POST STUDENT",  "post",   "/api/teams", tokens["USUARIO"], 403)
chk("Teams DELETE STUDENT","delete", "/api/teams/9999", tokens["USUARIO"], [403, 404])

# ── 8. TRAINING PLANS ─────────────────────────────────────────────────────────
chk("Plans GET ADMIN",   "get", "/api/training-plans/", tokens["ADMIN"],   200)
chk("Plans GET STUDENT", "get", "/api/training-plans/", tokens["USUARIO"], [200, 403])
chk("Plans GET no auth", "get", "/api/training-plans/", None,              401)

# ── 9. ADVANCED REPORTS ───────────────────────────────────────────────────────
AR_EPS = [
    "/api/admin/advanced-reports/dashboard-summary",
    "/api/admin/advanced-reports/mpu-analytics",
    "/api/admin/advanced-reports/certifications",
    "/api/admin/advanced-reports/trainer-productivity",
    "/api/admin/advanced-reports/student-performance",
    "/api/admin/advanced-reports/course-analytics",
]
for ep in AR_EPS:
    name = ep.split("/")[-1]
    chk(f"AdvRep ADMIN {name}",   "get", ep, tokens["ADMIN"],   200)
    chk(f"AdvRep STUDENT {name}", "get", ep, tokens["USUARIO"], 403)
    chk(f"AdvRep no auth {name}", "get", ep, None,              401)

# ── 10. KNOWLEDGE MATRIX ──────────────────────────────────────────────────────
chk("KMatrix ADMIN",   "get", "/api/admin/knowledge-matrix", tokens["ADMIN"],   200)
chk("KMatrix MANAGER", "get", "/api/admin/knowledge-matrix", tokens["MANAGER"], [200, 403])
chk("KMatrix STUDENT", "get", "/api/admin/knowledge-matrix", tokens["USUARIO"], 403)
chk("KMatrix no auth", "get", "/api/admin/knowledge-matrix", None,              401)

# ── 11. FEEDBACK ──────────────────────────────────────────────────────────────
chk("Feedback surveys ADMIN",    "get", "/api/feedback/surveys",   tokens["ADMIN"],   200)
chk("Feedback surveys STUDENT",  "get", "/api/feedback/surveys",   tokens["USUARIO"], [200, 403])
chk("Feedback dashboard ADMIN",  "get", "/api/feedback/dashboard", tokens["ADMIN"],   200)
chk("Feedback dashboard STUDENT","get", "/api/feedback/dashboard", tokens["USUARIO"], [200, 403])
chk("Feedback surveys no auth",  "get", "/api/feedback/surveys",   None,              401)

# ── 12. INTERNAL ERRORS ───────────────────────────────────────────────────────
chk("IntErr errors ADMIN",   "get", "/api/internal-errors/errors",    tokens["ADMIN"],   200)
chk("IntErr errors STUDENT", "get", "/api/internal-errors/errors",    tokens["USUARIO"], [200, 403])
chk("IntErr dashboard ADMIN","get", "/api/internal-errors/dashboard", tokens["ADMIN"],   200)
chk("IntErr lookups ADMIN",  "get", "/api/internal-errors/lookups/banks", tokens["ADMIN"], 200)
chk("IntErr errors no auth", "get", "/api/internal-errors/errors",    None,              401)

# ── 13. NEGATIVE / SECURITY ───────────────────────────────────────────────────
chk("SQLi in username",    "post", "/api/auth/login", None, [401, 422],
    data={"username": "' OR '1'='1", "password": "x"})
chk("Empty bearer header", "get",  "/api/auth/me", "", 401)
chk("Tampered JWT",        "get",  "/api/auth/me",
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkB0cmFkZWh1Yi5jb20ifQ.BADSIG", 401)
chk("XSS in register",     "post", "/api/auth/register", None, [400, 409, 422],
    json={"email": "<script>alert(1)</script>@x.com", "password": "x", "full_name": "X", "role": "USUARIO"})
chk("Oversized payload",   "post", "/api/auth/login", None, [401, 422, 413],
    data={"username": "A" * 10000, "password": "x"})

# ── REPORT ─────────────────────────────────────────────────────────────────────
passed = [r for r in RESULTS if r["pass"]]
failed = [r for r in RESULTS if not r["pass"]]

SEP = "=" * 70
print(SEP)
print("  QA SECURITY REPORT — PortalTradeHub API")
print(SEP)
print(f"  Endpoint base  : {BASE}")
print(f"  Total checks   : {len(RESULTS)}")
print(f"  PASS           : {len(passed)}")
print(f"  FAIL           : {len(failed)}")
print(SEP)

if failed:
    print("\nFAILURES DETAIL:")
    print("-" * 70)
    for r in failed:
        exp = r["expected"]
        print(f"  [{r['method']:6}] {r['path']}")
        print(f"    Label    : {r['label']}")
        print(f"    Expected : {exp}")
        print(f"    Got      : {r['got']}")
        print()
else:
    print("\n  All security checks PASSED!")

# By-area summary
groups = {}
for r in RESULTS:
    g = r["label"].split()[0]
    groups.setdefault(g, {"pass": 0, "fail": 0})
    groups[g]["pass" if r["pass"] else "fail"] += 1

print()
print("SUMMARY BY AREA:")
print("-" * 70)
for g, v in sorted(groups.items()):
    sym = "OK" if v["fail"] == 0 else "!!"
    bar = "#" * v["pass"] + "." * v["fail"]
    print(f"  [{sym}] {g:35} pass={v['pass']:3}  fail={v['fail']:2}  [{bar}]")

print()
print(SEP)
sys.exit(0 if not failed else 1)
