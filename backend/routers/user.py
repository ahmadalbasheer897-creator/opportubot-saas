from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import User
from schemas.schemas import UserOut, UserUpdate
from auth import get_current_user, hash_password

router = APIRouter(prefix="/user", tags=["User"])


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
    limits = {
        "free": {"daily_searches": 5, "ai_summary": False, "saved_limit": 20},
        "pro": {"daily_searches": -1, "ai_summary": True, "saved_limit": -1},
        "gift": {"daily_searches": 50, "ai_summary": True, "saved_limit": 100},
        "owner": {"daily_searches": -1, "ai_summary": True, "saved_limit": -1},
    }
    plan_info = limits.get(current_user.plan, limits["free"])
    return {
        "plan": current_user.plan,
        "daily_searches_used": current_user.daily_searches,
        **plan_info,
    }
