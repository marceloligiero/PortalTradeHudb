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
import re
import math
import random
from datetime import datetime, timezone

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
    suggestions: Optional[List[str]] = None


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


def _tokenize(text: str) -> set:
    """Split normalized text into meaningful tokens (len >= 2)."""
    return {w for w in _norm(text).split() if len(w) >= 2}


def _faq_score(norm_msg: str, msg_tokens: set, kw_block: str) -> float:
    """
    Score a FAQ keyword block against the user message.
    Uses a combination of:
      - Exact substring match (highest score)
      - Token overlap ratio (fuzzy matching)
    Returns a float 0..1.
    """
    if not kw_block.strip():
        return 0.0

    best = 0.0
    for kw_line in kw_block.replace("\n", ",").split(","):
        kw = kw_line.strip()
        if not kw:
            continue
        norm_kw = _norm(kw)

        # Exact substring match -> high score
        if norm_kw in norm_msg:
            score = 0.85 + 0.15 * (len(norm_kw) / max(len(norm_msg), 1))
            best = max(best, score)
            continue

        # Token overlap (fuzzy)
        kw_tokens = _tokenize(kw)
        if not kw_tokens:
            continue
        overlap = len(msg_tokens & kw_tokens)
        if overlap > 0:
            # Jaccard-like score weighted toward keyword coverage
            coverage = overlap / len(kw_tokens)
            relevance = overlap / max(len(msg_tokens), 1)
            score = 0.4 * coverage + 0.3 * relevance
            best = max(best, score)

    return best


def _faq_match(message: str, user: User, lang: str, db: Session):
    """
    Smart FAQ matching with fuzzy scoring.
    Returns (reply, support_url, support_label) or None.
    """
    norm_msg = _norm(message)
    msg_tokens = _tokenize(message)
    faqs = (
        db.query(ChatFAQ)
        .filter(ChatFAQ.is_active == True)
        .order_by(ChatFAQ.priority.asc())
        .all()
    )

    scored: list[tuple[float, ChatFAQ]] = []
    for faq in faqs:
        # Role filter check
        if faq.role_filter:
            allowed = [r.strip() for r in faq.role_filter.split(",")]
            if user.role not in allowed:
                continue

        # Score across all language keyword columns
        kw_fields = [faq.keywords_pt or "", faq.keywords_es or "", faq.keywords_en or ""]
        best_score = max(_faq_score(norm_msg, msg_tokens, kw) for kw in kw_fields)

        if best_score >= 0.45:  # threshold for a match
            scored.append((best_score, faq))

    if not scored:
        return None

    # Pick the best match (highest score, then lowest priority number)
    scored.sort(key=lambda x: (-x[0], x[1].priority))
    _, best_faq = scored[0]

    # Pick answer for the current language
    if lang == "es" and best_faq.answer_es:
        answer = best_faq.answer_es
    elif lang == "en" and best_faq.answer_en:
        answer = best_faq.answer_en
    else:
        answer = best_faq.answer_pt

    return answer, best_faq.support_url, best_faq.support_label


def _faq_suggestions(message: str, user: User, lang: str, db: Session, top_n: int = 3) -> list[str]:
    """
    Return suggested FAQ keywords that partially match the user message.
    Used when no strong match is found.
    """
    norm_msg = _norm(message)
    msg_tokens = _tokenize(message)
    if len(msg_tokens) < 1:
        return []

    faqs = (
        db.query(ChatFAQ)
        .filter(ChatFAQ.is_active == True)
        .order_by(ChatFAQ.priority.asc())
        .all()
    )
    candidates: list[tuple[float, str]] = []
    for faq in faqs:
        if faq.role_filter:
            allowed = [r.strip() for r in faq.role_filter.split(",")]
            if user.role not in allowed:
                continue

        kw_field = {
            "es": faq.keywords_es,
            "en": faq.keywords_en,
        }.get(lang) or faq.keywords_pt or ""

        for kw_line in kw_field.replace("\n", ",").split(","):
            kw = kw_line.strip()
            if not kw:
                continue
            kw_tokens = _tokenize(kw)
            overlap = len(msg_tokens & kw_tokens)
            if overlap > 0:
                score = overlap / max(len(kw_tokens), 1)
                if score >= 0.2 and score < 0.45:  # partial match but not strong enough
                    candidates.append((score, kw))

    candidates.sort(key=lambda x: -x[0])
    seen = set()
    result = []
    for _, kw in candidates:
        if kw.lower() not in seen:
            seen.add(kw.lower())
            result.append(kw)
        if len(result) >= top_n:
            break
    return result


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
    "date_today": {
        "pt": ["que dia e hoje", "qual e a data", "data de hoje", "dia de hoje", "que data", "hoje e dia"],
        "es": ["que dia es hoy", "cual es la fecha", "fecha de hoy", "dia de hoy", "que fecha"],
        "en": ["what day is today", "what is the date", "today's date", "what date", "current date"],
    },
    "time_now": {
        "pt": ["que horas sao", "que horas", "hora atual", "horas agora", "sabe as horas", "diz-me as horas"],
        "es": ["que hora es", "hora actual", "que horas son", "dime la hora"],
        "en": ["what time is it", "current time", "what time", "tell me the time"],
    },
    "day_of_week": {
        "pt": ["que dia da semana", "dia da semana", "que dia e", "hoje e que dia"],
        "es": ["que dia de la semana", "dia de la semana"],
        "en": ["what day of the week", "day of the week"],
    },
    "joke": {
        "pt": ["conta uma piada", "piada", "conta-me uma piada", "diz uma piada", "faz-me rir"],
        "es": ["cuenta un chiste", "chiste", "dime un chiste", "hazme reir"],
        "en": ["tell me a joke", "joke", "make me laugh", "tell a joke"],
    },
    "coin_flip": {
        "pt": ["cara ou coroa", "lanca uma moeda", "moeda ao ar", "tira cara ou coroa"],
        "es": ["cara o cruz", "lanza una moneda", "moneda al aire"],
        "en": ["flip a coin", "heads or tails", "coin flip", "toss a coin"],
    },
    "dice_roll": {
        "pt": ["lanca um dado", "dado", "rola um dado", "tira um dado"],
        "es": ["lanza un dado", "tira un dado", "dado"],
        "en": ["roll a dice", "roll dice", "throw a dice"],
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

# ── Smalltalk patterns ─────────────────────────────────────────────────────
SMALLTALK: dict[str, dict[str, list[str]]] = {
    "thanks": {
        "pt": ["obrigado", "obrigada", "agradeco", "valeu", "thanks", "brigado"],
        "es": ["gracias", "agradezco", "thanks"],
        "en": ["thanks", "thank you", "appreciate", "cheers"],
    },
    "goodbye": {
        "pt": ["adeus", "tchau", "ate logo", "ate ja", "ate amanha", "bye"],
        "es": ["adios", "hasta luego", "chao", "nos vemos", "bye"],
        "en": ["bye", "goodbye", "see you", "later", "cya"],
    },
    "how_are_you": {
        "pt": ["como estas", "como vai", "tudo bem", "como te sentes", "tas bem"],
        "es": ["como estas", "que tal", "como te va", "como andas"],
        "en": ["how are you", "how's it going", "what's up", "how do you do"],
    },
    "who_are_you": {
        "pt": ["quem es tu", "quem es", "o que es", "es um bot", "es um robo", "es humano", "como te chamas"],
        "es": ["quien eres", "que eres", "eres un bot", "eres un robot", "como te llamas"],
        "en": ["who are you", "what are you", "are you a bot", "are you a robot", "what's your name"],
    },
    "compliment": {
        "pt": ["es fixe", "es bom", "es otimo", "gosto de ti", "es util", "bem feito", "excelente", "parabens", "genial", "fantastico"],
        "es": ["eres genial", "eres bueno", "me gustas", "eres util", "bien hecho", "excelente", "fantastico"],
        "en": ["you're great", "you're good", "nice", "well done", "excellent", "awesome", "fantastic", "useful"],
    },
}

SMALLTALK_REPLIES: dict[str, dict[str, str]] = {
    "thanks": {
        "pt": "De nada! 😊 Se precisares de mais alguma coisa, é só perguntar.",
        "es": "¡De nada! 😊 Si necesitas algo más, solo pregunta.",
        "en": "You're welcome! 😊 Let me know if you need anything else.",
    },
    "goodbye": {
        "pt": "Até logo! 👋 Bom trabalho!",
        "es": "¡Hasta luego! 👋 ¡Buen trabajo!",
        "en": "See you later! 👋 Good work!",
    },
    "how_are_you": {
        "pt": "Estou sempre operacional e pronto para ajudar! 🚀 Em que posso ser útil?",
        "es": "¡Siempre operativo y listo para ayudar! 🚀 ¿En qué puedo ayudarte?",
        "en": "Always operational and ready to help! 🚀 What can I do for you?",
    },
    "who_are_you": {
        "pt": "Sou o **Assistente TradeHub** 🤖, o teu assistente virtual integrado no portal. Posso consultar os teus dados, erros, planos, estatísticas, e responder a perguntas frequentes. Escreve **ajuda** para ver tudo o que sei fazer!",
        "es": "Soy el **Asistente TradeHub** 🤖, tu asistente virtual integrado en el portal. Puedo consultar tus datos, errores, planes, estadísticas y responder preguntas frecuentes. ¡Escribe **ayuda** para ver todo lo que sé hacer!",
        "en": "I'm the **TradeHub Assistant** 🤖, your integrated virtual assistant. I can look up your data, errors, plans, stats, and answer FAQs. Type **help** to see everything I can do!",
    },
    "compliment": {
        "pt": "Obrigado! 😊 Fico contente em poder ajudar. Continua a perguntar!",
        "es": "¡Gracias! 😊 Me alegra poder ayudar. ¡Sigue preguntando!",
        "en": "Thanks! 😊 Glad I can help. Keep asking!",
    },
}


def _detect_smalltalk(msg: str) -> Optional[str]:
    """Detect smalltalk intent, returns key or None."""
    norm = _norm(msg)
    for intent, langs in SMALLTALK.items():
        for patterns in langs.values():
            for p in patterns:
                if _norm(p) in norm:
                    return intent
    return None


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
    lines_pt += [
        "",
        "**🧮 Também sei:**",
        "• Fazer contas — ex: `2+2`, `100/4`, `25*3`",
        "• `que dia é hoje` — data atual",
        "• `que horas são` — hora atual",
        "• `piada` — contar uma piada",
        "• `cara ou coroa` — lançar uma moeda",
        "• `dado` — lançar um dado",
    ]

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
    lines_es += [
        "",
        "**🧮 También sé:**",
        "• Hacer cálculos — ej: `2+2`, `100/4`, `25*3`",
        "• `qué día es hoy` — fecha actual",
        "• `qué hora es` — hora actual",
        "• `chiste` — contar un chiste",
        "• `cara o cruz` — lanzar una moneda",
        "• `dado` — lanzar un dado",
    ]

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
    lines_en += [
        "",
        "**🧮 I also know how to:**",
        "• Do math — e.g. `2+2`, `100/4`, `25*3`",
        "• `what day is today` — current date",
        "• `what time is it` — current time",
        "• `joke` — tell a joke",
        "• `flip a coin` — heads or tails",
        "• `roll dice` — roll a dice",
    ]

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
    # This is the fallback — the endpoint may override this with suggestions
    return _t(lang,
        "Hmm, não encontrei informação específica sobre isso. 🤔\n\nPodes tentar:\n• Reformular a pergunta com outras palavras\n• Escrever **ajuda** para ver os comandos disponíveis\n• Perguntar algo como \"meus erros\", \"estatísticas\" ou \"planos\"",
        "Hmm, no encontré información específica sobre eso. 🤔\n\nPuedes intentar:\n• Reformular la pregunta con otras palabras\n• Escribir **ayuda** para ver los comandos disponibles\n• Preguntar algo como \"mis errores\", \"estadísticas\" o \"planes\"",
        "Hmm, I couldn't find specific info about that. 🤔\n\nYou can try:\n• Rephrasing your question\n• Typing **help** to see available commands\n• Asking something like \"my errors\", \"stats\" or \"plans\"",
    )


# ── Math evaluation (safe) ─────────────────────────────────────────────────

def _safe_math_eval(expr: str) -> Optional[float]:
    """
    Safely evaluate a math expression.
    Only allows numbers, basic operators, parentheses, and common math functions.
    """
    # Clean the expression
    expr = expr.replace(",", ".").replace("×", "*").replace("÷", "/").replace("^", "**")
    expr = expr.replace("x", "*")  # 2x3 -> 2*3

    # Only allow safe characters
    allowed = re.compile(r'^[\d\s\+\-\*/\.\(\)\%\*]+$')
    if not allowed.match(expr):
        return None

    # Prevent dangerous patterns
    if "__" in expr or "import" in expr:
        return None

    try:
        result = eval(expr, {"__builtins__": {}}, {"math": math})
        if isinstance(result, (int, float)):
            # Format nicely
            if isinstance(result, float) and result == int(result):
                return int(result)
            return round(result, 6)
    except Exception:
        return None
    return None


def _extract_math_expr(msg: str) -> Optional[str]:
    """Try to extract a math expression from user message."""
    # Direct math expression (e.g., "2+3", "10*5", "100/4")
    patterns = [
        r'(?:quanto\s+[eé]\s+)?([\d\s\+\-\*/\.\(\)\,\%\^×÷x]+)',
        r'(?:calcula\s+)?([\d\s\+\-\*/\.\(\)\,\%\^×÷x]+)',
        r'([\d]+[\s]*[\+\-\*/\^×÷x][\s]*[\d][\d\s\+\-\*/\.\(\)\,\%\^×÷x]*)',
    ]
    for pat in patterns:
        m = re.search(pat, msg.strip())
        if m:
            expr = m.group(1).strip()
            # Must have at least an operator and two numbers
            if re.search(r'\d', expr) and re.search(r'[\+\-\*/\%\^×÷]', expr):
                return expr
    return None


def h_date_today(user: User, lang: str, **_) -> str:
    now = datetime.now()
    day_names = {
        "pt": ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"],
        "es": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    }
    month_names = {
        "pt": ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
        "es": ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
        "en": ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    }
    day_name = day_names.get(lang, day_names["pt"])[now.weekday()]
    month_name = month_names.get(lang, month_names["pt"])[now.month]

    return _t(lang,
        f"📅 Hoje é **{day_name}**, **{now.day} de {month_name} de {now.year}**.",
        f"📅 Hoy es **{day_name}**, **{now.day} de {month_name} de {now.year}**.",
        f"📅 Today is **{day_name}**, **{month_name} {now.day}, {now.year}**.",
    )


def h_time_now(user: User, lang: str, **_) -> str:
    now = datetime.now()
    time_str = now.strftime("%H:%M:%S")
    return _t(lang,
        f"🕐 Agora são **{time_str}** (hora do servidor).",
        f"🕐 Ahora son las **{time_str}** (hora del servidor).",
        f"🕐 It's currently **{time_str}** (server time).",
    )


def h_day_of_week(user: User, lang: str, **_) -> str:
    now = datetime.now()
    day_names = {
        "pt": ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"],
        "es": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    }
    day_name = day_names.get(lang, day_names["pt"])[now.weekday()]
    return _t(lang,
        f"📆 Hoje é **{day_name}**.",
        f"📆 Hoy es **{day_name}**.",
        f"📆 Today is **{day_name}**.",
    )


JOKES = {
    "pt": [
        "Porque é que o programador usa óculos? Porque não consegue C#! 😄",
        "O que é um algoritmo? Um programador que dançou samba! 😂",
        "Quantos programadores são precisos para trocar uma lâmpada? Nenhum, isso é um problema de hardware! 💡",
        "Porque é que o Python vive sozinho? Porque não precisa de ponto e vírgula! 🐍",
        "Um bug não é um erro, é uma funcionalidade não documentada! 🐛",
        "O wi-fi caiu. Acho que foi um 404 emocional. 📶",
    ],
    "es": [
        "¿Por qué el programador usa gafas? ¡Porque no puede C#! 😄",
        "¿Cuántos programadores se necesitan para cambiar una bombilla? Ninguno, ¡eso es un problema de hardware! 💡",
        "Un bug no es un error, ¡es una funcionalidad no documentada! 🐛",
        "¿Qué le dijo un bit al otro? Nos vemos en el bus. 🚌",
    ],
    "en": [
        "Why do programmers wear glasses? Because they can't C#! 😄",
        "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡",
        "A bug is not an error, it's an undocumented feature! 🐛",
        "There are only 10 types of people in the world: those who understand binary and those who don't. 🔢",
        "Why did the developer go broke? Because he used up all his cache! 💰",
    ],
}


def h_joke(user: User, lang: str, **_) -> str:
    jokes = JOKES.get(lang, JOKES["pt"])
    joke = random.choice(jokes)
    return joke


def h_coin_flip(user: User, lang: str, **_) -> str:
    result = random.choice(["heads", "tails"])
    if result == "heads":
        return _t(lang,
            "🪙 Lançei a moeda… **Cara!**",
            "🪙 Lancé la moneda… **¡Cara!**",
            "🪙 Flipped the coin… **Heads!**",
        )
    else:
        return _t(lang,
            "🪙 Lançei a moeda… **Coroa!**",
            "🪙 Lancé la moneda… **¡Cruz!**",
            "🪙 Flipped the coin… **Tails!**",
        )


def h_dice_roll(user: User, lang: str, **_) -> str:
    result = random.randint(1, 6)
    dice_emoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]
    return _t(lang,
        f"🎲 Lancei o dado… **{result}** {dice_emoji[result-1]}",
        f"🎲 Lancé el dado… **{result}** {dice_emoji[result-1]}",
        f"🎲 Rolled the dice… **{result}** {dice_emoji[result-1]}",
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
    "date_today":     h_date_today,
    "time_now":       h_time_now,
    "day_of_week":    h_day_of_week,
    "joke":           h_joke,
    "coin_flip":      h_coin_flip,
    "dice_roll":      h_dice_roll,
    "unknown":        h_unknown,
}


# ════════════════════════════════════════════════════════════════════════════
# Endpoint
# ════════════════════════════════════════════════════════════════════════════

def _get_quick_suggestions(user: User, lang: str) -> list[str]:
    """Return contextual quick-action suggestions based on user role."""
    if lang == "es":
        base = ["mis errores", "estadísticas", "mis planes"]
        if user.role in ("ADMIN", "TRAINER"):
            base += ["tutorados", "errores críticos"]
        if user.role == "ADMIN":
            base += ["usuarios"]
        return base
    elif lang == "en":
        base = ["my errors", "stats", "my plans"]
        if user.role in ("ADMIN", "TRAINER"):
            base += ["students", "critical errors"]
        if user.role == "ADMIN":
            base += ["users"]
        return base
    else:  # pt
        base = ["meus erros", "estatísticas", "meus planos"]
        if user.role in ("ADMIN", "TRAINER"):
            base += ["tutorados", "erros críticos"]
        if user.role == "ADMIN":
            base += ["utilizadores"]
        return base


@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lang = req.lang if req.lang in ("pt", "es", "en") else "pt"

    # 0. Smalltalk detection (thanks, bye, how are you, etc.)
    smalltalk_intent = _detect_smalltalk(req.message)
    if smalltalk_intent:
        reply = SMALLTALK_REPLIES.get(smalltalk_intent, {}).get(lang, "")
        if reply:
            return ChatResponse(reply=reply, lang=lang)

    # 0.5 Math expression detection (e.g., "2+3", "quanto é 10*5")
    math_expr = _extract_math_expr(req.message)
    if math_expr:
        result = _safe_math_eval(math_expr)
        if result is not None:
            reply = _t(lang,
                f"🧮 **{math_expr.strip()}** = **{result}**",
                f"🧮 **{math_expr.strip()}** = **{result}**",
                f"🧮 **{math_expr.strip()}** = **{result}**",
            )
            return ChatResponse(reply=reply, lang=lang)

    # 1. Check custom FAQs first (admin-registered Q&A) — now with fuzzy matching
    faq_result = _faq_match(req.message, current_user, lang, db)
    if faq_result:
        reply, support_url, support_label = faq_result
        return ChatResponse(reply=reply, lang=lang, support_url=support_url, support_label=support_label)

    # 2. Rule-based intent engine
    intent  = detect_intent(req.message)
    handler = HANDLERS.get(intent, h_unknown)
    reply   = handler(user=current_user, lang=lang, db=db)

    # 3. If unknown, try to find near-match FAQ suggestions
    suggestions = None
    if intent == "unknown":
        faq_sugg = _faq_suggestions(req.message, current_user, lang, db)
        if faq_sugg:
            sugg_label = _t(lang,
                "\n\n💡 **Talvez quisesses perguntar sobre:**",
                "\n\n💡 **Quizás querías preguntar sobre:**",
                "\n\n💡 **Perhaps you meant to ask about:**",
            )
            reply += sugg_label + "\n" + "\n".join(f"• {s}" for s in faq_sugg)
            suggestions = faq_sugg
        else:
            suggestions = _get_quick_suggestions(current_user, lang)

    # For greetings, also include quick suggestions
    if intent == "greeting":
        suggestions = _get_quick_suggestions(current_user, lang)

    return ChatResponse(reply=reply, lang=lang, suggestions=suggestions)


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
