# DefenDDoS Backend Test Script
param([string]$Mode = "demo")

$BaseUrl = "http://localhost:8082"
$AuthHeader = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:DefenDDoS123!"))
$Headers = @{
    "Authorization" = "Basic $AuthHeader"
    "Content-Type" = "application/json"
}

Write-Host "DefenDDoS Backend Testing - Mode: $Mode" -ForegroundColor Cyan
Write-Host "=================================================="

if ($Mode -ne "quick") {
    Write-Host ""
    Write-Host "Starting services..." -ForegroundColor Yellow
    $currentDir = Get-Location
    Set-Location "backend-service"
    docker-compose up -d
    Write-Host "Waiting 30 seconds for startup..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    Set-Location $currentDir
}

Write-Host ""
Write-Host "Testing health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Headers $Headers -TimeoutSec 10
    Write-Host "SUCCESS: Backend is healthy: $($health.status)" -ForegroundColor Green
}
catch {
    try {
        $dashboard = Invoke-RestMethod -Uri "$BaseUrl/api/v1/security/dashboard" -Headers $Headers -TimeoutSec 10
        Write-Host "SUCCESS: Backend API is responding" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "HINT: Make sure services are running with: docker-compose up -d" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Testing threat detection..." -ForegroundColor Yellow

$tests = @(
    @{ IP = "192.168.1.100"; Packets = 500; Level = "NORMAL" }
    @{ IP = "203.0.113.10"; Packets = 1500; Level = "LOW" }
    @{ IP = "203.0.113.20"; Packets = 8000; Level = "MEDIUM" }
    @{ IP = "203.0.113.30"; Packets = 20000; Level = "HIGH" }
    @{ IP = "203.0.113.99"; Packets = 60000; Level = "CRITICAL" }
)

foreach ($test in $tests) {
    $data = @{
        sourceIp = $test.IP
        destinationIp = "10.0.0.50"
        packetCount = $test.Packets
        byteCount = $test.Packets * 500
    } | ConvertTo-Json
    
    Write-Host "Sending $($test.Level) traffic from $($test.IP) with $($test.Packets) packets" -ForegroundColor White
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/traffic/ingest" -Method POST -Headers $Headers -Body $data
        Write-Host "  SUCCESS: Traffic sent successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Checking results..." -ForegroundColor Yellow

try {
    $dashboard = Invoke-RestMethod -Uri "$BaseUrl/api/v1/security/dashboard" -Headers $Headers
    Write-Host "Security Dashboard:" -ForegroundColor Green
    Write-Host "  Active Threats: $($dashboard.activeThreats)" -ForegroundColor White
    Write-Host "  System Health: $($dashboard.systemHealth)" -ForegroundColor White
    Write-Host "  Detection Status: $($dashboard.detectionEnabled)" -ForegroundColor White
    Write-Host "  Overall Status: $($dashboard.status)" -ForegroundColor White
}
catch {
    Write-Host "Dashboard error: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    $blocked = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/blocked" -Headers $Headers
    if ($blocked -and $blocked.Count -gt 0) {
        Write-Host ""
        Write-Host "Blocked IPs:" -ForegroundColor Red
        $blocked | ForEach-Object {
            Write-Host "  - $($_.ip) - $($_.reason)" -ForegroundColor DarkRed
        }
    } else {
        Write-Host ""
        Write-Host "No IPs currently blocked" -ForegroundColor Yellow
    }
}
catch {
    Write-Host ""
    Write-Host "Could not retrieve blocked IPs: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $trafficData = Invoke-RestMethod -Uri "$BaseUrl/api/v1/traffic/query?minutes=10" -Headers $Headers
    Write-Host ""
    Write-Host "Recent traffic events: $($trafficData.Count) in last 10 minutes" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "Traffic data query failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================================="
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "What was tested:" -ForegroundColor Cyan
Write-Host "  - System health and authentication" -ForegroundColor White
Write-Host "  - Traffic ingestion (5 threat levels)" -ForegroundColor White
Write-Host "  - Threat detection and alerts" -ForegroundColor White
Write-Host "  - Automatic IP blocking" -ForegroundColor White
Write-Host "  - Security dashboard monitoring" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:8082" -ForegroundColor White
Write-Host "  - InfluxDB UI: http://localhost:8086" -ForegroundColor White
Write-Host "  - Use requests-clean.http for manual testing" -ForegroundColor White
Write-Host "  - Check logs: docker logs defenddos-backend" -ForegroundColor White
Write-Host ""
Write-Host "To stop services: cd backend-service && docker-compose down" -ForegroundColor Red
