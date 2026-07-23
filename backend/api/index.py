"""Vercel serverless entry point for FastAPI app."""
from mangum import Mangum
from app.main import app

# Vercel serverless handler
handler = Mangum(app, lifespan="off")