from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models.models import User, UserOpportunity, OpportunityType, PlanType
from schemas.schemas import UserOut, UserUpdate, ProfileUpdate
from auth import get_current_user, hash_password

router = APIRouter(prefix="/user", tags=["User"])

# ── /profile ──────────────────────────────────────────────────────────────────
profile_router = APIRouter(tags=["Profile"])

@profile_router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@profile_router.put("/profile", response_model=UserOut)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update extended profile fields."""
    if data.name is not None:
        current_user.name = data.name
    if data.experience_level is not None:
        current_user.experience_level = data.experience_level
    if data.preferred_countries is not None:
        current_user.preferred_countries = data.preferred_countries
    if data.preferred_types is not None:
        current_user.preferred_types = data.preferred_types
    if data.skills is not None:
        current_user.skills = data.skills
    if data.onboarding_done is not None:
        current_user.onboarding_done = data.onboarding_done
    if data.selected_sources is not None:
        current_user.selected_sources = data.selected_sources
    if data.custom_sources is not None:
        current_user.custom_sources = data.custom_sources
    db.commit()
    db.refresh(current_user)
    return current_user

@profile_router.post("/profile/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a CV (PDF or text), extract profile with Claude."""
    if file.content_type not in ("application/pdf", "text/plain"):
        raise HTTPException(status_code=400, detail="Only PDF or TXT files supported")

    content = await file.read()

    # Extract text
    cv_text = ""
    if file.content_type == "application/pdf":
        try:
            import io
            import pdfminer.high_level
            cv_text = pdfminer.high_level.extract_text(io.BytesIO(content))
        except Exception:
            # Fallback: decode as utf-8 ignoring errors
            cv_text = content.decode("utf-8", errors="ignore")
    else:
        cv_text = content.decode("utf-8", errors="ignore")

    if not cv_text or len(cv_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text from CV. Please use a text-based PDF.")

    # Extract profile with Claude
    from services.ai_service import extract_cv_profile
    profile = await extract_cv_profile(cv_text)

    # Save to user
    current_user.cv_text = cv_text[:10000]
    current_user.cv_filename = file.filename
    current_user.profile_summary = profile.get("summary", "")
    current_user.skills = profile.get("skills", "")
    db.commit()

    return {
        "message": "CV uploaded and analyzed successfully",
        "summary": profile.get("summary", ""),
        "skills": profile.get("skills", ""),
        "experience_years": profile.get("experience_years", 0),
        "target_roles": profile.get("target_roles", ""),
        "filename": file.filename,
    }

@profile_router.get("/plan")
def get_plan_top(current_user: User = Depends(get_current_user)):
    return _build_plan(current_user)

@profile_router.get("/sources")
def get_sources(current_user: User = Depends(get_current_user)):
    """Return all curated sources grouped by type."""
    from services.search_service import get_all_sources
    return get_all_sources()

# ── /pipeline ─────────────────────────────────────────────────────────────────
pipeline_router = APIRouter(tags=["Pipeline"])

@pipeline_router.post("/pipeline/run")
async def run_pipeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run personalized AI opportunity search and score results."""
    from services.search_service import search_opportunities
    from services.ai_service import score_opportunities_batch

    # Build personalized query from CV profile if available
    if current_user.skills:
        skills_short = ", ".join(current_user.skills.split(",")[:4])
        query = f"{skills_short} opportunities"
    else:
        query = "scholarships jobs internships opportunities"

    # Parse user's selected sources (curated + custom)
    selected_sources = []
    if current_user.selected_sources:
        selected_sources += [s.strip() for s in current_user.selected_sources.split(",") if s.strip()]
    if current_user.custom_sources:
        selected_sources += [s.strip() for s in current_user.custom_sources.split(",") if s.strip()]
    selected_sources = selected_sources if selected_sources else None

    # Detect preferred types to run targeted searches per type
    preferred_types = None
    if current_user.preferred_types:
        preferred_types = [t.strip() for t in current_user.preferred_types.split(",") if t.strip()]

    try:
        if preferred_types:
            # Run a separate search per preferred type and merge results
            all_results = []
            for ptype in preferred_types[:3]:  # limit to 3 types max
                r = await search_opportunities(
                    query=query, opp_type=ptype, limit=8,
                    selected_sources=selected_sources
                )
                all_results.extend(r)
            results = all_results[:20]
        else:
            results = await search_opportunities(
                query=query, limit=20, selected_sources=selected_sources
            )
    except Exception as e:
        return {"message": f"Search error: {str(e)}", "status": "error", "count": 0}

    saved = 0
    new_opps = []
    for r in results:
        r_url   = getattr(r, "url", None) or ""
        r_title = getattr(r, "title", None) or "Untitled"
        r_type  = getattr(r, "type", None) or "job"
        r_desc  = getattr(r, "description", None) or ""
        r_src   = getattr(r, "source", None) or ""
        r_ctry  = getattr(r, "country", None) or ""
        r_ddl   = getattr(r, "deadline", None) or ""
        r_tags  = getattr(r, "tags", None) or ""

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
        db.flush()  # get the id
        new_opps.append({"id": opp.id, "title": r_title, "type": r_type, "description": r_desc})
        saved += 1

    db.commit()

    # AI Scoring for new opportunities
    if new_opps:
        user_profile = None
        if current_user.profile_summary:
            user_profile = f"{current_user.profile_summary}\nSkills: {current_user.skills or ''}"

        scores = await score_opportunities_batch(new_opps, user_profile=user_profile)

        for s in scores:
            opp = db.query(UserOpportunity).filter(UserOpportunity.id == s["id"]).first()
            if opp:
                opp.score = s["score"]
                opp.ai_analysis = s["analysis"]
                if s["score"] >= 60:
                    opp.status = "analyzed"

        db.commit()

    current_user.daily_searches += 1
    db.commit()

    # Send email notification (non-blocking)
    if saved > 0 and current_user.email_verified:
        import asyncio
        from services.email_service import send_pipeline_results_email, send_high_score_alert_email

        # Check for high-score (≥80) opportunities from this run
        high_score_opps = [s for s in scores if s["score"] >= 80] if new_opps else []

        if high_score_opps:
            # Get full opp data for high-score ones
            high_opp_ids = {s["id"] for s in high_score_opps}
            high_opps_db = db.query(UserOpportunity).filter(
                UserOpportunity.id.in_(high_opp_ids)
            ).all()
            high_opps_data = [
                {"title": o.title, "score": o.score, "url": o.url or "#",
                 "type": o.type.value if hasattr(o.type, "value") else str(o.type),
                 "country": o.country or ""}
                for o in high_opps_db
            ]
            asyncio.create_task(
                send_high_score_alert_email(
                    current_user.email, current_user.name, high_opps_data
                )
            )
        else:
            # Regular pipeline results email (only top 5)
            top_opps = (
                db.query(UserOpportunity)
                .filter(UserOpportunity.user_id == current_user.id)
                .order_by(UserOpportunity.score.desc())
                .limit(5)
                .all()
            )
            opps_data = [
                {"title": o.title, "score": o.score, "url": o.url or "#"}
                for o in top_opps
            ]
            asyncio.create_task(
                send_pipeline_results_email(
                    current_user.email, current_user.name, opps_data, saved
                )
            )

    return {
        "message": f"Pipeline completed. Found {saved} new opportunities with AI scoring.",
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
