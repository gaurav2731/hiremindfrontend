from fastapi import APIRouter, HTTPException

from app.schemas.job import JobAnalyzeRequest, JobDescriptionData
from app.services.jd_analyzer import analyze_job_description

router = APIRouter(prefix="/api/job", tags=["job"])


@router.post("/analyze", response_model=JobDescriptionData)
async def analyze_job(payload: JobAnalyzeRequest):
    """
    Accepts JD text or a URL. Fetches URL if provided, extracts requirements, 
    and ranks them by priority using LLM.
    """
    if not payload.text and not payload.url:
        raise HTTPException(status_code=400, detail="Provide either 'text' or 'url'")

    try:
        parsed_jd = await analyze_job_description(text=payload.text, url=payload.url)
        return parsed_jd
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze job description: {str(e)}")

from app.services.company_research import generate_company_research, CompanyResearch

@router.get("/company-research", response_model=CompanyResearch)
async def company_research_endpoint(company_name: str, url: str | None = None):
    """
    Generates research on a company to help a candidate prepare.
    """
    try:
        result = await generate_company_research(company_name=company_name, url=url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate company research: {str(e)}")
