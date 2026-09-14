Write-Host '===================================================' -ForegroundColor Cyan
Write-Host 'Starting PulseDepth Integrated Application' -ForegroundColor Cyan
Write-Host 'Backend:  http://localhost:8000 (FastAPI Docs: /docs)' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000 (Next.js Dashboard)' -ForegroundColor Green
Write-Host '===================================================' -ForegroundColor Cyan

Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; & .venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm.cmd run dev'

Write-Host 'Both services have been launched in dedicated terminals.' -ForegroundColor Yellow
