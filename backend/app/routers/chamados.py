"""
Router do Portal de Chamados — gestão de tickets (bugs / melhorias) com Kanban.

Regras:
  • Todos os utilizadores autenticados podem CRIAR chamados e adicionar comentários.
  • Só ADMIN pode alterar status, atribuir responsável e editar notas de andamento.
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Chamado, ChamadoComment

router = APIRouter()

# ─── Pydantic schemas ──────────────────────────────────────────

class ChamadoCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    description: str = Field(..., min_length=5)
    # TODO: expand to SISTEMA|ACESSO|PROCEDIMENTO|EQUIPAMENTO|OUTRO when DB migration is ready
    type: str = Field("BUG", pattern=r"^(BUG|MELHORIA)$")
    priority: str = Field("MEDIA", pattern=r"^(BAIXA|MEDIA|ALTA|CRITICA)$")
    portal: str = Field("GERAL", pattern=r"^(FORMACOES|TUTORIA|RELATORIOS|DADOS_MESTRES|CHAMADOS|GERAL)$")
    attachments: Optional[List[str]] = None

class ChamadoUpdate(BaseModel):
    """Campos editáveis pelo ADMIN"""
    status: Optional[str] = Field(None, pattern=r"^(ABERTO|EM_ANDAMENTO|EM_REVISAO|CONCLUIDO)$")
    priority: Optional[str] = Field(None, pattern=r"^(BAIXA|MEDIA|ALTA|CRITICA)$")
    assigned_to_id: Optional[int] = None
    admin_notes: Optional[str] = None

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)

class CommentOut(BaseModel):
    id: int
    chamado_id: int
    author_id: int
    author_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChamadoOut(BaseModel):
    id: int
    title: str
    description: str
    type: str
    priority: str
    status: str
    portal: str
    created_by_id: int
    creator_name: str
    assigned_to_id: Optional[int] = None
    assignee_name: Optional[str] = None
    admin_notes: Optional[str] = None
    attachments: Optional[List[str]] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    comments: List[CommentOut] = []

    class Config:
        from_attributes = True

# ─── Helpers ──────────────────────────────────────────────────

def _require_admin(user: User):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Apenas administradores podem realizar esta ação")

def _chamado_to_out(c: Chamado) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "type": c.type,
        "priority": c.priority,
        "status": c.status,
        "portal": c.portal,
        "created_by_id": c.created_by_id,
        "creator_name": c.creator.full_name if c.creator else "",
        "assigned_to_id": c.assigned_to_id,
        "assignee_name": c.assignee.full_name if c.assignee else None,
        "admin_notes": c.admin_notes,
        "attachments": c.attachments or [],
        "completed_at": c.completed_at,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "comments": [
            {
                "id": cm.id,
                "chamado_id": cm.chamado_id,
                "author_id": cm.author_id,
                "author_name": cm.author.full_name if cm.author else "",
                "content": cm.content,
                "created_at": cm.created_at,
            }
            for cm in (c.comments or [])
        ],
    }

# ─── Endpoints ──────────────────────────────────────────────────

@router.get("/chamados", response_model=List[ChamadoOut])
def list_chamados(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    portal: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todos os chamados (todos os users veem todos)."""
    q = db.query(Chamado).options(
        joinedload(Chamado.creator),
        joinedload(Chamado.assignee),
        joinedload(Chamado.comments).joinedload(ChamadoComment.author),
    )
    if status:
        q = q.filter(Chamado.status == status)
    if type:
        q = q.filter(Chamado.type == type)
    if portal:
        q = q.filter(Chamado.portal == portal)
    chamados = q.order_by(desc(Chamado.created_at)).all()
    return [_chamado_to_out(c) for c in chamados]


@router.get("/chamados/{chamado_id}", response_model=ChamadoOut)
def get_chamado(
    chamado_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detalhe de um chamado."""
    c = (
        db.query(Chamado)
        .options(
            joinedload(Chamado.creator),
            joinedload(Chamado.assignee),
            joinedload(Chamado.comments).joinedload(ChamadoComment.author),
        )
        .filter(Chamado.id == chamado_id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    return _chamado_to_out(c)


@router.post("/chamados", response_model=ChamadoOut, status_code=201)
def create_chamado(
    payload: ChamadoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Qualquer utilizador autenticado pode criar um chamado."""
    chamado = Chamado(
        title=payload.title,
        description=payload.description,
        type=payload.type,
        priority=payload.priority,
        portal=payload.portal,
        created_by_id=current_user.id,
        attachments=payload.attachments,
    )
    db.add(chamado)
    db.commit()
    db.refresh(chamado)
    # Reload with relationships
    c = (
        db.query(Chamado)
        .options(joinedload(Chamado.creator), joinedload(Chamado.assignee))
        .filter(Chamado.id == chamado.id)
        .first()
    )
    return _chamado_to_out(c)


@router.put("/chamados/{chamado_id}", response_model=ChamadoOut)
def update_chamado(
    chamado_id: int,
    payload: ChamadoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apenas ADMIN pode mover / atribuir / atualizar andamento."""
    _require_admin(current_user)
    c = db.query(Chamado).filter(Chamado.id == chamado_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    if payload.status is not None:
        c.status = payload.status
        if payload.status == "CONCLUIDO":
            c.completed_at = datetime.now(timezone.utc)
        elif c.completed_at and payload.status != "CONCLUIDO":
            c.completed_at = None
    if payload.priority is not None:
        c.priority = payload.priority
    if payload.assigned_to_id is not None:
        if payload.assigned_to_id == 0:
            c.assigned_to_id = None
        else:
            user = db.query(User).filter(User.id == payload.assigned_to_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="Utilizador não encontrado")
            c.assigned_to_id = payload.assigned_to_id
    if payload.admin_notes is not None:
        c.admin_notes = payload.admin_notes
    db.commit()
    # Reload
    c = (
        db.query(Chamado)
        .options(
            joinedload(Chamado.creator),
            joinedload(Chamado.assignee),
            joinedload(Chamado.comments).joinedload(ChamadoComment.author),
        )
        .filter(Chamado.id == chamado_id)
        .first()
    )
    return _chamado_to_out(c)


@router.delete("/chamados/{chamado_id}", status_code=204)
def delete_chamado(
    chamado_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apenas ADMIN pode eliminar chamados."""
    _require_admin(current_user)
    c = db.query(Chamado).filter(Chamado.id == chamado_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    db.delete(c)
    db.commit()


# ─── Comentários ────────────────────────────────────────────────

@router.post("/chamados/{chamado_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    chamado_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Qualquer utilizador pode comentar num chamado."""
    c = db.query(Chamado).filter(Chamado.id == chamado_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    comment = ChamadoComment(
        chamado_id=chamado_id,
        author_id=current_user.id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id,
        "chamado_id": comment.chamado_id,
        "author_id": comment.author_id,
        "author_name": current_user.full_name,
        "content": comment.content,
        "created_at": comment.created_at,
    }
