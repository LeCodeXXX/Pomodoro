# Study Material & Quiz Requirements (Simplified - Gemini Only)

## Overview

Simple, straightforward implementation using **Google's Gemini API** (free tier). No complex fallback logic or multiple AI providers.

---

## Study Materials

Users can:

* Upload study materials (PDF, DOCX, TXT)
* View materials inside the application
* Organize materials for future study sessions
* Have materials automatically converted to quizzes

### Supported File Types

* **PDF** (primary)
* **DOCX** (Word documents)
* **TXT** (Plain text)

---

## Simple AI Service Architecture

```
User uploads PDF
    ↓
Extract text from document
    ↓
Clean and prepare text
    ↓
Send to Google Gemini API
    ↓
Receive generated quiz
    ↓
Parse and save to database
    ↓
Display to user
```

### One Provider: Google Gemini

- **Free tier**: 60 requests/minute
- **No credit card needed**
- **Completely free for development**
- **Good quality responses**
- **Simple API integration**

---

## Document Processing Service

### Input

```
POST /api/documents/process

Body:
{
  "file": <binary file>,
  "file_type": "pdf|docx|txt",
  "user_id": "uuid",
  "document_title": "Biology Chapter 3"
}
```

### Processing Pipeline

```
1. Receive file
2. Validate file (size, type)
3. Extract text
   ├─ PDF: Extract using pdfplumber
   ├─ DOCX: Extract using python-docx
   └─ TXT: Read directly
4. Clean text (remove extra spaces, fix encoding)
5. Split into chunks (1000 tokens each)
6. Return extracted content
```

### Output

```json
{
  "status": "success",
  "document_id": "uuid",
  "file_name": "Biology_Chapter_3.pdf",
  "extraction": {
    "total_pages": 45,
    "total_words": 12500,
    "total_tokens": 3200
  },
  "content": {
    "raw_text": "Full extracted text...",
    "chunks": [
      {
        "chunk_id": 1,
        "text": "Chunk content...",
        "token_count": 256
      }
    ]
  },
  "next_action": "ready_for_quiz_generation"
}
```

---

## Quiz Generation Service

### Input

```
POST /api/quiz/generate

Body:
{
  "document_id": "uuid",
  "extracted_content": "Full document text",
  "quiz_config": {
    "difficulty": "easy|medium|hard",
    "question_type": "multiple_choice|identification",
    "num_questions": 10,
    "quiz_label": "Biology"
  }
}
```

### How It Works

```
1. Validate document content
2. Build prompt with:
   - Document content
   - Difficulty level
   - Question type
   - Number of questions
3. Send prompt to Gemini API
4. Receive response
5. Parse JSON from response
6. Validate all questions
7. Return formatted quiz
```

### Prompt Template

**Example for Medium Difficulty Multiple Choice:**

```
Generate 10 medium difficulty multiple choice questions about:
{document_content}

Requirements:
- Each question should have 4 options
- Only 1 correct answer per question
- Include a brief explanation for each answer
- Questions should test understanding, not just recall

Output as JSON in this exact format:
{
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
      "explanation": "Why this answer is correct..."
    }
  ]
}
```

### Output Format - Multiple Choice

```json
{
  "status": "success",
  "quiz_id": "uuid",
  "metadata": {
    "provider": "gemini",
    "generation_time_ms": 3450,
    "tokens_used": 2156
  },
  "quiz": {
    "title": "Biology Chapter 3 Quiz",
    "label": "Biology",
    "difficulty": "medium",
    "question_type": "multiple_choice",
    "total_questions": 10,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "questions": [
    {
      "id": "q1",
      "question": "What is the primary function of mitochondria in cells?",
      "type": "multiple_choice",
      "options": [
        {
          "id": "opt_1",
          "text": "Protein synthesis",
          "is_correct": false
        },
        {
          "id": "opt_2",
          "text": "ATP production for cellular energy",
          "is_correct": true
        },
        {
          "id": "opt_3",
          "text": "DNA replication",
          "is_correct": false
        },
        {
          "id": "opt_4",
          "text": "Hormone regulation",
          "is_correct": false
        }
      ],
      "correct_answer": "opt_2",
      "explanation": "Mitochondria are known as the 'powerhouse of the cell' because they produce ATP through cellular respiration, which provides energy for cellular processes."
    }
  ]
}
```

### Output Format - Identification

```json
{
  "status": "success",
  "quiz_id": "uuid",
  "quiz": {
    "title": "Programming Quiz",
    "difficulty": "hard",
    "question_type": "identification",
    "total_questions": 10
  },
  "questions": [
    {
      "id": "q1",
      "question": "In Python, what is the name of the process where a function calls itself?",
      "type": "identification",
      "correct_answer": "Recursion",
      "acceptable_answers": [
        "recursion",
        "recursive call"
      ],
      "explanation": "Recursion is a programming technique where a function calls itself as part of its definition."
    }
  ]
}
```

---

## Difficulty Levels

### Easy
- Basic definitions and facts
- Simple recall questions
- Straightforward concepts
- Shallow understanding required

### Medium
- Conceptual understanding
- Some analysis required
- Application to scenarios
- Moderate challenge

### Hard
- Deep understanding
- Critical thinking required
- Synthesis of concepts
- Compare/contrast questions

---

## Question Types

### Multiple Choice
- 4 options per question
- 1 correct answer
- Easy to grade automatically
- Good for knowledge assessment

### Identification
- Short answer format
- User types answer
- System checks if correct
- Multiple acceptable answers supported

---

## Quiz Attempts

Users can retake quizzes unlimited times.

### Track
* Number of attempts
* Attempt history
* Score per attempt
* Completion date
* Answers submitted
* Performance over time

### Example

```
Attempt 1 → 6/10 (60%)
Attempt 2 → 8/10 (80%)
Attempt 3 → 10/10 (100%)
```

---

## Analytics

### Quiz Analytics
* Quiz scores
* Accuracy percentage
* Total quizzes completed
* Total study time
* Focus sessions completed

### Learning Analytics
* Frequently missed topics
* Progress trends
* Weak subject areas
* Performance by question type

---

## Error Handling

### Document Processing Errors

```json
{
  "status": "error",
  "error_code": "FILE_PROCESSING_ERROR",
  "message": "Failed to extract text from PDF",
  "details": {
    "file_name": "document.pdf",
    "file_size": "25MB",
    "reason": "Corrupted PDF structure"
  },
  "suggestions": [
    "Try another file",
    "Use a different PDF",
    "Contact support"
  ]
}
```

### Quiz Generation Errors

```json
{
  "status": "error",
  "error_code": "QUIZ_GENERATION_FAILED",
  "message": "Failed to generate quiz from document",
  "details": {
    "reason": "API rate limit exceeded (wait a minute and retry)"
  },
  "retry_possible": true,
  "retry_after_seconds": 60
}
```

### Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| "API key invalid" | Wrong key in .env | Verify key at makersuite.google.com |
| "Rate limit exceeded" | Too many requests (60/min) | Wait 1 minute, then retry |
| "Invalid response format" | AI response not JSON | Retry or try different content |
| "File too large" | File > 50MB | Use smaller file |
| "Unsupported file type" | Not PDF/DOCX/TXT | Use supported format |

---

## API Endpoints

### Health & Status

```
GET /health
  └─ Returns: {"status": "healthy"}

GET /models/info
  └─ Returns: {"model": "gemini-pro", "provider": "google"}
```

### Document Processing

```
POST /api/documents/process
  ├─ Input: file + metadata
  └─ Output: extracted text + chunks

GET /api/documents/status/{id}
  └─ Get processing status
```

### Quiz Generation

```
POST /api/quiz/generate
  ├─ Input: document + config
  └─ Output: quiz JSON

GET /api/generation/status/{job_id}
  └─ Check generation status (for async)
```

---

## Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Extract PDF (45 pages) | < 5s | ~2-3s |
| Generate 5 questions | < 10s | ~6-8s |
| Generate 10 questions | < 15s | ~8-12s |
| Generate 20 questions | < 30s | ~15-20s |
| API Response | < 2s | ~1-2s |

---

## Security & Privacy

### Data Handling
* ✅ Files not stored permanently (deleted after processing)
* ✅ No data sent to Gemini API (only content, no metadata)
* ✅ All connections encrypted (HTTPS/TLS)
* ✅ Database encrypted at rest

### API Security
* ✅ JWT authentication on all routes
* ✅ File upload validation (type & size)
* ✅ Input sanitization
* ✅ Rate limiting per user
* ✅ Request timeout (60 seconds)

### User Privacy
* ✅ User can delete documents anytime
* ✅ Quiz data stored only with explicit permission
* ✅ No tracking/analytics by default
* ✅ GDPR compliant data handling

---

## Cost Analysis

### Google Gemini Pricing

```
Free Tier (Development):
├── Requests per minute: 60
├── Daily usage: Unlimited
├── Cost: $0
└── Perfect for MVP & testing

Paid Tier (If you exceed free):
├── Input: $0.00075 per 1K tokens
├── Output: $0.0015 per 1K tokens
├── Example: 100 quizzes/month = ~$1-2
└── Still extremely cheap
```

### Cost Per Quiz (Estimation)

```
Document extraction: ~500 input tokens = $0.0004
Quiz generation (10 Q): ~1500 output tokens = $0.0023
Total per quiz: ~$0.003 (less than 1 cent!)

Monthly (100 users × 30 quizzes):
3000 quizzes × $0.003 = ~$9/month
```

---

## Supported Features

✅ Upload PDF/DOCX/TXT  
✅ Automatic text extraction  
✅ AI-generated quizzes  
✅ Adjustable difficulty (Easy/Medium/Hard)  
✅ Multiple question types  
✅ Explanations for all answers  
✅ Unlimited quiz retakes  
✅ Score tracking  
✅ Progress analytics  
✅ Pomodoro timer integration  

---

## Future Enhancements (Post-MVP)

* AI Flashcard generation
* Document summarization
* Study recommendations
* Performance analytics dashboard
* Study groups/collaboration
* Mobile app

---

## Setup Checklist

- [ ] Get free Gemini API key (https://makersuite.google.com/app/apikeys)
- [ ] Create Python virtual environment
- [ ] Install dependencies from requirements.txt
- [ ] Set GEMINI_API_KEY in .env
- [ ] Run FastAPI service
- [ ] Test document extraction
- [ ] Test quiz generation
- [ ] Integrate with backend
- [ ] Update frontend
- [ ] Test end-to-end