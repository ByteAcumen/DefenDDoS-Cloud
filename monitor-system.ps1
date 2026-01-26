# Real-time System Monitoring Dashboard
# Monitors backend performance, database operations, and system resources

param(
    [int]$RefreshInterval = 2,
    [switch]$Continuous = $true
)

$API_KEY = 'defenddos-secret-key-123'
$BASE_URL = 'http://localhost:8082'

$headers = @{
    'X-API-KEY' = $API_KEY
}

function Get-ColoredStatus {
    param([double]$Value, [double]$Warning, [double]$Critical)
    
    if ($Value -lt $Warning) {
        return @{ Color = "Green"; Symbol = "✅" }
    } elseif ($Value -lt $Critical) {
        return @{ Color = "Yellow"; Symbol = "⚠️" }
    } else {
        return @{ Color = "Red"; Symbol = "🔴" }
    }
}

function Show-Dashboard {
    Clear-Host
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host "╔════════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                    DefenDDoS - Real-Time Monitoring Dashboard                      ║" -ForegroundColor Cyan
    Write-Host "║                    Last Updated: $timestamp                              ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

    # Backend Health
    try {
        $health = Invoke-RestMethod -Uri "$BASE_URL/actuator/health" -TimeoutSec 5
        $healthStatus = if ($health.status -eq 'UP') { @{ Color = "Green"; Symbol = "[OK]" } } else { @{ Color = "Red"; Symbol = "[FAIL]" } }
        
        Write-Host "BACKEND HEALTH: " -NoNewline
        Write-Host "$($healthStatus.Symbol) $($health.status)" -ForegroundColor $healthStatus.Color
    }
    catch {
        Write-Host "BACKEND HEALTH: [FAIL] DOWN" -ForegroundColor Red
    }

    # Docker Container Stats
    Write-Host "`nCONTAINER RESOURCES:" -ForegroundColor Yellow
    $containers = @('defenddos-backend', 'defenddos-influxdb', 'defenddos-redis', 'defenddos-ml-service')
    
    foreach ($container in $containers) {
        $stats = docker stats --no-stream --format "{{.Name}} {{.CPUPerc}} {{.MemUsage}}" $container 2>$null
        if ($stats) {
            $parts = $stats -split '\s+'
            $cpuPercent = [double]($parts[1] -replace '%', '')
            $memUsage = $parts[2]
            
            $cpuStatus = Get-ColoredStatus -Value $cpuPercent -Warning 70 -Critical 90
            
            Write-Host "  $container" -ForegroundColor Cyan
            Write-Host "    CPU: $($cpuStatus.Symbol) $($parts[1])  Memory: $memUsage" -ForegroundColor $cpuStatus.Color
        }
    }

    # Application Statistics
    Write-Host "`nAPPLICATION METRICS:" -ForegroundColor Yellow
    try {
        $stats = Invoke-RestMethod -Uri "$BASE_URL/api/v1/statistics/realtime" -Headers $headers -TimeoutSec 5
        if ($stats.success) {
            $data = $stats.data
            Write-Host "  Requests/sec: $($data.requestsPerSecond)" -ForegroundColor White
            Write-Host "  Bandwidth: $($data.bandwidthUsage)" -ForegroundColor White
            Write-Host "  Latency: $($data.latency)" -ForegroundColor White
            Write-Host "  CPU: $($data.cpuUsage)" -ForegroundColor White
            Write-Host "  Memory: $($data.memoryUsage)" -ForegroundColor White
        }
    }
    catch {
        Write-Host "  ⚠️ Unable to fetch statistics" -ForegroundColor Yellow
    }

    # Security Dashboard
    Write-Host "`nSECURITY STATUS:" -ForegroundColor Yellow
    try {
        $security = Invoke-RestMethod -Uri "$BASE_URL/api/v1/security/dashboard" -Headers $headers -TimeoutSec 5
        $threatStatus = if ($security.activeThreats -eq 0) { @{ Color = "Green"; Symbol = "[OK]" } } else { @{ Color = "Red"; Symbol = "[ALERT]" } }
        
        Write-Host "  Active Threats: $($threatStatus.Symbol) $($security.activeThreats)" -ForegroundColor $threatStatus.Color
        Write-Host "  System Health: $($security.systemHealth)" -ForegroundColor White
        Write-Host "  Detection Enabled: $($security.detectionEnabled)" -ForegroundColor White
        Write-Host "  Alerts Enabled: $($security.alertsEnabled)" -ForegroundColor White
    }
    catch {
        Write-Host "  ⚠️ Unable to fetch security status" -ForegroundColor Yellow
    }

    # ML Service Status
    Write-Host "`nML SERVICE:" -ForegroundColor Yellow
    try {
        $mlHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
        $mlStatus = if ($mlHealth.status -eq 'healthy') { @{ Color = "Green"; Symbol = "[OK]" } } else { @{ Color = "Red"; Symbol = "[FAIL]" } }
        
        Write-Host "  Status: $($mlStatus.Symbol) $($mlHealth.status)" -ForegroundColor $mlStatus.Color
        Write-Host "  RF Model: $(if ($mlHealth.rf_model_loaded) { '[OK] Loaded' } else { '[FAIL] Not Loaded' })" -ForegroundColor $(if ($mlHealth.rf_model_loaded) { "Green" } else { "Red" })
        Write-Host "  LSTM Model: $(if ($mlHealth.lstm_model_loaded) { '[OK] Loaded' } else { '[FAIL] Not Loaded' })" -ForegroundColor $(if ($mlHealth.lstm_model_loaded) { "Green" } else { "Red" })
        Write-Host "  Features: $($mlHealth.features_count)" -ForegroundColor White
    }
    catch {
        Write-Host "  ⚠️ ML Service unreachable" -ForegroundColor Yellow
    }

    # Recent Backend Errors
    Write-Host "`nRECENT ERRORS (Last 5):" -ForegroundColor Yellow
    $recentErrors = docker logs defenddos-backend --tail 100 2>&1 | Select-String "ERROR" | Select-Object -Last 5
    if ($recentErrors.Count -gt 0) {
        foreach ($error in $recentErrors) {
            Write-Host "  $($error.Line.Substring(0, [Math]::Min(100, $error.Line.Length)))..." -ForegroundColor Red
        }
    } else {
        Write-Host "  [OK] No recent errors" -ForegroundColor Green
    }

    # Database Stats (InfluxDB)
    Write-Host "`nDATABASE STATUS:" -ForegroundColor Yellow
    try {
        $influxHealth = Invoke-RestMethod -Uri "http://localhost:8086/health" -TimeoutSec 5
        $dbStatus = if ($influxHealth.status -eq 'pass') { @{ Color = "Green"; Symbol = "[OK]" } } else { @{ Color = "Red"; Symbol = "[FAIL]" } }
        Write-Host "  InfluxDB: $($dbStatus.Symbol) $($influxHealth.status)" -ForegroundColor $dbStatus.Color
    }
    catch {
        Write-Host "  InfluxDB: [FAIL] Unreachable" -ForegroundColor Red
    }

    Write-Host "`n╚════════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop monitoring | Refresh every $RefreshInterval seconds" -ForegroundColor Gray
}

# Main monitoring loop
if ($Continuous) {
    while ($true) {
        Show-Dashboard
        Start-Sleep -Seconds $RefreshInterval
    }
} else {
    Show-Dashboard
}
