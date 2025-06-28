from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, groups, expenses
# The import below is no longer needed and will cause an error
# from app.database import create_db_and_tables 
from app.config import settings
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.cleanup import cleanup_expired_invitations
import logging
from fastapi.responses import JSONResponse

# Initialize the scheduler
scheduler = AsyncIOScheduler()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.debug:
        print("Debug mode enabled")
    
    # Add the cleanup job to the scheduler to run once every 2 day
    scheduler.add_job(cleanup_expired_invitations, 'interval', days=2, id="cleanup_job")
    # Start the scheduler
    scheduler.start()
    print("Scheduler started. Cleanup job is scheduled.")

    yield  # Application runs here

    # Shutdown the scheduler when the application is closing
    scheduler.shutdown()
    print("Scheduler shut down.")

app = FastAPI(title="SplitMoney API", lifespan=lifespan)

# Dynamic CORS origins based on environment
cors_origins = [
    "http://localhost:5173", 
    "http://localhost:3000",
]

# Add production frontend URL if in production
if settings.environment == "production":
    cors_origins.append("https://split-money-seven.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    logger.error(f"Request URL: {request.url}")
    logger.error(f"Request method: {request.method}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )
