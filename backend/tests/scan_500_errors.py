"""Scan ALL endpoints for 500 errors."""
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User

client = TestClient(app, raise_server_exceptions=False)

# Login all roles
def login(email, pw="Test1234!"):
    r = client.post("/api/auth/login", data={"username": email, "password": pw})
    if r.status_code == 200:
        return r.json()["access_token"]
    r2 = client.post("/api/auth/login", data={"username": email, "password": "admin123"})
    if r2.status_code == 200:
        return r2.json()["access_token"]
    return None

tokens = {}
for e, k in [
    ("admin@tradehub.com", "admin"),
    ("manager_test@tradehub.com", "mgr"),
    ("tutor_test@tradehub.com", "tutor"),
    ("student_test@tradehub.com", "stu"),
    ("trainer_test@tradehub.com", "trainer"),
    ("liberador_test@tradehub.com", "lib"),
    ("referente_test@tradehub.com", "ref"),
]:
    t = login(e)
    if t:
        tokens[k] = {"Authorization": f"Bearer {t}"}

print("Logged in:", list(tokens.keys()))

ah = tokens.get("admin", {})
mh = tokens.get("mgr", {})
th = tokens.get("tutor", {})
sh = tokens.get("stu", {})
trh = tokens.get("trainer", ah)
lh = tokens.get("lib", {})
rh = tokens.get("ref", {})

# Get existing IDs
cl = client.get("/api/admin/courses", headers=ah)
courses = cl.json() if cl.status_code == 200 else []
cid = courses[0]["id"] if courses else 1

pl = client.get("/api/training-plans/", headers=ah)
plans_data = pl.json() if pl.status_code == 200 else {}
plans = plans_data.get("items", plans_data) if isinstance(plans_data, dict) else plans_data
pid = plans[0]["id"] if plans else 1

chr_ = client.get(f"/api/challenges/course/{cid}", headers=ah)
challs = chr_.json() if chr_.status_code == 200 else []
chid = challs[0]["id"] if challs else 1

terr_r = client.get("/api/tutoria/errors", headers=ah)
terrs = terr_r.json() if terr_r.status_code == 200 else []
terror_id = terrs[0]["id"] if terrs else 280

tplans_r = client.get("/api/tutoria/plans", headers=ah)
tplans = tplans_r.json() if tplans_r.status_code == 200 else []
tplan_id = tplans[0]["id"] if tplans else 41

teams_r = client.get("/api/teams", headers=ah)
teams_data = teams_r.json() if teams_r.status_code == 200 else {}
teams = teams_data.get("items", teams_data.get("teams", teams_data)) if isinstance(teams_data, dict) else teams_data
tid = teams[0]["id"] if teams else 1

banks_r = client.get("/api/admin/banks", headers=ah)
banks = banks_r.json() if banks_r.status_code == 200 else []
bid = banks[0]["id"] if banks else 1

products_r = client.get("/api/admin/products", headers=ah)
products = products_r.json() if products_r.status_code == 200 else []
prid = products[0]["id"] if products else 1

cham_r = client.get("/api/chamados", headers=ah)
chams_data = cham_r.json() if cham_r.status_code == 200 else {}
chams = chams_data.get("items", chams_data) if isinstance(chams_data, dict) else chams_data
chamado_id = chams[0]["id"] if chams else None

certs_r = client.get("/api/certificates/", headers=ah)
certs_data = certs_r.json() if certs_r.status_code == 200 else {}
certs = certs_data.get("items", certs_data) if isinstance(certs_data, dict) else certs_data
cert_id = certs[0]["id"] if certs else None

ie_r = client.get("/api/internal-errors/errors", headers=ah)
ies_data = ie_r.json() if ie_r.status_code == 200 else {}
ies = ies_data.get("items", ies_data) if isinstance(ies_data, dict) else ies_data
ie_id = ies[0]["id"] if ies else None

org_r = client.get("/api/org/nodes", headers=ah)
orgs = org_r.json() if org_r.status_code == 200 else []
org_id = orgs[0]["id"] if orgs else None

fb_r = client.get("/api/feedback/surveys", headers=ah)
fbs_data = fb_r.json() if fb_r.status_code == 200 else {}
fbs = fbs_data.get("items", fbs_data) if isinstance(fbs_data, dict) else fbs_data
fb_id = fbs[0]["id"] if fbs else None

db = SessionLocal()
sid = db.query(User).filter(User.email == "student_test@tradehub.com").first()
student_id = sid.id if sid else 22
tru = db.query(User).filter(User.email == "trainer_test@tradehub.com").first()
trainer_id = tru.id if tru else 20
db.close()

print(f"IDs: cid={cid} pid={pid} chid={chid} terror={terror_id} tplan={tplan_id} tid={tid}")
print(f"      bid={bid} prid={prid} chamado={chamado_id} cert={cert_id} ie={ie_id}")
print(f"      org={org_id} fb={fb_id} student={student_id} trainer={trainer_id}")

errors_500 = []
tested_count = 0

def test(method, path, headers=None, json_data=None, label=""):
    global tested_count
    tested_count += 1
    h = headers or ah
    fn = getattr(client, method)
    kwargs = {"headers": h}
    if json_data:
        kwargs["json"] = json_data
    try:
        r = fn(path, **kwargs)
        if r.status_code == 500:
            detail = ""
            try:
                detail = r.json().get("detail", "")[:120]
            except Exception:
                detail = r.text[:120]
            errors_500.append(f"500 {method.upper():7s} {path:60s} [{label}] => {detail}")
        return r.status_code
    except Exception as e:
        errors_500.append(f"ERR {method.upper():7s} {path:60s} [{label}] => {str(e)[:120]}")
        return 0


# ======================================================================
# SYSTEMATICALLY TEST EVERY ENDPOINT
# ======================================================================

# -- Health / Public --
test("get", "/", label="root")
test("get", "/api", label="api root")
test("get", "/health", label="health")
test("get", "/api/health", label="api health")
test("get", "/api/public/landing", label="landing")

# -- Auth --
test("post", "/api/auth/register", json_data={"email": "scan_test_reg@x.com", "full_name": "Scan", "password": "Test1234!"}, headers={}, label="register")
test("post", "/api/auth/verify-email", json_data={"email": "admin@tradehub.com"}, headers={}, label="verify-email")
test("post", "/api/auth/forgot-password", json_data={"email": "nobody@x.com"}, headers={}, label="forgot-pw")
test("get", "/api/auth/validate-reset-token/invalid-xyz", headers={}, label="validate-token")
test("post", "/api/auth/reset-password", json_data={"token": "bad", "new_password": "X"}, headers={}, label="reset-pw")
test("get", "/api/auth/me", label="auth me")

# -- Admin Users --
test("get", "/api/admin/users", label="admin users")
test("get", f"/api/admin/users/{student_id}", label="admin user detail")
test("put", f"/api/admin/users/{student_id}", json_data={"full_name": "Student Test"}, label="admin user update")
test("get", "/api/admin/trainers", label="admin trainers")
test("get", "/api/admin/students", label="admin students")
test("get", "/api/admin/pending-trainers", label="pending trainers")
test("post", f"/api/admin/validate-trainer/{trainer_id}", label="validate-trainer")

# -- Admin Banks --
test("get", "/api/admin/banks", label="banks list")
test("post", "/api/admin/banks", json_data={"name": "Banco Scan", "code": "BSCAN"}, label="create bank")
test("put", f"/api/admin/banks/{bid}", json_data={"name": "Banco Atualizado"}, label="update bank")

# -- Admin Products --
test("get", "/api/admin/products", label="products list")
test("post", "/api/admin/products", json_data={"name": "Produto Scan", "code": "PSCAN"}, label="create product")
test("put", f"/api/admin/products/{prid}", json_data={"name": "Prod Atualizado"}, label="update product")

# Delete product (potential FK issue!)
r_dp = client.post("/api/admin/products", headers=ah, json={"name": "DELETE ME PROD", "code": "DELP"})
if r_dp.status_code == 201:
    dp_id = r_dp.json()["id"]
    test("delete", f"/api/admin/products/{dp_id}", label="delete product no-FK")

# Delete product WITH FK references (the bug user found!)
test("delete", f"/api/admin/products/{prid}", label="delete product with-FK")

# Delete bank WITH FK references
test("delete", f"/api/admin/banks/{bid}", label="delete bank with-FK")

# -- Admin Master Data --
for ep in ["impacts", "origins", "detected-by", "departments", "activities", "error-types"]:
    test("get", f"/api/admin/master/{ep}", label=f"master {ep}")
    r_m = client.post(f"/api/admin/master/{ep}", headers=ah, json={"name": f"Scan {ep}", "description": "test"})
    if r_m.status_code == 201:
        mid = r_m.json()["id"]
        test("put", f"/api/admin/master/{ep}/{mid}", json_data={"name": f"Update {ep}"}, label=f"update {ep}")
        test("delete", f"/api/admin/master/{ep}/{mid}", label=f"delete {ep}")

test("get", "/api/admin/master/activities/filter", label="activities filter")
test("get", "/api/admin/master/error-types/filter", label="error-types filter")
test("get", "/api/admin/master/categories/filter", label="categories filter")

# -- Admin Courses --
test("get", "/api/admin/courses", label="admin courses list")
r_nc = client.post("/api/admin/courses", headers=ah, json={"title": "Curso Scan Test", "description": "scan"})
new_cid = r_nc.json()["id"] if r_nc.status_code == 201 else None
test("get", f"/api/admin/courses/{cid}", label="admin course detail")
test("put", f"/api/admin/courses/{cid}", json_data={"title": "Curso Atualizado"}, label="admin course update")
if new_cid:
    test("delete", f"/api/admin/courses/{new_cid}", label="delete course")

# -- Admin Courses Sub-resources (lessons/challenges) --
cd_r = client.get(f"/api/admin/courses/{cid}", headers=ah)
if cd_r.status_code == 200:
    cd = cd_r.json()
    lessons = cd.get("lessons", [])
    challenges = cd.get("challenges", [])
    if lessons:
        lid = lessons[0]["id"]
        test("get", f"/api/admin/courses/{cid}/lessons/{lid}", label="admin lesson detail")
        test("put", f"/api/admin/courses/{cid}/lessons/{lid}", json_data={"title": "Aula Updated"}, label="admin lesson update")
    if challenges:
        chlid = challenges[0]["id"]
        test("get", f"/api/admin/courses/{cid}/challenges/{chlid}", label="admin challenge detail")
        test("put", f"/api/admin/courses/{cid}/challenges/{chlid}", json_data={"title": "Challenge Updated"}, label="admin challenge update")

# -- Admin Reports --
for ep in ["stats", "courses", "trainers", "training-plans", "insights"]:
    test("get", f"/api/admin/reports/{ep}", label=f"admin report {ep}")

# -- Advanced Reports --
for ep in ["dashboard-summary", "course-analytics", "student-performance",
           "trainer-productivity", "certifications", "mpu-analytics"]:
    test("get", f"/api/admin/advanced-reports/{ep}", label=f"adv-report {ep}")

# -- Knowledge Matrix --
test("get", "/api/admin/knowledge-matrix", label="knowledge matrix")

# -- Student Portal --
test("get", "/api/student/courses", headers=sh, label="student courses")
test("get", f"/api/student/courses/{cid}", headers=sh, label="student course detail")
test("get", "/api/student/stats", headers=sh, label="student stats")
test("get", "/api/student/certificates", headers=sh, label="student certs")
test("get", "/api/stats/kpis", headers=sh, label="kpis")
test("get", "/api/stats/courses/featured", headers=sh, label="featured courses")
test("get", "/api/stats/training-plans/featured", headers=sh, label="featured plans")
test("post", f"/api/student/enroll/{cid}", headers=sh, label="student enroll")
for ep in ["overview", "dashboard", "courses", "lessons", "achievements"]:
    test("get", f"/api/student/reports/{ep}", headers=sh, label=f"student report {ep}")

# -- Trainer Portal --
test("get", "/api/trainer/courses", headers=trh, label="trainer courses")
test("get", "/api/trainer/courses/all", headers=trh, label="trainer all courses")
test("get", f"/api/trainer/courses/{cid}", headers=trh, label="trainer course detail")
test("get", f"/api/trainer/courses/details/{cid}", headers=trh, label="trainer course full")
test("post", "/api/trainer/courses", headers=trh, json_data={"title": "Trainer Scan Course", "description": "x"}, label="trainer create course")
test("get", "/api/trainer/students", headers=trh, label="trainer students")
test("get", "/api/trainer/students/list", headers=trh, label="trainer students list")
test("get", "/api/trainer/stats", headers=trh, label="trainer stats")
test("get", "/api/trainer/training-plans", headers=trh, label="trainer plans")
for ep in ["overview", "challenges", "lessons", "plans", "students"]:
    test("get", f"/api/trainer/reports/{ep}", headers=trh, label=f"trainer report {ep}")

# Trainer course sub-resources
if courses:
    tc_r = client.get(f"/api/trainer/courses/details/{cid}", headers=trh)
    if tc_r.status_code == 200:
        tcd = tc_r.json()
        tcls = tcd.get("challenges", [])
        tlsn = tcd.get("lessons", [])
        if tcls:
            test("get", f"/api/trainer/courses/{cid}/challenges/{tcls[0]['id']}", headers=trh, label="trainer chal detail")
        if tlsn:
            test("get", f"/api/trainer/courses/{cid}/lessons/{tlsn[0]['id']}", headers=trh, label="trainer lesson detail")

# -- Training Plans --
test("get", "/api/training-plans/", label="plans list")
test("get", f"/api/training-plans/{pid}", label="plan detail")
test("put", f"/api/training-plans/{pid}", json_data={"title": "Plan Updated"}, label="plan update")
test("get", "/api/training-plans/trainers", label="plan trainers")
test("get", f"/api/training-plans/{pid}/students", label="plan students")
test("get", f"/api/training-plans/{pid}/completion-status", label="plan completion")
test("get", "/api/training-plans/test", label="plan test GET")
test("post", "/api/training-plans/test", label="plan test POST")

# Plan enrollment update
stu_r = client.get(f"/api/training-plans/{pid}/students", headers=ah)
if stu_r.status_code == 200:
    stu_list = stu_r.json() if isinstance(stu_r.json(), list) else stu_r.json().get("items", [])
    if stu_list:
        enrollment_id = stu_list[0].get("enrollment_id") or stu_list[0].get("id")
        if enrollment_id:
            test("put", f"/api/training-plans/{pid}/enrollment/{enrollment_id}",
                 json_data={"status": "ACTIVE"}, label="plan enrollment update")

# Create a plan to delete
r_np = client.post("/api/training-plans/", headers=ah, json={
    "title": "Plan Delete Test", "course_ids": [cid], "trainer_ids": [trainer_id]
})
if r_np.status_code == 201:
    np_id = r_np.json()["id"]
    test("delete", f"/api/training-plans/{np_id}", label="delete plan")

# Remove trainer from plan
test("delete", f"/api/training-plans/{pid}/remove-trainer/{trainer_id}", label="remove trainer from plan")

# -- Challenges --
test("get", f"/api/challenges/{chid}", headers=trh, label="challenge detail")
test("put", f"/api/challenges/{chid}", headers=trh, json_data={"title": "Updated Chal"}, label="challenge update")
test("get", f"/api/challenges/course/{cid}", headers=trh, label="challenges by course")
test("get", f"/api/challenges/{chid}/submissions", headers=trh, label="challenge subs")
test("get", f"/api/challenges/{chid}/eligible-students", headers=trh, label="eligible students")
test("get", f"/api/challenges/{chid}/eligible-students/debug", headers=trh, label="eligible debug")
test("get", f"/api/challenges/{chid}/can-start/{student_id}", headers=trh, label="can start")
test("get", f"/api/challenges/{chid}/is-released/{student_id}", headers=trh, label="is released")
test("get", "/api/challenges/pending-review/list", headers=trh, label="pending review")
test("get", "/api/challenges/student/released", headers=sh, label="student released")
test("get", "/api/challenges/student/my-submissions", headers=sh, label="my subs")
test("post", f"/api/challenges/{chid}/release", headers=trh, json_data={"is_released": True}, label="release chal")
test("post", f"/api/challenges/{chid}/release/{student_id}", headers=trh, label="release for student")

# Challenge submit workflow
test("post", "/api/challenges/submit/summary", headers=trh, json_data={
    "challenge_id": chid, "user_id": student_id, "total_operations": 10,
    "total_time_minutes": 5.0, "errors_count": 0
}, label="submit summary")

# Start complete challenge
test("post", f"/api/challenges/submit/complete/start/{chid}?user_id={student_id}",
     headers=trh, label="start complete for student")
test("post", f"/api/challenges/submit/complete/start/{chid}/self",
     headers=sh, json_data={"training_plan_id": pid}, label="start complete self")

# Get a submission to test operations
subs_r = client.get(f"/api/challenges/{chid}/submissions", headers=trh)
subs = subs_r.json() if subs_r.status_code == 200 else []
sub_id = subs[0]["id"] if subs else None
if sub_id:
    test("get", f"/api/challenges/submissions/{sub_id}", headers=trh, label="sub detail")
    test("get", f"/api/challenges/submissions/{sub_id}/operations", headers=trh, label="sub operations")
    test("post", f"/api/challenges/submissions/{sub_id}/operations/start",
         headers=sh, json_data={"operation_reference": "OP-SCAN"}, label="start operation")

    # Get operation ID
    ops_r = client.get(f"/api/challenges/submissions/{sub_id}/operations", headers=trh)
    ops = ops_r.json() if ops_r.status_code == 200 else []
    op_id = ops[0]["id"] if ops else None
    if op_id:
        test("post", f"/api/challenges/operations/{op_id}/classify",
             headers=sh, json_data={"classification": "CORRECT"}, label="classify op")
        test("post", f"/api/challenges/operations/{op_id}/finish",
             headers=sh, json_data={"has_error": False}, label="finish op")

    # Submit part / finish for complete challenges
    test("post", f"/api/challenges/submit/complete/{sub_id}/part",
         headers=sh, json_data={"operation_reference": "OP-PART", "has_error": False}, label="submit part")
    test("post", f"/api/challenges/submit/complete/{sub_id}/finish",
         headers=sh, label="finish complete")

    test("post", f"/api/challenges/submissions/{sub_id}/submit-for-review",
         headers=sh, label="submit for review")
    test("post", f"/api/challenges/submissions/{sub_id}/finalize-summary",
         headers=trh, json_data={"total_operations": 10, "total_time_minutes": 5.0, "errors_count": 0},
         label="finalize summary")
    test("post", f"/api/challenges/submissions/{sub_id}/finalize-review",
         headers=trh, json_data={"approve": True, "notes": "OK"}, label="finalize review")
    test("post", f"/api/challenges/submissions/{sub_id}/manual-finalize",
         headers=trh, json_data={"approve": True, "notes": "Manual"}, label="manual finalize")
    test("post", f"/api/challenges/submissions/{sub_id}/allow-retry",
         headers=trh, json_data={"reason": "More practice"}, label="allow retry")
    test("post", f"/api/challenges/submissions/{sub_id}/start-retry",
         headers=sh, label="start retry")

# -- Lessons --
test("get", "/api/lessons/student/my-lessons", headers=sh, label="my lessons")

# -- Finalization --
test("get", f"/api/finalization/plan/{pid}/status", label="plan fin status")
test("get", f"/api/finalization/plan/{pid}/calculate-status", label="plan calc status")
test("get", f"/api/finalization/course/{pid}/{cid}/status", label="course fin status")
test("post", f"/api/finalization/course/{pid}/{cid}/finalize?user_id={student_id}", label="finalize course")
test("post", f"/api/finalization/plan/{pid}/finalize?user_id={student_id}", label="finalize plan")
test("post", f"/api/training-plans/{pid}/finalize?student_id={student_id}", label="finalize plan v2")

# -- Certificates --
test("get", "/api/certificates/", label="certs list")
test("get", f"/api/certificates/by-plan/{pid}", label="certs by plan")
if cert_id:
    test("get", f"/api/certificates/{cert_id}", label="cert detail")
    test("get", f"/api/certificates/{cert_id}/pdf", label="cert pdf")

# -- Tutoria --
test("get", "/api/tutoria/categories", headers=th, label="tut categories")
test("get", "/api/tutoria/errors", headers=th, label="tut errors")
test("get", f"/api/tutoria/errors/{terror_id}", headers=ah, label="tut error detail")
test("get", "/api/tutoria/plans", headers=th, label="tut plans")
test("get", f"/api/tutoria/plans/{tplan_id}", headers=ah, label="tut plan detail")
test("get", f"/api/tutoria/plans/{tplan_id}/items", headers=ah, label="tut plan items")
test("get", f"/api/tutoria/plans/{tplan_id}/comments", headers=ah, label="tut plan comments")
test("get", f"/api/tutoria/errors/{terror_id}/comments", headers=ah, label="tut error comments")
test("get", f"/api/tutoria/errors/{terror_id}/plans", headers=ah, label="tut error plans")
test("get", "/api/tutoria/dashboard", headers=th, label="tut dashboard")
test("get", "/api/tutoria/my-plans", headers=th, label="tut my plans")
test("get", "/api/tutoria/notifications", headers=th, label="tut notifs")
test("get", "/api/tutoria/students", headers=th, label="tut students")
test("get", "/api/tutoria/team", headers=th, label="tut team")
test("get", "/api/tutoria/products", headers=th, label="tut products")
test("get", "/api/tutoria/capsulas", headers=th, label="tut capsulas")
test("get", "/api/tutoria/capsulas-challenges", headers=th, label="tut capsulas-challenges")
test("get", "/api/tutoria/learning-sheets", headers=th, label="tut learning sheets")
test("get", "/api/tutoria/learning-sheets/mine", headers=sh, label="tut my learning sheets")

# Tutoria mutations
test("patch", f"/api/tutoria/errors/{terror_id}/tutor-review",
     headers=ah, json_data={"tutor_notes": "Scan review"}, label="tutor-review")
test("patch", f"/api/tutoria/notifications/read-all", headers=th, label="notifs read-all")

# -- Internal Errors --
test("get", "/api/internal-errors/errors", headers=th, label="int-errors")
if ie_id:
    test("get", f"/api/internal-errors/errors/{ie_id}", headers=ah, label="int-error detail")
    test("patch", f"/api/internal-errors/errors/{ie_id}", headers=ah,
         json_data={"status": "OPEN"}, label="int-error update")
test("get", "/api/internal-errors/dashboard", headers=ah, label="int-err dashboard")
test("get", "/api/internal-errors/sensos", headers=ah, label="sensos")
test("get", "/api/internal-errors/my-learning-sheets", headers=sh, label="my int learn sheets")
for lk in ["activities", "banks", "categories", "departments", "error-types", "impacts"]:
    test("get", f"/api/internal-errors/lookups/{lk}", headers=ah, label=f"ie lookup {lk}")

# -- Teams --
test("get", "/api/teams", label="teams")
test("get", f"/api/teams/{tid}", label="team detail")
test("patch", f"/api/teams/{tid}", json_data={"name": "Team Updated"}, label="team update")
test("get", f"/api/teams/{tid}/members", label="team members")
test("get", f"/api/teams/{tid}/services", label="team services")
test("post", f"/api/teams/{tid}/members", json_data={"user_id": student_id}, label="add team member")
test("delete", f"/api/teams/{tid}/members/{student_id}", label="remove team member")

# Team services
test("post", f"/api/teams/{tid}/services", json_data={"product_id": prid}, label="add team service")
test("delete", f"/api/teams/{tid}/services/{prid}", label="remove team service")

# Create/delete team
r_nt = client.post("/api/teams", headers=ah, json={"name": "Scan Delete Team"})
if r_nt.status_code == 201:
    nt_id = r_nt.json()["id"]
    test("delete", f"/api/teams/{nt_id}", label="delete team")

# -- Chamados --
test("get", "/api/chamados", headers=sh, label="chamados")
r_ch = client.post("/api/chamados", headers=sh, json={
    "title": "Chamado Scan", "description": "test", "priority": "LOW"
})
ch_new_id = r_ch.json()["id"] if r_ch.status_code == 201 else chamado_id
if ch_new_id:
    test("get", f"/api/chamados/{ch_new_id}", headers=ah, label="chamado detail")
    test("put", f"/api/chamados/{ch_new_id}", headers=ah,
         json_data={"title": "Updated Chamado", "status": "OPEN"}, label="chamado update")
    test("post", f"/api/chamados/{ch_new_id}/comments", headers=ah,
         json_data={"content": "Scan comment"}, label="chamado comment")
    test("delete", f"/api/chamados/{ch_new_id}", headers=ah, label="chamado delete")

# -- Chat --
test("get", "/api/chat/faqs", label="chat faqs")
test("post", "/api/chat", headers=sh, json_data={"message": "Scan test"}, label="chat message")
r_faq = client.post("/api/chat/faqs", headers=ah, json={
    "question": "Scan FAQ?", "answer": "Scan answer", "category": "GERAL"
})
if r_faq.status_code == 201:
    faq_id = r_faq.json()["id"]
    test("patch", f"/api/chat/faqs/{faq_id}", json_data={"answer": "Updated"}, label="faq update")
    test("delete", f"/api/chat/faqs/{faq_id}", label="faq delete")

# -- Ratings --
test("get", "/api/ratings/my-ratings", headers=sh, label="my ratings")
test("get", "/api/ratings/check", headers=sh, label="ratings check")
test("get", "/api/ratings/check/course/1", headers=sh, label="ratings check course")
test("post", "/api/ratings/submit", headers=sh, json_data={
    "rating_type": "course", "item_id": cid, "score": 5, "comment": "Scan"
}, label="submit rating")
test("get", "/api/ratings/admin/all", label="ratings admin all")
test("get", "/api/ratings/admin/summary", label="ratings admin summary")
test("get", "/api/ratings/admin/dashboard", label="ratings admin dashboard")
test("get", f"/api/ratings/admin/item/course/{cid}", label="ratings admin item")

# -- Relatorios --
test("get", "/api/relatorios/overview", headers=ah, label="rel overview")
test("get", "/api/relatorios/formacoes", headers=ah, label="rel formacoes")
test("get", "/api/relatorios/teams", headers=ah, label="rel teams")
test("get", "/api/relatorios/members", headers=ah, label="rel members")
test("get", "/api/relatorios/incidents", headers=ah, label="rel incidents")
test("get", "/api/relatorios/incidents/filters", headers=ah, label="rel inc filters")
test("get", "/api/relatorios/tutoria", headers=ah, label="rel tutoria")
test("get", "/api/relatorios/tutoria/analytics", headers=ah, label="rel tut analytics")

# -- DW --
for ep in ["snapshot/latest", "snapshot/trend", "training/by-month", "training/by-course",
           "tutoria/by-category", "tutoria/by-month", "tutoria/by-trainer",
           "chamados/by-status", "chamados/by-month", "chamados/by-type",
           "internal-errors/by-month", "internal-errors/by-team", "teams/overview"]:
    test("get", f"/api/dw/{ep}", label=f"dw {ep}")
test("post", "/api/dw/etl/run", label="dw etl run")

# -- Feedback --
test("get", "/api/feedback/surveys", label="fb surveys")
test("get", "/api/feedback/dashboard", label="fb dashboard")
test("get", "/api/feedback/my-pending", headers=sh, label="fb my pending")
if fb_id:
    test("get", f"/api/feedback/surveys/{fb_id}", label="fb survey detail")

# -- Org Hierarchy --
test("get", "/api/org/tree", label="org tree")
test("get", "/api/org/nodes", label="org nodes")
test("get", "/api/org/staff", label="org staff")
test("get", "/api/org/audit", label="org audit")
test("get", "/api/org/visual-hierarchy", label="org visual")
test("get", "/api/org/available-users", label="org available users")
test("get", "/api/org/master-teams", label="org master teams")
if org_id:
    test("get", f"/api/org/nodes/{org_id}/members", label="org node members")
    test("put", f"/api/org/nodes/{org_id}", json_data={"name": "Updated Node"}, label="org node update")
test("put", "/api/org/staff", json_data={"director_id": None, "manager_id": None}, label="org staff update")

# -- Users --
test("get", "/api/users/unassigned", label="users unassigned")

# ======================================================================
# RESULTS
# ======================================================================
print(f"\nTested {tested_count} endpoint calls")
print("=" * 70)
if errors_500:
    print(f"FOUND {len(errors_500)} ERRORS (500/Exception):")
    for e in errors_500:
        print(f"  {e}")
else:
    print("NO 500 ERRORS FOUND!")
print("=" * 70)
