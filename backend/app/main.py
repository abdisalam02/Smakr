import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.router import api_router
from app.services.event_broker import broker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("citypulse.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed Oslo spots
    logger.info("Initializing CityPulse backend engine...")
    await init_db()
    await broker.connect_redis()
    logger.info("CityPulse backend engine ready to pulse!")
    yield
    # Shutdown: clean up broker and database connections
    logger.info("Shutting down CityPulse services...")
    await broker.shutdown()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Live Café, Study Spot & Co-Working Vibe Radar API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["health"])
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "tagline": "Live Café, Study Spot & Co-Working Vibe Radar",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }
