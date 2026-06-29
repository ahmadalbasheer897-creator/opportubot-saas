import hmac
import hashlib
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models.models import User, PlanType
from auth import get_current_user
from config import get_settings
from services.payment_service import create_checkout_url

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.post("/checkout")
async def create_checkout(
    current_user: User = Depends(get_current_user),
):
    """Create a Lemon Squeezy checkout session."""
    settings = get_settings()
    if not settings.LSQ_API_KEY:
        raise HTTPException(status_code=503, detail="Payment not configured")
    try:
        url = await create_checkout_url(current_user.email, current_user.id)
        return {"checkout_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout error: {str(e)}")


@router.post("/webhook")
async def lsq_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Lemon Squeezy webhook events."""
    body = await request.body()
    sig = request.headers.get("X-Signature", "")
    settings = get_settings()

    # Verify webhook signature if secret is configured
    if settings.LSQ_WEBHOOK_SECRET and sig:
        expected = hmac.new(
            settings.LSQ_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        event = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_name = event.get("meta", {}).get("event_name", "")
    custom_data = event.get("meta", {}).get("custom_data", {})
    user_id = custom_data.get("user_id")

    if user_id:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user:
            if event_name in ("subscription_created", "subscription_updated", "order_created"):
                user.plan = PlanType.pro
                db.commit()
            elif event_name in ("subscription_cancelled", "subscription_expired", "subscription_paused"):
                user.plan = PlanType.free
                db.commit()

    return {"ok": True}
