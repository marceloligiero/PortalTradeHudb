"""
Gestão de Equipas — CRUD + atribuição de membros
Roles: ADMIN gere tudo; MANAGER vê a sua equipa; outros não acedem.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Team, Product

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_admin(user: User):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Apenas administradores podem gerir equipas")

def _require_admin_or_manager(user: User):
    if user.role not in ("ADMIN", "MANAGER"):
        raise HTTPException(status_code=403, detail="Acesso restrito")


# ── Schemas ───────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    product_id: Optional[int] = None
    manager_id: Optional[int] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    product_id: Optional[int] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None

class TeamOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    product_id: Optional[int]
    product_name: Optional[str]
    manager_id: Optional[int]
    manager_name: Optional[str]
    members_count: int
    is_active: bool

    class Config:
        from_attributes = True

class UserBrief(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    team_id: Optional[int]
    team_name: Optional[str]

    class Config:
        from_attributes = True


def _team_out(team: Team, db: Session) -> dict:
    members_count = db.query(User).filter(User.team_id == team.id).count()
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "product_id": team.product_id,
        "product_name": team.product.name if team.product else None,
        "manager_id": team.manager_id,
        "manager_name": team.manager.full_name if team.manager else None,
        "members_count": members_count,
        "is_active": team.is_active,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/teams", response_model=List[TeamOut])
def list_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_manager(current_user)
    q = db.query(Team)
    if current_user.role == "MANAGER":
        # MANAGER vê apenas a equipa que gere
        q = q.filter(Team.manager_id == current_user.id)
    teams = q.order_by(Team.name).all()
    return [_team_out(t, db) for t in teams]


@router.post("/teams", response_model=TeamOut, status_code=201)
def create_team(
    body: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    if body.manager_id:
        mgr = db.query(User).filter(User.id == body.manager_id).first()
        if not mgr or mgr.role != "MANAGER":
            raise HTTPException(status_code=400, detail="O manager deve ter o role MANAGER")
    team = Team(**body.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return _team_out(team, db)


@router.get("/teams/{team_id}", response_model=TeamOut)
def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_manager(current_user)
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    if current_user.role == "MANAGER" and team.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return _team_out(team, db)


@router.patch("/teams/{team_id}", response_model=TeamOut)
def update_team(
    team_id: int,
    body: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    if body.manager_id is not None:
        mgr = db.query(User).filter(User.id == body.manager_id).first()
        if not mgr or mgr.role != "MANAGER":
            raise HTTPException(status_code=400, detail="O manager deve ter o role MANAGER")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(team, field, value)
    db.commit()
    db.refresh(team)
    return _team_out(team, db)


@router.get("/teams/{team_id}/members", response_model=List[UserBrief])
def list_members(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_manager(current_user)
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    if current_user.role == "MANAGER" and team.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    members = db.query(User).filter(User.team_id == team_id).order_by(User.full_name).all()
    result = []
    for m in members:
        result.append({
            "id": m.id, "full_name": m.full_name, "email": m.email,
            "role": m.role, "is_active": m.is_active,
            "team_id": m.team_id, "team_name": team.name,
        })
    return result


@router.post("/teams/{team_id}/members", status_code=200)
def assign_member(
    team_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atribuir utilizador a equipa. Body: {"user_id": int}"""
    _require_admin(current_user)
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=422, detail="user_id obrigatório")
    member = db.query(User).filter(User.id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    if member.role == "ADMIN":
        raise HTTPException(status_code=400, detail="ADMIN não pode pertencer a uma equipa")
    member.team_id = team_id
    db.commit()
    return {"ok": True}


@router.delete("/teams/{team_id}/members/{user_id}", status_code=200)
def remove_member(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    member = db.query(User).filter(User.id == user_id, User.team_id == team_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado nesta equipa")
    member.team_id = None
    db.commit()
    return {"ok": True}


@router.get("/users/unassigned", response_model=List[UserBrief])
def list_unassigned(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Utilizadores sem equipa (para atribuição). ADMIN only."""
    _require_admin(current_user)
    users = (
        db.query(User)
        .filter(User.team_id == None, User.role != "ADMIN", User.is_active == True)
        .order_by(User.full_name)
        .all()
    )
    return [{"id": u.id, "full_name": u.full_name, "email": u.email,
             "role": u.role, "is_active": u.is_active, "team_id": None, "team_name": None}
            for u in users]
