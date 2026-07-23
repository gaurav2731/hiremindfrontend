"""
Resume Tailor Agent
-------------------
Compares a candidate's parsed ResumeData against a JobDescriptionData and generates
specific, line-by-line improvement suggestions grounded in the actual JD requirements.

This agent uses RAG to ground its suggestions in the candidate's real experience,
preventing hallucinations (no inventing skills the candidate doesn't have).
"""
from typing import List
from pydantic import BaseModel, Field

from app.schemas.resume import ResumeData, ResumeAnalysisResult, ResumeSuggestion
from app.schemas.job import JobDescriptionData
from app.services.ai_client import generate_structured, generate_text
from app.services.rag_engine import query_resume_context, store_resume_in_rag


class TailoringResult(BaseModel):
    ats_score: float = Field(description="Estimated ATS compatibility score 0-100")
    job_match_percent: float = Field(description="How well the resume matches the JD 0-100")
    strengths: List[str] = Field(description="Candidate's strong points relative to the JD")
    weaknesses: List[str] = Field(description="Gaps or weak areas relative to JD requirements")
    missing_skills: List[str] = Field(description="Skills in the JD that are absent from the resume")
    missing_keywords: List[str] = Field(description="Important ATS keywords absent from the resume")
    suggestions: List[ResumeSuggestion] = Field(
        description="Specific, actionable line-by-line improvement suggestions"
    )
    optimized_resume: ResumeData = Field(
        description="The candidate's original resume data with ONLY the suggested changes applied. "
                    "Preserve ALL original information exactly as-is (name, email, phone, education, "
                    "experience, projects). Only modify summary text, rephrase bullet points, and "
                    "add missing keywords from the JD where they naturally fit. NEVER add fake "
                    "experience, skills, projects, education, achievements, or certifications that the candidate doesn't have. "
                    "The `achievements` and `certifications` fields must only contain items from "
                    "the original resume — never invent them."
    )


async def tailor_resume(
    resume_id: str,
    resume_data: ResumeData,
    jd_data: JobDescriptionData,
) -> TailoringResult:
    """
    Core resume tailoring agent.
    
    1. Stores the resume in RAG for grounded retrieval.
    2. Retrieves the most relevant experience chunks for each JD requirement.
    3. Asks the LLM to generate specific improvements.
    """
    # Store resume in vector DB for retrieval
    await store_resume_in_rag(resume_id, resume_data)

    # Build prioritized requirements list for context
    top_skills = [r.name for r in jd_data.required_skills if r.priority == "High"]
    top_tech = [r.name for r in jd_data.tech_stack if r.priority == "High"]

    # Retrieve relevant experience context from RAG
    skills_query = f"experience with {', '.join(top_skills[:5])} and {', '.join(top_tech[:5])}"
    relevant_experience = await query_resume_context(resume_id, skills_query, n_results=5)

    # Serialize the original resume data so the LLM can reference it exactly
    original_resume_json = resume_data.model_dump_json(indent=2)

    context_text = "\n".join(relevant_experience) if relevant_experience else "No additional context retrieved."

    system_prompt = (
        "You are HireMind AI, an elite career coach and ATS optimization expert. "
        "Your role is to improve a candidate's resume for a specific job description. "
        "CRITICAL RULES:\n"
        "1. NEVER add fake skills, experience, projects, or education.\n"
        "2. NEVER change the candidate's name, email, phone, company names, job titles, or dates.\n"
        "3. Keep the resume concise — maximum 1 page when printed.\n"
        "4. Only rephrase bullet points to use stronger action verbs and include relevant keywords from the JD.\n"
        "5. If the candidate lacks a skill mentioned in the JD, flag it in `missing_skills` — don't add it to the resume.\n"
        "6. Focus on presentation improvements, keyword optimization, and quantifying achievements.\n"
        "7. The optimized_resume must be the ORIGINAL resume with ONLY MINIMAL changes — do not restructure or expand it."
    )

    user_prompt = f"""
Analyze this candidate's resume against the job description and provide tailoring suggestions.

ORIGINAL RESUME DATA (JSON):
{original_resume_json}

JOB DESCRIPTION:
Role: {jd_data.job_title} at {jd_data.company_name or 'the company'}
Required Skills: {', '.join([s.name for s in jd_data.required_skills])}
Preferred Skills: {', '.join([s.name for s in jd_data.preferred_skills])}
Tech Stack: {', '.join([t.name for t in jd_data.tech_stack])}
Responsibilities: {'; '.join(jd_data.responsibilities[:8])}

MOST RELEVANT CANDIDATE EXPERIENCE:
{context_text}

Provide:
1. An ATS score (0-100) based on keyword alignment between resume and JD
2. A job match percentage
3. Strengths, weaknesses, missing skills, and missing keywords
4. At least 5 specific line-by-line improvement suggestions (original_line → improved_line)
5. An `optimized_resume` that starts from the ORIGINAL resume data above and ONLY applies the suggested changes. Keep it honest and concise.
"""

    result = await generate_structured(
        prompt=user_prompt,
        response_model=TailoringResult,
        system=system_prompt,
    )

    return result
