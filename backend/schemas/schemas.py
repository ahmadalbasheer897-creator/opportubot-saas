from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models.models import PlanType, OpportunityType


# ─── Auth ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None  # frontend sends full_name
    email: EmailStr
    password: str

    def get_name(self) -> str:
        return self.full_name or self.name or "User"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    plan: PlanType
    is_active: bool
    daily_searches: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token: str  # alias for frontend compatibility
    refresh_token: str
    token_type: str = "bearer"
    plan: str
    is_owner: bool
    user: UserOut


class TokenRefresh(BaseModel):
    refresh_token: str


# ─── Opportunities ──────────────────────────────────────────────────────────

class OpportunityCreate(BaseModel):
    title: str
    type: OpportunityType
    description: Optional[str] = None
    deadline: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    tags: Optional[str] = None
    country: Optional[str] = None


class OpportunityOut(BaseModel):
    id: int
    title: str
    type: OpportunityType
    description: Optional[str]
    deadline: Optional[str]
    url: Optional[str]
    source: Optional[str]
    tags: Optional[str]
    country: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SavedOpportunityOut(BaseModel):
    id: int
    opportunity: OpportunityOut
    saved_at: datetime

    class Config:
        from_attributes = True


# ─── Search ──────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    type: Optional[OpportunityType] = None
    country: Optional[str] = None
    limit: int = 10


class SearchResult(BaseModel):
    title: str
    type: str
    description: Optional[str]
    url: Optional[str]
    source: Optional[str]
    deadline: Optional[str]
    country: Optional[str]
    tags: Optional[str]


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    query: str
    ai_summary: Optional[str] = None


# ─── Admin ──────────────────────────────────────────────────--
class UpdateUserPlan(BaseModel):
    plan: PlanType


class AdminUserOut(UserOut):
    daily_searches: int
    last_search_reset: Optional[datetime]

    class Config:
        from_attributes = True
