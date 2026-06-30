from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.config import settings
from app.routes import documents, health, quiz

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Quiz Generator",
    description="Document processing and quiz generation",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")

@app.on_event("startup")
async def startup():
    logger.info("AI Quiz Generator Service started")
    logger.info(f"Using Gemini API model: {settings.gemini_model}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.fastapi_port, reload=True)
