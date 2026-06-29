# Simplified AI Implementation Plan (Gemini Only)

## Quick Overview

**Objective:** Add AI-powered quiz generation using Google's free Gemini API.

**Timeline:** 2-3 weeks (instead of 6 weeks)

**Complexity:** Low (no local AI, no fallback logic)

**Cost:** Free

---

## Phase 1: Setup (2-3 days)

### 1.1 Get Gemini API Key

```bash
# 1. Go to: https://makersuite.google.com/app/apikeys
# 2. Sign in with your Google account (free)
# 3. Click "Create API key"
# 4. Copy the key
# Done! No credit card needed
```

### 1.2 Create Python Project

```bash
# Create directory
mkdir ai-services
cd ai-services

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Create folder structure
mkdir app
touch app/__init__.py
touch app/main.py
touch app/config.py
touch app/models.py
touch requirements.txt .env.example Dockerfile docker-compose.yml
```

### 1.3 Install Dependencies

**File:** `requirements.txt`

```
fastapi==0.104.0
uvicorn==0.24.0
pydantic==2.4.0
pydantic-settings==2.0.0
python-dotenv==1.0.0
PyPDF2==3.0.0
pdfplumber==0.10.0
python-docx==0.8.11
chardet==5.2.0
google-generativeai==0.3.0
requests==2.31.0
python-multipart==0.0.6
aiofiles==23.2.1
```

```bash
pip install -r requirements.txt
```

### 1.4 Setup Environment

**File:** `.env`

```
ENVIRONMENT=development
FASTAPI_PORT=8000
LOG_LEVEL=info
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-pro
MAX_FILE_SIZE_MB=50
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### 1.5 Test Connection

```bash
# Create a simple test script
python -c "
import google.generativeai as genai
genai.configure(api_key='YOUR_KEY')
model = genai.GenerativeModel('gemini-pro')
response = model.generate_content('Say hello')
print(response.text)
"
# Should print: "Hello! How can I help you today?"
```

**Deliverable:**
- [ ] API key obtained
- [ ] Virtual environment created
- [ ] All dependencies installed
- [ ] Connection to Gemini API verified

---

## Phase 2: Core Services (1 week)

### 2.1 Create Config Module

**File:** `app/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    fastapi_port: int = 8000
    log_level: str = "info"
    
    # Gemini Configuration
    gemini_api_key: str
    gemini_model: str = "gemini-pro"
    
    # File Processing
    max_file_size_mb: int = 50
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

### 2.2 Create Models

**File:** `app/models.py`

```python
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
    extraction: dict
    content: dict
    next_action: str

# Quiz Generation
class QuizConfig(BaseModel):
    difficulty: DifficultyLevel
    question_type: QuestionType
    num_questions: int = Field(..., ge=1, le=50)
    quiz_label: str

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
```

### 2.3 Create Document Service

**File:** `app/services/document_service.py`

```python
import PyPDF2
import pdfplumber
from docx import Document
import chardet
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List

class DocumentService:
    """Handle PDF, DOCX, and TXT file extraction"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    async def extract_pdf(self, file_path: str) -> Dict:
        """Extract text from PDF"""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                total_pages = len(pdf.pages)
                for page in pdf.pages:
                    page_text = page.extract_text()
                    text += f"{page_text}\n"
            
            return {
                "success": True,
                "text": text,
                "page_count": total_pages
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def extract_docx(self, file_path: str) -> Dict:
        """Extract text from DOCX"""
        try:
            doc = Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            return {
                "success": True,
                "text": text,
                "paragraphs": len(doc.paragraphs)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def extract_txt(self, file_path: str) -> Dict:
        """Extract text from TXT"""
        try:
            with open(file_path, 'rb') as f:
                raw_data = f.read()
            
            detected = chardet.detect(raw_data)
            encoding = detected.get('encoding', 'utf-8')
            text = raw_data.decode(encoding, errors='replace')
            
            return {
                "success": True,
                "text": text,
                "encoding": encoding
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def extract_file(self, file_path: str, file_type: str) -> Dict:
        """Route extraction by file type"""
        if file_type.lower() == "pdf":
            return self.extract_pdf(file_path)
        elif file_type.lower() == "docx":
            return self.extract_docx(file_path)
        elif file_type.lower() == "txt":
            return self.extract_txt(file_path)
        else:
            return {"success": False, "error": f"Unsupported file type: {file_type}"}
    
    def clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text
    
    def chunk_text(self, text: str) -> List[Dict]:
        """Split text into chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunk_words = words[i:i + self.chunk_size]
            chunk_text = ' '.join(chunk_words)
            
            chunks.append({
                "chunk_id": len(chunks) + 1,
                "text": chunk_text,
                "token_count": len(chunk_words),
                "word_count": len(chunk_words)
            })
        
        return chunks
    
    async def process_document(self, file_path: str, file_type: str, 
                              document_title: str = None) -> Dict:
        """Complete document processing"""
        
        # Extract
        extraction_result = self.extract_file(file_path, file_type)
        
        if not extraction_result["success"]:
            return {
                "status": "error",
                "error": extraction_result.get("error"),
                "document_id": str(uuid.uuid4())
            }
        
        raw_text = extraction_result["text"]
        
        # Clean
        cleaned_text = self.clean_text(raw_text)
        
        # Chunk
        chunks = self.chunk_text(cleaned_text)
        
        # Stats
        total_words = len(cleaned_text.split())
        total_tokens = sum(c["token_count"] for c in chunks)
        
        return {
            "status": "success",
            "document_id": str(uuid.uuid4()),
            "file_name": Path(file_path).name,
            "file_type": file_type,
            "extraction": {
                "total_pages": extraction_result.get("page_count", 1),
                "total_words": total_words,
                "total_tokens": total_tokens
            },
            "content": {
                "raw_text": cleaned_text,
                "chunks": chunks,
                "metadata": {
                    "title": document_title or Path(file_path).stem,
                    "processed_at": datetime.utcnow().isoformat()
                }
            },
            "next_action": "ready_for_quiz_generation"
        }

# Initialize
doc_service = DocumentService()
```

### 2.4 Create Gemini Service

**File:** `app/services/gemini_service.py`

```python
import google.generativeai as genai
import json
import logging
from typing import Dict, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    """Integration with Google Gemini API"""
    
    DIFFICULTY_PROMPTS = {
        "easy": """Generate {num_questions} EASY {question_type} questions about:

{content}

Focus on:
- Basic facts and definitions
- Simple recall
- Straightforward concepts

Output ONLY valid JSON, no other text:
{format_spec}""",
        
        "medium": """Generate {num_questions} MEDIUM DIFFICULTY {question_type} questions about:

{content}

Requirements:
- Test conceptual understanding
- Require some analysis
- Not just simple recall

Output ONLY valid JSON:
{format_spec}""",
        
        "hard": """Generate {num_questions} HARD {question_type} questions requiring:

{content}

Must require:
- Deep understanding
- Critical thinking
- Analysis and synthesis

Output ONLY valid JSON:
{format_spec}"""
    }
    
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
    
    async def generate_quiz(self, prompt: str) -> Optional[Dict]:
        """Generate quiz using Gemini"""
        try:
            response = self.model.generate_content(prompt)
            return {
                "response": response.text,
                "success": True
            }
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def generate_json_response(self, prompt: str) -> Optional[Dict]:
        """Generate and parse JSON from Gemini"""
        response_data = await self.generate_quiz(prompt)
        
        if not response_data.get("success"):
            return None
        
        response_text = response_data.get("response", "")
        
        try:
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                parsed = json.loads(json_str)
                return parsed
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON from Gemini response")
        
        return None

gemini_service = GeminiService()
```

### 2.5 Create Quiz Generator

**File:** `app/services/quiz_generator.py`

```python
from typing import Dict
import uuid
from datetime import datetime
from app.models import QuizGenerationRequest, QuestionType
from app.services.gemini_service import gemini_service
import logging

logger = logging.getLogger(__name__)

class QuizGenerator:
    """Generate quizzes using Gemini"""
    
    FORMAT_TEMPLATES = {
        "multiple_choice": """{
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "type": "multiple_choice",
      "options": [
        {"id": "opt_1", "text": "Option 1", "is_correct": false},
        {"id": "opt_2", "text": "Option 2", "is_correct": true},
        {"id": "opt_3", "text": "Option 3", "is_correct": false},
        {"id": "opt_4", "text": "Option 4", "is_correct": false}
      ],
      "correct_answer": "opt_2",
      "explanation": "Why this is correct..."
    }
  ]
}""",
        "identification": """{
  "questions": [
    {
      "id": "q1",
      "question": "What is X?",
      "type": "identification",
      "correct_answer": "Answer",
      "acceptable_answers": ["alt1", "alt2"],
      "explanation": "Explanation..."
    }
  ]
}"""
    }
    
    async def generate_quiz(self, request: QuizGenerationRequest) -> Dict:
        """Generate complete quiz"""
        
        quiz_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        try:
            # Build prompt
            format_spec = self.FORMAT_TEMPLATES[request.quiz_config.question_type.value]
            
            prompt = f"""Generate {request.quiz_config.num_questions} {request.quiz_config.difficulty.value} {request.quiz_config.question_type.value} questions about:

{request.extracted_content[:3000]}

Return ONLY valid JSON, no markdown or explanations:
{format_spec}"""
            
            logger.info(f"Generating quiz {quiz_id} with Gemini")
            
            # Generate
            questions_data = await gemini_service.generate_json_response(prompt)
            
            if not questions_data or "questions" not in questions_data:
                return {
                    "status": "error",
                    "error": "Failed to generate quiz",
                    "quiz_id": quiz_id
                }
            
            questions = questions_data.get("questions", [])
            
            # Calculate metrics
            end_time = datetime.utcnow()
            generation_time = int((end_time - start_time).total_seconds() * 1000)
            
            return {
                "status": "success",
                "quiz_id": quiz_id,
                "metadata": {
                    "provider": "gemini",
                    "generation_time_ms": generation_time
                },
                "quiz": {
                    "title": f"{request.quiz_config.quiz_label} Quiz",
                    "label": request.quiz_config.quiz_label,
                    "difficulty": request.quiz_config.difficulty.value,
                    "question_type": request.quiz_config.question_type.value,
                    "total_questions": len(questions),
                    "created_at": start_time.isoformat()
                },
                "questions": questions,
                "warnings": []
            }
        
        except Exception as e:
            logger.error(f"Quiz generation failed: {str(e)}")
            return {
                "status": "error",
                "error": f"Quiz generation failed: {str(e)}",
                "quiz_id": quiz_id
            }

quiz_generator = QuizGenerator()
```

**Deliverable:**
- [ ] Document extraction working (PDF, DOCX, TXT)
- [ ] Text processing & chunking working
- [ ] Gemini API integration working
- [ ] Quiz generation working
- [ ] JSON parsing working
- [ ] Error handling in place

---

## Phase 3: API Routes (3-4 days)

### 3.1 Create FastAPI App

**File:** `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.config import settings

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

# Routes (will add in 3.2 & 3.3)

@app.on_event("startup")
async def startup():
    logger.info("AI Quiz Generator Service started")
    logger.info(f"Using Gemini API: {settings.gemini_model}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.fastapi_port)
```

### 3.2 Create Document Route

**File:** `app/routes/documents.py`

```python
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import aiofiles
import os
import uuid
from app.services.document_service import doc_service

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/documents/process")
async def process_document(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    user_id: str = Form(...),
    document_title: str = Form(None)
):
    """Process document and extract text"""
    
    try:
        # Validate
        if not file.filename:
            raise HTTPException(400, "No filename")
        if file.size > 50 * 1024 * 1024:
            raise HTTPException(413, "File too large")
        
        # Save
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Process
        result = await doc_service.process_document(
            file_path, file_type, document_title
        )
        
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return JSONResponse(result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Processing failed: {str(e)}")

# In app/main.py, add:
# from app.routes import documents
# app.include_router(documents.router, prefix="/api")
```

### 3.3 Create Quiz Route

**File:** `app/routes/quiz.py`

```python
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
        
        if result["status"] != "success":
            raise HTTPException(500, result.get("error"))
        
        return JSONResponse(result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz generation failed: {str(e)}")
        raise HTTPException(500, f"Failed: {str(e)}")

# In app/main.py, add:
# from app.routes import quiz
# app.include_router(quiz.router, prefix="/api")
```

### 3.4 Create Health Check

**File:** `app/routes/health.py`

```python
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

# In app/main.py, add:
# from app.routes import health
# app.include_router(health.router, prefix="/api")
```

**Deliverable:**
- [ ] FastAPI app running
- [ ] All routes working
- [ ] File upload handling
- [ ] Error handling in place

---

## Phase 4: Backend Integration (3-4 days)

### 4.1 Create AI Service Client

**File:** `backend/src/services/aiService.ts`

```typescript
import axios from 'axios';

const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';

class AIService {
  private client = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 65000,
  });

  async processDocument(file: File, userId: string, documentTitle?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', file.name.split('.').pop()?.toLowerCase() || 'txt');
    formData.append('user_id', userId);
    if (documentTitle) formData.append('document_title', documentTitle);

    const response = await this.client.post('/api/documents/process', formData);
    return response.data;
  }

  async generateQuiz(documentId: string, extractedContent: string, config: any, userId: string) {
    const response = await this.client.post('/api/quiz/generate', {
      document_id: documentId,
      extracted_content: extractedContent,
      quiz_config: config,
      user_id: userId,
    });
    return response.data;
  }
}

export default new AIService();
```

### 4.2 Create Quiz Route

**File:** `backend/src/routes/quizRoutes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import aiService from '../services/aiService';
import { prisma } from '../config/database';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/generate', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.userId;
    const { difficulty, questionType, numQuestions, quizLabel } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file' });

    // 1. Process document
    const docResult = await aiService.processDocument(file, userId, quizLabel);
    if (docResult.status !== 'success') {
      return res.status(500).json({ error: docResult.error });
    }

    // 2. Generate quiz
    const quizResult = await aiService.generateQuiz(
      docResult.document_id,
      docResult.content.raw_text,
      {
        difficulty,
        question_type: questionType,
        num_questions: numQuestions,
        quiz_label: quizLabel
      },
      userId
    );

    if (quizResult.status !== 'success') {
      return res.status(500).json({ error: quizResult.error });
    }

    // 3. Save to database
    const savedQuiz = await prisma.quiz.create({
      data: {
        userId,
        title: quizResult.quiz.title,
        label: quizResult.quiz.label,
        difficulty,
        questionType,
        totalQuestions: quizResult.quiz.total_questions,
        questions: {
          createMany: {
            data: quizResult.questions.map((q: any, idx: number) => ({
              question: q.question,
              answer: q.correct_answer,
              explanation: q.explanation,
              options: q.options || []
            }))
          }
        }
      }
    });

    res.json({ success: true, quiz: savedQuiz });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

export default router;
```

**Deliverable:**
- [ ] AI service client created
- [ ] Quiz generation endpoint working
- [ ] Database saving working
- [ ] End-to-end flow working

---

## Phase 5: Frontend Integration (3-4 days)

### 5.1 Quiz Generation Component

Create a form component that:
- [ ] Accepts file upload
- [ ] Selects difficulty level
- [ ] Selects question type
- [ ] Selects number of questions
- [ ] Calls backend endpoint
- [ ] Shows loading state
- [ ] Displays generated quiz

### 5.2 Quiz Display Component

- [ ] Shows questions one at a time
- [ ] Shows answer options
- [ ] Checks answers
- [ ] Shows explanations
- [ ] Tracks score
- [ ] Allows retry

**Deliverable:**
- [ ] File upload working
- [ ] Quiz display working
- [ ] User interactions working
- [ ] End-to-end tested

---

## Phase 6: Testing & Deployment (2-3 days)

### 6.1 Testing

```bash
# Test document extraction
curl -X POST http://localhost:8000/api/documents/process \
  -F "file=@sample.pdf" \
  -F "file_type=pdf" \
  -F "user_id=test"

# Test quiz generation
curl -X POST http://localhost:8000/api/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "123",
    "extracted_content": "Sample content...",
    "quiz_config": {
      "difficulty": "easy",
      "question_type": "multiple_choice",
      "num_questions": 3,
      "quiz_label": "Test"
    }
  }'
```

### 6.2 Deployment

Create Docker setup:

**File:** `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: studyapp
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: study_db
    ports:
      - "5432:5432"

  ai-service:
    build: ./ai-services
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - postgres

  backend:
    build: ./backend
    environment:
      AI_SERVICE_URL: http://ai-service:8000
    ports:
      - "3000:3000"
    depends_on:
      - ai-service
```

**Deliverable:**
- [ ] All tests passing
- [ ] Docker configured
- [ ] Production ready
- [ ] Documentation complete

---

## Quick Checklist

### Day 1
- [ ] Get Gemini API key
- [ ] Setup Python environment
- [ ] Install dependencies

### Day 2
- [ ] Implement document service
- [ ] Test PDF/DOCX/TXT extraction

### Day 3
- [ ] Implement Gemini service
- [ ] Test quiz generation

### Day 4
- [ ] Create FastAPI routes
- [ ] Test API endpoints

### Day 5-6
- [ ] Backend integration
- [ ] Frontend integration

### Day 7-8
- [ ] End-to-end testing
- [ ] Deployment
- [ ] Launch

---

## Success Metrics

| Milestone | Target | Status |
|-----------|--------|--------|
| API key obtained | Day 1 | ☐ |
| Document extraction | Day 2 | ☐ |
| Quiz generation | Day 3 | ☐ |
| API routes ready | Day 4 | ☐ |
| Backend integrated | Day 6 | ☐ |
| Frontend working | Day 7 | ☐ |
| End-to-end tested | Day 8 | ☐ |
| Deployed | Day 10 | ☐ |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "API key invalid" | Verify key at makersuite.google.com |
| "Rate limit" | Wait 1 minute, Gemini free has 60 req/min |
| "JSON parse error" | Check prompt format, retry |
| "File too large" | Reduce file size or increase limit |

---

## Timeline Summary

**Total: 2-3 weeks**

- Week 1: Setup + Document Service + Gemini Integration
- Week 2: API Routes + Backend Integration
- Week 3: Frontend + Testing + Deployment

Much simpler than the 6-week complex setup!