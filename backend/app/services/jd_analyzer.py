import httpx
from bs4 import BeautifulSoup

from app.schemas.job import JobDescriptionData
from app.services.ai_client import generate_structured


async def scrape_url_text(url: str) -> str:
    """Basic scraper to extract text from a URL."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        
    soup = BeautifulSoup(response.text, "html.parser")
    # Remove script and style elements
    for script in soup(["script", "style"]):
        script.extract()
        
    text = soup.get_text(separator="\n")
    # Clean up blank lines
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = "\n".join(chunk for chunk in chunks if chunk)
    return text


async def analyze_job_description(text: str | None = None, url: str | None = None) -> JobDescriptionData:
    """Parse a job description into structured requirements."""
    if url and not text:
        text = await scrape_url_text(url)
        
    if not text:
        raise ValueError("Either text or URL must be provided, and text could not be extracted.")

    system_prompt = (
        "You are an expert technical recruiter and AI job analyzer. "
        "Your task is to analyze a raw job description and extract structured requirements. "
        "Rank the skills and tech stack into High, Medium, or Low priority based on how strongly "
        "they are emphasized in the description."
    )
    
    user_prompt = f"Analyze the following job description:\n\n{text[:10000]}"  # Limit text size
    
    parsed_data = await generate_structured(
        prompt=user_prompt,
        response_model=JobDescriptionData,
        system=system_prompt
    )
    
    return parsed_data
