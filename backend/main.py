from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, Base
from config import get_settings
from routers import auth, user, opportunities, saved, admin

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
app.include_router(opportunities.router)
app.include_router(saved.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "online", "app": "OpportuBot API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
