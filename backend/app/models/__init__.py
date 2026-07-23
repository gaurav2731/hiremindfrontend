"""
Import all models here so Base.metadata is aware of them
(needed for `Base.metadata.create_all()` and for Alembic autogenerate).
"""
from app.models.user import User  # noqa: F401
from app.models.chat_session import ChatSession  # noqa: F401
# noqa needed above — imported so Base.metadata creates the chat_sessions table
