"""
SQLAlchemy engine/session setup.

Uses SQLite by default (local dev). For production on Vercel, set DATABASE_URL
to a **pooled** PostgreSQL connection string — get one from Neon (Vercel
Marketplace) or Supabase (port 6543 for transaction pooler).

The pooler handles the high connection churn of serverless functions.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# ─── Engine ──────────────────────────────────────────────────────────────
is_sqlite = settings.database_url.startswith("sqlite")
is_postgres = settings.database_url.startswith("postgresql")

connect_args = {}

if is_sqlite:
    # SQLite doesn't allow concurrent access from different threads
    connect_args["check_same_thread"] = False

# Connection pooling — critical for serverless PostgreSQL.
# Conservative defaults keep free-tier databases (Neon: 10 conn, Supabase: 15) happy.
pool_config = {}
if is_postgres:
    pool_config = {
        "pool_size": 2,            # Max connections kept warm in the pool
        "max_overflow": 5,         # Extra connections allowed when pool is busy
        "pool_recycle": settings.db_pool_recycle,  # Recycle stale connections
        "pool_pre_ping": True,     # Verify connection is alive before handing it out
    }

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    **pool_config,
)

# ─── Session factory ─────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
