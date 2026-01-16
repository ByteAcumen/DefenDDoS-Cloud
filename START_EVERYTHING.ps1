# DefenDDoS - Start Everything Script
# Starts all services: Redis, InfluxDB, Backend, Frontend

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           DefenDDoS Cloud - Service Launcher                 ║" -ForegroundColor Cyan
Write-Host "║                   v2.0 - Production Ready                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
if (-not $projectRoot) { $projectRoot = "D:\Capstone Project\project" }

# Step 1: Start Docker Services (Redis + InfluxDB)
Write-Host "🐳 Step 1: Starting Docker Services..." -ForegroundColor Cyan

try {
    Set-Location "$projectRoot\backend-service"
    docker start defenddos-redis defenddos-influxdb 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   Creating new containers..." -ForegroundColor Yellow
        docker-compose up -d redis influxdb 2>$null
    }
    Write-Host "   ✅ Redis and InfluxDB containers started" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Docker not available or containers failed" -ForegroundColor Yellow
}

Start-Sleep -Seconds 3

# Step 2: Check Backend
Write-Host ""
Write-Host "🔧 Step 2: Checking Backend Service..." -ForegroundColor Cyan
$backendRunning = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend is already running on port 8081" -ForegroundColor Green
        $backendRunning = $true
    }
}
catch {
    Write-Host "   ⚠️  Backend is not running" -ForegroundColor Yellow
}

if (-not $backendRunning) {
    Write-Host ""
    $startBackend = Read-Host "   Start backend now? (y/n)"
    
    if ($startBackend -eq 'y') {
        Write-Host "   Loading environment variables..." -ForegroundColor Cyan
        Set-Location "$projectRoot\backend-service"
        
        # Load environment variables
        if (Test-Path ".env") {
            Get-Content ".env" | ForEach-Object {
                if ($_ -match '^([^#][^=]+)=(.*)$') {
                    [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
                }
            }
        }
        
        # Start backend in new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend-service'; .\mvnw.cmd spring-boot:run" -WindowStyle Normal
        
        Write-Host "   ✅ Backend is starting in a new window..." -ForegroundColor Green
        Write-Host "   ⏳ Waiting 30 seconds for initialization..." -ForegroundColor Yellow
        
        Start-Sleep -Seconds 30
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -UseBasicParsing -TimeoutSec 5
            Write-Host "   ✅ Backend is now running!" -ForegroundColor Green
        }
        catch {
            Write-Host "   ⚠️  Backend may still be starting. Check the other window." -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Step 2: Check Frontend
Write-Host "🔍 Step 2: Checking Frontend Service..." -ForegroundColor Cyan
$frontendRunning = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "✅ Frontend is running on port 3000" -ForegroundColor Green
    $frontendRunning = $true
}
catch {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -ErrorAction SilentlyContinue
        Write-Host "✅ Frontend is running on port 3001" -ForegroundColor Green
        $frontendRunning = $true
    }
    catch {
        Write-Host "⚠️  Frontend is not running" -ForegroundColor Yellow
    }
}

if (!$frontendRunning) {
    Write-Host ""
    Write-Host "🚀 Starting Frontend Service..." -ForegroundColor Cyan
    Write-Host ""
    
    $startFrontend = Read-Host "Start frontend now? (y/n)"
    
    if ($startFrontend -eq 'y') {
        Write-Host "Starting frontend dev server..." -ForegroundColor Cyan
        Set-Location "$projectRoot\defenddos-frontend"
        
        # Start in background
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\defenddos-frontend'; npm run dev" -WindowStyle Normal
        
        Write-Host "✅ Frontend is starting in a new window..." -ForegroundColor Green
        Write-Host "⏳ Waiting 15 seconds for dev server to start..." -ForegroundColor Yellow
        
        Start-Sleep -Seconds 15
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Status Summary                                " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Final Status Check
Write-Host "🔍 Final Status Check..." -ForegroundColor Cyan
Write-Host ""

# Redis
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 6379)
    $tcpClient.Close()
    Write-Host "   ✅ Redis:      RUNNING on localhost:6379" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Redis:      NOT RUNNING" -ForegroundColor Red
}

# Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ Backend:    RUNNING on http://localhost:8081" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Backend:    NOT RUNNING" -ForegroundColor Red
}

# ML Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ ML Service: RUNNING on http://localhost:8000" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  ML Service: NOT RUNNING (optional)" -ForegroundColor Yellow
}

# InfluxDB
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8086/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ InfluxDB:   RUNNING on http://localhost:8086" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ InfluxDB:   NOT RUNNING" -ForegroundColor Red
}

# Frontend
$frontendUrl = ""
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3
    $frontendUrl = "http://localhost:3000"
    Write-Host "✅ Frontend: RUNNING on $frontendUrl" -ForegroundColor Green
}
catch {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3
        $frontendUrl = "http://localhost:3001"
        Write-Host "✅ Frontend: RUNNING on $frontendUrl" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Frontend: NOT RUNNING" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Quick Links                                   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if ($frontendUrl) {
    Write-Host "🌐 Open Dashboard: $frontendUrl/dashboard" -ForegroundColor Cyan
}
else {
    Write-Host "⚠️  Frontend not running. Start it manually." -ForegroundColor Yellow
}

Write-Host "   📊 Backend API:    http://localhost:8081" -ForegroundColor Cyan
Write-Host "   🔴 Redis:          localhost:6379" -ForegroundColor Cyan
Write-Host "   🤖 ML Service:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "   💾 InfluxDB:       http://localhost:8086" -ForegroundColor Cyan

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  All Done! 🎉                                  " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if ($frontendUrl) {
    $openBrowser = Read-Host "Open dashboard in browser? (y/n)"
    if ($openBrowser -eq 'y') {
        Start-Process "$frontendUrl/dashboard"
    }
}
