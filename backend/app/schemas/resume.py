from typing import List, Optional
from pydantic import BaseModel, Field


class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None


class Experience(BaseModel):
    company: str
    job_title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)


class Project(BaseModel):
    name: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    link: Optional[str] = None


class Certification(BaseModel):
    name: str
    issuer: str
    date: Optional[str] = None


class ResumeData(BaseModel):
    """Structured data extracted from a raw resume file."""
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)


class ResumeAnalysisResult(BaseModel):
    ats_score: float
    job_match_percent: float
    strengths: list[str]
    weaknesses: list[str]
    missing_skills: list[str]
    missing_keywords: list[str]


class ResumeSuggestion(BaseModel):
    original_line: str
    improved_line: str
    reason: str
