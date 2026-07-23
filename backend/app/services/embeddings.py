from typing import List
from app.services.ai_client import get_client


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate vector embeddings for a list of text strings using OpenAI."""
    client = await get_client()
    
    # text-embedding-3-small provides the best cost/performance ratio
    response = await client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    
    return [data.embedding for data in response.data]


async def generate_embedding(text: str) -> List[float]:
    """Generate a single vector embedding."""
    result = await generate_embeddings([text])
    return result[0]
