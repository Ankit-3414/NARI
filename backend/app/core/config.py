from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Core
    NARI_ENV: str = "development"
    NARI_APP_NAME: str = "NARI"
    NARI_VERSION: str = "1.0.0-alpha.7"
    NARI_SECRET_KEY: str # REQUIRED
    NARI_API_KEY: str    # REQUIRED

    # Database
    DATABASE_URL: str = "sqlite:///./data/nari.db"

    # Server
    NARI_HOST: str = "0.0.0.0"
    NARI_PORT: int = 8000
    NARI_WORKERS: int = 1

    # Logging
    NARI_LOG_LEVEL: str = "INFO"

    # User preferences
    NARI_TIMEZONE: str = "Asia/Kolkata"
    NARI_THEME: str = "dark"

    # Scheduler
    NARI_SCHEDULER_ENABLED: bool = True

    # AI (reserved for Stage 9)
    GROQ_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    AI_PROVIDER: Optional[str] = None
    AI_ENABLED: bool = False


settings = Settings()
