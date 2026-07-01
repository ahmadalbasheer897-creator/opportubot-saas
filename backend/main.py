import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from sqlalchemy import text
from database import engine, Base
from config import get_settings
from routers import auth, user, opportunities, saved, admin, payment, digest
from routers.user import profile_router, pipeline_router, gifts_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[logging.StreamHandler()],
)

settings = get_settings()


def run_migrations():
    """Add missing columns to existing tables without dropping data."""
    migrations = [
        # users table
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS cv_text TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_summary TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS cv_filename VARCHAR(255)",
        # user_opportunities table
        "ALTER TABLE user_opportunities ADD COLUMN IF NOT EXISTS ai_analysis TEXT",
        "ALTER TABLE user_opportunities ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0",
        "ALTER TABLE user_opportunities ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new'",
        "ALTER TABLE user_opportunities ADD COLUMN IF NOT EXISTS tags TEXT",
        "ALTER TABLE user_opportunities ADD COLUMN IF NOT EXISTS country VARCHAR(100)",
        "ALTER TABLE user_opportunities ADD COLUMN IF NOT EXISTS deadline VARCHAR(100)",
        "ALTER TABLE user_opportunities ADD COLUMN IF NOT EXISTS source VARCHAR(255)",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"Migration skipped: {e}")
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    yield


app = FastAPI(
    title="OpportuBot API",
    description="AI-powered opportunity tracking platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://prismatic-kelpie-ece144.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(profile_router)
app.include_router(pipeline_router)
app.include_router(gifts_router)
app.include_router(opportunities.router)
app.include_router(saved.router)
app.include_router(admin.router)
app.include_router(payment.router)
app.include_router(digest.router)


@app.get("/")
def root():
    return {"status": "online", "app": "OpportuBot API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
