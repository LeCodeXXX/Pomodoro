from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import aiofiles
import os
import uuid
import logging
from app.services.document_service import doc_service
from app.utils.security import get_api_key
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/documents/process", dependencies=[Depends(get_api_key)])
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
            
        # Extension validation
        ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS or file_type.lower() not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
        
        # Save
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        
        # Stream write chunk by chunk with size limit check to prevent DoS
        limit = settings.max_file_size_mb * 1024 * 1024
        total_bytes = 0
        async with aiofiles.open(file_path, 'wb') as f:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > limit:
                    raise HTTPException(413, f"File too large. Maximum size is {settings.max_file_size_mb}MB.")
                await f.write(chunk)
        
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
