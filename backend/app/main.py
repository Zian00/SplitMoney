from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, groups, expenses
from app.database import create_db_and_tables
from app.config import settings
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.debug:
        print("Debug mode enabled")
    create_db_and_tables()
    yield  # Application runs during this time
    # You can add cleanup code after yield if needed

app = FastAPI(title="SplitMoney API", lifespan=lifespan)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(groups.router, prefix="/api", tags=["Groups"])
app.include_router(expenses.router, prefix="/api", tags=["Expenses"])

@app.get("/")
async def root():
    return {"message": "Welcome to SplitMoney API"}
