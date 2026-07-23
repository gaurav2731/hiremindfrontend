from pydantic import BaseModel, Field
from typing import List

class AnswerEvaluation(BaseModel):
    score: int = Field(description="Score out of 100 for the candidate's answer")
    feedback: str = Field(description="Constructive feedback on the answer")
    strengths: List[str] = Field(description="What the candidate did well")
    missing_points: List[str] = Field(description="Key concepts or points the candidate missed")
    model_answer: str = Field(description="A model answer that would score a 100")
