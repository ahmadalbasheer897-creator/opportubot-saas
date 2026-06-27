from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from database import get_db
from models.models import User, RefreshToken, PlanType
from schemas.schemas import UserCreate, UserLogin, Token, TokenRefresh, UserOut
from auth import hash_password, verify_password, create_access_token, create_refresh_token
from config import get_settings
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()


@router.post("/register", response_model=Token, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    # Check duplicate email
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Assign plan
    plan = PlanType.owner if data.email == settings.OWNER_EMAIL else PlanType.free

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        plan=plan,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _issue_tokens(user, db)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    return _issue_tokens(user, db)


@router.post("/refresh", response_model=Token)
def refresh_token(data: TokenRefresh, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Invalid refresh token")
    try:
        payload = jwt.decode(data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise credentials_exception
        user_id = payload.get("sub")
    except JWTError:
        raise credentials_exception

    # Verify token exists in DB
    stored = db.query(RefreshToken).filter(RefreshToken.token == data.refresh_token).first()
    if not stored:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise credentials_exception

    # Rotate refresh token
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


def _issue_tokens(user: User, db: Session) -> dict:
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token_str = create_refresh_token({"sub": str(user.id)})

    # Store refresh token
    expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(user_id=user.id, token=refresh_token_str, expires_at=expires)
    db.add(db_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
        "user": user,
    }
