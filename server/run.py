import os
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the server directory before anything else starts
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting AI Project Workspace FastAPI Server on port {port}...")
    print(f"API Docs available at: http://localhost:{port}/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
