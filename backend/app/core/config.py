"""
Central application configuration.
Loads values from environment variables / .env file.
Never hardcode secrets here — this file only defines defaults and types.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore


class Settings(BaseSettings):
    app_name: str = "HireMind AI"
    environment: str = "development"
    debug: bool = False
    secret_key: str = "dev-secret-change-me"

    # ─── Database ────────────────────────────────────────────────────────
    # For production on Vercel, set DATABASE_URL to a **pooled** connection
    # string from your provider (port 6543 for Supabase, -pooler for Neon).
    # SQLite is used only for local development.
    database_url: str = "sqlite:///./hiremind.db"

    # Direct (non-pooled) connection for schema migrations and table creation.
    # Set DIRECT_URL to the direct connection string (port 5432 for Supabase,
    # non-pooler for Neon). Falls back to database_url if unset.
    direct_url: str | None = None

    # Connection pool recycle time in seconds (300 = 5 min).
    # Prevents stale connections when using a connection pooler.
    db_pool_recycle: int = 300

    # ─── AI / LLM ────────────────────────────────────────────────────────
    openai_api_key: str | None = None
    llm_model: str = "gpt-4o-mini"
    llm_base_url: str | None = None  # Set to https://openrouter.ai/api/v1 for OpenRouter

    # ─── Frontend ────────────────────────────────────────────────────────
    frontend_origin: str = "http://localhost:5173"

    # ─── Auth / JWT ──────────────────────────────────────────────────────
    algorithm: str = "HS256"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
