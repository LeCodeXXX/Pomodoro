import uuid
import logging
from typing import Dict
from datetime import datetime
from app.models import QuizGenerationRequest
from app.services.gemini_service import gemini_service

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
    
    DIFFICULTY_PROMPTS = {
        "easy": """Generate {num_questions} EASY {question_type} questions about the following text.
Focus on: Basic facts and definitions, simple recall, straightforward concepts.

Text:
{content}

Return ONLY valid JSON matching this exact format, with no markdown formatting or other text:
{format_spec}""",
        
        "medium": """Generate {num_questions} MEDIUM DIFFICULTY {question_type} questions about the following text.
Requirements: Test conceptual understanding, require some analysis, not just simple recall.

Text:
{content}

Return ONLY valid JSON matching this exact format, with no markdown formatting or other text:
{format_spec}""",
        
        "hard": """Generate {num_questions} HARD {question_type} questions about the following text.
Requirements: Deep understanding, critical thinking, analysis and synthesis.

Text:
{content}

Return ONLY valid JSON matching this exact format, with no markdown formatting or other text:
{format_spec}"""
    }
    
    async def generate_quiz(self, request: QuizGenerationRequest) -> Dict:
        """Generate complete quiz"""
        
        quiz_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        try:
            # Build prompt
            q_type = request.quiz_config.question_type.value
            difficulty = request.quiz_config.difficulty.value
            num_q = request.quiz_config.num_questions
            
            format_spec = self.FORMAT_TEMPLATES.get(q_type, self.FORMAT_TEMPLATES["multiple_choice"])
            prompt_template = self.DIFFICULTY_PROMPTS.get(difficulty, self.DIFFICULTY_PROMPTS["medium"])
            
            # Limit the content to around ~15000 chars just to be safe if the chunk is huge
            content = request.extracted_content[:15000]
            
            prompt = prompt_template.format(
                num_questions=num_q,
                question_type=q_type,
                content=content,
                format_spec=format_spec
            )
            
            logger.info(f"Generating quiz {quiz_id} with Gemini. Config: {num_q} {difficulty} {q_type} questions.")
            
            # Generate
            questions_data = await gemini_service.generate_json_response(prompt)
            
            if not questions_data or "questions" not in questions_data:
                return {
                    "status": "error",
                    "error": "Failed to generate quiz. The AI did not return a valid JSON format.",
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
                    "difficulty": difficulty,
                    "question_type": q_type,
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
