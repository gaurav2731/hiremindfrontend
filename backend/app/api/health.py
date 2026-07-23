from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Basic liveness check — used by deployment platforms and for local debugging."""
    return {"status": "ok"}
