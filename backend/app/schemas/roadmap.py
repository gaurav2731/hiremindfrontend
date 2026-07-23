from pydantic import BaseModel, Field
from typing import List

class RoadmapStep(BaseModel):
    title: str = Field(description="Step title, e.g., 'Learn React Hooks'")
    description: str = Field(description="Details on what to learn and why")
    resources: List[str] = Field(description="Recommended resources (links, books, courses)")
    estimated_time: str = Field(description="Estimated time to complete this step, e.g., '1 week'")

class SkillGapRoadmap(BaseModel):
    role: str = Field(description="Target role")
    missing_skills: List[str] = Field(description="Skills identified as missing")
    roadmap: List[RoadmapStep] = Field(description="Step-by-step learning roadmap")
