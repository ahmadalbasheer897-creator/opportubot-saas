import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from sqlalchemy import text
from database import engine, Base
from config import get_settings
from routers import auth, user, opportunities, saved, admin, payment, digest, analytics
from routers.user import profile_router, pipeline_router, gifts_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[logging.StreamHandler()],
)

settings = get_settings()


def run_migrations():
    """Add missing columns to existing tables without dropping data."""
    is_sqlite = "sqlite" in str(engine.url)
    
    columns_to_add = [
        # users table
        ("users", "email_verified", "BOOLEAN DEFAULT FALSE"),
        ("users", "verification_token", "VARCHAR(255)"),
        ("users", "verification_token_expires", "TIMESTAMP" if is_sqlite else "TIMESTAMP WITH TIME ZONE"),
        ("users", "reset_token", "VARCHAR(255)"),
        ("users", "reset_token_expires", "TIMESTAMP" if is_sqlite else "TIMESTAMP WITH TIME ZONE"),
        ("users", "cv_text", "TEXT"),
        ("users", "profile_summary", "TEXT"),
        ("users", "skills", "TEXT"),
        ("users", "cv_filename", "VARCHAR(255)"),
        ("users", "experience_level", "VARCHAR(50)"),
        ("users", "nationality", "VARCHAR(100)"),
        ("users", "country_of_residence", "VARCHAR(100)"),
        ("users", "date_of_birth", "VARCHAR(20)"),
        ("users", "gender", "VARCHAR(20)"),
        ("users", "phone", "VARCHAR(50)"),
        ("users", "linkedin_url", "VARCHAR(500)"),
        ("users", "portfolio_url", "VARCHAR(500)"),
        ("users", "education_level", "VARCHAR(100)"),
        ("users", "field_of_study", "VARCHAR(200)"),
        ("users", "university", "VARCHAR(200)"),
        ("users", "gpa", "VARCHAR(20)"),
        ("users", "graduation_year", "VARCHAR(10)"),
        ("users", "current_occupation", "VARCHAR(200)"),
        ("users", "languages", "TEXT"),
        ("users", "career_goals", "TEXT"),
        ("users", "preferred_countries", "TEXT"),
        ("users", "preferred_types", "TEXT"),
        ("users", "onboarding_done", "BOOLEAN DEFAULT FALSE"),
        ("users", "selected_sources", "TEXT"),
        ("users", "custom_sources", "TEXT"),
        # user_opportunities table
        ("user_opportunities", "ai_analysis", "TEXT"),
        ("user_opportunities", "score", "INTEGER DEFAULT 0"),
        ("user_opportunities", "status", "VARCHAR(50) DEFAULT 'new'"),
        ("user_opportunities", "tags", "TEXT"),
        ("user_opportunities", "country", "VARCHAR(100)"),
        ("user_opportunities", "deadline", "VARCHAR(100)"),
        ("user_opportunities", "source", "VARCHAR(255)"),
        ("user_opportunities", "notes", "TEXT"),
    ]
    
    if is_sqlite:
        site_visits_sql = """
        CREATE TABLE IF NOT EXISTS site_visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address VARCHAR(100),
            user_agent VARCHAR(500),
            page VARCHAR(255) DEFAULT '/',
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            user_email VARCHAR(255),
            visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    else:
        site_visits_sql = """
        CREATE TABLE IF NOT EXISTS site_visits (
            id SERIAL PRIMARY KEY,
            ip_address VARCHAR(100),
            user_agent VARCHAR(500),
            page VARCHAR(255) DEFAULT '/',
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            user_email VARCHAR(255),
            visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        """

    with engine.connect() as conn:
        for table, col, df in columns_to_add:
            sql = f"ALTER TABLE {table} ADD COLUMN {col} {df}"
            try:
                conn.execute(text(sql))
                print(f"Added column {col} to table {table}")
            except Exception as e:
                err_msg = str(e).lower()
                if "duplicate column name" in err_msg or "already exists" in err_msg:
                    pass
                else:
                    print(f"Failed to add column {col} to table {table}: {e}")
        
        try:
            conn.execute(text(site_visits_sql))
            print("Verified site_visits table")
        except Exception as e:
            print(f"Failed to verify/create site_visits table: {e}")
            
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
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"status": "online", "app": "OpportuBot API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
