from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import aiofiles
import os
import uuid
import logging
from app.services.document_service import doc_service

router = APIRouter()
logger = logging.getLogger(__name__)

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
    
    file_path = None
    try:
        # Validate
        if not file.filename:
            raise HTTPException(400, "No filename")
        
        # Save
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            
            # Very basic size check here. Better done via middleware/config
            if len(content) > 50 * 1024 * 1024:
                raise HTTPException(413, "File too large. Maximum size is 50MB.")
                
            await f.write(content)
        
        # Process
        result = await doc_service.process_document(
            file_path, file_type, document_title
        )
        
        if result.get("status") == "error":
             # We can decide to map this to a 400 or 500 depending on the exact error, but 400 is safer for extraction failures
             raise HTTPException(400, result.get("error", "Failed to extract text from document"))
             
        return JSONResponse(result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(500, f"Processing failed: {str(e)}")
    finally:
        # Cleanup
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.error(f"Failed to cleanup file {file_path}: {str(e)}")
