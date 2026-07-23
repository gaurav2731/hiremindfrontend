"""
FastAPI application entry point.

On Vercel, this module is imported by api/index.py (Mangum handler).
Because Mangum uses lifespan="off", startup tasks run at module level.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from sqlalchemy import create_engine, inspect, text

from app.api import auth, health, interview, job, resume
from app.core.config import settings
from app.core.database import Base
from app import models  # noqa: F401  (ensures models are registered on Base.metadata)

# ─── Database table creation ─────────────────────────────────────────────
# Uses direct_url (non-pooled) for schema DDL when available — some connection
# poolers (Supavisor, PgBouncer in transaction mode) don't handle DDL reliably.
_migration_url = settings.direct_url or settings.database_url

# Warn if DIRECT_URL is not set for PostgreSQL — some poolers (PgBouncer in
# transaction mode, Supavisor) don't handle DDL (CREATE TABLE) reliably.
if settings.database_url.startswith("postgresql") and not settings.direct_url:
    print("[startup] WARNING: DIRECT_URL not set. Schema migrations will use the pooled")
    print("[startup] connection (DATABASE_URL). For reliability, set DIRECT_URL to the")
    print("[startup] non-pooled connection string from your database provider.")

try:
    mig_engine = create_engine(
        _migration_url,
        pool_pre_ping=True,
        # Single connection, no pooling needed for one-off migration
        pool_size=1,
        max_overflow=0,
    )
    with mig_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        conn.commit()

    inspector = inspect(mig_engine)
    existing = inspector.get_table_names()
    wanted = list(Base.metadata.tables.keys())
    missing = [t for t in wanted if t not in existing]
    if missing:
        Base.metadata.create_all(bind=mig_engine)
        print(f"[startup] Created missing tables: {missing}")
    else:
        print("[startup] All database tables already exist.")

    # ── pgvector setup (PostgreSQL only) ─────────────────────────────────
    # ── pgvector setup (PostgreSQL only) ─────────────────────────────────
    if settings.database_url.startswith("postgresql") and "vector_store" not in existing:
        _setup_pgvector(mig_engine)
        # Register vector_store table so next cold start doesn't try again
        print("[startup] pgvector extension + vector_store table created.")
    elif not settings.database_url.startswith("postgresql"):
        print("[startup] Skipping pgvector — using SQLite + ChromaDB fallback.")

    mig_engine.dispose()
except Exception as exc:
    print(f"[startup] Database tables NOT created — {exc}")
    print("[startup] If using Neon/Supabase, set DIRECT_URL to the non-pooled connection string.")

# ─── FastAPI app ─────────────────────────────────────────────────────────
app = FastAPI(title=settings.app_name)

# CORS — required so the frontend can call this API from a different origin.
# In production, set FRONTEND_ORIGIN to your deployed frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(job.router)
app.include_router(interview.router)


@app.get("/")
def root():
    return {"app": settings.app_name, "status": "running"}


# ─── pgvector helper ────────────────────────────────────────────────────


def _setup_pgvector(mig_engine):
    """Enable pgvector extension and create the vector_store table.

    Runs only once on PostgreSQL. The table uses a raw Vector(1536) column
    which cannot be declared on the shared Base (incompatible with SQLite),
    so we create it with raw DDL instead.
    """
    from sqlalchemy import Table, Column, Integer, String, Text, DateTime, func

    with mig_engine.connect() as conn:
        # Enable pgvector extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create vector_store table manually (Vector type is PG-only)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS vector_store (
                id          TEXT PRIMARY KEY,
                collection_name TEXT NOT NULL,
                document    TEXT NOT NULL,
                embedding   vector(1536) NOT NULL,
                metadata    TEXT DEFAULT '{}',
                created_at  TIMESTAMPTZ DEFAULT now()
            )
        """))
        # Create index for fast cosine similarity search
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_vector_store_embedding
            ON vector_store
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 10)
        """))
        conn.commit()
