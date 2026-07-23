from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.schemas.evaluation import AnswerEvaluation
from app.services.evaluator import evaluate_answer

from app.schemas.resume import ResumeData
from app.schemas.job import JobDescriptionData
from app.services.agents.interview_prep import (
    generate_interview_questions,
    InterviewPrepResult,
    RoundType,
    Profession,
    PROFESSION_ROUNDS,
)
from app.services.agents.focus_router import (
    create_session,
    get_session,
    chat,
    SessionState,
)

router = APIRouter(prefix="/api/interview", tags=["interview"])


class StartSessionRequest(BaseModel):
    session_id: str
    resume_id: str | None = None
    resume_data: ResumeData
    jd_data: JobDescriptionData
    focus: Optional[str] = None
    profession: Profession = Profession.GENERAL


class ChatRequest(BaseModel):
    session_id: str
    message: str


class GenerateQuestionsRequest(BaseModel):
    resume_id: str | None = None
    resume_data: ResumeData
    jd_data: JobDescriptionData
    round_type: RoundType
    profession: Profession = Profession.GENERAL
    num_questions: int = 10


class ChatResponse(BaseModel):
    response: str
    session_id: str


@router.post("/session/start")
def start_session(payload: StartSessionRequest) -> dict:
    """Start a new interview preparation session."""
    state = create_session(
        session_id=payload.session_id,
        resume_id=payload.resume_id,
        resume_data=payload.resume_data,
        jd_data=payload.jd_data,
        focus=payload.focus,
        profession=payload.profession,
    )
    return {
        "status": "session_started",
        "session_id": state.session_id,
        "focus": state.current_focus,
        "profession": state.profession.value if hasattr(state.profession, 'value') else state.profession,
    }


@router.post("/chat", response_model=ChatResponse)
async def interview_chat(payload: ChatRequest) -> ChatResponse:
    """Send a message to the AI career coach and get a focused response."""
    if not get_session(payload.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Please start a session first.")

    try:
        response = await chat(session_id=payload.session_id, user_message=payload.message)
        return ChatResponse(response=response, session_id=payload.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.post("/questions/generate", response_model=InterviewPrepResult)
async def generate_questions(payload: GenerateQuestionsRequest) -> InterviewPrepResult:
    """Generate tailored interview questions for a specific round type and profession."""
    try:
        result = await generate_interview_questions(
            resume_id=payload.resume_id,
            resume_data=payload.resume_data,
            jd_data=payload.jd_data,
            round_type=payload.round_type,
            profession=payload.profession,
            num_questions=payload.num_questions,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")


class MockAnswerSubmission(BaseModel):
    session_id: str
    question: str
    answer_text: str


@router.post("/mock/answer", response_model=AnswerEvaluation)
async def submit_mock_answer(payload: MockAnswerSubmission):
    """
    Receives an answer in a mock interview turn and returns an evaluation.
    """
    session = get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        evaluation = await evaluate_answer(
            question=payload.question,
            answer=payload.answer_text,
            resume_data=session.resume_data,
            jd_data=session.jd_data
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")


# ─── Profession Metadata Endpoint ───────────────────────────────────────

class ProfessionInfo(BaseModel):
    value: str
    label: str
    icon: str
    rounds: list


@router.get("/professions")
def get_professions() -> dict:
    """Return all supported professions and their round types."""
    icons = {
        Profession.SOFTWARE_ENGINEERING: "💻",
        Profession.NURSING: "🩺",
        Profession.DATA_SCIENCE: "📊",
        Profession.PRODUCT_MANAGEMENT: "📱",
        Profession.MARKETING: "📈",
        Profession.FINANCE: "💰",
        Profession.HUMAN_RESOURCES: "👥",
        Profession.GENERAL: "🎯",
    }
    result = {}
    for prof in Profession:
        rounds = PROFESSION_ROUNDS.get(prof, [])
        result[prof.value] = {
            "value": prof.value,
            "label": prof.value,
            "icon": icons.get(prof, "🎯"),
            "rounds": rounds,
        }
    return {"professions": result}
