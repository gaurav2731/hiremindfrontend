"""
Interview Prep Agent
--------------------
Generates tailored, realistic interview questions based on the candidate's actual 
experience and the target job's requirements. Supports multiple professions
(e.g., Nursing, Software Engineering, Data Science) with domain-specific
round types and interview formats.
"""
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.resume import ResumeData
from app.schemas.job import JobDescriptionData
from app.services.ai_client import generate_structured
from app.services.rag_engine import query_resume_context


# ─── Profession-Specific Interview Domains ───────────────────────────────

class Profession(str, Enum):
    SOFTWARE_ENGINEERING = "Software Engineering"
    NURSING = "Nursing"
    DATA_SCIENCE = "Data Science"
    PRODUCT_MANAGEMENT = "Product Management"
    MARKETING = "Marketing"
    FINANCE = "Finance"
    HUMAN_RESOURCES = "Human Resources"
    GENERAL = "General"


class RoundType(str, Enum):
    # Tech rounds (SE, Data Science, etc.)
    TECHNICAL = "Technical"
    SYSTEM_DESIGN = "System Design"
    CODING = "Coding"
    # Nursing-specific rounds
    CLINICAL_SKILLS = "Clinical Skills"
    MEDICATION_SAFETY = "Medication Safety"
    PATIENT_COMMUNICATION = "Patient Communication"
    # Common rounds
    HR = "HR"
    BEHAVIORAL = "Behavioral"
    MANAGERIAL = "Managerial"
    CULTURAL_FIT = "Cultural Fit"
    CASE_STUDY = "Case Study"
    PORTFOLIO_REVIEW = "Portfolio Review"
    DOMAIN_KNOWLEDGE = "Domain Knowledge"


# ─── Profession → Round Type Mapping ─────────────────────────────────────

PROFESSION_ROUNDS: Dict[Profession, List[Dict]] = {
    Profession.SOFTWARE_ENGINEERING: [
        {"value": "HR", "label": "HR Round", "icon": "🤝", "desc": "Motivation, culture fit, career goals"},
        {"value": "Technical", "label": "Technical Round", "icon": "⚙️", "desc": "Core CS concepts, problem-solving"},
        {"value": "Coding", "label": "Coding Round", "icon": "💻", "desc": "Data structures, algorithms, coding"},
        {"value": "System Design", "label": "System Design", "icon": "🏗️", "desc": "Architecture, scalability, design"},
        {"value": "Behavioral", "label": "Behavioral Round", "icon": "🧠", "desc": "STAR method, past experiences"},
        {"value": "Managerial", "label": "Managerial Round", "icon": "📊", "desc": "Leadership, team management"},
        {"value": "Domain Knowledge", "label": "Domain Knowledge", "icon": "📚", "desc": "Industry-specific expertise"},
    ],
    Profession.NURSING: [
        {"value": "HR", "label": "HR Round", "icon": "🤝", "desc": "Motivation, hospital fit, career goals"},
        {"value": "Clinical Skills", "label": "Clinical Skills", "icon": "🩺", "desc": "Patient assessment, procedures, critical thinking"},
        {"value": "Medication Safety", "label": "Medication Safety", "icon": "💊", "desc": "5 Rights, dosage, adverse reactions"},
        {"value": "Patient Communication", "label": "Patient Communication", "icon": "💬", "desc": "Patient education, empathy, family interaction"},
        {"value": "Behavioral", "label": "Behavioral Round", "icon": "🧠", "desc": "Teamwork, conflict, prioritization"},
        {"value": "Case Study", "label": "Clinical Scenario", "icon": "🏥", "desc": "Real-world patient case analysis"},
    ],
    Profession.DATA_SCIENCE: [
        {"value": "HR", "label": "HR Round", "icon": "🤝", "desc": "Motivation, culture fit, career goals"},
        {"value": "Technical", "label": "Technical Round", "icon": "⚙️", "desc": "Statistics, ML algorithms, probability"},
        {"value": "Coding", "label": "Coding Round", "icon": "💻", "desc": "Python, SQL, data manipulation"},
        {"value": "System Design", "label": "ML System Design", "icon": "🏗️", "desc": "Data pipelines, model deployment, scaling"},
        {"value": "Case Study", "label": "Case Study", "icon": "📊", "desc": "End-to-end data science problem"},
        {"value": "Behavioral", "label": "Behavioral Round", "icon": "🧠", "desc": "STAR method, past experiences"},
    ],
    Profession.PRODUCT_MANAGEMENT: [
        {"value": "HR", "label": "HR Round", "icon": "🤝", "desc": "Motivation, culture fit, career goals"},
        {"value": "Case Study", "label": "Product Case Study", "icon": "📊", "desc": "Strategy, prioritization, metrics"},
        {"value": "Technical", "label": "Technical Awareness", "icon": "⚙️", "desc": "Tech understanding, feasibility"},
        {"value": "Behavioral", "label": "Behavioral Round", "icon": "🧠", "desc": "Leadership, stakeholder management"},
        {"value": "Managerial", "label": "Managerial Round", "icon": "📊", "desc": "Team leadership, strategy"},
        {"value": "Domain Knowledge", "label": "Domain Knowledge", "icon": "📚", "desc": "Industry & market expertise"},
    ],
    Profession.MARKETING: [
        {"value": "HR", "label": "HR Round", "icon": "🤝", "desc": "Motivation, culture fit, career goals"},
        {"value": "Case Study", "label": "Marketing Case Study", "icon": "📊", "desc": "Campaign strategy, analytics"},
        {"value": "Portfolio Review", "label": "Portfolio Review", "icon": "🎨", "desc": "Past campaigns, creative work"},
        {"value": "Domain Knowledge", "label": "Domain Knowledge", "icon": "📚", "desc": "Digital marketing, SEO, channels"},
        {"value": "Behavioral", "label": "Behavioral Round", "icon": "🧠", "desc": "Teamwork, client handling"},
    ],
    Profession.FINANCE: [
        {"value": "HR", "label": "HR Round", "icon": "🤝", "desc": "Motivation, firm fit, ethics"},
        {"value": "Technical", "label": "Technical Round", "icon": "⚙️", "desc": "Financial modeling, accounting, math"},
        {"value": "Case Study", "label": "Case Study", "icon": "📊", "desc": "Deal analysis, investment memo"},
        {"value": "Domain Knowledge", "label": "Domain Knowledge", "icon": "📚", "desc": "Markets, regulations, products"},
        {"value": "Behavioral", "label": "Behavioral Round", "icon": "🧠", "desc": "Fit, teamwork, handle pressure"},
    ],
    Profession.HUMAN_RESOURCES: [
        {"value": "HR", "label": "HR Fit", "icon": "🤝", "desc": "HR philosophy, culture building"},
        {"value": "Domain Knowledge", "label": "Domain Knowledge", "icon": "📚", "desc": "Employment law, compensation, L&D"},
        {"value": "Case Study", "label": "HR Case Study", "icon": "📊", "desc": "Employee relations, org design"},
        {"value": "Behavioral", "label": "Behavioral Round", "icon": "🧠", "desc": "Conflict resolution, empathy"},
        {"value": "Managerial", "label": "Managerial Round", "icon": "📊", "desc": "HR strategy, team leadership"},
    ],
    Profession.GENERAL: [
        {"value": "HR", "label": "HR Round", "icon": "🤝", "desc": "Motivation, culture fit, career goals"},
        {"value": "Behavioral", "label": "Behavioral Round", "icon": "🧠", "desc": "STAR method, past experiences"},
        {"value": "Domain Knowledge", "label": "Domain Knowledge", "icon": "📚", "desc": "Role-specific expertise"},
        {"value": "Case Study", "label": "Problem Solving", "icon": "💡", "desc": "Analytical thinking approach"},
        {"value": "Managerial", "label": "Managerial Round", "icon": "📊", "desc": "Leadership, team management"},
    ],
}


# ─── Profession-Specific System Prompts ──────────────────────────────────

PROFESSION_PROMPTS: Dict[Profession, str] = {
    Profession.NURSING: (
        "You are a senior nursing interviewer at a top hospital. "
        "You evaluate candidates based on clinical competence, patient safety, "
        "communication skills, empathy, and adherence to nursing best practices. "
        "Generate realistic, challenging nursing interview questions that reflect "
        "real clinical scenarios. Tailor questions to the candidate's actual clinical "
        "rotations and experience. Reference specific areas like med-surg, OB/GYN, "
        "pediatrics, mental health, and critical care as applicable. "
        "Never ask generic questions — every question should feel like it comes from "
        "a real nurse manager who has reviewed the candidate's clinical portfolio."
    ),
    Profession.SOFTWARE_ENGINEERING: (
        "You are a senior technical interviewer at a top tech company. "
        "Generate realistic, challenging interview questions that a real interviewer would ask. "
        "Tailor questions specifically to the candidate's background — reference their "
        "actual skills, projects, and tech stack. "
        "Never ask generic or off-topic questions."
    ),
    Profession.DATA_SCIENCE: (
        "You are a senior data science interviewer at a top analytics company. "
        "Evaluate candidates on statistical knowledge, ML fundamentals, data manipulation, "
        "and business acumen. Generate questions that test both theoretical understanding "
        "and practical application. Reference the candidate's actual projects and tools."
    ),
    Profession.PRODUCT_MANAGEMENT: (
        "You are a senior product leader interviewing a product manager candidate. "
        "Focus on strategic thinking, prioritization, user empathy, data-driven decision making, "
        "and stakeholder management. Use the candidate's actual experience to frame questions."
    ),
    Profession.MARKETING: (
        "You are a senior marketing director interviewing a marketing professional. "
        "Focus on campaign strategy, channel expertise, analytics, creative thinking, "
        "and ROI-driven decision making. Reference the candidate's actual campaigns and tools."
    ),
    Profession.FINANCE: (
        "You are a senior finance professional conducting an interview. "
        "Focus on financial analysis, modeling skills, market knowledge, risk assessment, "
        "and attention to detail. Use the candidate's actual experience to frame questions."
    ),
    Profession.HUMAN_RESOURCES: (
        "You are a senior HR leader interviewing an HR professional. "
        "Focus on employment law knowledge, employee relations, compensation, "
        "talent development, organizational design, and strategic HR thinking."
    ),
    Profession.GENERAL: (
        "You are an experienced interviewer evaluating a candidate for their target role. "
        "Generate realistic, thoughtful questions that assess the candidate's fit, "
        "skills, and potential. Tailor questions to their actual background."
    ),
}


class InterviewQuestion(BaseModel):
    question: str = Field(description="The interview question")
    round_type: RoundType = Field(description="The type of interview round this belongs to")
    difficulty: str = Field(description="Easy / Medium / Hard")
    why_asked: str = Field(description="Why an interviewer would ask this question in context")
    ideal_answer_hint: str = Field(description="Key points a strong answer should include")
    follow_up: Optional[str] = Field(default=None, description="A likely follow-up question")


class InterviewPrepResult(BaseModel):
    round_type: RoundType
    questions: List[InterviewQuestion]
    preparation_tips: List[str] = Field(description="Specific tips for preparing for this round")
    topics_to_revise: List[str] = Field(description="Topics to revise before this interview round")


async def generate_interview_questions(
    resume_id: str | None,
    resume_data: ResumeData,
    jd_data: JobDescriptionData,
    round_type: RoundType,
    profession: Profession = Profession.GENERAL,
    num_questions: int = 10,
) -> InterviewPrepResult:
    """
    Generate tailored interview questions for a specific round type and profession.
    Uses RAG to ground questions in the candidate's actual experience.
    """
    # Retrieve relevant experience for the chosen round type
    if round_type in (RoundType.TECHNICAL, RoundType.CODING, RoundType.SYSTEM_DESIGN):
        query = f"technical skills, projects, architecture, {round_type.value}"
    elif round_type in (RoundType.BEHAVIORAL, RoundType.MANAGERIAL):
        query = "leadership, teamwork, conflict, project management, challenges"
    elif round_type == RoundType.CLINICAL_SKILLS:
        query = f"clinical rotations, procedures, patient care, {profession.value}"
    elif round_type == RoundType.MEDICATION_SAFETY:
        query = "medication administration, dosage, 5 rights, safety protocols"
    elif round_type == RoundType.PATIENT_COMMUNICATION:
        query = "patient education, communication, empathy, family interaction"
    elif round_type == RoundType.CASE_STUDY:
        query = "problem-solving, analytical, scenarios, case analysis"
    elif round_type == RoundType.PORTFOLIO_REVIEW:
        query = "projects, campaigns, portfolio, past work"
    elif round_type == RoundType.DOMAIN_KNOWLEDGE:
        query = f"domain expertise, industry knowledge for {jd_data.job_title}"
    else:
        query = f"work experience, motivation, career goals for {jd_data.job_title}"

    relevant_chunks = await query_resume_context(resume_id, query, n_results=5)
    context_text = "\n".join(relevant_chunks) if relevant_chunks else "Use general knowledge of the candidate's background."

    # Get profession-specific system prompt
    base_prompt = PROFESSION_PROMPTS.get(profession, PROFESSION_PROMPTS[Profession.GENERAL])

    top_skills = [s.name for s in jd_data.required_skills[:5]]
    top_tech = [t.name for t in jd_data.tech_stack[:5]]

    system_prompt = (
        f"You are interviewing for a {profession.value} role. {base_prompt} "
        "Never ask generic or off-topic questions."
    )

    # Profession-specific domain hints for the prompt
    domain_hints = {
        Profession.NURSING: "Focus on clinical judgment, patient safety, evidence-based practice, and compassionate care.",
        Profession.SOFTWARE_ENGINEERING: "Focus on code quality, system thinking, algorithms, and engineering best practices.",
        Profession.DATA_SCIENCE: "Focus on statistical rigor, model selection, data quality, and business impact.",
        Profession.PRODUCT_MANAGEMENT: "Focus on user research, prioritization frameworks, metrics, and cross-functional leadership.",
        Profession.MARKETING: "Focus on campaign ROI, channel strategy, brand building, and data-driven decision making.",
        Profession.FINANCE: "Focus on analytical rigor, financial models, risk management, and regulatory knowledge.",
        Profession.HUMAN_RESOURCES: "Focus on employee experience, compliance, organizational development, and strategic HR.",
        Profession.GENERAL: "Focus on role-specific skills, problem-solving, and cultural contribution.",
    }
    domain_focus = domain_hints.get(profession, domain_hints[Profession.GENERAL])

    user_prompt = f"""
Generate exactly {num_questions} {round_type.value} interview questions for this candidate applying to:

ROLE: {jd_data.job_title} at {jd_data.company_name or 'the company'}
PROFESSION: {profession.value}
REQUIRED SKILLS: {', '.join(top_skills)}
TECH STACK: {', '.join(top_tech)}

CANDIDATE'S RELEVANT BACKGROUND (from their resume):
{context_text}

CANDIDATE SKILLS: {', '.join(resume_data.skills[:15])}
CANDIDATE TECH: {', '.join(resume_data.technologies[:15])}

{domain_focus}

Generate {num_questions} questions for the {round_type.value} round. 
Include specific follow-ups and ideal answer hints for each question.
Also provide preparation tips and topics to revise.
"""

    result = await generate_structured(
        prompt=user_prompt,
        response_model=InterviewPrepResult,
        system=system_prompt,
    )
    return result
