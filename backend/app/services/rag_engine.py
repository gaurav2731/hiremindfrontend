import uuid
from typing import List, Dict, Any

from app.services.vector_db import store_resume_embeddings, query_resume_chunks
from app.services.embeddings import generate_embeddings, generate_embedding
from app.schemas.resume import ResumeData
from app.schemas.job import JobDescriptionData


def chunk_text(text: str, max_words: int = 150) -> List[str]:
    """Simple word-based chunker for documents."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), max_words):
        chunk = " ".join(words[i:i + max_words])
        chunks.append(chunk)
    return chunks


async def store_resume_in_rag(resume_id: str, resume_data: ResumeData):
    """Embed and store a parsed resume in the vector database."""
    chunk_texts = []
    chunk_types = []

    for exp in resume_data.experience:
        text = f"Experience at {exp.company} as {exp.job_title}: " + " ".join(exp.responsibilities)
        chunk_texts.append(text)
        chunk_types.append("experience")

    for proj in resume_data.projects:
        text = f"Project {proj.name}: {proj.description} using {', '.join(proj.technologies)}"
        chunk_texts.append(text)
        chunk_types.append("project")

    if resume_data.skills:
        text = f"Skills: {', '.join(resume_data.skills)}"
        chunk_texts.append(text)
        chunk_types.append("skills")

    if not chunk_texts:
        return

    embeddings = await generate_embeddings(chunk_texts)
    await store_resume_embeddings(
        resume_id=resume_id,
        chunk_texts=chunk_texts,
        chunk_types=chunk_types,
        embeddings=embeddings,
    )


async def query_resume_context(resume_id: str | None, query: str, n_results: int = 3) -> List[str]:
    """Retrieve relevant resume chunks for a specific query."""
    if not resume_id:
        return []

    query_embedding = await generate_embedding(query)
    return await query_resume_chunks(
        resume_id=resume_id,
        query_embedding=query_embedding,
        n_results=n_results,
    )
