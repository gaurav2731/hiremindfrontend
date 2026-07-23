from pydantic import BaseModel, Field
from typing import List
from app.services.ai_client import generate_structured
import httpx
from bs4 import BeautifulSoup

class CompanyResearch(BaseModel):
    company_name: str
    overview: str = Field(description="A brief overview of what the company does")
    recent_news: List[str] = Field(description="Recent news or milestones, if available")
    culture_values: List[str] = Field(description="Inferred or stated company culture and values")
    interview_tips: List[str] = Field(description="Specific tips for interviewing at this company")

async def generate_company_research(company_name: str, url: str | None = None) -> CompanyResearch:
    """Generate research on a company to help candidate prepare."""
    
    scraped_content = ""
    if url:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    for element in soup(['script', 'style', 'nav', 'footer']):
                        element.decompose()
                    text = soup.get_text(separator=' ', strip=True)
                    scraped_content = text[:3000]
        except Exception:
            pass

    system_prompt = (
        "You are an expert career advisor. "
        "Your task is to provide research about a specific company to help a candidate prepare for an interview. "
        "If scraped content is provided, use it. Otherwise, rely on your general knowledge up to your training cutoff."
    )
    
    user_prompt = f"COMPANY NAME: {company_name}\n"
    if scraped_content:
        user_prompt += f"SCRAPED CONTEXT FROM WEBSITE:\n{scraped_content}\n"
        
    return await generate_structured(
        prompt=user_prompt,
        response_model=CompanyResearch,
        system=system_prompt
    )
