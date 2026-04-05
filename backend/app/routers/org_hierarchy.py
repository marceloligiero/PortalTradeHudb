"""
Hierarquia Organizacional — CRUD + gestão de membros + auditoria.
Prefixo: /api/org
"""
from __future__ import annotations

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import OrgNode, OrgNodeMember, OrgNodeAudit, User, Team, TeamMember
from app.auth import get_current_active_user, require_role, ADMIN_ROLES

router = APIRouter(prefix="/api/org", tags=["org-hierarchy"])

# ── Pydantic schemas ───────────────────────────────────────────────────────────

class OrgNodeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    position: int = 0
    team_id: Optional[int] = None

class OrgNodeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class OrgNodeMove(BaseModel):
    new_parent_id: Optional[int] = None  # None = move to root
    position: int = 0

class MemberAdd(BaseModel):
    user_id: int

# ── Helpers ────────────────────────────────────────────────────────────────────

def _node_to_dict(node: OrgNode, include_members: bool = False) -> dict:
    d = {
        "id": node.id,
        "name": node.name,
        "description": node.description,
        "parent_id": node.parent_id,
        "position": node.position,
        "is_active": node.is_active,
        "created_at": node.created_at.isoformat() if node.created_at else None,
        "members_count": len(node.members),
    }
    if include_members:
        d["members"] = [
            {
                "id": m.user_id,
                "full_name": m.user.full_name if m.user else None,
                "email": m.user.email if m.user else None,
                "role": m.user.role if m.user else None,
                "assigned_at": m.assigned_at.isoformat() if m.assigned_at else None,
            }
            for m in node.members
        ]
    return d


def _build_tree(nodes: list[OrgNode], parent_id: Optional[int] = None) -> list[dict]:
    """Recursively build a nested tree from a flat list."""
    result = []
    children = [n for n in nodes if n.parent_id == parent_id]
    children.sort(key=lambda n: (n.position, n.id))
    for child in children:
        d = _node_to_dict(child, include_members=True)
        d["children"] = _build_tree(nodes, child.id)
        result.append(d)
    return result


def _get_descendant_ids(db: Session, node_id: int) -> set[int]:
    """Return all descendant node IDs (to prevent cycles)."""
    result: set[int] = set()
    queue = [node_id]
    while queue:
        current = queue.pop()
        children = db.query(OrgNode.id).filter(OrgNode.parent_id == current).all()
        for (cid,) in children:
            if cid not in result:
                result.add(cid)
                queue.append(cid)
    return result


def _audit(db: Session, node: OrgNode, action: str,
           old_value: dict | None, new_value: dict | None,
           performed_by: int) -> None:
    db.add(OrgNodeAudit(
        node_id=node.id,
        node_name=node.name,
        action=action,
        old_value=old_value,
        new_value=new_value,
        performed_by=performed_by,
    ))


# ── Tree endpoint (todos os autenticados podem ver) ───────────────────────────

@router.get("/tree")
def get_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Devolve a hierarquia completa como árvore aninhada."""
    nodes = (
        db.query(OrgNode)
        .options(
            joinedload(OrgNode.members).joinedload(OrgNodeMember.user),
        )
        .filter(OrgNode.is_active == True)
        .all()
    )
    return _build_tree(nodes, parent_id=None)


@router.get("/nodes")
def list_nodes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lista plana de todos os nós activos (útil para dropdowns)."""
    nodes = db.query(OrgNode).filter(OrgNode.is_active == True)\
               .order_by(OrgNode.position, OrgNode.name).all()
    return [_node_to_dict(n) for n in nodes]


# ── Admin: criar / editar / eliminar ──────────────────────────────────────────

@router.post("/nodes", status_code=status.HTTP_201_CREATED)
def create_node(
    body: OrgNodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    if body.parent_id is not None:
        parent = db.query(OrgNode).filter(OrgNode.id == body.parent_id).first()
        if not parent:
            raise HTTPException(404, "Nó pai não encontrado")

    node = OrgNode(
        name=body.name,
        description=body.description,
        parent_id=body.parent_id,
        position=body.position,
        created_by=current_user.id,
    )
    db.add(node)
    db.flush()
    _audit(db, node, "CREATE", None, {"name": node.name, "parent_id": node.parent_id}, current_user.id)

    # Link to a Master Data team if provided
    if body.team_id is not None:
        team = db.query(Team).filter(Team.id == body.team_id).first()
        if team:
            team.node_id = node.id

    db.commit()
    db.refresh(node)
    return _node_to_dict(node)


@router.put("/nodes/{node_id}")
def update_node(
    node_id: int,
    body: OrgNodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    node = db.query(OrgNode).filter(OrgNode.id == node_id).first()
    if not node:
        raise HTTPException(404, "Nó não encontrado")

    old = {"name": node.name, "description": node.description}
    if body.name is not None:
        node.name = body.name
    if body.description is not None:
        node.description = body.description
    new = {"name": node.name, "description": node.description}

    _audit(db, node, "UPDATE", old, new, current_user.id)
    db.commit()
    db.refresh(node)
    return _node_to_dict(node)


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(
    node_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    node = db.query(OrgNode).filter(OrgNode.id == node_id).first()
    if not node:
        raise HTTPException(404, "Nó não encontrado")

    children_count = db.query(OrgNode).filter(OrgNode.parent_id == node_id).count()
    if children_count > 0:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Este nível tem {children_count} sub-nível(is). Elimine-os primeiro ou mova-os.",
        )

    from sqlalchemy.exc import IntegrityError as SAIntegrityError
    try:
        _audit(db, node, "DELETE", {"name": node.name, "parent_id": node.parent_id}, None, current_user.id)
        db.flush()  # persist audit record before deleting node
        db.delete(node)
        db.commit()
    except SAIntegrityError:
        db.rollback()
        # Retry without audit
        node = db.query(OrgNode).filter(OrgNode.id == node_id).first()
        if node:
            db.delete(node)
            db.commit()


@router.post("/nodes/{node_id}/move")
def move_node(
    node_id: int,
    body: OrgNodeMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    node = db.query(OrgNode).filter(OrgNode.id == node_id).first()
    if not node:
        raise HTTPException(404, "Nó não encontrado")

    # Anti-cycle: new_parent cannot be a descendant of this node
    if body.new_parent_id is not None:
        if body.new_parent_id == node_id:
            raise HTTPException(400, "Um nível não pode ser pai de si próprio")
        descendants = _get_descendant_ids(db, node_id)
        if body.new_parent_id in descendants:
            raise HTTPException(400, "Ciclo hierárquico detectado: o pai não pode ser um descendente")
        parent = db.query(OrgNode).filter(OrgNode.id == body.new_parent_id).first()
        if not parent:
            raise HTTPException(404, "Novo nó pai não encontrado")

    old = {"parent_id": node.parent_id, "position": node.position}
    node.parent_id = body.new_parent_id
    node.position = body.position
    new = {"parent_id": node.parent_id, "position": node.position}

    _audit(db, node, "MOVE", old, new, current_user.id)
    db.commit()
    db.refresh(node)
    return _node_to_dict(node)


# ── Membros ────────────────────────────────────────────────────────────────────

@router.get("/nodes/{node_id}/members")
def get_members(
    node_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    node = db.query(OrgNode).options(
        joinedload(OrgNode.members).joinedload(OrgNodeMember.user)
    ).filter(OrgNode.id == node_id).first()
    if not node:
        raise HTTPException(404, "Nó não encontrado")

    return [
        {
            "id": m.user_id,
            "full_name": m.user.full_name if m.user else None,
            "email": m.user.email if m.user else None,
            "role": m.user.role if m.user else None,
            "assigned_at": m.assigned_at.isoformat() if m.assigned_at else None,
        }
        for m in node.members
    ]


@router.post("/nodes/{node_id}/members", status_code=status.HTTP_201_CREATED)
def add_member(
    node_id: int,
    body: MemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    node = db.query(OrgNode).filter(OrgNode.id == node_id).first()
    if not node:
        raise HTTPException(404, "Nó não encontrado")

    user = db.query(User).filter(User.id == body.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(404, "Utilizador não encontrado")

    existing = db.query(OrgNodeMember).filter(
        OrgNodeMember.node_id == node_id,
        OrgNodeMember.user_id == body.user_id,
    ).first()
    if existing:
        raise HTTPException(409, "Utilizador já atribuído a este nível")

    member = OrgNodeMember(node_id=node_id, user_id=body.user_id, assigned_by=current_user.id)
    db.add(member)
    _audit(db, node, "ADD_MEMBER",
           None,
           {"user_id": body.user_id, "user_name": user.full_name},
           current_user.id)
    db.commit()
    return {"ok": True, "user_id": body.user_id, "user_name": user.full_name}


@router.delete("/nodes/{node_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    node_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    member = db.query(OrgNodeMember).filter(
        OrgNodeMember.node_id == node_id,
        OrgNodeMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(404, "Atribuição não encontrada")

    node = db.query(OrgNode).filter(OrgNode.id == node_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    _audit(db, node, "REMOVE_MEMBER",
           {"user_id": user_id, "user_name": user.full_name if user else None},
           None,
           current_user.id)
    db.delete(member)
    db.commit()


# ── Auditoria ──────────────────────────────────────────────────────────────────

@router.get("/audit")
def get_audit(
    node_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    q = db.query(OrgNodeAudit).options(
        joinedload(OrgNodeAudit.performer)
    )
    if node_id:
        q = q.filter(OrgNodeAudit.node_id == node_id)
    entries = q.order_by(OrgNodeAudit.performed_at.desc()).limit(limit).all()

    return [
        {
            "id": e.id,
            "node_id": e.node_id,
            "node_name": e.node_name,
            "action": e.action,
            "old_value": e.old_value,
            "new_value": e.new_value,
            "performed_by_name": e.performer.full_name if e.performer else None,
            "performed_at": e.performed_at.isoformat() if e.performed_at else None,
        }
        for e in entries
    ]


# ── Utilizadores disponíveis para atribuição ──────────────────────────────────

@router.get("/available-users")
def get_available_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lista todos os utilizadores activos (para o picker de membros)."""
    users = db.query(User).filter(User.is_active == True)\
               .order_by(User.full_name).all()
    return [
        {"id": u.id, "full_name": u.full_name, "email": u.email, "role": u.role}
        for u in users
    ]


# ── Equipas do Master Data ─────────────────────────────────────────────────────

@router.get("/master-teams")
def get_master_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Devolve todas as equipas activas do Master Data com o seu node_id (se ligadas ao organograma)."""
    teams = db.query(Team).filter(Team.is_active == True).order_by(Team.name).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "node_id": t.node_id,
            "manager_name": t.manager.full_name if t.manager else None,
        }
        for t in teams
    ]


@router.post("/nodes/{node_id}/link-team/{team_id}")
def link_team_to_node(
    node_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    """Liga uma equipa do Master Data a um nó do organograma."""
    node = db.query(OrgNode).filter(OrgNode.id == node_id).first()
    if not node:
        raise HTTPException(404, "Nó não encontrado")
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(404, "Equipa não encontrada")
    team.node_id = node_id
    _audit(db, node, "LINK_TEAM", None, {"team_id": team_id, "team_name": team.name}, current_user.id)
    db.commit()
    return {"ok": True, "node_id": node_id, "team_id": team_id, "team_name": team.name}


# ── Staff (Diretora / Gerente) ─────────────────────────────────────────────────

class StaffUpdate(BaseModel):
    director_id: Optional[int] = None
    manager_id: Optional[int] = None


@router.get("/staff")
def get_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Devolve quem é a Diretora e o Gerente actuais (membros do nó raiz com member_role)."""
    root = db.query(OrgNode).filter(OrgNode.parent_id == None, OrgNode.is_active == True).first()
    if not root:
        return {"director": None, "manager": None}

    members = (
        db.query(OrgNodeMember)
        .options(joinedload(OrgNodeMember.user))
        .filter(OrgNodeMember.node_id == root.id)
        .all()
    )

    def _person(m: OrgNodeMember):
        if not m or not m.user:
            return None
        return {"id": m.user.id, "full_name": m.user.full_name, "email": m.user.email, "role": m.user.role}

    director = next((m for m in members if m.member_role == "DIRECTOR"), None)
    manager  = next((m for m in members if m.member_role == "MANAGER"), None)

    return {"director": _person(director), "manager": _person(manager)}


@router.put("/staff")
def set_staff(
    body: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    """
    Define (ou substitui) a Diretora e/ou o Gerente.
    Substitui apenas os papéis enviados; os restantes mantêm-se.
    Cria automaticamente o nó raiz da organização se não existir.
    """
    root = db.query(OrgNode).filter(OrgNode.parent_id == None, OrgNode.is_active == True).first()
    if not root:
        # Auto-create root node so the staff assignment can proceed
        root = OrgNode(
            name="Organização",
            parent_id=None,
            position=0,
            created_by=current_user.id,
        )
        db.add(root)
        db.flush()
        _audit(db, root, "CREATE", None, {"name": root.name, "auto_created": True}, current_user.id)
        db.commit()
        db.refresh(root)

    def _assign(role_key: str, user_id: Optional[int]):
        if user_id is None:
            return

        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise HTTPException(404, f"Utilizador {user_id} não encontrado")

        # Remove existing entry for this role AND any other entry for this user on root node
        db.query(OrgNodeMember).filter(
            OrgNodeMember.node_id == root.id,
            (OrgNodeMember.member_role == role_key) | (OrgNodeMember.user_id == user_id),
        ).delete(synchronize_session=False)

        # Flush deletes to DB before inserting — prevents unique constraint violation
        db.flush()

        db.add(OrgNodeMember(
            node_id=root.id,
            user_id=user_id,
            assigned_by=current_user.id,
            member_role=role_key,
        ))
        _audit(db, root, "UPDATE",
               {"role": role_key},
               {"role": role_key, "user_id": user_id, "user_name": user.full_name},
               current_user.id)

    _assign("DIRECTOR", body.director_id)
    _assign("MANAGER", body.manager_id)
    db.commit()

    return {"ok": True}


# ── Visual Hierarchy (read-only, para o organograma) ──────────────────────────

@router.get("/visual-hierarchy")
def get_visual_hierarchy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Hierarquia visual completa para o organograma interativo (read-only).
    Estrutura: Diretora → Gerente → Departamentos → Setores → Equipas → Membros.
    Os dois primeiros níveis (Diretor e Gerente) são sempre mostrados,
    mesmo quando ninguém está atribuído.
    """
    # Load all active org_nodes with members
    nodes = (
        db.query(OrgNode)
        .options(
            joinedload(OrgNode.members).joinedload(OrgNodeMember.user),
        )
        .filter(OrgNode.is_active == True)
        .all()
    )

    node_map = {n.id: n for n in nodes}

    # Root node = the organisation
    root_nodes = [n for n in nodes if n.parent_id is None]
    if not root_nodes:
        # Os 2 primeiros níveis (Diretor e Gerente) são sempre fixos —
        # devolver estrutura vazia mas com os campos obrigatórios.
        return {"organization": "Organização", "director": None, "manager": None, "departments": [], "unlinked_teams": []}

    root = root_nodes[0]

    # Director = root member with member_role == 'DIRECTOR'
    def _person(m: OrgNodeMember | None) -> dict | None:
        if not m or not m.user:
            return None
        return {
            "id": m.user_id,
            "full_name": m.user.full_name,
            "email": m.user.email,
            "role": m.user.role,
        }

    director_member = next((m for m in root.members if m.member_role == "DIRECTOR"), None)
    manager_member  = next((m for m in root.members if m.member_role == "MANAGER"),  None)
    director = _person(director_member)
    org_manager = _person(manager_member)

    # Load all active teams with manager and members from Master Data
    teams = (
        db.query(Team)
        .options(
            joinedload(Team.manager),
            joinedload(Team.team_members).joinedload(TeamMember.user),
        )
        .filter(Team.is_active == True)
        .all()
    )

    # Group teams by their linked org_node
    teams_by_node: dict[int, list] = {}
    for t in teams:
        if t.node_id is not None:
            teams_by_node.setdefault(t.node_id, []).append(t)

    def _team_dict(t: Team) -> dict:
        chief = None
        if t.manager:
            chief = {"id": t.manager.id, "full_name": t.manager.full_name, "email": t.manager.email}
        members = [
            {"id": tm.user.id, "full_name": tm.user.full_name, "role": tm.user.role}
            for tm in t.team_members
            if tm.user and tm.user.is_active
        ]
        return {
            "id": t.id,
            "name": t.name,
            "chief": chief,
            "members": members,
            "members_count": len(members),
        }

    # Level 1 = departments (direct children of root)
    dept_nodes = sorted(
        [n for n in nodes if n.parent_id == root.id],
        key=lambda x: (x.position, x.id),
    )

    departments = []
    for dept in dept_nodes:
        managers = [
            {"id": m.user_id, "full_name": m.user.full_name if m.user else "—", "email": m.user.email if m.user else None}
            for m in dept.members
        ]

        # Level 2 = sectors/products (children of dept)
        sector_nodes = sorted(
            [n for n in nodes if n.parent_id == dept.id],
            key=lambda x: (x.position, x.id),
        )

        sectors = []
        for sector in sector_nodes:
            sectors.append({
                "id": sector.id,
                "name": sector.name,
                "teams": [_team_dict(t) for t in teams_by_node.get(sector.id, [])],
            })

        departments.append({
            "id": dept.id,
            "name": dept.name,
            "managers": managers,
            "sectors": sectors,
            "direct_teams": [_team_dict(t) for t in teams_by_node.get(dept.id, [])],
        })

    # Teams not yet linked to any node
    unlinked = [_team_dict(t) for t in teams if t.node_id is None]

    return {
        "organization": root.name,
        "director": director,
        "manager": org_manager,
        "departments": departments,
        "unlinked_teams": unlinked,
    }


@router.delete("/nodes/{node_id}/link-team/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_team_from_node(
    node_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(ADMIN_ROLES)),
):
    """Remove a ligação entre uma equipa e um nó do organograma."""
    team = db.query(Team).filter(Team.id == team_id, Team.node_id == node_id).first()
    if not team:
        raise HTTPException(404, "Ligação não encontrada")
    team.node_id = None
    db.commit()
