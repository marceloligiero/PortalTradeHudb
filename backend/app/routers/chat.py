"""
Chatbot local — motor de regras + SQL + FAQs personalizadas
Suporta pt-PT, es, en.
Sem dependências externas — tudo corre localmente.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, TutoriaError, TutoriaActionPlan, TutoriaActionItem,
    ErrorCategory, ChatFAQ,
)

# ── optional portal-of-formations models (may not exist) ──────────────────
try:
    from app.models import Course, Enrollment
    HAS_COURSES = True
except ImportError:
    HAS_COURSES = False

router = APIRouter()


# ════════════════════════════════════════════════════════════════════════════
# Pydantic models
# ════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str
    lang: str = "pt"   # pt | es | en


class ChatResponse(BaseModel):
    reply: str
    lang: str
    support_url: Optional[str] = None
    support_label: Optional[str] = None


# ── FAQ management schemas ─────────────────────────────────────────────────

class FAQCreate(BaseModel):
    keywords_pt: str
    keywords_es: Optional[str] = None
    keywords_en: Optional[str] = None
    answer_pt: str
    answer_es: Optional[str] = None
    answer_en: Optional[str] = None
    support_url: Optional[str] = None
    support_label: Optional[str] = None
    role_filter: Optional[str] = None
    priority: int = 0


class FAQUpdate(BaseModel):
    keywords_pt: Optional[str] = None
    keywords_es: Optional[str] = None
    keywords_en: Optional[str] = None
    answer_pt: Optional[str] = None
    answer_es: Optional[str] = None
    answer_en: Optional[str] = None
    support_url: Optional[str] = None
    support_label: Optional[str] = None
    role_filter: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class FAQOut(BaseModel):
    id: int
    keywords_pt: str
    keywords_es: Optional[str]
    keywords_en: Optional[str]
    answer_pt: str
    answer_es: Optional[str]
    answer_en: Optional[str]
    support_url: Optional[str]
    support_label: Optional[str]
    role_filter: Optional[str]
    priority: int
    is_active: bool

    class Config:
        from_attributes = True


# ════════════════════════════════════════════════════════════════════════════
# FAQ lookup (custom Q&A registered by admins)
# ════════════════════════════════════════════════════════════════════════════

def _norm(text: str) -> str:
    """Lowercase + strip accents for loose matching."""
    import unicodedata
    text = text.lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def _faq_match(message: str, user: User, lang: str, db: Session):
    """
    Check custom FAQs first (highest priority).
    Returns (reply, support_url, support_label) or None.
    """
    norm_msg = _norm(message)
    faqs = (
        db.query(ChatFAQ)
        .filter(ChatFAQ.is_active == True)
        .order_by(ChatFAQ.priority.asc())
        .all()
    )
    for faq in faqs:
        # Role filter check
        if faq.role_filter:
            allowed = [r.strip() for r in faq.role_filter.split(",")]
            if user.role not in allowed:
                continue

        # Keyword matching across all language columns
        kw_fields = [faq.keywords_pt or "", faq.keywords_es or "", faq.keywords_en or ""]
        matched = False
        for kw_block in kw_fields:
            for kw in kw_block.replace("\n", ",").split(","):
                kw = kw.strip()
                if kw and _norm(kw) in norm_msg:
                    matched = True
                    break
            if matched:
                break

        if not matched:
            continue

        # Pick answer for the current language
        if lang == "es" and faq.answer_es:
            answer = faq.answer_es
        elif lang == "en" and faq.answer_en:
            answer = faq.answer_en
        else:
            answer = faq.answer_pt

        return answer, faq.support_url, faq.support_label

    return None


# ════════════════════════════════════════════════════════════════════════════
# Intent keywords per language
# ════════════════════════════════════════════════════════════════════════════

INTENT_PATTERNS: dict[str, dict[str, list[str]]] = {
    "greeting": {
        "pt": ["ola", "oi", "bom dia", "boa tarde", "boa noite", "tudo bem", "como estas", "como vai"],
        "es": ["hola", "buenos dias", "buenas tardes", "buenas noches", "como estas", "que tal"],
        "en": ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "how are you"],
    },
    "help": {
        "pt": ["ajuda", "o que podes fazer", "o que sabes", "comandos", "o que perguntar"],
        "es": ["ayuda", "que puedes hacer", "que sabes", "comandos", "que preguntar"],
        "en": ["help", "what can you do", "what do you know", "commands", "what to ask"],
    },
    "my_errors": {
        "pt": ["meus erros", "meus erro", "erros que tenho", "ver erros", "listar erros", "os meus erros"],
        "es": ["mis errores", "mis fallos", "ver errores", "listar errores", "mis faltas"],
        "en": ["my errors", "my mistakes", "show errors", "list errors", "my faults"],
    },
    "my_plans": {
        "pt": ["meus planos", "planos de acao", "planos de accao", "ver planos", "listar planos", "os meus planos"],
        "es": ["mis planes", "planes de accion", "ver planes", "listar planes"],
        "en": ["my plans", "action plans", "show plans", "list plans"],
    },
    "critical_errors": {
        "pt": ["criticos", "critica", "alta prioridade", "graves", "urgentes", "erros criticos"],
        "es": ["criticos", "critica", "alta prioridad", "graves", "urgentes", "errores criticos"],
        "en": ["critical", "high priority", "severe", "urgent", "critical errors"],
    },
    "recurrent_errors": {
        "pt": ["reincidentes", "reincidencia", "repetidos", "repetem", "recorrentes"],
        "es": ["reincidentes", "reincidencia", "repetidos", "recurrentes"],
        "en": ["recurrent", "repeated", "recurring", "repeat errors"],
    },
    "pending_plans": {
        "pt": ["pendentes", "aguardando", "a aguardar", "nao aprovados", "por aprovar", "planos pendentes"],
        "es": ["pendientes", "esperando", "por aprobar", "no aprobados", "planes pendientes"],
        "en": ["pending", "waiting", "awaiting", "not approved", "pending plans"],
    },
    "approved_plans": {
        "pt": ["aprovados", "em execucao", "planos aprovados"],
        "es": ["aprobados", "en ejecucion", "planes aprobados"],
        "en": ["approved", "in progress", "approved plans"],
    },
    "completed_plans": {
        "pt": ["concluidos", "terminados", "finalizados", "planos concluidos"],
        "es": ["completados", "terminados", "finalizados", "planes completados"],
        "en": ["completed", "finished", "done", "completed plans"],
    },
    "my_students": {
        "pt": ["tutorados", "formandos", "meus alunos", "minha equipa", "meus estudantes"],
        "es": ["tutorados", "alumnos", "mis alumnos", "mi equipo", "mis estudiantes"],
        "en": ["students", "trainees", "my students", "my team", "my trainees"],
    },
    "stats": {
        "pt": ["estatisticas", "resumo", "dashboard", "visao geral", "sumario", "metricas", "numeros"],
        "es": ["estadisticas", "resumen", "dashboard", "vision general", "metricas", "numeros"],
        "en": ["stats", "statistics", "summary", "dashboard", "overview", "metrics", "numbers"],
    },
    "categories": {
        "pt": ["categorias", "tipos de erro", "categoria"],
        "es": ["categorias", "tipos de error", "categoria"],
        "en": ["categories", "error types", "category"],
    },
    "users": {
        "pt": ["utilizadores", "usuarios", "membros", "listar utilizadores"],
        "es": ["usuarios", "miembros", "listar usuarios"],
        "en": ["users", "members", "list users"],
    },
    "open_errors": {
        "pt": ["abertos", "em aberto", "erros abertos", "novos erros"],
        "es": ["abiertos", "errores abiertos", "nuevos errores"],
        "en": ["open", "open errors", "new errors"],
    },
    "my_courses": {
        "pt": ["cursos", "formacoes", "meus cursos", "as minhas formacoes"],
        "es": ["cursos", "formaciones", "mis cursos", "mis formaciones"],
        "en": ["courses", "trainings", "my courses", "my trainings"],
    },
}


# ════════════════════════════════════════════════════════════════════════════
# Intent detection
# ════════════════════════════════════════════════════════════════════════════

def detect_intent(msg: str) -> str:
    """Return the best-matching intent key, or 'unknown'."""
    norm = _norm(msg)
    best_intent = "unknown"
    best_score = 0
    for intent, langs in INTENT_PATTERNS.items():
        for patterns in langs.values():
            for p in patterns:
                if _norm(p) in norm:
                    score = len(p)   # longer match wins
                    if score > best_score:
                        best_score = score
                        best_intent = intent
    return best_intent


# ════════════════════════════════════════════════════════════════════════════
# Response templates per language
# ════════════════════════════════════════════════════════════════════════════

def _t(lang: str, pt: str, es: str, en: str) -> str:
    return {"pt": pt, "es": es, "en": en}.get(lang, pt)


def _role_label(role: str, lang: str) -> str:
    labels = {
        "ADMIN":   _t(lang, "Administrador", "Administrador", "Administrator"),
        "TRAINER": _t(lang, "Tutor",         "Tutor",         "Trainer"),
        "STUDENT": _t(lang, "Tutorado",      "Tutorado",      "Student"),
        "TRAINEE": _t(lang, "Tutorado",      "Tutorado",      "Trainee"),
    }
    return labels.get(role, role)


def _severity_label(s: str, lang: str) -> str:
    m = {
        "BAIXA":   _t(lang, "Baixa",   "Baja",   "Low"),
        "MEDIA":   _t(lang, "Média",   "Media",  "Medium"),
        "ALTA":    _t(lang, "Alta",    "Alta",   "High"),
        "CRITICA": _t(lang, "Crítica", "Crítica","Critical"),
    }
    return m.get(s, s)


def _status_label(s: str, lang: str) -> str:
    m = {
        "ABERTO":              _t(lang, "Aberto",            "Abierto",           "Open"),
        "EM_ANALISE":          _t(lang, "Em Análise",        "En Análisis",       "Under Analysis"),
        "PLANO_CRIADO":        _t(lang, "Plano Criado",      "Plan Creado",       "Plan Created"),
        "EM_EXECUCAO":         _t(lang, "Em Execução",       "En Ejecución",      "In Progress"),
        "CONCLUIDO":           _t(lang, "Concluído",         "Completado",        "Completed"),
        "VERIFICADO":          _t(lang, "Verificado",        "Verificado",        "Verified"),
        "RASCUNHO":            _t(lang, "Rascunho",          "Borrador",          "Draft"),
        "AGUARDANDO_APROVACAO":_t(lang, "Ag. Aprovação",     "Esp. Aprobación",   "Awaiting Approval"),
        "APROVADO":            _t(lang, "Aprovado",          "Aprobado",          "Approved"),
        "DEVOLVIDO":           _t(lang, "Devolvido",         "Devuelto",          "Returned"),
    }
    return m.get(s, s)


# ════════════════════════════════════════════════════════════════════════════
# Handlers
# ════════════════════════════════════════════════════════════════════════════

def h_greeting(user: User, lang: str, **_) -> str:
    name = user.full_name.split()[0]
    role = _role_label(user.role, lang)
    return _t(lang,
        f"Olá {name}! 👋 Sou o assistente do portal ({role}). Posso mostrar erros, planos, estatísticas e muito mais. Escreve **ajuda** para ver o que sei fazer.",
        f"¡Hola {name}! 👋 Soy el asistente del portal ({role}). Puedo mostrar errores, planes, estadísticas y más. Escribe **ayuda** para ver qué sé hacer.",
        f"Hello {name}! 👋 I'm the portal assistant ({role}). I can show errors, plans, stats and more. Type **help** to see what I can do.",
    )


def h_help(user: User, lang: str, **_) -> str:
    is_admin  = user.role == "ADMIN"
    is_mgr    = user.role in ("ADMIN", "TRAINER")
    is_student = user.role in ("STUDENT", "TRAINEE")

    lines_pt = [
        "**O que posso responder:**",
        "• `meus erros` — lista os teus erros",
        "• `meus planos` — lista os teus planos de ação",
        "• `erros críticos` — erros com gravidade crítica",
        "• `reincidentes` — erros reincidentes",
        "• `pendentes` — planos a aguardar ação",
        "• `concluídos` — planos concluídos",
        "• `estatísticas` — resumo geral",
    ]
    if is_mgr:
        lines_pt += ["• `tutorados` — lista os teus formandos"]
    if is_admin:
        lines_pt += ["• `utilizadores` — lista de utilizadores", "• `categorias` — categorias de erro"]
    if HAS_COURSES:
        lines_pt += ["• `cursos` — os teus cursos"]

    lines_es = [
        "**Lo que puedo responder:**",
        "• `mis errores` — lista tus errores",
        "• `mis planes` — lista tus planes de acción",
        "• `errores críticos` — errores de gravedad crítica",
        "• `reincidentes` — errores reincidentes",
        "• `pendientes` — planes esperando acción",
        "• `completados` — planes completados",
        "• `estadísticas` — resumen general",
    ]
    if is_mgr:
        lines_es += ["• `tutorados` — lista tus alumnos"]
    if is_admin:
        lines_es += ["• `usuarios` — lista de usuarios", "• `categorías` — categorías de error"]

    lines_en = [
        "**What I can answer:**",
        "• `my errors` — list your errors",
        "• `my plans` — list your action plans",
        "• `critical errors` — critical severity errors",
        "• `recurrent` — recurrent errors",
        "• `pending` — plans awaiting action",
        "• `completed` — completed plans",
        "• `stats` — overall summary",
    ]
    if is_mgr:
        lines_en += ["• `students` — list your trainees"]
    if is_admin:
        lines_en += ["• `users` — user list", "• `categories` — error categories"]

    return _t(lang, "\n".join(lines_pt), "\n".join(lines_es), "\n".join(lines_en))


def h_my_errors(user: User, lang: str, db: Session, **_) -> str:
    is_mgr = user.role in ("ADMIN", "TRAINER")
    q = db.query(TutoriaError).filter(TutoriaError.is_active == True)
    if not is_mgr:
        q = q.filter(TutoriaError.tutorado_id == user.id)
    elif user.role == "TRAINER":
        q = q.join(User, TutoriaError.tutorado_id == User.id).filter(User.tutor_id == user.id)
    errors = q.order_by(TutoriaError.created_at.desc()).limit(8).all()

    if not errors:
        return _t(lang, "Não tens erros registados. 🎉",
                        "No tienes errores registrados. 🎉",
                        "You have no registered errors. 🎉")

    title = _t(lang, f"📋 **{len(errors)} erros** (mais recentes):",
                     f"📋 **{len(errors)} errores** (más recientes):",
                     f"📋 **{len(errors)} errors** (most recent):")
    rows = []
    for e in errors:
        sev = _severity_label(e.severity, lang)
        st  = _status_label(e.status, lang)
        recur = " 🔁" if e.is_recurrent else ""
        rows.append(f"• #{e.id} {e.description[:50]}… — **{sev}** | {st}{recur}")
    return title + "\n" + "\n".join(rows)


def h_my_plans(user: User, lang: str, db: Session, **_) -> str:
    is_mgr = user.role in ("ADMIN", "TRAINER")
    q = db.query(TutoriaActionPlan)
    if not is_mgr:
        q = q.filter(TutoriaActionPlan.tutorado_id == user.id)
    elif user.role == "TRAINER":
        q = q.join(User, TutoriaActionPlan.tutorado_id == User.id).filter(User.tutor_id == user.id)
    plans = q.order_by(TutoriaActionPlan.created_at.desc()).limit(8).all()

    if not plans:
        return _t(lang, "Não tens planos de ação registados.",
                        "No tienes planes de acción registrados.",
                        "You have no action plans registered.")

    title = _t(lang, f"📑 **{len(plans)} planos** (mais recentes):",
                     f"📑 **{len(plans)} planes** (más recientes):",
                     f"📑 **{len(plans)} plans** (most recent):")
    rows = []
    for p in plans:
        st = _status_label(p.status, lang)
        what = (p.what or "—")[:50]
        rows.append(f"• #{p.id} {what}… — {st}")
    return title + "\n" + "\n".join(rows)


def h_critical_errors(user: User, lang: str, db: Session, **_) -> str:
    q = db.query(TutoriaError).filter(
        TutoriaError.severity == "CRITICA",
        TutoriaError.is_active == True,
    )
    if user.role == "TRAINER":
        q = q.join(User, TutoriaError.tutorado_id == User.id).filter(User.tutor_id == user.id)
    elif user.role in ("STUDENT", "TRAINEE"):
        q = q.filter(TutoriaError.tutorado_id == user.id)
    errors = q.order_by(TutoriaError.created_at.desc()).limit(10).all()

    if not errors:
        return _t(lang, "✅ Não há erros críticos ativos.",
                        "✅ No hay errores críticos activos.",
                        "✅ No active critical errors.")
    title = _t(lang, f"🔴 **{len(errors)} erro(s) crítico(s):**",
                     f"🔴 **{len(errors)} error(es) crítico(s):**",
                     f"🔴 **{len(errors)} critical error(s):**")
    rows = [f"• #{e.id} {e.description[:60]}… — {_status_label(e.status, lang)}" for e in errors]
    return title + "\n" + "\n".join(rows)


def h_recurrent_errors(user: User, lang: str, db: Session, **_) -> str:
    q = db.query(TutoriaError).filter(
        TutoriaError.is_recurrent == True,
        TutoriaError.is_active == True,
    )
    if user.role == "TRAINER":
        q = q.join(User, TutoriaError.tutorado_id == User.id).filter(User.tutor_id == user.id)
    elif user.role in ("STUDENT", "TRAINEE"):
        q = q.filter(TutoriaError.tutorado_id == user.id)
    errors = q.order_by(TutoriaError.recurrence_count.desc()).limit(10).all()

    if not errors:
        return _t(lang, "✅ Não há erros reincidentes.",
                        "✅ No hay errores reincidentes.",
                        "✅ No recurrent errors.")
    title = _t(lang, f"🔁 **{len(errors)} erro(s) reincidente(s):**",
                     f"🔁 **{len(errors)} error(es) reincidente(s):**",
                     f"🔁 **{len(errors)} recurrent error(s):**")
    rows = [f"• #{e.id} {e.description[:55]}… ({e.recurrence_count+1}×)" for e in errors]
    return title + "\n" + "\n".join(rows)


def _plans_by_status(user: User, lang: str, db: Session, statuses: list[str]) -> str:
    q = db.query(TutoriaActionPlan).filter(TutoriaActionPlan.status.in_(statuses))
    if user.role == "TRAINER":
        q = q.join(User, TutoriaActionPlan.tutorado_id == User.id).filter(User.tutor_id == user.id)
    elif user.role in ("STUDENT", "TRAINEE"):
        q = q.filter(TutoriaActionPlan.tutorado_id == user.id)
    return q.order_by(TutoriaActionPlan.created_at.desc()).limit(10).all()


def h_pending_plans(user: User, lang: str, db: Session, **_) -> str:
    plans = _plans_by_status(user, lang, db, ["RASCUNHO", "AGUARDANDO_APROVACAO", "DEVOLVIDO"])
    if not plans:
        return _t(lang, "✅ Não há planos pendentes.",
                        "✅ No hay planes pendientes.",
                        "✅ No pending plans.")
    title = _t(lang, f"⏳ **{len(plans)} plano(s) pendente(s):**",
                     f"⏳ **{len(plans)} plan(es) pendiente(s):**",
                     f"⏳ **{len(plans)} pending plan(s):**")
    rows = [f"• #{p.id} {(p.what or '—')[:50]}… — {_status_label(p.status, lang)}" for p in plans]
    return title + "\n" + "\n".join(rows)


def h_approved_plans(user: User, lang: str, db: Session, **_) -> str:
    plans = _plans_by_status(user, lang, db, ["APROVADO", "EM_EXECUCAO"])
    if not plans:
        return _t(lang, "Não há planos em execução.",
                        "No hay planes en ejecución.",
                        "No plans in progress.")
    title = _t(lang, f"🔵 **{len(plans)} plano(s) em execução:**",
                     f"🔵 **{len(plans)} plan(es) en ejecución:**",
                     f"🔵 **{len(plans)} plan(s) in progress:**")
    rows = [f"• #{p.id} {(p.what or '—')[:50]}… — {_status_label(p.status, lang)}" for p in plans]
    return title + "\n" + "\n".join(rows)


def h_completed_plans(user: User, lang: str, db: Session, **_) -> str:
    plans = _plans_by_status(user, lang, db, ["CONCLUIDO"])
    if not plans:
        return _t(lang, "Ainda não há planos concluídos.",
                        "Aún no hay planes completados.",
                        "No completed plans yet.")
    title = _t(lang, f"✅ **{len(plans)} plano(s) concluído(s):**",
                     f"✅ **{len(plans)} plan(es) completado(s):**",
                     f"✅ **{len(plans)} completed plan(s):**")
    rows = [f"• #{p.id} {(p.what or '—')[:50]}…" for p in plans]
    return title + "\n" + "\n".join(rows)


def h_my_students(user: User, lang: str, db: Session, **_) -> str:
    if user.role not in ("ADMIN", "TRAINER"):
        return _t(lang, "Não tens acesso a esta informação.",
                        "No tienes acceso a esta información.",
                        "You don't have access to this information.")
    q = db.query(User).filter(User.role.in_(["STUDENT", "TRAINEE"]), User.is_active == True)
    if user.role == "TRAINER":
        q = q.filter(User.tutor_id == user.id)
    students = q.order_by(User.full_name).all()

    if not students:
        return _t(lang, "Não tens tutorados atribuídos.",
                        "No tienes tutorados asignados.",
                        "You have no assigned students.")
    title = _t(lang, f"👥 **{len(students)} tutorado(s):**",
                     f"👥 **{len(students)} tutorado(s):**",
                     f"👥 **{len(students)} student(s):**")
    rows = [f"• {s.full_name} ({s.email})" for s in students[:15]]
    if len(students) > 15:
        rows.append(_t(lang, f"… e mais {len(students)-15}",
                             f"… y {len(students)-15} más",
                             f"… and {len(students)-15} more"))
    return title + "\n" + "\n".join(rows)


def h_stats(user: User, lang: str, db: Session, **_) -> str:
    is_mgr = user.role in ("ADMIN", "TRAINER")

    # errors
    eq = db.query(TutoriaError).filter(TutoriaError.is_active == True)
    if user.role == "TRAINER":
        eq = eq.join(User, TutoriaError.tutorado_id == User.id).filter(User.tutor_id == user.id)
    elif user.role in ("STUDENT", "TRAINEE"):
        eq = eq.filter(TutoriaError.tutorado_id == user.id)

    total_errors   = eq.count()
    open_errors    = eq.filter(TutoriaError.status == "ABERTO").count()
    recur_errors   = db.query(TutoriaError).filter(TutoriaError.is_recurrent == True, TutoriaError.is_active == True).count() if user.role == "ADMIN" else eq.filter(TutoriaError.is_recurrent == True).count()
    critical       = eq.filter(TutoriaError.severity == "CRITICA").count()

    # plans
    pq = db.query(TutoriaActionPlan)
    if user.role == "TRAINER":
        pq = pq.join(User, TutoriaActionPlan.tutorado_id == User.id).filter(User.tutor_id == user.id)
    elif user.role in ("STUDENT", "TRAINEE"):
        pq = pq.filter(TutoriaActionPlan.tutorado_id == user.id)

    total_plans    = pq.count()
    pending_plans  = pq.filter(TutoriaActionPlan.status.in_(["RASCUNHO", "AGUARDANDO_APROVACAO", "DEVOLVIDO"])).count()
    done_plans     = pq.filter(TutoriaActionPlan.status == "CONCLUIDO").count()

    lines_pt = [
        "📊 **Resumo geral:**",
        f"• Erros activos: **{total_errors}** ({open_errors} abertos, {critical} críticos)",
        f"• Reincidentes: **{recur_errors}**",
        f"• Planos: **{total_plans}** ({pending_plans} pendentes, {done_plans} concluídos)",
    ]
    lines_es = [
        "📊 **Resumen general:**",
        f"• Errores activos: **{total_errors}** ({open_errors} abiertos, {critical} críticos)",
        f"• Reincidentes: **{recur_errors}**",
        f"• Planes: **{total_plans}** ({pending_plans} pendientes, {done_plans} completados)",
    ]
    lines_en = [
        "📊 **Overall summary:**",
        f"• Active errors: **{total_errors}** ({open_errors} open, {critical} critical)",
        f"• Recurrent: **{recur_errors}**",
        f"• Plans: **{total_plans}** ({pending_plans} pending, {done_plans} completed)",
    ]

    if is_mgr:
        sq = db.query(User).filter(User.role.in_(["STUDENT", "TRAINEE"]), User.is_active == True)
        if user.role == "TRAINER":
            sq = sq.filter(User.tutor_id == user.id)
        nstudents = sq.count()
        lines_pt.append(f"• Tutorados: **{nstudents}**")
        lines_es.append(f"• Tutorados: **{nstudents}**")
        lines_en.append(f"• Students: **{nstudents}**")

    return _t(lang, "\n".join(lines_pt), "\n".join(lines_es), "\n".join(lines_en))


def h_categories(user: User, lang: str, db: Session, **_) -> str:
    cats = db.query(ErrorCategory).filter(ErrorCategory.is_active == True, ErrorCategory.parent_id == None).all()
    if not cats:
        return _t(lang, "Não há categorias definidas.",
                        "No hay categorías definidas.",
                        "No categories defined.")
    title = _t(lang, f"🏷️ **{len(cats)} categorias ativas:**",
                     f"🏷️ **{len(cats)} categorías activas:**",
                     f"🏷️ **{len(cats)} active categories:**")
    rows = [f"• {c.name}" + (f" — {c.description[:60]}" if c.description else "") for c in cats]
    return title + "\n" + "\n".join(rows)


def h_users(user: User, lang: str, db: Session, **_) -> str:
    if user.role != "ADMIN":
        return _t(lang, "Apenas administradores podem ver utilizadores.",
                        "Solo los administradores pueden ver usuarios.",
                        "Only administrators can view users.")
    total  = db.query(User).filter(User.is_active == True).count()
    admins = db.query(User).filter(User.role == "ADMIN", User.is_active == True).count()
    trainers = db.query(User).filter(User.role == "TRAINER", User.is_active == True).count()
    students = db.query(User).filter(User.role.in_(["STUDENT","TRAINEE"]), User.is_active == True).count()
    return _t(lang,
        f"👤 **Utilizadores ({total} total):**\n• Admins: {admins}\n• Tutores: {trainers}\n• Tutorados: {students}",
        f"👤 **Usuarios ({total} total):**\n• Admins: {admins}\n• Tutores: {trainers}\n• Tutorados: {students}",
        f"👤 **Users ({total} total):**\n• Admins: {admins}\n• Trainers: {trainers}\n• Students: {students}",
    )


def h_open_errors(user: User, lang: str, db: Session, **_) -> str:
    q = db.query(TutoriaError).filter(TutoriaError.status == "ABERTO", TutoriaError.is_active == True)
    if user.role == "TRAINER":
        q = q.join(User, TutoriaError.tutorado_id == User.id).filter(User.tutor_id == user.id)
    elif user.role in ("STUDENT", "TRAINEE"):
        q = q.filter(TutoriaError.tutorado_id == user.id)
    errors = q.order_by(TutoriaError.created_at.desc()).limit(8).all()

    if not errors:
        return _t(lang, "✅ Não há erros em aberto.",
                        "✅ No hay errores abiertos.",
                        "✅ No open errors.")
    title = _t(lang, f"🟡 **{len(errors)} erro(s) em aberto:**",
                     f"🟡 **{len(errors)} error(es) abierto(s):**",
                     f"🟡 **{len(errors)} open error(s):**")
    rows = [f"• #{e.id} {e.description[:60]}… — {_severity_label(e.severity, lang)}" for e in errors]
    return title + "\n" + "\n".join(rows)


def h_unknown(user: User, lang: str, **_) -> str:
    return _t(lang,
        "Não percebi a pergunta. Escreve **ajuda** para ver o que sei responder.",
        "No entendí la pregunta. Escribe **ayuda** para ver qué sé responder.",
        "I didn't understand the question. Type **help** to see what I can answer.",
    )


# ════════════════════════════════════════════════════════════════════════════
# Dispatch table
# ════════════════════════════════════════════════════════════════════════════

HANDLERS = {
    "greeting":       h_greeting,
    "help":           h_help,
    "my_errors":      h_my_errors,
    "my_plans":       h_my_plans,
    "critical_errors":h_critical_errors,
    "recurrent_errors":h_recurrent_errors,
    "pending_plans":  h_pending_plans,
    "approved_plans": h_approved_plans,
    "completed_plans":h_completed_plans,
    "my_students":    h_my_students,
    "stats":          h_stats,
    "categories":     h_categories,
    "users":          h_users,
    "open_errors":    h_open_errors,
    "unknown":        h_unknown,
}


# ════════════════════════════════════════════════════════════════════════════
# Endpoint
# ════════════════════════════════════════════════════════════════════════════

@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lang = req.lang if req.lang in ("pt", "es", "en") else "pt"

    # 1. Check custom FAQs first (admin-registered Q&A)
    faq_result = _faq_match(req.message, current_user, lang, db)
    if faq_result:
        reply, support_url, support_label = faq_result
        return ChatResponse(reply=reply, lang=lang, support_url=support_url, support_label=support_label)

    # 2. Rule-based intent engine
    intent  = detect_intent(req.message)
    handler = HANDLERS.get(intent, h_unknown)
    reply   = handler(user=current_user, lang=lang, db=db)
    return ChatResponse(reply=reply, lang=lang)


# ════════════════════════════════════════════════════════════════════════════
# FAQ CRUD — apenas ADMIN
# ════════════════════════════════════════════════════════════════════════════

def _require_admin(user: User):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Apenas administradores podem gerir FAQs")


@router.get("/chat/faqs", response_model=List[FAQOut])
def list_faqs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todas as FAQs (ADMIN vê todas, outros só as ativas e permitidas pelo role)."""
    q = db.query(ChatFAQ)
    if current_user.role != "ADMIN":
        q = q.filter(ChatFAQ.is_active == True)
    return q.order_by(ChatFAQ.priority.asc()).all()


@router.post("/chat/faqs", response_model=FAQOut, status_code=201)
def create_faq(
    body: FAQCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    faq = ChatFAQ(**body.model_dump(), created_by_id=current_user.id)
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


@router.patch("/chat/faqs/{faq_id}", response_model=FAQOut)
def update_faq(
    faq_id: int,
    body: FAQUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    faq = db.query(ChatFAQ).filter(ChatFAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ não encontrada")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(faq, field, value)
    db.commit()
    db.refresh(faq)
    return faq


@router.delete("/chat/faqs/{faq_id}", status_code=204)
def delete_faq(
    faq_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    faq = db.query(ChatFAQ).filter(ChatFAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ não encontrada")
    db.delete(faq)
    db.commit()
