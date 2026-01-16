# ===================================
# DefenDDoS - Automated Testing Suite
# Tests all features end-to-end
# ===================================

param(
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Load,
    [switch]$All
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DefenDDoS - Automated Testing Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$ProjectRoot = "d:\Capstone Project\project"
$TestResults = @()

function Write-TestResult {
    param([string]$TestName, [bool]$Passed, [string]$Message = "")
    
    $result = @{
        Test = $TestName
        Passed = $Passed
        Message = $Message
        Timestamp = Get-Date
    }
    
    $script:TestResults += $result
    
    if ($Passed) {
        Write-Host "[PASS] $TestName" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $TestName - $Message" -ForegroundColor Red
    }
}

# ===================================
# UNIT TESTS
# ===================================
if ($Unit -or $All) {
    Write-Host "`n=== UNIT TESTS ===" -ForegroundColor Yellow
    Set-Location "$ProjectRoot\backend-service"
    
    Write-Host "Running Maven unit tests..." -ForegroundColor Cyan
    $output = & mvn test 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult "Maven Unit Tests" $true
    } else {
        Write-TestResult "Maven Unit Tests" $false "Tests failed - check logs"
    }
}

# ===================================
# INTEGRATION TESTS
# ===================================
if ($Integration -or $All) {
    Write-Host "`n=== INTEGRATION TESTS ===" -ForegroundColor Yellow
    
    # Test 1: Backend Health
    Write-Host "Testing backend health..." -ForegroundColor Cyan
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8081/actuator/health" -Method Get -TimeoutSec 5
        if ($health.status -eq "UP") {
            Write-TestResult "Backend Health Check" $true
        } else {
            Write-TestResult "Backend Health Check" $false "Status: $($health.status)"
        }
    } catch {
        Write-TestResult "Backend Health Check" $false $_.Exception.Message
    }
    
    # Test 2: ML Service Health
    Write-Host "Testing ML service health..." -ForegroundColor Cyan
    try {
        $mlHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
        Write-TestResult "ML Service Health" $true
    } catch {
        Write-TestResult "ML Service Health" $false $_.Exception.Message
    }
    
    # Test 3: Predictive Forecasting
    Write-Host "Testing predictive forecasting..." -ForegroundColor Cyan
    try {
        $forecast = Invoke-RestMethod -Uri "http://localhost:8081/api/forecast" -Method Get -TimeoutSec 10
        
        if ($forecast.attackProbability -ge 0 -and $forecast.attackProbability -le 1) {
            Write-TestResult "Predictive Forecasting" $true "Probability: $($forecast.attackProbability)"
        } else {
            Write-TestResult "Predictive Forecasting" $false "Invalid probability value"
        }
    } catch {
        Write-TestResult "Predictive Forecasting" $false $_.Exception.Message
    }
    
    # Test 4: Multi-Timeframe Forecast
    Write-Host "Testing multi-timeframe forecasting..." -ForegroundColor Cyan
    try {
        $multicast = Invoke-RestMethod -Uri "http://localhost:8081/api/forecast/multi?timeframes=15,30,60" -Method Get -TimeoutSec 10
        
        if ($multicast.forecasts.Count -eq 3) {
            Write-TestResult "Multi-Timeframe Forecast" $true "Got $($multicast.forecasts.Count) forecasts"
        } else {
            Write-TestResult "Multi-Timeframe Forecast" $false "Expected 3 forecasts, got $($multicast.forecasts.Count)"
        }
    } catch {
        Write-TestResult "Multi-Timeframe Forecast" $false $_.Exception.Message
    }
    
    # Test 5: Traffic Fingerprinting
    Write-Host "Testing traffic fingerprinting..." -ForegroundColor Cyan
    try {
        $fpRequest = @{
            sourceIp = "192.168.1.100"
            userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            tlsVersion = "771"
            cipherSuites = @("TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384")
            http2 = $true
            tcpWindowSize = 65535
            ttl = 64
        }
        
        $fp = Invoke-RestMethod -Uri "http://localhost:8081/api/fingerprint/generate" -Method Post -Body ($fpRequest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        
        if ($fp.compositeFingerprint) {
            Write-TestResult "Traffic Fingerprinting" $true "Fingerprint: $($fp.compositeFingerprint.Substring(0,16))..."
        } else {
            Write-TestResult "Traffic Fingerprinting" $false "No fingerprint generated"
        }
    } catch {
        Write-TestResult "Traffic Fingerprinting" $false $_.Exception.Message
    }
    
    # Test 6: Blockchain Threat Intelligence
    Write-Host "Testing blockchain threat intelligence..." -ForegroundColor Cyan
    try {
        $stats = Invoke-RestMethod -Uri "http://localhost:8081/api/threats/statistics" -Method Get -TimeoutSec 10
        
        if ($stats.totalReports -ge 0) {
            Write-TestResult "Blockchain Threat Intel" $true "Total Reports: $($stats.totalReports)"
        } else {
            Write-TestResult "Blockchain Threat Intel" $false "Invalid statistics"
        }
    } catch {
        Write-TestResult "Blockchain Threat Intel" $false $_.Exception.Message
    }
    
    # Test 7: IP Reputation
    Write-Host "Testing IP reputation system..." -ForegroundColor Cyan
    try {
        $rep = Invoke-RestMethod -Uri "http://localhost:8081/api/threats/reputation/192.168.1.100" -Method Get -TimeoutSec 10
        
        if ($rep.score -ge 0 -and $rep.score -le 100) {
            Write-TestResult "IP Reputation System" $true "Score: $($rep.score), Risk: $($rep.risk)"
        } else {
            Write-TestResult "IP Reputation System" $false "Invalid score"
        }
    } catch {
        Write-TestResult "IP Reputation System" $false $_.Exception.Message
    }
    
    # Test 8: Incident Response Playbooks
    Write-Host "Testing incident response playbooks..." -ForegroundColor Cyan
    try {
        $playbooks = Invoke-RestMethod -Uri "http://localhost:8081/api/incidents/playbooks" -Method Get -TimeoutSec 10
        
        if ($playbooks.Count -ge 4) {
            Write-TestResult "Incident Response Playbooks" $true "Found $($playbooks.Count) playbooks"
        } else {
            Write-TestResult "Incident Response Playbooks" $false "Expected at least 4 playbooks"
        }
    } catch {
        Write-TestResult "Incident Response Playbooks" $false $_.Exception.Message
    }
    
    # Test 9: Real-time Visualization
    Write-Host "Testing real-time visualization..." -ForegroundColor Cyan
    try {
        $heatmap = Invoke-RestMethod -Uri "http://localhost:8081/api/realtime/heatmap" -Method Get -TimeoutSec 10
        
        if ($heatmap.totalAttacks -ge 0) {
            Write-TestResult "Real-time Visualization" $true "Total Attacks: $($heatmap.totalAttacks)"
        } else {
            Write-TestResult "Real-time Visualization" $false "Invalid heatmap data"
        }
    } catch {
        Write-TestResult "Real-time Visualization" $false $_.Exception.Message
    }
    
    # Test 10: Historical Metrics
    Write-Host "Testing historical metrics..." -ForegroundColor Cyan
    try {
        $history = Invoke-RestMethod -Uri "http://localhost:8081/api/realtime/history/30" -Method Get -TimeoutSec 10
        
        if ($history.count -ge 0) {
            Write-TestResult "Historical Metrics" $true "Retrieved $($history.count) metrics"
        } else {
            Write-TestResult "Historical Metrics" $false "Invalid history data"
        }
    } catch {
        Write-TestResult "Historical Metrics" $false $_.Exception.Message
    }
    
    # Test 11: Attack Event Sharing
    Write-Host "Testing attack event sharing..." -ForegroundColor Cyan
    try {
        $attackReport = @{
            sourceIp = "192.168.1.200"
            attackType = "DDoS"
            severity = "CRITICAL"
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            details = @{
                method = "SYN_FLOOD"
                packetsPerSecond = 50000
            }
        }
        
        $result = Invoke-RestMethod -Uri "http://localhost:8081/api/threats/share" -Method Post -Body ($attackReport | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        
        if ($result.success) {
            Write-TestResult "Attack Event Sharing" $true "TX: $($result.transactionHash)"
        } else {
            Write-TestResult "Attack Event Sharing" $false $result.message
        }
    } catch {
        Write-TestResult "Attack Event Sharing" $false $_.Exception.Message
    }
    
    # Test 12: Playbook Execution
    Write-Host "Testing playbook execution..." -ForegroundColor Cyan
    try {
        $incident = @{
            playbookId = "PLAYBOOK_DDOS_001"
            incidentType = "DDoS Attack"
            severity = "CRITICAL"
            sourceIp = "192.168.1.201"
            description = "Test DDoS attack for automation"
            metadata = @{
                packetsPerSecond = 10000
            }
        }
        
        $execution = Invoke-RestMethod -Uri "http://localhost:8081/api/incidents/execute" -Method Post -Body ($incident | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        
        if ($execution.success) {
            Write-TestResult "Playbook Execution" $true "Incident: $($execution.incidentId)"
        } else {
            Write-TestResult "Playbook Execution" $false $execution.message
        }
    } catch {
        Write-TestResult "Playbook Execution" $false $_.Exception.Message
    }
}

# ===================================
# LOAD TESTS
# ===================================
if ($Load -or $All) {
    Write-Host "`n=== LOAD TESTS ===" -ForegroundColor Yellow
    
    if (Get-Command k6 -ErrorAction SilentlyContinue) {
        Write-Host "Running k6 load tests..." -ForegroundColor Cyan
        
        # Create k6 script
        $k6Script = @"
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp up
        { duration: '1m', target: 100 },  // Steady
        { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% under 500ms
        http_req_failed: ['rate<0.01'],   // Error rate under 1%
    },
};

export default function () {
    // Test forecast endpoint
    let forecast = http.get('http://localhost:8081/api/forecast');
    check(forecast, {
        'forecast status 200': (r) => r.status === 200,
        'forecast has probability': (r) => JSON.parse(r.body).attackProbability !== undefined,
    });
    
    sleep(1);
}
"@
        
        $k6Script | Out-File -FilePath "$ProjectRoot\load-test.js" -Encoding UTF8
        
        & k6 run "$ProjectRoot\load-test.js"
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Load Test (k6)" $true "Completed successfully"
        } else {
            Write-TestResult "Load Test (k6)" $false "Load test failed"
        }
    } else {
        Write-TestResult "Load Test (k6)" $false "k6 not installed"
    }
    
    # Simple load test without k6
    Write-Host "Running simple concurrency test..." -ForegroundColor Cyan
    $jobs = @()
    $startTime = Get-Date
    
    for ($i = 0; $i -lt 50; $i++) {
        $jobs += Start-Job -ScriptBlock {
            try {
                Invoke-RestMethod -Uri "http://localhost:8081/api/forecast" -Method Get -TimeoutSec 5 | Out-Null
                return $true
            } catch {
                return $false
            }
        }
    }
    
    $results = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job
    
    $successCount = ($results | Where-Object { $_ -eq $true }).Count
    $duration = (Get-Date) - $startTime
    
    if ($successCount -ge 45) {
        Write-TestResult "Concurrency Test (50 requests)" $true "$successCount/50 succeeded in $([math]::Round($duration.TotalSeconds, 2))s"
    } else {
        Write-TestResult "Concurrency Test (50 requests)" $false "Only $successCount/50 succeeded"
    }
}

# ===================================
# TEST SUMMARY
# ===================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passedTests = ($TestResults | Where-Object { $_.Passed }).Count
$failedTests = ($TestResults | Where-Object { !$_.Passed }).Count
$totalTests = $TestResults.Count

Write-Host "Total Tests:  $totalTests" -ForegroundColor White
Write-Host "Passed:       $passedTests" -ForegroundColor Green
Write-Host "Failed:       $failedTests" -ForegroundColor Red
Write-Host "Pass Rate:    $([math]::Round(($passedTests / $totalTests) * 100, 1))%" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Yellow" })

Write-Host "`nDetailed Results:" -ForegroundColor Cyan
$TestResults | Format-Table -Property Test, Passed, Message -AutoSize

# Export results
$TestResults | ConvertTo-Json | Out-File -FilePath "$ProjectRoot\test-results.json"
Write-Host "`nResults saved to: test-results.json" -ForegroundColor Gray

# Exit code
if ($failedTests -eq 0) {
    Write-Host "`n✅ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Some tests failed!" -ForegroundColor Red
    exit 1
}
