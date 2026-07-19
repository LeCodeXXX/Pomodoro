from fastapi import APIRouter, Depends
from app.config import settings
from app.utils.security import get_api_key

router = APIRouter()


@router.get("/health", dependencies=[Depends(get_api_key)])
async def health_check():
    try:
        if settings.gemini_model is None:
            raise RuntimeError("Gemini model is not configured")

        return {
            "status": "healthy",
            "service": "AI Quiz Generator",
            "model": settings.gemini_model,
            "provider": "gemini",
        }
    except Exception:
        return {
            "status": "unhealthy",
            "service": "AI Quiz Generator",
            "model": None,
            "provider": "gemini",
        }

