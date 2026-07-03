"""Site visit analytics — public tracking + admin stats."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from database import get_db
from models.models import SiteVisit, User
from auth import get_current_user, get_optional_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/visit")
async def record_visit(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    """Record a page visit. Called by frontend on load. No auth required."""
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else None)
    if ip:
        ip = ip.split(",")[0].strip()  # Take first IP if multiple

    user_agent = request.headers.get("user-agent", "")[:500]

    visit = SiteVisit(
        ip_address=ip,
        user_agent=user_agent,
        page=request.headers.get("referer", "/"),
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else None,
    )
    db.add(visit)
    db.commit()
    return {"recorded": True}


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return visitor stats. Owner only."""
    if current_user.plan.value != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")

    now = datetime.utcnow()
    day_ago   = now - timedelta(days=1)
    week_ago  = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total      = db.query(func.count(SiteVisit.id)).scalar() or 0
    today      = db.query(func.count(SiteVisit.id)).filter(SiteVisit.visited_at >= day_ago).scalar() or 0
    this_week  = db.query(func.count(SiteVisit.id)).filter(SiteVisit.visited_at >= week_ago).scalar() or 0
    this_month = db.query(func.count(SiteVisit.id)).filter(SiteVisit.visited_at >= month_ago).scalar() or 0

    # Unique IPs
    unique_total = db.query(func.count(func.distinct(SiteVisit.ip_address))).scalar() or 0
    unique_today = db.query(func.count(func.distinct(SiteVisit.ip_address))).filter(SiteVisit.visited_at >= day_ago).scalar() or 0

    # Logged-in vs anonymous
    logged_in  = db.query(func.count(SiteVisit.id)).filter(SiteVisit.user_id.isnot(None)).scalar() or 0
    anonymous  = total - logged_in

    # Recent 20 visits with details
    recent = (
        db.query(SiteVisit)
        .order_by(SiteVisit.visited_at.desc())
        .limit(20)
        .all()
    )

    # Daily breakdown for last 7 days
    daily_raw = db.execute(text("""
        SELECT DATE(visited_at AT TIME ZONE 'UTC') as day, COUNT(*) as cnt
        FROM site_visits
        WHERE visited_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day ASC
    """)).fetchall()

    # Top registered users by visit count
    top_users = db.execute(text("""
        SELECT user_email, COUNT(*) as visits
        FROM site_visits
        WHERE user_email IS NOT NULL
        GROUP BY user_email
        ORDER BY visits DESC
        LIMIT 10
    """)).fetchall()

    return {
        "total_visits":    total,
        "today_visits":    today,
        "week_visits":     this_week,
        "month_visits":    this_month,
        "unique_ips_total": unique_total,
        "unique_ips_today": unique_today,
        "logged_in_visits": logged_in,
        "anonymous_visits": anonymous,
        "recent": [
            {
                "id": v.id,
                "ip": v.ip_address,
                "user_email": v.user_email or "—",
                "page": v.page,
                "user_agent": (v.user_agent or "")[:80],
                "visited_at": v.visited_at.isoformat() if v.visited_at else None,
            }
            for v in recent
        ],
        "daily_chart": [
            {"day": str(row.day), "visits": row.cnt}
            for row in daily_raw
        ],
        "top_users": [
            {"email": row.user_email, "visits": row.visits}
            for row in top_users
        ],
    }
