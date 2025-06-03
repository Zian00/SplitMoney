from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
from app.database import create_db_and_tables
from config import settings

app = FastAPI(title="SplitMoney API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.on_event("startup")
async def on_startup():
    if settings.debug:
        print("Debug mode enabled")
    create_db_and_tables()

@app.get("/")
async def root():
    return {"message": "Welcome to SplitMoney API"} 