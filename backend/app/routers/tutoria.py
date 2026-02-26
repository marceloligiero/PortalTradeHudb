from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter()

class TutoriaErrorIn(BaseModel):
    title: str
    description: Optional[str] = None
    reported_by: Optional[int] = None

class TutoriaErrorOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    reported_by: Optional[int]
    status: str

    class Config:
        orm_mode = True

class ActionPlanIn(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[str] = None

class ActionPlanOut(BaseModel):
    id: int
    error_id: int
    title: str
    description: Optional[str]
    assigned_to: Optional[int]
    status: str

    class Config:
        orm_mode = True

@router.get("/errors", response_model=List[TutoriaErrorOut])
def list_errors(db: Session = Depends(get_db)):
    return db.query(models.TutoriaError).order_by(models.TutoriaError.created_at.desc()).all()

@router.post("/errors", response_model=TutoriaErrorOut)
def create_error(payload: TutoriaErrorIn, db: Session = Depends(get_db)):
    err = models.TutoriaError(title=payload.title, description=payload.description, reported_by=payload.reported_by)
    db.add(err)
    db.commit()
    db.refresh(err)
    return err

@router.get("/errors/{error_id}", response_model=TutoriaErrorOut)
def get_error(error_id: int, db: Session = Depends(get_db)):
    err = db.query(models.TutoriaError).filter(models.TutoriaError.id == error_id).first()
    if not err:
        raise HTTPException(status_code=404, detail="Error not found")
    return err

@router.post("/errors/{error_id}/action-plans", response_model=ActionPlanOut)
def create_action_plan(error_id: int, payload: ActionPlanIn, db: Session = Depends(get_db)):
    err = db.query(models.TutoriaError).filter(models.TutoriaError.id == error_id).first()
    if not err:
        raise HTTPException(status_code=404, detail="Error not found")
    ap = models.TutoriaActionPlan(error_id=error_id, title=payload.title, description=payload.description, assigned_to=payload.assigned_to)
    db.add(ap)
    db.commit()
    db.refresh(ap)
    return ap

@router.get("/errors/{error_id}/action-plans", response_model=List[ActionPlanOut])
def list_action_plans(error_id: int, db: Session = Depends(get_db)):
    aps = db.query(models.TutoriaActionPlan).filter(models.TutoriaActionPlan.error_id == error_id).order_by(models.TutoriaActionPlan.created_at.desc()).all()
    return aps
