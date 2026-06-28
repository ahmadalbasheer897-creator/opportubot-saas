from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.models import User, SavedOpportunity
from schemas.schemas import UserOut, UserUpdate
from auth import get_current_user, hash_password

router = APIRouter(prefix="/user", tags=["User"])

# ── /profile alias (frontend uses /profile not /user/me) ──────────────────────
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

# ── /pipeline stub ─────────────────────────────────────────────────────────────
pipeline_router = APIRouter(tags=["Pipeline"])

@pipeline_router.post("/pipeline/run")
def run_pipeline(current_user: User = Depends(get_current_user)):
    return {"message": "Pipeline started successfully", "status": "started"}

# ── /gifts stub ───