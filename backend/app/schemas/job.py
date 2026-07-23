from typing import List, Literal, Optional, Annotated
from pydantic import BaseModel, Field, BeforeValidator

def _capitalize(v: str) -> str:
    return v.capitalize() if isinstance(v, str) else v

PriorityLevel = Annotated[Literal["High", "Medium", "Low"], BeforeValidator(_capitalize)]

class JobRequirement(BaseModel):
    name: str
    priority: PriorityLevel


class JobDescriptionData(BaseModel):
    """Structured data extracted from a raw job description."""
    job_title: str
    company_name: Optional[str] = None
    required_skills: List[JobRequirement] = Field(default_factory=list)
    preferred_skills: List[JobRequirement] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    tech_stack: List[JobRequirement] = Field(default_factory=list)
    experience_level: Optional[str] = None
    soft_skills: List[JobRequirement] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class JobAnalyzeRequest(BaseModel):
    """Request payload to analyze a job description."""
    text: Optional[str] = None
    url: Optional[str] = None
