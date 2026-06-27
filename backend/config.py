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

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
