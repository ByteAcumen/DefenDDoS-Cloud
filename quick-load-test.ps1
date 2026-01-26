# DefenDDoS - Quick Start Load Testing Script
# Runs all essential tests in sequence

param(
    [switch]$SkipInstall,
    [switch]$QuickTest
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         DefenDDoS - Quick Start Load Testing Suite            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "D:\Capstone Project\project"

# Step 1: Check if backend is running
Write-Host "🔍 Step 1: Checking backend status..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  ✅ Backend is running on port 8081" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "  Please start backend first:" -ForegroundColor Yellow
    Write-Host "    cd '$projectRoot\backend-service'" -ForegroundColor Gray
    Write-Host "    .\mvnw.cmd spring-boot:run" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Step 2: Install K6 if needed
if (!$SkipInstall) {
    Write-Host ""
    Write-Host "🔧 Step 2: Checking K6 installation..." -ForegroundColor Cyan
    
    $k6Installed = $null -ne (Get-Command k6 -ErrorAction SilentlyContinue)
    
    if (!$k6Installed) {
        Write-Host "  K6 not found. Installing via winget..." -ForegroundColor Yellow
        try {
            winget install k6 --silent
            Write-Host "  ✅ K6 installed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "  ❌ Failed to install K6. Install manually:" -ForegroundColor Red
            Write-Host "    winget install k6" -ForegroundColor Gray
            exit 1
        }
    }
    else {
        Write-Host "  ✅ K6 already installed" -ForegroundColor Green
    }
}

# Step 3: Run Load Tests
Write-Host ""
Write-Host "🚀 Step 3: Running Load Tests..." -ForegroundColor Cyan
Write-Host ""

Set-Location $projectRoot

if ($QuickTest) {
    # Quick 1-minute test
    Write-Host "Running quick 1-minute load test (10 users)..." -ForegroundColor Yellow
    k6 run --vus 10 --duration 1m .\load-tests\load-test.js
}
else {
    # Full test suite
    
    # Test 1: Smoke test (1 min, 5 users)
    Write-Host "Test 1/3: Smoke Test (1 min, 5 users)" -ForegroundColor Yellow
    k6 run --vus 5 --duration 1m .\load-tests\load-test.js
    
    Start-Sleep -Seconds 5
    
    # Test 2: Load test (5 min, 100 users)
    Write-Host ""
    Write-Host "Test 2/3: Load Test (5 min, 100 users)" -ForegroundColor Yellow
    k6 run --vus 100 --duration 5m .\load-tests\load-test.js
    
    Start-Sleep -Seconds 10
    
    # Test 3: Mini stress test (2 min, 200 users)
    Write-Host ""
    Write-Host "Test 3/3: Stress Test (2 min, 200 users)" -ForegroundColor Yellow
    k6 run --vus 200 --duration 2m .\load-tests\load-test.js
}

# Step 4: Database Verification
Write-Host ""
Write-Host "📊 Step 4: Running Database Verification..." -ForegroundColor Cyan
Write-Host ""

.\test-db-verification.ps1 -TestRecords 100 -ConcurrentThreads 10

# Step 5: Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                     Testing Complete! ✅                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review K6 output for performance metrics" -ForegroundColor Gray
Write-Host "  2. Check backend logs for errors" -ForegroundColor Gray
Write-Host "  3. Run DDoS simulation:" -ForegroundColor Gray
Write-Host "     k6 run .\load-tests\ddos-simulation.js" -ForegroundColor Cyan
Write-Host "  4. View metrics:" -ForegroundColor Gray
Write-Host "     http://localhost:8081/actuator/metrics" -ForegroundColor Cyan
Write-Host ""

Write-Host "For detailed guide, see: LOAD_TESTING_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
