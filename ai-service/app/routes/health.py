from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Quiz Generator",
        "model": settings.gemini_model,
        "provider": "gemini"
    }
