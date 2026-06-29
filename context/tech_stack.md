# Tech Stack (Simplified - Free Cloud AI Only)

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion

## Backend (Node.js)

* Node.js
* Express.js
* JWT Authentication
* Axios (HTTP client for AI service)
* Multer (File upload handling)

## AI Services Layer (Simplified)

### Python-based AI Service

* **Python 3.9+**
* **FastAPI** (async API framework)
* **Uvicorn** (ASGI server)
* **PyPDF2 / pdfplumber** (PDF extraction)
* **python-docx** (DOCX parsing)
* **google-generativeai** (Google Gemini API)
* **python-dotenv** (Environment configuration)
* **Pydantic** (Data validation)

## Cloud AI (Single Provider)

* **Google Gemini API** (Free tier: 60 requests/minute, no credit card needed)

## Database

* PostgreSQL
* Prisma ORM

## File Storage

### Development

* Local Storage (`/uploads` directory)

### Production

* Supabase Storage or Amazon S3

---

## Simplified Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
│              Vite + TypeScript + Tailwind               │
└──────────────────────┬──────────────────────────────────┘
                       │ (HTTP/REST)
┌──────────────────────▼──────────────────────────────────┐
│              Backend (Node.js + Express)                │
│  - File Upload Handler (Multer)                         │
│  - Quiz API Endpoints                                   │
│  - Authentication (JWT)                                 │
│  - Request Orchestration                                │
└──────────────────────┬──────────────────────────────────┘
                       │ (HTTP/REST)
┌──────────────────────▼──────────────────────────────────┐
│          AI Services (Python + FastAPI)                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │   Document Processing Service                   │    │
│  │   - PDF Extraction (PyPDF2/pdfplumber)         │    │
│  │   - DOCX Parsing (python-docx)                 │    │
│  │   - Text Cleaning & Chunking                   │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │   Quiz Generation Service                       │    │
│  │   - Gemini API Integration                      │    │
│  │   - Response Parsing & Validation               │    │
│  │   - No fallback needed                          │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │   Google Gemini API      │
        │   (Free Tier)            │
        │   60 req/min             │
        │   No credit card needed  │
        └──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL + Prisma ORM                    │
│  - Quiz data, User data, Analytics                     │
└───────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────┐
│    File Storage (S3 / Supabase / Local)                │
│    - Uploaded PDFs, Documents                          │
└───────────────────────────────────────────────────────────┘
```

---

## Service Folder Structure (Simplified)

```
project-root/
├── frontend/                    # React application
├── backend/                     # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── services/
│   ├── uploads/                # Temporary file storage
│   └── .env
│
├── ai-services/                # Python AI Services (SIMPLIFIED)
│   ├── app/
│   │   ├── main.py            # FastAPI app entry
│   │   ├── config.py          # Configuration & env vars
│   │   ├── models.py          # Pydantic models
│   │   ├── constants.py       # Prompts & constants
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── document_service.py      # PDF/DOCX extraction
│   │   │   └── gemini_service.py        # Gemini API integration
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py              # Health check
│   │   │   ├── process_document.py    # Document processing
│   │   │   └── generate_quiz.py       # Quiz generation
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── text_processing.py     # Chunking, cleaning
│   │       └── response_parser.py     # JSON parsing
│   │
│   ├── requirements.txt         # Python dependencies (MINIMAL)
│   ├── .env.example            # Environment template
│   ├── Dockerfile              # Containerization
│   └── README.md               # AI Service documentation
│
└── docker-compose.yml          # Multi-container orchestration
```

---

## Simplified Technology Purpose

| Technology         | Purpose                                      |
| ------------------ | -------------------------------------------- |
| Python + FastAPI   | AI Service backend                           |
| PyPDF2/pdfplumber  | PDF text extraction                          |
| python-docx        | DOCX file parsing                            |
| google-generativeai | Gemini API client (free cloud AI)            |
| Pydantic           | Data validation                              |
| Express.js         | Request orchestration                        |
| Axios              | HTTP communication                           |
| PostgreSQL         | Persistent storage                           |
| Prisma             | ORM & database client                        |

---

## Environment Variables

### Backend (.env)

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/study_db
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=60000
```

### AI Service (.env)

```
ENVIRONMENT=development
FASTAPI_PORT=8000
LOG_LEVEL=info

# Gemini API Configuration
GEMINI_API_KEY=your_free_api_key_here
GEMINI_MODEL=gemini-pro

# File Processing
MAX_FILE_SIZE_MB=50
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
SUPPORTED_FORMATS=pdf,docx,txt
```

---

## Python Dependencies (Simplified)

```
fastapi==0.104.0
uvicorn==0.24.0
pydantic==2.4.0
pydantic-settings==2.0.0
python-dotenv==1.0.0

# Document Processing
PyPDF2==3.0.0
pdfplumber==0.10.0
python-docx==0.8.11
chardet==5.2.0

# AI (Only Gemini - Free)
google-generativeai==0.3.0
requests==2.31.0

# Utilities
python-multipart==0.0.6
aiofiles==23.2.1
```

---

## Setup Instructions

### 1. Get Free Gemini API Key

```bash
# Go to: https://makersuite.google.com/app/apikeys
# 1. Sign in with Google account (free)
# 2. Click "Create API key"
# 3. Copy the key to .env file
# No credit card needed!
```

### 2. Install & Run

```bash
# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set API key in .env
GEMINI_API_KEY=your_key_here

# Run service
python -m uvicorn app.main:app --reload
```

### 3. Verify Working

```bash
# Health check
curl http://localhost:8000/health

# Should return:
# {"status": "healthy", "ai_provider": "gemini"}
```

---

## Deployment Architecture

### Development

```
Local Machine
├── Frontend: localhost:5173 (Vite dev server)
├── Backend: localhost:3000 (Express)
└── AI Services: localhost:8000 (FastAPI)
```

### Production

```
Cloud Provider (AWS/GCP/Heroku)
├── Frontend: CDN (Vercel/CloudFront)
├── Backend: App Server (ECS/Railway)
├── AI Services: App Server (same as backend or separate)
└── Database: Managed PostgreSQL
```

---

## Cost Comparison

### This Simplified Approach

```
Google Gemini Free Tier:
├── Price: $0
├── Requests/min: 60
├── Requests/day: Unlimited
├── Models: gemini-pro (latest)
├── No credit card needed
└── Perfect for MVP & development

Monthly Cost: $0
```

### If You Exceed Free Tier (optional)

```
Google AI Studio Pricing:
├── Input: $0.00075 per 1K tokens (~$0.50/month if heavy use)
├── Output: $0.0015 per 1K tokens (~$1/month if heavy use)
└── Total: ~$1-2/month for heavy usage

Still extremely cheap!
```

---

## Key Features

✅ **No local AI infrastructure needed** - Just a Python service  
✅ **No Docker Compose complexity** - Ollama not needed  
✅ **Extremely simple setup** - Just get API key and go  
✅ **Free to start** - No credit card  
✅ **Scalable** - Easy to upgrade to paid later  
✅ **Reliable** - Google's infrastructure  
✅ **Fast responses** - Cloud-based  
✅ **No fallback logic needed** - Single provider  

---

## Comparison: Before vs After Simplification

| Aspect | Complex Setup | Simplified |
|--------|---------------|-----------|
| AI Providers | 2 (Ollama + Claude) | 1 (Gemini) |
| Fallback Logic | Yes (Ollama→Claude) | No |
| Local Setup | Ollama installation | Just API key |
| Infrastructure | Ollama + Python service | Just Python service |
| Cost | $0 (local) or $30/mo | $0 always |
| Learning Curve | Medium-High | Low |
| Dependencies | 20+ | 10 |
| Config Complexity | High | Low |
| Time to MVP | 6 weeks | 2-3 weeks |

---

## What's Removed

❌ Ollama integration  
❌ Local model management  
❌ Claude API integration  
❌ Fallback mechanism  
❌ LangChain  
❌ Model selection logic  
❌ Local AI setup complexity  

---

## What's Kept

✅ Document processing (PDF, DOCX, TXT)  
✅ Text chunking & cleaning  
✅ Quiz generation  
✅ JSON parsing & validation  
✅ Error handling  
✅ FastAPI service architecture  
✅ Database integration  
✅ All quality features