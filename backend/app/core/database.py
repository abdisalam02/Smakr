import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger("citypulse.database")

Base = declarative_base()

# Determine if we're using SQLite or Postgres
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Engine creation with sensible connection pool defaults
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    **({"connect_args": {"check_same_thread": False}} if is_sqlite else {"pool_size": 10, "max_overflow": 20})
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initializes the database schema and seeds initial spots."""
    from app.models import Venue, LiveCheckin, WifiSpeedTest, SavedCollection
    from app.db.seed_data import seed_initial_venues

    try:
        async with engine.begin() as conn:
            # If PostgreSQL, enable PostGIS extension
            if not is_sqlite:
                try:
                    from sqlalchemy import text
                    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                    await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
                except Exception as e:
                    logger.warning(f"PostGIS extension creation skipped or already exists: {e}")

            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully.")

        # Seed initial venues if empty
        async with AsyncSessionLocal() as session:
            await seed_initial_venues(session)

    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
