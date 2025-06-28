import os
from dotenv import load_dotenv
from sqlmodel import create_engine
from sqlalchemy import text

# Load environment variables
load_dotenv()

# Get database URL
database_url = os.getenv("DATABASE_URL_PROD" if os.getenv("ENVIRONMENT") == "production" else "DATABASE_URL_DEV")
print(f"Attempting to connect to: {database_url}")

try:
    engine = create_engine(database_url, echo=True)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("Database connection successful!")
except Exception as e:
    print(f"Database connection failed: {e}")