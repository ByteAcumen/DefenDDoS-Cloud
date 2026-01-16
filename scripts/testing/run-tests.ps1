# DefenDDoS Test Execution Script
# Comprehensive script to run all tests

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "backend", "frontend", "unit", "integration", "e2e", "load", "security")]
    [string]$TestType = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Message" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

# Start
Write-Header "DefenDDoS Comprehensive Test Runner"

# Backend Tests
function Run-BackendUnitTests {
    Write-Header "Running Backend Unit Tests"
    Set-Location "backend-service"
    
    try {
        mvn test
        Write-Success "Backend unit tests passed!"
    } catch {
        Write-Error-Custom "Backend unit tests failed!"
        throw
    } finally {
        Set-Location ..
    }
}

function Run-BackendIntegrationTests {
    Write-Header "Running Backend Integration Tests"
    Set-Location "backend-service"
    
    Write-Info "Starting InfluxDB container..."
    docker-compose up -d influxdb
    Start-Sleep -Seconds 10
    
    try {
        mvn verify -P integration-tests
        Write-Success "Backend integration tests passed!"
    } catch {
        Write-Error-Custom "Backend integration tests failed!"
        throw
    } finally {
        Write-Info "Stopping InfluxDB container..."
        docker-compose down
        Set-Location ..
    }
}

# Frontend Tests
function Run-FrontendUnitTests {
    Write-Header "Running Frontend Unit Tests"
    Set-Location "defenddos-frontend"
    
    if (-not $SkipInstall) {
        Write-Info "Installing dependencies..."
        pnpm install
    }
    
    try {
        pnpm test:ci
        Write-Success "Frontend unit tests passed!"
    } catch {
        Write-Error-Custom "Frontend unit tests failed!"
        throw
    } finally {
        Set-Location ..
    }
}

function Run-FrontendE2ETests {
    Write-Header "Running Frontend E2E Tests"
    Set-Location "defenddos-frontend"
    
    if (-not $SkipInstall) {
        Write-Info "Installing dependencies..."
        pnpm install
        pnpm exec cypress install
    }
    
    Write-Info "Building application..."
    pnpm build
    
    Write-Info "Starting application..."
    $process = Start-Process -FilePath "pnpm" -ArgumentList "start" -PassThru -NoNewWindow
    Start-Sleep -Seconds 30
    
    try {
        pnpm test:e2e
        Write-Success "Frontend E2E tests passed!"
    } catch {
        Write-Error-Custom "Frontend E2E tests failed!"
        throw
    } finally {
        Write-Info "Stopping application..."
        Stop-Process -Id $process.Id -Force
        Set-Location ..
    }
}

# Load Tests
function Run-LoadTests {
    Write-Header "Running Load Tests"
    
    # Check if K6 is installed
    try {
        k6 version | Out-Null
    } catch {
        Write-Error-Custom "K6 is not installed. Please install K6 first."
        Write-Info "Installation: https://k6.io/docs/get-started/installation/"
        return
    }
    
    Set-Location "backend-service"
    
    Write-Info "Starting services..."
    docker-compose up -d
    Start-Sleep -Seconds 30
    
    try {
        Set-Location "k6-tests"
        Write-Info "Running load test..."
        k6 run load-test.js --env BASE_URL=http://localhost:8080
        Write-Success "Load tests completed!"
    } catch {
        Write-Error-Custom "Load tests failed!"
        throw
    } finally {
        Set-Location ..
        Write-Info "Stopping services..."
        docker-compose down
        Set-Location ..
    }
}

# Security Tests
function Run-SecurityTests {
    Write-Header "Running Security Tests"
    
    # Check if Python is installed
    try {
        python --version | Out-Null
    } catch {
        Write-Error-Custom "Python is not installed."
        return
    }
    
    Set-Location "backend-service"
    
    Write-Info "Starting API server..."
    docker-compose up -d
    Start-Sleep -Seconds 30
    
    try {
        Set-Location "security-tests"
        Write-Info "Running OWASP ZAP baseline scan..."
        python run-security-tests.py baseline
        Write-Success "Security tests completed!"
    } catch {
        Write-Error-Custom "Security tests failed!"
        throw
    } finally {
        Set-Location ..
        Write-Info "Stopping services..."
        docker-compose down
        Set-Location ..
    }
}

# Execute tests based on parameter
try {
    switch ($TestType) {
        "all" {
            Run-BackendUnitTests
            Run-BackendIntegrationTests
            Run-FrontendUnitTests
            Run-FrontendE2ETests
            Run-LoadTests
            Run-SecurityTests
        }
        "backend" {
            Run-BackendUnitTests
            Run-BackendIntegrationTests
        }
        "frontend" {
            Run-FrontendUnitTests
            Run-FrontendE2ETests
        }
        "unit" {
            Run-BackendUnitTests
            Run-FrontendUnitTests
        }
        "integration" {
            Run-BackendIntegrationTests
        }
        "e2e" {
            Run-FrontendE2ETests
        }
        "load" {
            Run-LoadTests
        }
        "security" {
            Run-SecurityTests
        }
    }
    
    Write-Header "All Tests Completed Successfully! 🎉"
    Write-Success "Test suite execution completed without errors"
    
} catch {
    Write-Header "Tests Failed ❌"
    Write-Error-Custom "Some tests failed. Please check the output above."
    exit 1
}
