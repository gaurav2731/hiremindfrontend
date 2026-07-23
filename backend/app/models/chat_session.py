from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func

from app.core.database import Base


class ChatSession(Base):
    """Persists focus-router session state across Vercel cold starts."""
    __tablename__ = "chat_sessions"

    session_id = Column(String, primary_key=True, index=True)
    data = Column(Text, nullable=False)  # JSON-encoded SessionState
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
