"""
SSO Microsoft (Entra ID / Azure AD) — autenticação OAuth2 PKCE-less via MSAL.

Fluxo:
  1. GET /api/auth/microsoft/login     → redireciona para login.microsoftonline.com
  2. Azure redireciona de volta para
     GET /api/auth/microsoft/callback  → troca code por token, emite JWT PTH
  3. Frontend recebe token em /auth/callback?token=...

O login local (email + password) NÃO é afectado.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.auth import create_access_token
from app.config import settings
from app.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/microsoft", tags=["sso"])

# ---------------------------------------------------------------------------
# Configuração (lida a partir de variáveis de ambiente)
# ---------------------------------------------------------------------------
_CLIENT_ID     = os.getenv("MICROSOFT_CLIENT_ID", "")
_TENANT_ID     = os.getenv("MICROSOFT_TENANT_ID", "common")
_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "")
_REDIRECT_URI  = os.getenv("MICROSOFT_REDIRECT_URI", "")

_AUTHORITY = f"https://login.microsoftonline.com/{_TENANT_ID}"
_SCOPES    = ["User.Read"]

# ---------------------------------------------------------------------------
# Cache em memória para o flow object (state → flow dict, expira em 10 min)
# Suficiente para instância única (Docker). Para multi-instância usar Redis.
# ---------------------------------------------------------------------------
_FLOW_CACHE: dict[str, tuple[dict, float]] = {}
_FLOW_TTL   = 600  # segundos


def _put_flow(state: str, flow: dict) -> None:
    _FLOW_CACHE[state] = (flow, time.monotonic() + _FLOW_TTL)


def _pop_flow(state: str) -> Optional[dict]:
    entry = _FLOW_CACHE.pop(state, None)
    if entry is None:
        return None
    flow, expires = entry
    if time.monotonic() > expires:
        return None
    return flow


def _get_msal_app():
    import msal
    return msal.ConfidentialClientApplication(
        _CLIENT_ID,
        authority=_AUTHORITY,
        client_credential=_CLIENT_SECRET,
    )


def _sso_configured() -> bool:
    return bool(_CLIENT_ID and _CLIENT_SECRET and _REDIRECT_URI)


def _msal_available() -> bool:
    try:
        import msal  # noqa: F401
        return True
    except ImportError:
        return False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/status")
def microsoft_sso_status():
    """Retorna se o SSO Microsoft está configurado. Público, sem autenticação."""
    return {"enabled": _sso_configured() and _msal_available()}


@router.get("/login")
def microsoft_login():
    """Inicia o fluxo OAuth2 — redireciona para Microsoft."""
    if not _sso_configured():
        raise HTTPException(
            status_code=503,
            detail="SSO Microsoft não configurado. Preencha as variáveis MICROSOFT_* no .env.",
        )
    if not _msal_available():
        raise HTTPException(
            status_code=503,
            detail="Pacote msal não instalado. Execute: pip install msal",
        )
    import msal
    flow = _get_msal_app().initiate_auth_code_flow(
        scopes=_SCOPES,
        redirect_uri=_REDIRECT_URI,
    )
    state = flow.get("state", "")
    _put_flow(state, flow)
    auth_uri = flow.get("auth_uri", "")
    if not auth_uri:
        raise HTTPException(status_code=500, detail="Não foi possível obter o URL de autenticação Microsoft.")
    return RedirectResponse(auth_uri)


@router.get("/callback")
async def microsoft_callback(request: Request, db: Session = Depends(get_db)):
    """Recebe o callback da Microsoft e emite um JWT PTH."""
    params = dict(request.query_params)

    # Recuperar o flow guardado em memória
    state = params.get("state", "")
    flow = _pop_flow(state)
    if flow is None:
        logger.warning("SSO callback: flow não encontrado para state=%s", state)
        frontend_url = settings.FRONTEND_URL
        return RedirectResponse(f"{frontend_url}/login?error=sso_state_invalid")

    # Verificar se há código de erro da Microsoft
    if "error" in params:
        logger.warning("SSO callback error: %s — %s", params.get("error"), params.get("error_description"))
        frontend_url = settings.FRONTEND_URL
        return RedirectResponse(f"{frontend_url}/login?error=sso_failed")

    # Trocar o authorization code por tokens
    result = _get_msal_app().acquire_token_by_auth_code_flow(
        auth_code_flow=flow,
        auth_response=params,
    )

    if "access_token" not in result:
        err = result.get("error_description") or result.get("error") or "SSO failed"
        logger.error("SSO token exchange failed: %s", err)
        frontend_url = settings.FRONTEND_URL
        return RedirectResponse(f"{frontend_url}/login?error=sso_failed")

    # Obter dados do utilizador via Microsoft Graph
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            graph_resp = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {result['access_token']}"},
            )
        graph_resp.raise_for_status()
        user_data = graph_resp.json()
    except Exception as exc:
        logger.error("Falha ao chamar Microsoft Graph: %s", exc)
        frontend_url = settings.FRONTEND_URL
        return RedirectResponse(f"{frontend_url}/login?error=sso_graph_error")

    email: str = user_data.get("mail") or user_data.get("userPrincipalName") or ""
    display_name: str = user_data.get("displayName") or email.split("@")[0]
    sso_id: str = user_data.get("id") or ""

    if not email:
        logger.error("SSO callback: email não obtido via Graph")
        frontend_url = settings.FRONTEND_URL
        return RedirectResponse(f"{frontend_url}/login?error=sso_no_email")

    # Lookup ou criação do utilizador
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            email=email,
            full_name=display_name,
            hashed_password=None,
            role="USUARIO",
            is_active=True,
            is_pending=False,
            sso_provider="microsoft",
            sso_id=sso_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("SSO: novo utilizador criado email=%s", email)
    else:
        # Actualizar provider/id caso ainda não estivesse preenchido
        changed = False
        if not user.sso_provider:
            user.sso_provider = "microsoft"
            changed = True
        if not user.sso_id and sso_id:
            user.sso_id = sso_id
            changed = True
        if changed:
            db.commit()
        logger.info("SSO: login utilizador existente email=%s", email)

    if not user.is_active:
        frontend_url = settings.FRONTEND_URL
        return RedirectResponse(f"{frontend_url}/login?error=sso_inactive")

    # Emitir JWT PTH (mesmo formato do login local)
    token = create_access_token({"sub": user.email})

    frontend_url = settings.FRONTEND_URL
    return RedirectResponse(f"{frontend_url}/auth/callback?token={token}")
