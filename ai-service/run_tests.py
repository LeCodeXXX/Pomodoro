import requests
import time
import subprocess
import sys
import json

def main():
    # Start the FastAPI server in the background
    print("Starting FastAPI server...")
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        cwd=r"c:\Users\bench\pomodoro\ai-service"
    )
    
    try:
        # Wait a bit for the server to start
        print("Waiting for server to start...")
        time.sleep(3)
        
        # Test Health Check
        print("\n--- Testing Health Check ---")
        headers = {"X-API-Key": "dev_shared_api_key_pomodoro_2026"}
        health_res = requests.get("http://localhost:8000/api/health", headers=headers)
        print(f"Status Code: {health_res.status_code}")
        print(f"Response: {health_res.json()}")
        
        # Test Document Processing (TXT)
        print("\n--- Testing Document Processing (TXT) ---")
        with open("test_doc.txt", "rb") as f:
            files = {"file": ("test_doc.txt", f, "text/plain")}
            data = {
                "file_type": "txt",
                "user_id": "test_user",
                "document_title": "Test Document"
            }
            doc_res = requests.post("http://localhost:8000/api/documents/process", files=files, data=data, headers=headers)
            
        print(f"Status Code: {doc_res.status_code}")
        doc_data = doc_res.json()
        print(f"Response: {doc_data}")
        
        if doc_res.status_code == 200:
            print("\n--- Testing Quiz Generation ---")
            quiz_req = {
                "document_id": doc_data["document_id"],
                "extracted_content": doc_data["content"]["raw_text"],
                "quiz_config": {
                    "difficulty": "easy",
                    "question_type": "multiple_choice",
                    "num_questions": 2,
                    "quiz_label": "Test"
                },
                "user_id": "test_user"
            }
            quiz_res = requests.post("http://localhost:8000/api/quiz/generate", json=quiz_req, headers=headers)
            print(f"Status Code: {quiz_res.status_code}")
            try:
                quiz_data = quiz_res.json()
                # Print nicely formatted JSON to verify the structure
                print(f"Response: {json.dumps(quiz_data, indent=2)}")
            except Exception as e:
                print(f"Failed to parse quiz response: {quiz_res.text}")
        
    finally:
        print("\nShutting down server...")
        server.terminate()
        server.wait()

if __name__ == "__main__":
    main()
