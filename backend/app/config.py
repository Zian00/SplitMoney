import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL")
    secret_key: str = os.getenv("SECRET_KEY")
    algorithm: str = os.getenv("ALGORITHM")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    # Application settings
    api_prefix: str = "/api"
    debug: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")


# Create settings instance
settings = Settings()
