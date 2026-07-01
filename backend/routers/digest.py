"""
Daily Digest router.
POST /digest/send?secret=<DIGEST_SECRET>
  → Sends top-5 opportunity digest emails to all active, verified users.

Trigger this endpoint daily via an external cron service (e.g. cron-job.org).
"""
import logging
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import get_db
from config import get_settings
from models.models import User, UserOpportunity
from services.email_service import send_daily_digest_email

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/digest", tags=["Digest"])


@router.post("/send")
async def send_digest(
    secret: str = Query(..., description="Must match DIGEST_SECRET env var"),
    db: Session = Depends(get_db),
):
    """
    Send daily digest emails to all active verified users.
    Secured by a shared secret (set DIGEST_SECRET in Render env vars).
    """
    if secret != settings.DIGEST_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")

    # All active, email-verified users
    users = db.query(User).filter(
        and_(User.is_active == True, User.email_verified == True)
    ).all()

    sent = 0
    skipped = 0
    errors = 0

    for user in users:
        try:
            # Top 5 opportunities by score, excluding rejected/archived
            top_opps = (
                db.query(UserOpportunity)
                .filter(
                    and_(
                        UserOpportunity.user_id == user.id,
                        UserOpportunity.status.notin_(["rejected", "archived"]),
                    )
                )
                .order_by(UserOpportunity.score.desc())
                .limit(5)
                .all()
            )

            if not top_opps:
                skipped += 1
                continue

            opp_dicts = [
                {
                    "title":    o.title,
                    "url":      o.url or "#",
                    "score":    o.score or 0,
                    "type":     o.type.value if hasattr(o.type, "value") else str(o.type),
                    "country":  o.country or "",
                    "deadline": o.deadline or "",
                }
                for o in top_opps
            ]

            ok = await send_daily_digest_email(
                to_email=user.email,
                name=user.name,
                opportunities=opp_dicts,
            )
            if ok:
                sent += 1
                logger.info("Digest sent to %s", user.email)
            else:
                errors += 1
                logger.warning("Digest failed for %s", user.email)

        except Exception as e:
            errors += 1
            logger.error("Digest error for user %s: %s", user.id, e)

    return {
        "status": "done",
        "users_found": len(users),
        "emails_sent": sent,
        "skipped_no_opps": skipped,
        "errors": errors,
    }


@router.post("/test")
async def test_digest(
    secret: str = Query(...),
    email: str = Query(..., description="Send a test digest to this email"),
    db: Session = Depends(get_db),
):
    """Send a test digest to a specific email (uses their real opportunities)."""
    if secret != settings.DIGEST_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    top_opps = (
        db.query(UserOpportunity)
        .filter(UserOpportunity.user_id == user.id)
        .order_by(UserOpportunity.score.desc())
        .limit(5)
        .all()
    )

    if not top_opps:
        return {"status": "skipped", "reason": "No opportunities found for this user"}

    opp_dicts = [
        {
            "title":    o.title,
            "url":      o.url or "#",
            "score":    o.score or 0,
            "type":     o.type.value if hasattr(o.type, "value") else str(o.type),
            "country":  o.country or "",
            "deadline": o.deadline or "",
        }
        for o in top_opps
    ]

    ok = await send_daily_digest_email(
        to_email=user.email,
        name=user.name,
        opportunities=opp_dicts,
    )

    return {"status": "sent" if ok else "failed", "to": email, "opportunities": len(opp_dicts)}
