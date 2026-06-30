import re
from typing import List, Dict

def clean_text(text: str) -> str:
    """Clean extracted text by removing extra whitespace and normalizing."""
    # Remove extra whitespace and newlines
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[Dict]:
    """Split text into overlapping chunks based on word count."""
    words = text.split()
    chunks = []
    
    # Calculate step size ensuring it's at least 1
    step = max(1, chunk_size - chunk_overlap)
    
    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)
        
        chunks.append({
            "chunk_id": len(chunks) + 1,
            "text": chunk_text,
            "token_count": len(chunk_words), # Approximation
            "word_count": len(chunk_words)
        })
    
    return chunks
