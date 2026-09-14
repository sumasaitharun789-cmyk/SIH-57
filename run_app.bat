@echo off
echo ===================================================
echo Starting PulseDepth Integrated Application
echo Backend:  http://localhost:8000 (FastAPI Docs: /docs)
echo Frontend: http://localhost:3000 (Next.js Dashboard)
echo ===================================================

start "PulseDepth Backend (FastAPI)" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
start "PulseDepth Frontend (Next.js)" cmd /k "cd frontend && npm.cmd run dev"

echo Both services launched in separate windows.
