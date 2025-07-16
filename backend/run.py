import uvicorn
from app.main import app
import os

if __name__ == "__main__":
    is_dev = os.getenv("ENVIRONMENT", "development") == "development"
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=is_dev
    )