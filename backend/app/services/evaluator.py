from app.schemas.evaluation import AnswerEvaluation
from app.services.ai_client import generate_structured
from app.schemas.resume import ResumeData
from app.schemas.job import JobDescriptionData

async def evaluate_answer(
    question: str,
    answer: str,
    resume_data: ResumeData,
    jd_data: JobDescriptionData
) -> AnswerEvaluation:
    """Evaluate a candidate's answer to an interview question."""
    
    system_prompt = (
        "You are an expert technical interviewer and career coach. "
        "Your task is to evaluate a candidate's answer to an interview question. "
        "Provide a realistic score (0-100), constructive feedback, strengths, missing points, and a model answer."
    )
    
    user_prompt = f"""
ROLE: {jd_data.job_title} at {jd_data.company_name or 'the company'}
CANDIDATE: {resume_data.name}

QUESTION:
{question}

CANDIDATE'S ANSWER:
{answer}

Evaluate the candidate's answer. Focus on clarity, completeness, accuracy, and relevance to the role and their background.
"""
    
    return await generate_structured(
        prompt=user_prompt,
        response_model=AnswerEvaluation,
        system=system_prompt
    )
