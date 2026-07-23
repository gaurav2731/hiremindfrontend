"""
Thin wrapper around the LLM provider (OpenAI).

Provides a single access point for all AI calls, allowing easy mock/swap,
and exposing structured output generation directly.

Uses AsyncOpenAI so callers don't block the event loop during LLM calls.
"""
from typing import TypeVar, Type
from pydantic import BaseModel
from openai import AsyncOpenAI

from app.core.config import settings

_client: AsyncOpenAI | None = None
T = TypeVar("T", bound=BaseModel)


async def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not settings.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Add it to your .env file."
            )
        _client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            # If LLM_BASE_URL is set (e.g. OpenRouter), use it. Otherwise default to OpenAI.
            base_url=settings.llm_base_url or None,
        )
    return _client


async def generate_text(prompt: str, system: str | None = None, max_tokens: int = 1024) -> str:
    """Single-shot text generation."""
    client = await get_client()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=settings.llm_model or "gpt-4o-mini",
        messages=messages,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


async def generate_structured(prompt: str, response_model: Type[T], system: str | None = None) -> T:
    """Single-shot generation guaranteed to return the given Pydantic model."""
    client = await get_client()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await client.beta.chat.completions.parse(
        model=settings.llm_model or "gpt-4o-mini",
        messages=messages,
        response_format=response_model,
    )
    return response.choices[0].message.parsed
