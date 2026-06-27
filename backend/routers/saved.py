from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.models import User, Opportunity, SavedOpportunity, PlanType
from schemas.schemas import SavedOpportunityOut, OpportunityCreate
from auth import get_current_user

router = APIRouter(prefix="/saved", tags=["Saved Opportunities"])

FREE_SAVE_LIMIT = 20
GIFT_SAVE_LIMIT = 100


@router.get("/", response_model=List[SavedOpportunityOut])
def list_saved(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SavedOpportunity)
        .filter(SavedOpportunity.user_id == current_user.id)
        .order_by(SavedOpportunity.saved_at.desc())
        .all()
    )


@router.post("/{opportunity_id}", status_code=201)
def save_opportunity(
    opportunity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check save limit
    count = db.query(SavedOpportunity).filter(SavedOpportunity.user_id == current_user.id).count()
    if current_user.plan == PlanType.free and count >= FREE_SAVE_LIMIT:
        raise HTTPException(status_code=429, detail="Save limit reached. Upgrade to Pro.")
    if current_user.plan == PlanType.gift and count >= GIFT_SAVE_LIMIT:
        raise HTTPException(status_code=429, detail="Save limit reached.")

    opp = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    existing = (
        db.query(SavedOpportunity)
        .filter(
            SavedOpportunity.user_id == current_user.id,
            SavedOpportunity.opportunity_id == opportunity_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already saved")

    saved = SavedOpportunity(user_id=current_user.id, opportunity_id=opportunity_id)
    db.add(saved)
    db.commit()
    return {"message": "Saved successfully"}


@router.delete("/{opportunity_id}")
def unsave_opportunity(
    opportunity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = (
        db.query(SavedOpportunity)
        .filter(
            SavedOpportunity.user_id == current_user.id,
            SavedOpportunity.opportunity_id == opportunity_id,
        )
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Not found in saved list")
    db.delete(saved)
    db.commit()
    return {"message": "Removed from saved"}
