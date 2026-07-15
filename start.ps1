# HireMind AI — Start Script (Windows)
# Run this from the project root to start both backend and frontend

Write-Host "🧠 Starting HireMind AI..." -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "🚀 Starting FastAPI backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\uv_venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

Start-Sleep 2

# Start frontend
Write-Host "⚡ Starting Vite frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ HireMind AI is running!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
