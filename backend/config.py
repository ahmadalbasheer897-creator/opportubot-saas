from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./opportubot.db"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Anthropic / Claude
    ANTHROPIC_API_KEY: str = ""

    # Serper (Google Search)
    SERPER_API_KEY: str = "07b618bd1d7179092191b332c6619cfcadc0345b"

    # RapidAPI (LinkedIn)
    RAPIDAPI_KEY: str = "a54b63e366msh560994524e87b12p191d39jsn98a3afad2490"

    # App
    OWNER_EMAIL: str = "ahmadalbasheer.897@gmail.com"
    FRONTEND_URL: str = "https://prismatic-kelpie-ece144.netlify.app"

    # SMTP (Email) - fallback, Render free tier blocks port 587
    SMTP_HOST: str = ""           # e.g. smtp.gmail.com
    SMTP_PORT: int = 587          # 587 for TLS, 465 for SSL
    SMTP_USER: str = ""           # your Gmail address
    SMTP_PASSWORD: str = ""       # Gmail App Password (not your main password)

    # Resend (preferred email API - uses HTTPS, not blocked by Render)
    RESEND_API_KEY: str = ""      # from resend.com

    # Lemon Squeezy (Payments)
    LSQ_API_KEY: str = ""
    LSQ_STORE_ID: str = "420823"
    LSQ_VARIANT_ID: str = "1851645"
    LSQ_WEBHOOK_SECRET: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
