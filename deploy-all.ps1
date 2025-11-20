# ===================================
# DefenDDoS - Complete Automation Script
# One-command deployment, testing, and monitoring
# ===================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DefenDDoS - Automated Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ErrorActionPreference = "Stop"
$ProjectRoot = "d:\Capstone Project\project"

# Functions
function Write-Status {
    param([string]$Message, [string]$Color = "Yellow")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Status $Message "Green"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Status $Message "Red"
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Step 1: Prerequisites Check
Write-Status "Checking prerequisites..."

$prerequisites = @{
    "docker" = "Docker"
    "docker-compose" = "Docker Compose"
    "mvn" = "Maven"
    "java" = "Java JDK 21"
    "node" = "Node.js"
}

$missingPrereqs = @()
foreach ($cmd in $prerequisites.Keys) {
    if (Test-Command $cmd) {
        Write-Success "$($prerequisites[$cmd]) installed"
    } else {
        Write-Error-Custom "$($prerequisites[$cmd]) NOT installed"
        $missingPrereqs += $prerequisites[$cmd]
    }
}

if ($missingPrereqs.Count -gt 0) {
    Write-Error-Custom "Missing prerequisites: $($missingPrereqs -join ', ')"
    Write-Host "Please install missing components and try again."
    exit 1
}

# Step 2: Clean Previous Builds
Write-Status "Cleaning previous builds..."
Set-Location $ProjectRoot

if (Test-Path "backend-service\target") {
    Remove-Item "backend-service\target" -Recurse -Force
    Write-Success "Cleaned backend target directory"
}

if (Test-Path "defenddos-frontend\.next") {
    Remove-Item "defenddos-frontend\.next" -Recurse -Force
    Write-Success "Cleaned frontend build directory"
}

# Step 3: Build Backend
Write-Status "Building backend service..."
Set-Location "$ProjectRoot\backend-service"

& mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Backend build failed"
    exit 1
}
Write-Success "Backend built successfully"

# Step 4: Build ML Service
Write-Status "Setting up ML service..."
Set-Location "$ProjectRoot\backend-service\ml-service"

if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Success "Created Python virtual environment"
}

& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt --quiet
Write-Success "ML service dependencies installed"
deactivate

# Step 5: Install Frontend Dependencies
Write-Status "Installing frontend dependencies..."
Set-Location "$ProjectRoot\defenddos-frontend"

if (Test-Command "pnpm") {
    pnpm install
} elseif (Test-Command "npm") {
    npm install
} else {
    Write-Error-Custom "Neither pnpm nor npm found"
    exit 1
}
Write-Success "Frontend dependencies installed"

# Step 6: Create Required Directories
Write-Status "Creating required directories..."
Set-Location $ProjectRoot

$directories = @(
    "monitoring",
    "nginx",
    "monitoring\grafana\dashboards",
    "monitoring\grafana\datasources",
    "backend-service\logs"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Success "Created directory: $dir"
    }
}

# Step 7: Create Prometheus Configuration
Write-Status "Creating Prometheus configuration..."
$prometheusConfig = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'defenddos-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['backend:8081']

  - job_name: 'defenddos-ml'
    static_configs:
      - targets: ['ml-service:8000']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'kafka'
    static_configs:
      - targets: ['kafka:9092']
"@

$prometheusConfig | Out-File -FilePath "monitoring\prometheus.yml" -Encoding UTF8
Write-Success "Created Prometheus configuration"

# Step 8: Create Nginx Configuration
Write-Status "Creating Nginx configuration..."
$nginxConfig = @"
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8081;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host `$host;
            proxy_cache_bypass `$http_upgrade;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }

        # WebSocket
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host `$host;
        }

        # Actuator endpoints
        location /actuator/ {
            proxy_pass http://backend;
        }
    }
}
"@

$nginxConfig | Out-File -FilePath "nginx\nginx.conf" -Encoding UTF8
Write-Success "Created Nginx configuration"

# Step 9: Start Docker Services
Write-Status "Starting Docker services..."
Set-Location $ProjectRoot

docker-compose down -v
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Docker services failed to start"
    exit 1
}

Write-Success "Docker services started"

# Step 10: Wait for Services to be Healthy
Write-Status "Waiting for services to be healthy (60 seconds)..."
Start-Sleep -Seconds 60

# Step 11: Health Checks
Write-Status "Running health checks..."

$healthChecks = @(
    @{ Name = "Backend"; Url = "http://localhost:8081/actuator/health" },
    @{ Name = "ML Service"; Url = "http://localhost:8000/health" },
    @{ Name = "Frontend"; Url = "http://localhost:3000" },
    @{ Name = "InfluxDB"; Url = "http://localhost:8086/health" },
    @{ Name = "Redis"; Url = "http://localhost:6379" },
    @{ Name = "Prometheus"; Url = "http://localhost:9090/-/healthy" },
    @{ Name = "Grafana"; Url = "http://localhost:3001/api/health" }
)

foreach ($check in $healthChecks) {
    try {
        $response = Invoke-WebRequest -Uri $check.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "$($check.Name) is healthy"
        } else {
            Write-Error-Custom "$($check.Name) returned status $($response.StatusCode)"
        }
    } catch {
        Write-Error-Custom "$($check.Name) health check failed"
    }
}

# Step 12: Run Feature Tests
Write-Status "Running feature tests..."

Write-Status "Testing Predictive Forecasting..."
try {
    $forecast = Invoke-RestMethod -Uri "http://localhost:8081/api/forecast" -Method Get -ErrorAction Stop
    Write-Success "Forecasting API working - Probability: $($forecast.attackProbability)"
} catch {
    Write-Error-Custom "Forecasting test failed: $_"
}

Write-Status "Testing Blockchain Threat Intel..."
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:8081/api/threats/statistics" -Method Get -ErrorAction Stop
    Write-Success "Threat Intel API working - Total Reports: $($stats.totalReports)"
} catch {
    Write-Error-Custom "Threat Intel test failed: $_"
}

Write-Status "Testing Real-time Visualization..."
try {
    $heatmap = Invoke-RestMethod -Uri "http://localhost:8081/api/realtime/heatmap" -Method Get -ErrorAction Stop
    Write-Success "Real-time API working - Total Attacks: $($heatmap.totalAttacks)"
} catch {
    Write-Error-Custom "Real-time test failed: $_"
}

Write-Status "Testing Incident Response..."
try {
    $playbooks = Invoke-RestMethod -Uri "http://localhost:8081/api/incidents/playbooks" -Method Get -ErrorAction Stop
    Write-Success "Incident Response API working - Playbooks: $($playbooks.Count)"
} catch {
    Write-Error-Custom "Incident Response test failed: $_"
}

# Step 13: Display URLs
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DefenDDoS Successfully Deployed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API:     http://localhost:8081" -ForegroundColor White
Write-Host "  ML Service:      http://localhost:8000" -ForegroundColor White
Write-Host "  Prometheus:      http://localhost:9090" -ForegroundColor White
Write-Host "  Grafana:         http://localhost:3001 (admin/admin123)" -ForegroundColor White
Write-Host "  InfluxDB:        http://localhost:8086" -ForegroundColor White
Write-Host ""
Write-Host "Key Endpoints:" -ForegroundColor Cyan
Write-Host "  Forecast:        http://localhost:8081/api/forecast" -ForegroundColor White
Write-Host "  Threat Intel:    http://localhost:8081/api/threats/statistics" -ForegroundColor White
Write-Host "  Heatmap:         http://localhost:8081/api/realtime/heatmap" -ForegroundColor White
Write-Host "  Playbooks:       http://localhost:8081/api/incidents/playbooks" -ForegroundColor White
Write-Host ""
Write-Host "Docker Status:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""
Write-Host "Logs:" -ForegroundColor Cyan
Write-Host "  View all logs:   docker-compose logs -f" -ForegroundColor White
Write-Host "  Backend logs:    docker-compose logs -f backend" -ForegroundColor White
Write-Host "  ML logs:         docker-compose logs -f ml-service" -ForegroundColor White
Write-Host ""
Write-Host "Management:" -ForegroundColor Cyan
Write-Host "  Stop all:        docker-compose stop" -ForegroundColor White
Write-Host "  Restart:         docker-compose restart" -ForegroundColor White
Write-Host "  Shutdown:        docker-compose down" -ForegroundColor White
Write-Host ""
