import uvicorn
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the server directory before anything else starts
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

if __name__ == "__main__":
    print("Starting AI Project Workspace FastAPI Server on http://localhost:8000...")
    print("API Docs available at: http://localhost:8000/docs")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
