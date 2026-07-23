"""
Vector store for resume and job-description embeddings.

Uses Supabase pgvector (PostgreSQL) in production on Vercel.
Falls back to ChromaDB when SQLite is used for local development.

pgvector ensures vector data persists across serverless cold starts
— no more RAG data loss on restart.
"""
import uuid
import os
from typing import List, Any
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine

# ─── Detection ───────────────────────────────────────────────────────────
is_postgres = settings.database_url.startswith("postgresql")

# ─── ChromaDB (fallback for SQLite / local dev) ──────────────────────────
_chroma_client = None


def _get_chroma():
    """Lazy ChromaDB client (PersistentClient or Ephemeral fallback)."""
    global _chroma_client
    if _chroma_client is not None:
        return _chroma_client

    import chromadb

    try:
        chroma_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", ".chroma")
        )
        _chroma_client = chromadb.PersistentClient(path=chroma_dir)
        _chroma_client.heartbeat()
    except Exception:
        _chroma_client = chromadb.EphemeralClient()
    return _chroma_client


# ─── Public API ──────────────────────────────────────────────────────────

async def store_embeddings(
    collection_name: str,
    ids: List[str],
    embeddings: List[List[float]],
    documents: List[str],
    metadatas: List[dict],
) -> None:
    """Store embeddings in the vector DB (pgvector or ChromaDB)."""
    if is_postgres:
        await _pgvector_store(collection_name, ids, embeddings, documents, metadatas)
    else:
        _chroma_store(collection_name, ids, embeddings, documents, metadatas)


async def query_embeddings(
    collection_name: str,
    query_embedding: List[float],
    n_results: int = 3,
    filter_dict: dict | None = None,
) -> List[str]:
    """Query the vector DB for similar documents."""
    if is_postgres:
        return await _pgvector_query(collection_name, query_embedding, n_results, filter_dict)
    else:
        return _chroma_query(collection_name, query_embedding, n_results, filter_dict)


# ─── pgvector implementation (PostgreSQL) ────────────────────────────────

async def _pgvector_store(
    collection_name: str,
    ids: List[str],
    embeddings: List[List[float]],
    documents: List[str],
    metadatas: List[dict],
) -> None:
    """Store embeddings via raw SQL into the vector_store table."""
    import json
    with engine.begin() as conn:
        for i, chunk_id in enumerate(ids):
            conn.execute(
                text("""
                    INSERT INTO vector_store (id, collection_name, document, embedding, metadata)
                    VALUES (:id, :collection, :doc, :emb, :meta)
                    ON CONFLICT (id) DO UPDATE SET
                        document = EXCLUDED.document,
                        embedding = EXCLUDED.embedding,
                        metadata = EXCLUDED.metadata
                """),
                {
                    "id": chunk_id,
                    "collection": collection_name,
                    "doc": documents[i],
                    "emb": str(embeddings[i]),   # pgvector accepts string format '[0.1, 0.2, ...]'
                    "meta": json.dumps(metadatas[i]),  # JSON format so query can use jsonb ops
                },
            )


async def _pgvector_query(
    collection_name: str,
    query_embedding: List[float],
    n_results: int = 3,
    filter_dict: dict | None = None,
) -> List[str]:
    """Query pgvector using cosine distance (<=> operator)."""
    emb_str = str(query_embedding)

    # Build optional WHERE clause from filter_dict using JSONB containment
    where_clause = "collection_name = :collection"
    params = {"collection": collection_name, "emb": emb_str}

    if filter_dict:
        for key, value in filter_dict.items():
            # metadata::jsonb @> '{"key": "value"}'::jsonb checks containment
            where_clause += f" AND metadata::jsonb @> :_{key}_jb"
            params[f"_{key}_jb"] = f'{{"{key}": "{value}"}}'

    sql = f"""
        SELECT document
        FROM vector_store
        WHERE {where_clause}
        ORDER BY embedding <=> :emb
        LIMIT :limit
    """

    with engine.connect() as conn:
        result = conn.execute(text(sql), {**params, "limit": n_results})
        rows = result.fetchall()
        return [row[0] for row in rows]


# ─── ChromaDB implementation (SQLite / local dev) ────────────────────────

def _chroma_store(
    collection_name: str,
    ids: List[str],
    embeddings: List[List[float]],
    documents: List[str],
    metadatas: List[dict],
) -> None:
    """Store embeddings via ChromaDB."""
    client = _get_chroma()
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )
    collection.add(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def _chroma_query(
    collection_name: str,
    query_embedding: List[float],
    n_results: int = 3,
    filter_dict: dict | None = None,
) -> List[str]:
    """Query ChromaDB for similar documents."""
    client = _get_chroma()
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=filter_dict,
    )
    if results and results["documents"] and results["documents"][0]:
        return results["documents"][0]
    return []


# ─── Convenience helpers (keep existing API for backwards compat) ────────

async def store_resume_embeddings(
    resume_id: str,
    chunk_texts: List[str],
    chunk_types: List[str],
    embeddings: List[List[float]],
) -> None:
    """Store resume chunks with their embeddings."""
    ids = [f"{resume_id}-{chunk_types[i]}-{uuid.uuid4().hex[:8]}" for i in range(len(chunk_texts))]
    metadatas = [{"type": chunk_types[i], "resume_id": resume_id} for i in range(len(chunk_texts))]
    await store_embeddings(
        collection_name="resumes",
        ids=ids,
        embeddings=embeddings,
        documents=chunk_texts,
        metadatas=metadatas,
    )


async def query_resume_chunks(
    resume_id: str,
    query_embedding: List[float],
    n_results: int = 3,
) -> List[str]:
    """Retrieve relevant resume chunks for a query."""
    return await query_embeddings(
        collection_name="resumes",
        query_embedding=query_embedding,
        n_results=n_results,
        filter_dict={"resume_id": resume_id},
    )
