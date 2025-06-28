import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings(BaseSettings):
    # Dynamic database URL based on environment
    database_url: str = os.getenv(
        "DATABASE_URL_PROD" if os.getenv("ENVIRONMENT") == "production" 
        else "DATABASE_URL_DEV", 
        os.getenv("DATABASE_URL_DEV")  # fallback to dev if neither is set
    )
    secret_key: str = os.getenv("SECRET_KEY")
    algorithm: str = os.getenv("ALGORITHM")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    # Application settings
    api_prefix: str = "/api"
    debug: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    frontend_base_url: str = os.getenv(
        "FRONTEND_BASE_URL" if os.getenv("ENVIRONMENT") == "production"
        else "http://localhost:5173",
        os.getenv("DATABASE_URL_DEV")
    )


# Create settings instance
settings = Settings()
