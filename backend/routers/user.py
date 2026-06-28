from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.models import User, UserOpportunity, OpportunityType, PlanType
from schemas.schemas import UserOut, UserUpdate
from auth import get_current_user, hash_password

router = APIRouter(prefix="/user", tags=["User"])

# ── /profile alias ────────────────────────────────────────────────────────────
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

# ── /pipeline ─────────────────────────────────────────────────────────────────
pipeline_router = APIRouter(tags=["Pipeline"])

@pipeline_router.post("/pipeline/run")
async def run_pipeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run AI opportunity search and save results for the user."""
    from services.search_service import search_opportunities

    query = "software engineer jobs scholarships internships 2024 2025"

    try:
        results = await search_opportunities(query=query, limit=20)
    except Exception as e:
        return {"message": f"Pipeline error: {str(e)}", "status": "error", "count": 0}

    saved = 0
    for r in results:
        # r is a SearchResult Pydantic model — use attribute access
        r_url   = getattr(r, "url", None) or ""
        r_title = getattr(r, "title", None) or "Untitled"
        r_type  = getattr(r, "type", None) or "job"
        r_desc  = getattr(r, "description", None) or ""
        r_src   = getattr(r, "source", None) or ""
        r_ctry  = getattr(r, "country", None) or ""
        r_ddl   = getattr(r, "deadline", None) or ""
        r_tags  = getattr(r, "tags", None) or ""

        # Skip duplicates by URL
        if r_url and db.query(UserOpportunity).filter(
            UserOpportunity.user_id == current_user.id,
            UserOpportunity.url == r_url,
        ).first():
            continue

        try:
            opp_type = OpportunityType(r_type)
        except Exception:
            opp_type = OpportunityType.job

        opp = UserOpportunity(
            user_id=current_user.id,
            title=r_title,
            type=opp_type,
            description=r_desc,
            url=r_url,
            source=r_src,
            country=r_ctry,
            deadline=r_ddl,
            score=50,
            status="new",
            tags=r_tags,
        )
        db.add(opp)
        saved += 1

    db.commit()
    current_user.daily_searches += 1
    db.commit()

    return {
        "message": f"Pipeline completed. Found {saved} new opportunities.",
        "status": "completed",
        "count": saved,
    }

# ── /gifts ────────────────────────────────────────────────────────────────────
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
        **plan_info,
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.name:
        current_user.name = data.name
    if data.password:
        current_user.password_hash = hash_password(data.password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/plan")
def get_plan(current_user: User = Depends(get_current_user)):
    return _build_plan(current_user)
