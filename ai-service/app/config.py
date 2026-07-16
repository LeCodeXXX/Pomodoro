from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    fastapi_port: int = 8000
    log_level: str = "info"
    
    # Gemini Configuration
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    
    # AI Service API Security
    ai_service_api_key: str
    
    # File Processing
    max_file_size_mb: int = 50
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
