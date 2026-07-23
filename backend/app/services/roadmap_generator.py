from app.schemas.roadmap import SkillGapRoadmap
from app.services.ai_client import generate_structured
from app.schemas.resume import ResumeData
from app.schemas.job import JobDescriptionData

async def generate_skill_roadmap(
    resume_data: ResumeData,
    jd_data: JobDescriptionData,
) -> SkillGapRoadmap:
    """Generate a step-by-step learning roadmap to bridge skill gaps."""
    
    system_prompt = (
        "You are an expert tech career coach and curriculum designer. "
        "Analyze the candidate's skills against the job description requirements. "
        "Identify key missing skills and create a realistic, step-by-step learning roadmap."
    )
    
    user_prompt = f"""
ROLE: {jd_data.job_title}
COMPANY: {jd_data.company_name or 'the company'}
REQUIRED SKILLS: {', '.join([s.name for s in jd_data.required_skills])}
TECH STACK: {', '.join([t.name for t in jd_data.tech_stack])}

CANDIDATE SKILLS: {', '.join(resume_data.skills)}
CANDIDATE TECH: {', '.join(resume_data.technologies)}

Generate a structured learning roadmap for the candidate to acquire the missing skills for this role.
"""
    
    return await generate_structured(
        prompt=user_prompt,
        response_model=SkillGapRoadmap,
        system=system_prompt
    )
