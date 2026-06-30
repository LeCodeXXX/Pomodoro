from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.models import QuizGenerationRequest
from app.services.quiz_generator import quiz_generator
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/quiz/generate")
async def generate_quiz(request: QuizGenerationRequest):
    """Generate quiz from document"""
    
    try:
        result = await quiz_generator.generate_quiz(request)
        
        if result.get("status") != "success":
            raise HTTPException(500, result.get("error", "Failed to generate quiz"))
        
        return JSONResponse(result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz generation failed: {str(e)}")
        raise HTTPException(500, f"Failed: {str(e)}")
