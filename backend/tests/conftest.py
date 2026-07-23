"""
HireMind AI — Backend Test Configuration
=========================================
Provides pytest fixtures:
- test database (SQLite in-memory, tables auto-created)
- FastAPI TestClient
- sample ResumeData / JobDescriptionData factories
- auth token helper
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.core.config import settings
from app.main import app
from app.schemas.resume import ResumeData, Experience, Education, Project, Certification
from app.schemas.job import JobDescriptionData, JobRequirement

# ─── In-memory SQLite engine ─────────────────────────────────────────────
# Set it BEFORE any imports that read it
settings.database_url = "sqlite:///./test_hiremind.db"

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """FastAPI dependency override: returns a test DB session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    """FastAPI TestClient with overridden DB dependency."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def sample_resume_data() -> ResumeData:
    return ResumeData(
        name="Rahul Sharma",
        email="rahul@example.com",
        phone="+91-9876543210",
        summary="Experienced full-stack developer with 5+ years building scalable web apps.",
        skills=["Python", "JavaScript", "React", "FastAPI", "PostgreSQL"],
        technologies=["Docker", "AWS", "Git", "Redis"],
        experience=[
            Experience(
                company="TechCorp",
                job_title="Senior Software Engineer",
                start_date="2021-03",
                end_date="Present",
                responsibilities=[
                    "Built microservices handling 10K+ req/s",
                    "Led a team of 4 junior engineers",
                ],
            ),
            Experience(
                company="StartupXYZ",
                job_title="Full-Stack Developer",
                start_date="2019-01",
                end_date="2021-02",
                responsibilities=[
                    "Developed React SPA with 99.9% uptime",
                ],
            ),
        ],
        education=[
            Education(
                institution="IIT Bombay",
                degree="B.Tech",
                field_of_study="Computer Science",
                end_date="2018",
            ),
        ],
        projects=[
            Project(
                name="E-Commerce Platform",
                description="Built a full-stack e-commerce platform with payment integration",
                technologies=["React", "Node.js", "PostgreSQL"],
            ),
        ],
        certifications=[
            Certification(name="AWS Certified Developer", issuer="Amazon", date="2022"),
        ],
    )


@pytest.fixture()
def sample_jd_data() -> JobDescriptionData:
    return JobDescriptionData(
        job_title="Senior Full-Stack Engineer",
        company_name="DreamCorp",
        required_skills=[
            JobRequirement(name="Python", priority="High"),
            JobRequirement(name="React", priority="High"),
            JobRequirement(name="PostgreSQL", priority="Medium"),
        ],
        preferred_skills=[
            JobRequirement(name="Docker", priority="Low"),
        ],
        tech_stack=[
            JobRequirement(name="AWS", priority="High"),
            JobRequirement(name="Redis", priority="Medium"),
        ],
        responsibilities=[
            "Design and implement scalable backend services",
            "Build responsive frontend components",
            "Mentor junior developers",
        ],
        experience_level="Senior (5+ years)",
        soft_skills=[
            JobRequirement(name="Leadership", priority="High"),
        ],
        keywords=["microservices", "CI/CD", "system design", "agile"],
    )


@pytest.fixture()
def auth_headers(client):
    """Register a test user and return Authorization headers."""
    client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!",
        "full_name": "Test User",
    })
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "SecurePass123!",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def registered_user(client):
    """Register and return (token, user_data) tuple."""
    resp = client.post("/api/auth/register", json={
        "email": "fixture@example.com",
        "password": "SecurePass123!",
        "full_name": "Fixture User",
    })
    data = resp.json()
    return data["access_token"], data["user"]
