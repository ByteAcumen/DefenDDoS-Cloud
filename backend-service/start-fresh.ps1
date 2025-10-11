# DefenDDoS Quick Start Script
# This script performs a complete fresh start of the backend

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "           DEFENDDOS BACKEND - FRESH START SCRIPT              " -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "   ✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Navigate to backend-service directory
Write-Host ""
Write-Host "📂 Navigating to backend-service directory..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "   ✅ Current directory: $(Get-Location)" -ForegroundColor Green

# Step 1: Stop and remove existing containers
Write-Host ""
Write-Host "🛑 Step 1: Stopping existing containers..." -ForegroundColor Yellow
docker-compose down -v 2>&1 | Out-Null
Write-Host "   ✅ Existing containers stopped and removed" -ForegroundColor Green

# Step 2: Clean Docker system (optional - commented out by default)
# Write-Host ""
# Write-Host "🧹 Step 2: Cleaning Docker system..." -ForegroundColor Yellow
# docker system prune -af --volumes 2>&1 | Out-Null
# Write-Host "   ✅ Docker system cleaned" -ForegroundColor Green

# Step 3: Build services
Write-Host ""
Write-Host "🔨 Step 2: Building services (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ All services built successfully" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build failed. Please check errors above." -ForegroundColor Red
    exit 1
}

# Step 4: Start services
Write-Host ""
Write-Host "🚀 Step 3: Starting services..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ All services started successfully" -ForegroundColor Green
} else {
    Write-Host "   ❌ Start failed. Please check errors above." -ForegroundColor Red
    exit 1
}

# Step 5: Wait for services to be ready
Write-Host ""
Write-Host "⏳ Step 4: Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "   ✅ Services should be ready now" -ForegroundColor Green

# Step 6: Verify services
Write-Host ""
Write-Host "🔍 Step 5: Verifying services..." -ForegroundColor Yellow

# Check Backend
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:8082/actuator/health" -TimeoutSec 5
    if ($backend.status -eq "UP") {
        Write-Host "   ✅ Backend Service: RUNNING (Port 8082)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend Service: NOT HEALTHY" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Backend Service: NOT RESPONDING" -ForegroundColor Red
    Write-Host "      Try: docker-compose logs backend-service" -ForegroundColor Gray
}

# Check ML Service
try {
    $ml = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    if ($ml.status -eq "healthy") {
        Write-Host "   ✅ ML Service: RUNNING (Port 8000)" -ForegroundColor Green
        Write-Host "      • Random Forest: $($ml.models.random_forest)" -ForegroundColor Gray
        Write-Host "      • LSTM Autoencoder: $($ml.models.lstm_autoencoder)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  ML Service: NOT HEALTHY" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ ML Service: NOT RESPONDING" -ForegroundColor Red
    Write-Host "      Try: docker-compose logs ml-service" -ForegroundColor Gray
}

# Check InfluxDB
try {
    $influx = Invoke-RestMethod -Uri "http://localhost:8086/health" -TimeoutSec 5
    if ($influx.status -eq "pass") {
        Write-Host "   ✅ InfluxDB: RUNNING (Port 8086)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  InfluxDB: NOT HEALTHY" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ InfluxDB: NOT RESPONDING" -ForegroundColor Red
    Write-Host "      Try: docker-compose logs influxdb" -ForegroundColor Gray
}

# Step 7: Show running containers
Write-Host ""
Write-Host "🐳 Step 6: Docker Containers Status" -ForegroundColor Yellow
docker-compose ps

# Step 8: Quick test
Write-Host ""
Write-Host "🧪 Step 7: Running quick test..." -ForegroundColor Yellow
try {
    $testData = @{
        sourceIp = "192.168.1.100"
        destinationIp = "10.0.0.1"
        packetCount = 1000
        byteCount = 64000
    }
    
    $result = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
        -Method POST `
        -Body ($testData | ConvertTo-Json) `
        -ContentType "application/json" `
        -TimeoutSec 5
    
    if ($result.success) {
        Write-Host "   ✅ Traffic ingestion test PASSED" -ForegroundColor Green
        Write-Host "      Ingested from: $($result.data.sourceIp)" -ForegroundColor Gray
        Write-Host "      Packets: $($result.data.packetCount)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Traffic ingestion test FAILED" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Traffic ingestion test FAILED" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Final summary
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    STARTUP COMPLETE                            " -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 SYSTEM STATUS:" -ForegroundColor White
Write-Host "   Backend API:    http://localhost:8082" -ForegroundColor Cyan
Write-Host "   ML Service:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "   InfluxDB:       http://localhost:8086" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 DOCUMENTATION:" -ForegroundColor White
Write-Host "   Startup Guide:  STARTUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "   API Reference:  docs/FRONTEND_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host "   Quick Ref:      docs/API_QUICK_REFERENCE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 USEFUL COMMANDS:" -ForegroundColor White
Write-Host "   View logs:      docker-compose logs -f" -ForegroundColor Gray
Write-Host "   Stop services:  docker-compose down" -ForegroundColor Gray
Write-Host "   Restart:        docker-compose restart" -ForegroundColor Gray
Write-Host "   Check status:   docker-compose ps" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Ready for frontend development!" -ForegroundColor Green
Write-Host ""
