import requests
import time
import subprocess
import os
import sys

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
        health_res = requests.get("http://localhost:8000/api/health")
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
            doc_res = requests.post("http://localhost:8000/api/documents/process", files=files, data=data)
            
        print(f"Status Code: {doc_res.status_code}")
        print(f"Response: {doc_res.json()}")
        
    finally:
        print("\nShutting down server...")
        server.terminate()
        server.wait()

if __name__ == "__main__":
    main()
