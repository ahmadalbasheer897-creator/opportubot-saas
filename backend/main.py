from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, Base
from config import get_settings
from routers import auth, user, opportunities, saved, admin
from routers.user import profile_router, pipeline_router, gifts_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
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