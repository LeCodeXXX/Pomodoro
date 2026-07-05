from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    IDENTIFICATION = "identification"

# Document Processing
class DocumentProcessRequest(BaseModel):
    file_name: str
    file_type: str = Field(..., pattern="^(pdf|docx|txt)$")
    user_id: str
    document_title: Optional[str] = None

class DocumentExtractionResponse(BaseModel):
    status: str
    document_id: str
    file_name: str
    file_type: str
    extraction: dict
    content: dict
    next_action: str

# Quiz Generation
class QuizConfig(BaseModel):
    difficulty: DifficultyLevel
    question_type: QuestionType
    num_questions: int = Field(..., ge=1, le=50)
    quiz_label: str
    focus_topics: Optional[str] = None

class QuizGenerationRequest(BaseModel):
    document_id: str
    extracted_content: str
    quiz_config: QuizConfig
    user_id: str

class QuestionOption(BaseModel):
    id: str
    text: str
    is_correct: bool

class MCQuestion(BaseModel):
    id: str
    question: str
    type: str = "multiple_choice"
    options: List[QuestionOption]
    correct_answer: str
    explanation: str

class IdentificationQuestion(BaseModel):
    id: str
    question: str
    type: str = "identification"
    correct_answer: str
    acceptable_answers: List[str]
    explanation: str

class QuizGenerationResponse(BaseModel):
    status: str
    quiz_id: str
    metadata: dict
    quiz: dict
    questions: List[dict]
