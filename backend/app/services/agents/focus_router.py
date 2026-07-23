"""
Focus Router Agent
------------------
A conversational state machine that maintains focus during mock interviews.

The router:
1. Interprets user intent from a free-text message
2. Routes to the correct prompt chain (resume help, interview Q&A, skill gap, etc.)
3. Generates a grounded, contextual response
4. Enforces topic focus — it will politely redirect off-topic questions

Session state is persisted in the database so it survives Vercel cold starts.
"""
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.resume import ResumeData
from app.schemas.job import JobDescriptionData
from app.services.ai_client import generate_structured
from app.services.rag_engine import query_resume_context
from app.core.database import SessionLocal
from app.services.agents.interview_prep import Profession

# ─── In-Memory Cache ────────────────────────────────────────────────────
# Keeps hot sessions in memory for fast access. Falls back to DB on miss.
_sessions: Dict[str, "SessionState"] = {}


class Intent(str, Enum):
    RESUME_HELP = "resume_help"
    INTERVIEW_QUESTION = "interview_question"
    SKILL_GAP = "skill_gap"
    MOCK_ANSWER_FEEDBACK = "mock_answer_feedback"
    GENERAL_CAREER = "general_career"
    OFF_TOPIC = "off_topic"


class RouterDecision(BaseModel):
    intent: Intent
    confidence: float = Field(ge=0.0, le=1.0)
    sub_topic: Optional[str] = Field(default=None, description="Specific topic within the intent")


class CoachChatOutput(BaseModel):
    """
    Structured output from the AI career coach.
    Using a Pydantic model constrains the LLM output (vs free-form text),
    which significantly reduces hallucination.
    """
    response: str = Field(
        description="The main coaching response text to show the user"
    )
    resume_sections_referenced: List[str] = Field(
        default_factory=list,
        description="Which parts of the resume were referenced to answer (e.g. 'Experience at Google', 'Python skill')"
    )
    action_items: List[str] = Field(
        default_factory=list,
        description="Optional actionable next steps or practice tasks for the candidate"
    )


class SessionState(BaseModel):
    session_id: str
    resume_id: str
    resume_data: ResumeData
    jd_data: JobDescriptionData
    profession: Profession = Profession.GENERAL
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    current_focus: Optional[str] = None  # e.g., "Technical Round", "HR Round"

    class Config:
        # Allow storing complex nested models as dicts in DB
        use_enum_values = True


def _serialize(state: SessionState) -> dict:
    """Convert a SessionState to a JSON-safe dict for DB storage."""
    return {
        "session_id": state.session_id,
        "resume_id": state.resume_id,
        "resume_data": state.resume_data.model_dump(),
        "jd_data": state.jd_data.model_dump(),
        "profession": state.profession.value if hasattr(state.profession, 'value') else state.profession,
        "conversation_history": state.conversation_history,
        "current_focus": state.current_focus,
    }


def _deserialize(data: dict) -> SessionState:
    """Rebuild a SessionState from a DB dict."""
    prof_str = data.get("profession", "General")
    try:
        profession = Profession(prof_str)
    except ValueError:
        profession = Profession.GENERAL
    return SessionState(
        session_id=data["session_id"],
        resume_id=data["resume_id"],
        resume_data=ResumeData(**data["resume_data"]),
        jd_data=JobDescriptionData(**data["jd_data"]),
        profession=profession,
        conversation_history=data.get("conversation_history", []),
        current_focus=data.get("current_focus"),
    )


def _db_save(state: SessionState) -> None:
    """Persist session state to the database (upsert by session_id)."""
    import json
    from sqlalchemy import text

    serialized = _serialize(state)
    try:
        with SessionLocal() as db:
            stmt = text("""
                INSERT INTO chat_sessions (session_id, data, updated_at)
                VALUES (:sid, :data, datetime('now'))
                ON CONFLICT(session_id) DO UPDATE SET
                    data = :data,
                    updated_at = datetime('now')
            """)
            db.execute(stmt, {"sid": state.session_id, "data": json.dumps(serialized)})
            db.commit()
    except Exception:
        pass  # DB might not have the table yet — fail silently


def _db_load(session_id: str) -> Optional[SessionState]:
    """Load session state from the database."""
    import json
    from sqlalchemy import text

    try:
        with SessionLocal() as db:
            result = db.execute(
                text("SELECT data FROM chat_sessions WHERE session_id = :sid"),
                {"sid": session_id}
            )
            row = result.fetchone()
            if row:
                return _deserialize(json.loads(row[0]))
    except Exception:
        pass
    return None


def create_session(
    session_id: str,
    resume_id: str | None,
    resume_data: ResumeData,
    jd_data: JobDescriptionData,
    focus: Optional[str] = None,
    profession: Profession = Profession.GENERAL,
) -> SessionState:
    """Create a new conversation session and persist it."""
    state = SessionState(
        session_id=session_id,
        resume_id=resume_id or "",
        resume_data=resume_data,
        jd_data=jd_data,
        profession=profession,
        current_focus=focus,
    )
    _sessions[session_id] = state
    _db_save(state)
    return state


def get_session(session_id: str) -> Optional[SessionState]:
    """Retrieve a session — first from memory, then from DB."""
    state = _sessions.get(session_id)
    if state is not None:
        return state

    state = _db_load(session_id)
    if state is not None:
        _sessions[session_id] = state  # warm the cache
    return state


async def _classify_intent(message: str, focus: Optional[str]) -> RouterDecision:
    """Ask the LLM to classify what the user wants."""
    system_prompt = (
        "You are an intent classifier for an AI career assistant. "
        "Classify the user's message into one of the following intents: "
        "resume_help, interview_question, skill_gap, mock_answer_feedback, general_career, off_topic. "
        "Also identify any sub-topic if present."
    )
    prompt = f"Current session focus: {focus or 'general'}\nUser message: {message}"
    return await generate_structured(prompt=prompt, response_model=RouterDecision, system=system_prompt)


async def chat(session_id: str, user_message: str) -> str:
    """
    Main chat entry point. Routes user message to the correct handler.
    Returns the assistant's response text.
    """
    state = get_session(session_id)
    if not state:
        return "Session not found. Please start a new session."

    # Classify intent
    decision = await _classify_intent(user_message, state.current_focus)

    # Add message to history
    state.conversation_history.append({"role": "user", "content": user_message})

    if decision.intent == Intent.OFF_TOPIC:
        response = (
            f"I'm here to help you prepare for your {state.jd_data.job_title} interview! "
            f"I can help with resume optimization, interview questions, skill gaps, "
            f"or give feedback on your mock answers. What would you like to work on?"
        )
        state.conversation_history.append({"role": "assistant", "content": response})
        _db_save(state)
        return response

    # Retrieve relevant context from RAG
    relevant_chunks = await query_resume_context(state.resume_id, user_message, n_results=3)
    context_text = "\n".join(relevant_chunks) if relevant_chunks else ""

    # Build conversation history string
    history = "\n".join(
        f"{m['role'].capitalize()}: {m['content']}"
        for m in state.conversation_history[-8:]  # last 4 turns
    )

    # Build a comprehensive candidate profile from their actual resume data
    exp_summary = "; ".join(
        f"{e.job_title} at {e.company} ({e.start_date or '?'}–{e.end_date or 'present'})"
        for e in state.resume_data.experience[:5]
    ) if state.resume_data.experience else "No experience listed"
    proj_summary = "; ".join(
        f"{p.name}: {p.description[:80]}"
        for p in state.resume_data.projects[:5]
    ) if state.resume_data.projects else "No projects listed"
    edu_summary = "; ".join(
        f"{e.degree} at {e.institution}"
        for e in state.resume_data.education[:3]
    ) if state.resume_data.education else "No education listed"

    company = state.jd_data.company_name or "the company"
    job_title = state.jd_data.job_title

    profession_name = state.profession.value if hasattr(state.profession, 'value') else 'General'

    # Profession-specific coaching style
    prof_styles = {
        "Nursing": """You are helping a **Nursing** candidate. IMPORTANT:
- Focus on clinical judgment, patient safety, evidence-based practice, and compassionate care
- Ask about specific clinical rotations (med-surg, OB/GYN, peds, mental health)
- Evaluate STAR stories for clinical decision-making
- Use nursing-specific terminology (FLACC scale, 5 Rights, ABCDE framework, etc.)
- Reference real nursing scenarios: patient assessment, medication admin, wound care, labor support""",
        "Software Engineering": """You are helping a **Software Engineering** candidate. IMPORTANT:
- Focus on technical skills, system design, coding ability, and engineering best practices
- Ask about specific projects, tech stack decisions, and architectural choices""",
        "Data Science": """You are helping a **Data Science** candidate. IMPORTANT:
- Focus on statistical methods, ML modeling, data manipulation, and business impact
- Ask about specific projects, model choices, and evaluation metrics""",
        "Product Management": """You are helping a **Product Management** candidate. IMPORTANT:
- Focus on strategy, prioritization, user research, metrics, and cross-functional leadership
- Ask about specific products/shipments and their impact""",
    }
    prof_style = prof_styles.get(profession_name, "")

    system_prompt = f"""You are HireMind AI, a world-class career coach and interview preparation expert.

You are helping a candidate prepare for the role of **{job_title}** at **{company}**.
**Profession:** {profession_name}

## CANDIDATE'S ACTUAL RESUME DATA (ONLY use this — never fabricate)
- **Name:** {state.resume_data.name}
- **Summary:** {state.resume_data.summary or 'Not provided'}
- **Education:** {edu_summary}
- **Experience:** {exp_summary}
- **Projects:** {proj_summary}
- **Skills:** {', '.join(state.resume_data.skills[:15])}
- **Technologies:** {', '.join(state.resume_data.technologies[:10])}
- **Current Focus:** {state.current_focus or 'General Career Coaching'}

{prof_style}

## CRITICAL RULES (Read carefully)
1. **NEVER fabricate or hallucinate** experience, skills, projects, or education the candidate doesn't have. If you don't have enough information, say so honestly.
2. **GROUND every answer** in the candidate's actual resume data shown above. Reference their specific experience and projects when giving advice.
3. **Be specific and actionable** — give concrete examples, suggested talking points, and practice questions.
4. **If asked about something not in their resume**, say: "Based on your resume, I don't see specific experience with [topic]. Here's what I can suggest..."
5. **Be encouraging but honest** — never fluff.
6. **Keep responses focused** on the current role ({job_title}) and the candidate's actual background.

## OUTPUT FORMAT
You must respond with a structured JSON object containing:
- `response`: Your full coaching response text — MUST use proper markdown formatting
- `resume_sections_referenced`: List of specific resume sections you used (e.g., ["Experience at Google", "Python skill"]). Empty list if none.
- `action_items`: List of actionable next steps or practice tasks for the candidate. Empty list if none.

## MARKDOWN FORMATTING RULES (CRITICAL)
- Use `##` for section headings and `###` for sub-headings
- Use `---` (horizontal rules) to separate major sections
- Use `| Table | Format |` for structured comparison data
- Use `**bold**` for important terms, role names, and key concepts
- Use bullet lists (`- item`) for all lists — never write paragraphs where a list works better
- Use numbered lists (`1. item`) for step-by-step instructions or ranked items
- Use `> blockquote` for tips, warnings, or callout boxes
- Use `\n\n` (double newlines) between sections for clear visual separation
- Keep paragraphs short (2-3 sentences max) for readability
- At the end of the response, add a clear actionable `### ✅ Next Steps` section with specific tasks the candidate should do
"""

    user_prompt = f"""RELEVANT CANDIDATE EXPERIENCE:
{context_text}

CONVERSATION HISTORY:
{history}

DETECTED INTENT: {decision.intent.value} ({decision.sub_topic or ''})

Please respond to the candidate's latest message in a helpful, focused way."""

    # Use structured output (Pydantic model) instead of free-form text
    # This forces the LLM to follow the schema, reducing hallucination
    coach_output = await generate_structured(
        prompt=user_prompt,
        response_model=CoachChatOutput,
        system=system_prompt,
    )
    response = coach_output.response
    state.conversation_history.append({"role": "assistant", "content": response})
    _db_save(state)

    return response
