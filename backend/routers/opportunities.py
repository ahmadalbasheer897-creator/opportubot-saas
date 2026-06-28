from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from models.models import User, UserOpportunity, SearchHistory, PlanType, OpportunityType
from schemas.schemas import SearchRequest, SearchResponse, OpportunityCreate
from auth import get_current_user
from services.search_service import search_opportunities
from services.ai_service import generate_search_summary
import json

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

FREE_DAILY_LIMIT = 5


@router.get("")
def list_opportunities(
    limit: int = Query(100, ge=1, le=500),
    min_score: int = Query(0, ge=0, le=100),
    opp_type: Optional[str] = Query(None, alias="type"),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List current user's tracked opportunities."""
    q = db.query(UserOpportunity).filter(UserOpportunity.user_id == current_user.id)
    if min_score > 0:
        q = q.filter(UserOpportunity.score >= min_score)
    if opp_type:
        q = q.filter(UserOpportunity.type == opp_type)
    if status:
        q = q.filter(UserOpportunity.status == status)
    items = q.order_by(UserOpportunity.score.desc()).limit(limit).all()
    opps = [
        {
            "id": o.id,
            "title": o.title,
            "type": o.type.value if hasattr(o.type, "value") else str(o.type),
            "description": o.description,
            "url": o.url,
            "source": o.source,
            "country": o.country,
            "deadline": o.deadline,
            "score": o.score,
            "status": o.status,
            "tags": o.tags,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in items
    ]
    return {"opportunities": opps, "total": len(opps)}


@router.patch("/{opp_id}/status")
def update_status(
    opp_id: int,
    status: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    opp = db.query(UserOpportunity).filter(
        UserOpportunity.id == opp_id,
        UserOpportunity.user_id == current_user.id,
    ).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    valid = {"new", "analyzed", "applied", "accepted", "rejected"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid}")
    opp.status = status
    db.commit()
    return {"id": opp_id, "status": status}


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base = db.query(UserOpportunity).filter(UserOpportunity.user_id == current_user.id)
    total    = base.count()
    ready    = base.filter(UserOpportunity.status == "analyzed").count()
    applied  = base.filter(UserOpportunity.status == "applied").count()
    accepted = base.filter(UserOpportunity.status == "accepted").count()
    rejected = base.filter(UserOpportunity.status == "rejected").count()
    return {
        "total": total,
        "ready": ready,
        "applied": applied,
        "accepted": accepted,
        "rejected": rejected,
        "deadline_soon": 0,
        "daily_searches": current_user.daily_searches,
        "plan": current_user.plan.value if hasattr(current_user.plan, "value") else str(current_user.plan),
    }


def _check_and_increment_search(user: User, db: Session):
    now = datetime.now(timezone.utc)
    last_reset = user.last_search_reset
    if last_reset and last_reset.date() < now.date():
        user.daily_searches = 0
        user.last_search_reset = now
    if user.plan == PlanType.free and user.daily_searches >= FREE_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Daily search limit reached ({FREE_DAILY_LIMIT}/day). Upgrade to Pro for unlimited searches."
        )
    user.daily_searches += 1
    db.commit()


@router.post("/search", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_and_increment_search(current_user, db)

    results = await search_opportunities(
        query=request.query,
        opp_type=request.type.value if request.type else None,
        country=request.country,
        limit=request.limit,
    )

    ai_summary = None
    if current_user.plan != PlanType.free:
        ai_summary = await generate_search_summary(request.query, results)

    log = SearchHistory(
        user_id=current_user.id,
        query=request.query,
        filters=json.dumps({"type": str(request.type) if request.type else None, "country": request.country}),
        results_count=len(results),
    )
    db.add(log)
    db.commit()

    return SearchResponse(
        results=results,
        total=len(results),
        query=request.query,
        ai_summary=ai_summary,
    )


@router.get("/history")
def search_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "query": r.query,
            "results_count": r.results_count,
            "searched_at": r.searched_at.isoformat() if r.searched_at else None,
        }
        for r in records
    ]
