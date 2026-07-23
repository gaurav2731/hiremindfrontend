from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid
from pydantic import BaseModel

from app.schemas.resume import ResumeAnalysisResult, ResumeData
from app.schemas.job import JobDescriptionData
from app.services.resume_parser import parse_resume
from app.services.agents.resume_tailor import tailor_resume, TailoringResult

router = APIRouter(prefix="/api/resume", tags=["resume"])

ALLOWED_TYPES = {"application/pdf",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


class TailorRequest(BaseModel):
    resume_data: ResumeData
    jd_data: JobDescriptionData
    resume_id: str | None = None


@router.post("/upload", response_model=ResumeData)
async def upload_resume(file: UploadFile = File(...)):
    """
    Accepts a PDF/DOCX resume, extracts text, and parses structured fields via LLM.
    """
    if file.content_type not in ALLOWED_TYPES and not (file.filename and file.filename.endswith(('.pdf', '.docx'))):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files are accepted")

    try:
        parsed_resume = await parse_resume(file)
        return parsed_resume
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


@router.post("/tailor", response_model=TailoringResult)
async def tailor_resume_endpoint(payload: TailorRequest):
    """
    Core AI Agent: compares the parsed resume against a job description and 
    returns an ATS score, gap analysis, and line-by-line improvement suggestions.
    """
    resume_id = payload.resume_id or str(uuid.uuid4())
    try:
        result = await tailor_resume(
            resume_id=resume_id,
            resume_data=payload.resume_data,
            jd_data=payload.jd_data,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume tailoring failed: {str(e)}")

from app.schemas.roadmap import SkillGapRoadmap
from app.services.roadmap_generator import generate_skill_roadmap

@router.post("/roadmap", response_model=SkillGapRoadmap)
async def generate_roadmap_endpoint(payload: TailorRequest):
    """
    Generates a step-by-step learning roadmap to bridge skill gaps between the candidate and the JD.
    """
    try:
        result = await generate_skill_roadmap(
            resume_data=payload.resume_data,
            jd_data=payload.jd_data,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")


from fastapi.responses import StreamingResponse
from app.services.resume_generator import generate_docx_resume

@router.post("/download")
async def download_resume_endpoint(resume_data: ResumeData):
    """
    Generate and download a DOCX format resume from the structured ResumeData.
    """
    try:
        file_stream = generate_docx_resume(resume_data)
        
        # Clean the filename
        safe_name = "".join(c for c in resume_data.name if c.isalnum() or c in (' ', '_', '-')).strip()
        filename = f"{safe_name.replace(' ', '_')}_Optimized_Resume.docx" if safe_name else "Optimized_Resume.docx"

        return StreamingResponse(
            file_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate resume document: {str(e)}")
