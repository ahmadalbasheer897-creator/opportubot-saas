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

    # ------ Totals ------------------------------------------------------------------------------------------------------------------------------------------------
    total_users        = db.query(User).count()
    active_users       = db.query(User).filter(User.is_active == True).count()
    total_searches     = db.query(SearchHistory).count()
    total_opportunities = db.query(UserOpportunity).count()

    # ------ Plan distribution ---------------------------------------------------------------------------------------------------------------
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

    # ------ Revenue estimate (Pro subscribers -- price) ------------------------------------
    revenue_iqd = pro_users * PRO_PRICE_IQD

    # ------ Users registered per day --- last 14 days ---------------------------------------------
    users_by_day = []
    for i in range(13, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = db.query(User).filter(
            and_(User.created_at >= day_start, User.created_at < day_end)
        ).count()
        users_by_day.append({"date": day_start.strftime("%m/%d"), "count": count})

    # ------ Searches per day --- last 7 days ---------------------------------------------------------------------
    searches_by_day = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = db.query(SearchHistory).filter(
            and_(SearchHistory.searched_at >= day_start, SearchHistory.searched_at < day_end)
        ).count()
        searches_by_day.append({"date": day_start.strftime("%m/%d"), "count": count})

    # ------ Opportunities by type --------------------------------------------------------------------------