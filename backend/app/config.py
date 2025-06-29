import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings(BaseSettings):
    # Determine environment first
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Dynamic database URL based on environment
    database_url: str = os.getenv(
        "DATABASE_URL_PROD" if environment == "production" 
        else "DATABASE_URL_DEV", 
        os.getenv("DATABASE_URL_DEV")  # fallback to dev if neither is set
    )
    
    # Print the correct message based on environment
    if environment == "production":
        print("connecting to production db")
    else:
        print("connecting to development db")
    
    secret_key: str = os.getenv("SECRET_KEY")
    algorithm: str = os.getenv("ALGORITHM")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    # Application settings
    api_prefix: str = "/api"
    debug: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # Dynamic frontend base URL based on environment
    frontend_base_url: str = os.getenv(
        "FRONTEND_BASE_URL" if environment == "production"
        else "http://localhost:5173",
        "http://localhost:5173"  # fallback to localhost if neither is set
    )
    if environment == "production":
        print("connecting to production frontend")
    else:
        print("connecting to development frontend")


# Create settings instance
settings = Settings()
