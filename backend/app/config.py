import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "A World of Bhagyashri - API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/bhagyashri.db"
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    MEDIA_STORAGE_DIR: str = str(BASE_DIR / "storage")
    THUMBNAIL_SIZE: int = 500
    MAX_DOWNLOAD_BYTES: int = 15_000_000  # 15 MB
    
    # Security
    JWT_SECRET_KEY: str = "bhagyashri_super_secret_fan_jwt_key_2025_cinematic"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Discovery APIs (Bing Image Search optional)
    BING_IMAGE_SEARCH_API_KEY: str = ""
    BING_IMAGE_SEARCH_ENDPOINT: str = "https://api.bing.microsoft.com/v7.0/images/search"
    
    # Admin Seed
    ADMIN_INITIAL_USERNAME: str = "admin"
    ADMIN_INITIAL_PASSWORD: str = "BhagyaAdmin@2025!"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
