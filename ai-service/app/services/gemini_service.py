import json
import logging
from typing import Dict, Optional
from google import genai
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    """Integration with Google Gemini API using google-genai SDK"""
    
    def __init__(self):
        # The new google-genai client uses the api_key passed in initialization 
        # or from the GEMINI_API_KEY environment variable.
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model
    
    async def generate_quiz(self, prompt: str) -> Optional[Dict]:
        """Generate quiz using Gemini"""
        try:
            # We are using generate_content. The synchronous method is available,
            # but for FastAPI, it's best to run blocking tasks in an executor or use async if provided.
            # Currently google-genai synchronous client is simple enough for this scope, 
            # though we could wrap it in asyncio.to_thread if we wanted strict async.
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
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
            # Clean up potential markdown formatting block like ```json ... ```
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
                
            clean_text = clean_text.strip()

            # Extract JSON from response in case there is text before/after
            json_start = clean_text.find('{')
            json_end = clean_text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = clean_text[json_start:json_end]
                parsed = json.loads(json_str)
                return parsed
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Gemini response: {e}\nResponse was: {response_text}")
        
        return None

gemini_service = GeminiService()
