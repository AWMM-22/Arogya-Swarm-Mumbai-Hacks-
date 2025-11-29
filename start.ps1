# Quick Start Script for Arogya-Swarm
# Run this to start the entire stack

Write-Host "🚀 Starting Arogya-Swarm Full Stack..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "📦 Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker is running" -ForegroundColor Green
Write-Host ""

# Start database services
Write-Host "🐘 Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database services started" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start database services" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✓ Services ready" -ForegroundColor Green
Write-Host ""

# Start backend
Write-Host "🔧 Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\jhasw\Desktop\MumbaiHacks\Arogya-Swarm-Mumbai-Hacks-\backend"
    & ".\venv\Scripts\activate.ps1"
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
}
Write-Host "✓ Backend starting (Job ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host "   Backend will be at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "⚛️  Starting frontend..." -ForegroundColor Yellow
Write-Host "   Frontend will be at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "🎉 Arogya-Swarm is starting!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Services:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Start frontend in foreground
Set-Location "frontend"
npm run dev
