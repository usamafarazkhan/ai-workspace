import os
import sys
from pathlib import Path
from dotenv import load_dotenv

server_dir = Path(__file__).parent / "server"
sys.path.insert(0, str(server_dir))
load_dotenv(dotenv_path=server_dir / ".env")

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting AI Project Workspace FastAPI Server on port {port}...")
    print(f"API Docs available at: http://localhost:{port}/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
