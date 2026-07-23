from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    resume_data = Column(Text, nullable=True)   # JSON-encoded ResumeData
    jd_data = Column(Text, nullable=True)       # JSON-encoded JobDescriptionData
    created_at = Column(DateTime(timezone=True), server_default=func.now())
