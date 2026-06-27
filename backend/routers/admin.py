from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func

from database import get_db
from models.models import User, Opportunity, SearchHistory, PlanType
from schemas.schemas import AdminUserOut, UpdateUserPlan, OpportunityCreate, OpportunityOut
from auth import get_owner_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    total_users = db.query(User).count()
    total_searches = db.query(SearchHistory).count()
    total_opportunities = db.query(Opportunity).count()
    plan_dist = (
        db.query(User.plan, func.count(User.id))
        .group_by(User.plan)
        .all()
    )
    return {
        "total_users": total_users,
        "total_searches": total_searches,
        "total_opportunities": total_opportunities,
        "plan_distribution": {p: c for p, c in plan_dist},
    }


@router.get("/users", response_model=List[AdminUserOut])
def list_users(
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    return db.query(User).offset(offset).limit(limit).all()


@router.put("/users/{user_id}/plan")
def update_user_plan(
    user_id: int,
    data: UpdateUserPlan,
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.plan = data.plan
    db.commit()
    return {"message": f"Plan updated to {data.plan}"}


@router.put("/users/{user_id}/toggle")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}


@router.post("/opportunities", response_model=OpportunityOut, status_code=201)
def create_opportunity(
    data: OpportunityCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    opp = Opportunity(**data.model_dump())
    db.add(opp)
    db.commit()
    db.refresh(opp)
    return opp


@router.delete("/opportunities/{opp_id}")
def delete_opportunity(
    opp_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    db.delete(opp)
    db.commit()
    return {"message": "Deleted"}
