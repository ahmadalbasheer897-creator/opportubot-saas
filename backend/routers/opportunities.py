from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from models.models import User, Opportunity, SearchHistory, PlanType
from schemas.schemas import SearchRequest, SearchResponse, OpportunityOut, OpportunityCreate
from auth import get_current_user
from services.search_service import search_opportunities
from services.ai_service import generate_search_summary
import json

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

FREE_DAILY_LIMIT = 5


def _check_and_increment_search(user: User, db: Session):
    """Check daily search limit and increment counter."""
    now = datetime.now(timezone.utc)

    # Reset daily count if it's a new day
    last_reset = user.last_search_reset
    if last_reset and last_reset.date() < now.date():
        user.daily_searches = 0
        user.last_search_reset = now

    if user.plan == PlanType.free and user.daily_searches >= FREE_DAILY_LIMIT:
        from fastapi import HTTPException
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

    # AI summary only for Pro/Gift/Owner
    ai_summary = None
    if current_user.plan != PlanType.free:
        ai_summary = await generate_search_summary(request.query, results)

    # Log search
    log = SearchHistory(
        user_id=current_user.id,
        query=request.query,
        filters=json.dumps({"type": request.type, "country": request.country}),
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
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": h.id,
            "query": h.query,
            "results_count": h.results_count,
            "searched_at": h.searched_at,
        }
        for h in history
    ]
