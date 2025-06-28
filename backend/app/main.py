from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, groups, expenses
# The import below is no longer needed and will cause an error
# from app.database import create_db_and_tables 
from app.config import settings
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.cleanup import cleanup_expired_invitations

# Initialize the scheduler
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.debug:
        print("Debug mode enabled")
    
    # Add the cleanup job to the scheduler to run once every day
    scheduler.add_job(cleanup_expired_invitations, 'interval', days=30, id="cleanup_job")
    # Start the scheduler
    scheduler.start()
    print("Scheduler started. Cleanup job is scheduled.")

    yield  # Application runs here

    # Shutdown the scheduler when the application is closing
    scheduler.shutdown()
    print("Scheduler shut down.")

app = FastAPI(title="SplitMoney API", lifespan=lifespan)

# Configure CORS for frontend - update with your Vercel frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://split-money-seven.vercel.app"  # Update this with your actual frontend URL
    ],
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
