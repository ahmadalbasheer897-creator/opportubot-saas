from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.models import User, UserOpportunity, OpportunityType, PlanType
from schemas.schemas import UserOut, UserUpdate
from auth import get_current_user, hash_password

router = APIRouter(prefix="/user", tags=["User"])

# ── /profile alias ──────────────────────────────────────────────────────────────
profile_router = APIRouter(tags=["Profile"])

@profile_router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@profile_router.post("/profile/upload-cv")
async def upload_cv(current_user: User = Depends(get_current_user)):
    return {"message": "CV upload feature coming soon", "status": "ok"}

@profile_router.get("/plan")
def get_plan_top(current_user: User = Depends(get_current_user)):
    return _build_plan(current_user)

# ── /pipeline ────────────────────────────────────────────────────────────────────
pipeline_router = APIRouter(tags=["Pipeline"])

@pipeline_router.post("/pipeline/run")
async def run_pipeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run AI opportunity search and save results for the user."""
    from services.search_service import search_opportunities

    # Build query based on user profile (generic for now)
    query = "software engineer jobs scholarships internships 2024 2025"

    try:
        results = await search_opportunities(query=query, limit=20)
    except Exception as e:
        return {"message": f"Pipeline error: {str(e)}", "status": "error", "count": 0}

    saved = 0
    for r in results:
        # r is a SearchResult Pydantic model — use dot notation
        r_url = r.url if hasattr(r, 'url') else r.get("url") if isinstance(r, dict) else ""

        # Skip duplicates
        existing = db.query(UserOpportunity).filter(
            UserOpportunity.user_id == current_user.id,
            UserOpportunity.url == r_url,
        ).first()
        if existing:
            continue

        opp_type_str = (r.type if hasattr(r, 'type') else r.get("type", "job") if isinstance(r, dict) else "job") or "job"
        try:
            opp_type = OpportunityType(opp_type_str)
        except Exception:
            opp_type = OpportunityType.job

        opp = UserOpportunity(
            user_id=current_user.id,
            title=(r.title if hasattr(r, 'title') else r.get("title", "Untitled") if isinstance(r, dict) else "Untitled") or "Untitled",
            type=opp_type,
            description=r.description if hasattr(r, 'description') else (r.get("description", "") if isinstance(r, dict) else ""),
            url=r_url,
            source=r.source if hasattr(r, 'source') else (r.get("source", "") if isinstance(r, dict) else ""),
            country=r.country if hasattr(r, 'country') else (r.get("country", "") if isinstance(r, dict) else ""),
            deadline=r.deadline if hasattr(r, 'deadline') else (r.get("deadline", "") if isinstance(r, dict) else ""),
            score=50,
            status="new",
            tags=r.tags if hasattr(r, 'tags') else (r.get("tags", "") if isinstance(r, dict) else ""),
        )
        db.add(opp)
        saved += 1

    db.commit()

    # Increment search count
    current_user.daily_searches += 1
    db.commit()

    return {
        "message": f"Pipeline completed. Found {saved} new opportunities.",
        "status": "completed",
        "count": saved,
    }

# ── /gifts ────────────────────────────────────────────────────────────────────────
gifts_router = APIRouter(tags=["Gifts"])

@gifts_router.post("/gifts/redeem")
def redeem_gift(
    code: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not code.upper().startswith("OB-"):
        raise HTTPException(status_code=400, detail="Invalid gift code")
    current_user.plan = PlanType.gift
    db.commit()
    return {"message": "Gift code accepted! Plan upgraded to Pro.", "plan": "gift"}


def _build_plan(user: User):
    limits = {
        "free":  {"daily_searches": 5,  "ai_summary": False, "saved_limit": 20},
        "pro":   {"daily_searches": -1, "ai_summary": True,  "saved_limit": -1},
        "gift":  {"daily_searches": 50, "ai_summary": True,  "saved_limit": 100},
        "owner": {"daily_searches": -1, "ai_summary": True,  "saved_limit": -1},
    }
    plan_key = user.plan.value if hasattr(user.plan, "value") else str(user.plan)
    plan_info = limits.get(plan_key, limits["free"])
    return {
        "plan": plan_key,
        "daily_searches_used": user.daily_searches,
 