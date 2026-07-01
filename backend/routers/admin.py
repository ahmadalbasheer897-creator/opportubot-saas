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

    total_users         = db.query(User).count()
    active_users        = db.query(User).filter(User.is_active == True).count()
    total_searches      = db.query(SearchHistory).count()
    total_opportunities = db.query(UserOpportunity).count()

    plan_dist_raw = (
        db.query(User.plan, func.count(User.id))
        .group_by(User.plan)
        .all()
    )
    plan_dist   = {str(p): c for p, c in plan_dist_raw}
    free_users  = plan_dist.get("free",  0)
    pro_users   = plan_dist.get("pro",   0)
    gift_users  = plan_dist.get("gift",  0)
    owner_users = plan_dist.get("owner", 0)
    revenue_iqd = pro_users * PRO_PRICE_IQD

    users_by_day = []
    for i in range(13, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = db.query(User).filter(
            and_(User.created_at >= day_start, User.created_at < day_end)
        ).count()
        users_by_day.append({"date": day_start.strftime("%m/%d"), "count": count})

    searches_by_day = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = db.query(SearchHistory).filter(
            and_(SearchHistory.searched_at >= day_start, SearchHistory.searched_at < day_end)
        ).count()
        searches_by_day.append({"date": day_start.strftime("%m/%d"), "count": count})

    opp_type_raw = (
        db.query(UserOpportunity.type, func.count(UserOpportunity.id))
        .group_by(UserOpportunity.type)
        .all()
    )
    opp_by_type = [{"type": t or "unknown", "count": c} for t, c in opp_type_raw]

    return {
        "total_users":         total_users,
        "active_users":        active_users,
        "total_searches":      total_searches,
        "total_opportunities": total_opportunities,
        "free_users":          free_users,
        "pro_users":           pro_users,
        "gift_users":          gift_users,
        "owner_users":         owner_users,
        "revenue_iqd":         revenue_iqd,
        "users_by_day":        users_by_day,
        "searches_by_day":     searches_by_day,
        "opp_by_type":         opp_by_type,
    }


@router.get("/users", response_model=List[AdminUserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    return db.query(User).order_by(User.id.desc()).all()


@router.patch("/users/{user_id}/plan")
def update_user_plan(
    user_id: int,
    body: UpdateUserPlan,
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.plan = body.plan
    db.commit()
    return {"ok": True, "plan": body.plan}


@router.patch("/users/{user_id}/toggle")
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_owner_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"ok": True, "is_active": user.is_active}
