from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class PlanType(str, enum.Enum):
    free = "free"
    pro = "pro"
    gift = "gift"
    owner = "owner"


class OpportunityType(str, enum.Enum):
    scholarship = "scholarship"
    job = "job"
    internship = "internship"
    volunteering = "volunteering"
    conference = "conference"
    training = "training"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    plan = Column(Enum(PlanType), default=PlanType.free, nullable=False)
    is_active = Column(Boolean, default=True)
    daily_searches = Column(Integer, default=0)
    last_search_reset = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Email verification
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)

    # Password reset
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    # CV & profile fields
    cv_text = Column(Text, nullable=True)
    profile_summary = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    cv_filename = Column(String(255), nullable=True)

    saved = relationship("SavedOpportunity", back_populates="user", cascade="all, delete")
    searches = relationship("SearchHistory", back_populates="user", cascade="all, delete")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete")


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    type = Column(Enum(OpportunityType), nullable=False)
    description = Column(Text)
    deadline = Column(String(100))
    url = Column(String(1000))
    source = Column(String(255))
    tags = Column(Text)
    country = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    saved_by = relationship("SavedOpportunity", back_populates="opportunity", cascade="all, delete")


class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved")
    opportunity = relationship("Opportunity", back_populates="saved_by")


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    query = Column(String(500), nullable=False)
    filters = Column(Text)
    results_count = Column(Integer, default=0)
    searched_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="searches")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")


class UserOpportunity(Base):
    """Per-user tracked opportunities with status and score."""
    __tablename__ = "user_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    type = Column(Enum(OpportunityType), nullable=False, default=OpportunityType.job)
    description = Column(Text)
    url = Column(String(1000))
    source = Column(String(255))
    country = Column(String(100))
    deadline = Column(String(100))
    score = Column(Integer, default=0)
    status = Column(String(50), default="new")
    tags = Column(Text)
    ai_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="user_opportunities")
