"""
Gestão de Equipas — CRUD + atribuição de membros
Roles: ADMIN gere tudo; MANAGER vê a sua equipa; outros não acedem.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import Annotated, Optional, List
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Team, Product, TeamMember, TeamService, Department

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_admin(user: User):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Apenas administradores podem gerir equipas")

def _require_admin_or_manager(user: User):
    if not user.can_manage_teams:
        raise HTTPException(status_code=403, detail="Acesso restrito")

# FastAPI dependency versions — declared as Depends so auth runs before body validation
def _admin_dep(current_user: User = Depends(get_current_user)) -> User:
    _require_admin(current_user)
    return current_user

def _manager_dep(current_user: User = Depends(get_current_user)) -> User:
    _require_admin_or_manager(current_user)
    return current_user

AdminUser = Annotated[User, Depends(_admin_dep)]
ManagerUser = Annotated[User, Depends(_manager_dep)]


# ── Schemas ───────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    product_id: Optional[int] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    product_id: Optional[int] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None

class ServiceBrief(BaseModel):
    id: int
    name: Optional[str] = None

class MemberBrief(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    team_role: Optional[str] = None

class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    product_id: Optional[int]
    product_name: Optional[str]
    department_id: Optional[int]
    department_name: Optional[str]
    manager_id: Optional[int]
    manager_name: Optional[str]
    members_count: int
    is_active: bool
    services: List[ServiceBrief] = []
    team_members: List[MemberBrief] = []

class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    team_id: Optional[int]
    team_name: Optional[str]


def _team_out(team: Team, db: Session) -> dict:
    members_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    services = [{
        "id": ts.product_id,
        "name": ts.product.name if ts.product else None,
    } for ts in (team.team_services or [])]
    tm_list = [{
        "id": tm.user.id,
        "full_name": tm.user.full_name,
        "email": tm.user.email,
        "role": tm.user.role,
        "team_role": tm.role,
    } for tm in (team.team_members or []) if tm.user]
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "product_id": team.product_id,
        "product_name": team.product.name if team.product else None,
        "department_id": team.department_id,
        "department_name": team.department.name if team.department else None,
        "manager_id": team.manager_id,
        "manager_name": team.manager.full_name if team.manager else None,
        "members_count": members_count,
        "is_active": team.is_active,
        "services": services,
        "team_members": tm_list,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/teams", response_model=List[TeamOut])
def list_teams(
    current_user: ManagerUser,
    db: Session = Depends(get_db),
):
    q = db.query(Team).options(
        joinedload(Team.team_services).joinedload(TeamService.product),
        joinedload(Team.team_members).joinedload(TeamMember.user),
        joinedload(Team.manager),
        joinedload(Team.product),
        joinedload(Team.department),
    )
    # MANAGER can view all teams (read-only), only ADMIN can modify
    teams = q.order_by(Team.name).all()
    return [_team_out(t, db) for t in teams]


@router.post("/teams", response_model=TeamOut, status_code=201)
def create_team(
    current_user: AdminUser,
    body: TeamCreate,
    db: Session = Depends(get_db),
):
    if body.manager_id:
        mgr = db.query(User).filter(User.id == body.manager_id).first()
        qualifies = mgr and (mgr.is_chefe_equipe or getattr(mgr, 'is_team_lead', False) or mgr.role in ('MANAGER', 'CHEFE_EQUIPE'))
        if not qualifies:
            raise HTTPException(status_code=400, detail="O chefe de equipa deve ter a flag 'Chefe de Equipa' activa")
    team = Team(**body.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return _team_out(team, db)


@router.get("/teams/{team_id}", response_model=TeamOut)
def get_team(
    team_id: int,
    current_user: ManagerUser,
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    return _team_out(team, db)


@router.patch("/teams/{team_id}", response_model=TeamOut)
def update_team(
    team_id: int,
    current_user: AdminUser,
    body: TeamUpdate,
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    if body.manager_id is not None:
        mgr = db.query(User).filter(User.id == body.manager_id).first()
        qualifies = mgr and (mgr.is_chefe_equipe or getattr(mgr, 'is_team_lead', False) or mgr.role in ('MANAGER', 'CHEFE_EQUIPE'))
        if not qualifies:
            raise HTTPException(status_code=400, detail="O chefe de equipa deve ter a flag 'Chefe de Equipa' activa")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(team, field, value)
    db.commit()
    db.refresh(team)
    return _team_out(team, db)


@router.get("/teams/{team_id}/members", response_model=List[UserBrief])
def list_members(
    team_id: int,
    current_user: ManagerUser,
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    tms = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    result = []
    for tm in tms:
        u = tm.user
        if u:
            result.append({
                "id": u.id, "full_name": u.full_name, "email": u.email,
                "role": u.role, "is_active": u.is_active,
                "team_id": team_id, "team_name": team.name,
            })
    return result


@router.post("/teams/{team_id}/members", status_code=200)
def assign_member(
    team_id: int,
    current_user: AdminUser,
    body: dict,
    db: Session = Depends(get_db),
):
    """Atribuir utilizador a equipa (M2M). Body: {"user_id": int}"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=422, detail="user_id obrigatório")
    member = db.query(User).filter(User.id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, TeamMember.user_id == user_id
    ).first()
    if existing:
        return {"ok": True, "message": "Utilizador já pertence a esta equipa"}
    db.add(TeamMember(team_id=team_id, user_id=user_id))
    db.commit()
    return {"ok": True}


@router.delete("/teams/{team_id}/members/{user_id}", status_code=200)
def remove_member(
    team_id: int,
    user_id: int,
    current_user: AdminUser,
    db: Session = Depends(get_db),
):
    tm = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, TeamMember.user_id == user_id
    ).first()
    if not tm:
        raise HTTPException(status_code=404, detail="Membro não encontrado nesta equipa")
    db.delete(tm)
    db.commit()
    return {"ok": True}


@router.delete("/teams/{team_id}", status_code=200)
def delete_team(
    team_id: int,
    current_user: AdminUser,
    db: Session = Depends(get_db),
):
    """Eliminar equipa e remover vínculos."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    # remove M2M members & services (cascade handles it, but be explicit)
    db.query(TeamMember).filter(TeamMember.team_id == team_id).delete()
    db.query(TeamService).filter(TeamService.team_id == team_id).delete()
    # remove legacy team_id
    db.query(User).filter(User.team_id == team_id).update({User.team_id: None})
    db.delete(team)
    db.commit()
    return {"ok": True}


@router.get("/users/unassigned", response_model=List[UserBrief])
def list_unassigned(
    current_user: ManagerUser,
    db: Session = Depends(get_db),
):
    """Utilizadores disponíveis para atribuição. ADMIN/GERENTE/CHEFE_EQUIPE."""
    users = (
        db.query(User)
        .filter(User.is_admin == False, User.is_active == True)
        .order_by(User.full_name)
        .all()
    )
    return [{"id": u.id, "full_name": u.full_name, "email": u.email,
             "role": u.role, "is_active": u.is_active, "team_id": None, "team_name": None}
            for u in users]


# ── Team Services (M2M: equipa ↔ serviço/produto) ────────────────────────────

@router.get("/teams/{team_id}/services")
def list_team_services(
    team_id: int,
    current_user: ManagerUser,
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    return [{
        "id": ts.product_id,
        "name": ts.product.name if ts.product else None,
    } for ts in team.team_services]


@router.post("/teams/{team_id}/services", status_code=200)
def add_team_service(
    team_id: int,
    current_user: AdminUser,
    body: dict,
    db: Session = Depends(get_db),
):
    """Vincular serviço/produto a equipa. Body: {"product_id": int}"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada")
    product_id = body.get("product_id")
    if not product_id:
        raise HTTPException(status_code=422, detail="product_id obrigatório")
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Serviço/produto não encontrado")
    existing = db.query(TeamService).filter(
        TeamService.team_id == team_id, TeamService.product_id == product_id
    ).first()
    if existing:
        return {"ok": True, "message": "Serviço já vinculado a esta equipa"}
    db.add(TeamService(team_id=team_id, product_id=product_id))
    db.commit()
    return {"ok": True}


@router.delete("/teams/{team_id}/services/{product_id}", status_code=200)
def remove_team_service(
    team_id: int,
    product_id: int,
    current_user: AdminUser,
    db: Session = Depends(get_db),
):
    ts = db.query(TeamService).filter(
        TeamService.team_id == team_id, TeamService.product_id == product_id
    ).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Serviço não vinculado a esta equipa")
    db.delete(ts)
    db.commit()
    return {"ok": True}
