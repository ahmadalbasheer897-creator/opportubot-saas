from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func, and_
from datetime import datetime, timedelta, timezone

from database import get_db
from models.models import User, Opportunity, SearchHistory, PlanType, UserOpportunity
from schemas.schemas import AdminUserOut, UpdateUserPlan, OpportunityCreate, OpportunityOut
from auth import get_owner_user

router = APIRouter(prefix="/admin", tags=["Admin"])

PRO_PRICE_IQD = 9990


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    now = datetime.now(timezone.utc)

    # ── Totals ────────────────────────────────────────────────
    total_users        = db.query(User).count()
    active_users       = db.query(User).filter(User.is_active == True).count()
    total_searches     = db.query(SearchHistory).count()
    total_opportunities = db.query(UserOpportunity).count()

    # ── Plan distribution ─────────────────────────────────────
    plan_dist_raw = (
        db.query(User.plan, func.count(User.id))
        .group_by(User.plan)
        .all()
    )
    plan_dist = {str(p): c for p, c in plan_dist_raw}
    free_users  = plan_dist.get("free",  0)
    pro_users   = plan_dist.get("pro",   0)
    gift_users  = plan_dist.get("gift",  0)
    owner_users = plan_dist.get("owner", 0)

    # ── Revenue estimate (Pro subscribers × price) ────────────
    revenue_iqd = pro_users * PRO_PRICE_IQD

    # ── Users registered per day — last 14 days ───────────────
    users_by_day = []
    for i in range(13, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = db.query(User).filter(
            and_(User.created_at >= day_start, User.created_at < day_end)
        ).count()
        users_by_day.append({"date": day_start.strftime("%m/%d"), "count": count})

    # ── Searches per day — last 7 days ───────────────────────
    searches_by_day = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = db.query(SearchHistory).filter(
            and_(SearchHistory.searched_at >= day_start, SearchHistory.searched_at < day_end)
        ).count()
        searches_by_day.append({"date": day_start.strftime("%m/%d"), "count": count})

    # ── Opportunities by type ─────────────────────────────────
    opps_by_type_raw = (
        db.query(UserOpportunity.type, func.count(UserOpportunity.id))
        .group_by(UserOpportunity.type)
        .all()
    )
    opps_by_type = {
        (t.value if hasattr(t, "value") else str(t)): c
        for t, c in opps_by_type_raw
    }

    return {
        # Totals
        "total_users":          total_users,
        "active_users":         active_users,
        "free_users":           free_users,
        "pro_users":            pro_users,
        "gift_users":           gift_users,
        "owner_users":          owner_users,
        "total_searches":       total_searches,
        "total_opportunities":  total_opportunities,
        "revenue_iqd":          revenue_iqd,
        # Time series
        "users_by_day":         users_by_day,
        "searches_by_day":      searches_by_day,
        # Distributions
        "plan_distribution":    plan_dist,
        "opps_by_type":         opps_by_type,
    }


@router.get("/users", response_model=List[AdminUserOut])
def list_users(
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    return db.query(User).offset(offset).limit(limit).all()


@router.patch("/users/{user_id}/plan")
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


@router.patch("/users/{user_id}/toggle")
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
