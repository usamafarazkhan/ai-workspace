@echo off
echo ===================================================
echo   multim-project - AI Workspace Multi-Agent Launcher
echo ===================================================
echo.

echo [1/2] Starting FastAPI Backend Server on http://localhost:8000 ...
start "FastAPI Backend Server" cmd /k "cd /d %~dp0server && pip install -r requirements.txt && python run.py"

timeout /t 3 >nul

echo [2/2] Starting Next.js Frontend Client on http://localhost:3000 ...
start "Next.js Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ===================================================
echo Both Backend (Port 8000) and Frontend (Port 3000) are starting up!
echo Open your browser at: http://localhost:3000
echo ===================================================
pause
