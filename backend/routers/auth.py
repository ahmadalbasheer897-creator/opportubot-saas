import secrets
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from auth import (
    create_access_token, create_refresh_token,
    hash_password, verify_password,
)
from config import get_settings
from database import get_db
from models.models import PlanType, RefreshToken, User
from schemas.schemas import Token, TokenRefresh, UserCreate

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()


# ── helpers ───────────────────────────────────────────────────────────────────

def _make_token(hours: int = 24) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=hours)
    return token, expires


def _issue_tokens(user: User, db: Session) -> dict:
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token_str = create_refresh_token({"sub": str(user.id)})

    expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(user_id=user.id, token=refresh_token_str, expires_at=expires)
    db.add(db_token)
    db.commit()

    return {
        "access_token": access_token,
        "token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
        "plan": user.plan.value if hasattr(user.plan, "value") else str(user.plan),
        "is_owner": user.plan.value == "owner" if hasattr(user.plan, "value") else str(user.plan) == "owner",
        "user": user,
    }


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=Token, status_code=201)
async def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    plan = PlanType.owner if data.email == settings.OWNER_EMAIL else PlanType.free

    # Owners skip email verification; free users need to verify
    v_token, v_expires = _make_token(hours=24)

    user = User(
        name=data.get_name(),
        email=data.email,
        password_hash=hash_password(data.password),
        plan=plan,
        email_verified=(plan == PlanType.owner),
        verification_token=None if plan == PlanType.owner else v_token,
        verification_token_expires=None if plan == PlanType.owner else v_expires,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send verification email in background (non-blocking)
    if plan != PlanType.owner:
        import asyncio
        from services.email_service import send_verification_email
        asyncio.create_task(
            send_verification_email(user.email, user.name, v_token)
        )

    return _issue_tokens(user, db)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body = await request.json()
        user_email = body.get("email") or body.get("username")
        user_password = body.get("password")
    else:
        form = await request.form()
        user_email = form.get("email") or form.get("username")
        user_password = form.get("password")

    if not user_email or not user_password:
        raise HTTPException(status_code=422, detail="Email and password are required")

    user = db.query(User).filter(User.email == user_email).first()
    if not user or not verify_password(user_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    return _issue_tokens(user, db)


# ── Email Verification ────────────────────────────────────────────────────────

@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    if user.verification_token_expires and \
       user.verification_token_expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification token has expired")

    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    # Send welcome email
    import asyncio
    from services.email_service import send_welcome_email
    asyncio.create_task(send_welcome_email(user.email, user.name))

    return {"message": "Email verified successfully! Welcome to OpportuBot."}


@router.post("/resend-verification")
async def resend_verification(
    request: Request,
    db: Session = Depends(get_db),
):
    body = await request.json()
    email = body.get("email", "")
    user = db.query(User).filter(User.email == email).first()

    # Always return 200 to prevent email enumeration
    if user and not user.email_verified:
        v_token, v_expires = _make_token(hours=24)
        user.verification_token = v_token
        user.verification_token_expires = v_expires
        db.commit()

        import asyncio
        from services.email_service import send_verification_email
        asyncio.create_task(send_verification_email(user.email, user.name, v_token))

    return {"message": "If that email exists, a verification link has been sent."}


# ── Password Reset ────────────────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    email = body.get("email", "")
    user = db.query(User).filter(User.email == email).first()

    if user:
        r_token, r_expires = _make_token(hours=1)
        user.reset_token = r_token
        user.reset_token_expires = r_expires
        db.commit()

        import asyncio
        from services.email_service import send_password_reset_email
        asyncio.create_task(send_password_reset_email(user.email, user.name, r_token))

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    token = body.get("token", "")
    new_password = body.get("password", "")

    if len(new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if user.reset_token_expires and \
       user.reset_token_expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.password_hash = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}


# ── Refresh / Logout ──────────────────────────────────────────────────────────

@router.post("/refresh", response_model=Token)
def refresh_token(data: TokenRefresh, db: Session = Depends(get_db)):
    err = HTTPException(status_code=401, detail="Invalid refresh token")
    try:
        payload = jwt.decode(data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise err
        user_id = payload.get("sub")
    except JWTError:
        raise err

    stored = db.query(RefreshToken).filter(RefreshToken.token == data.refresh_token).first()
    if not stored:
        raise err

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise err

    db.delete(stored)
    db.commit()
    return _issue_tokens(user, db)


@router.post("/logout")
def logout(data: TokenRefresh, db: Session = Depends(get_db)):
    stored = db.query(RefreshToken).filter(RefreshToken.token == data.refresh_token).first()
    if stored:
        db.delete(stored)
        db.commit()
    return {"message": "Logged out successfully"}
