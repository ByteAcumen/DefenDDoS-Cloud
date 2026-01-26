# Comprehensive Testing Suite for DefenDDoS Backend
# Run all load tests, database verification, and generate reports

param(
    [ValidateSet('smoke', 'load', 'stress', 'spike', 'database', 'all')]
    [string]$TestType = 'all',
    
    [switch]$SkipPreChecks,
    [switch]$GenerateReport = $true,
    [string]$OutputDir = ".\test-reports"
)

$ErrorActionPreference = 'Continue'
$API_KEY = 'defenddos-secret-key-123'
$BASE_URL = 'http://localhost:8082'

# Ensure output directory exists
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

function Write-TestSection {
    param([string]$Title, [string]$Color = "Cyan")
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor $Color
    Write-Host "║  $Title" -ForegroundColor $Color
    Write-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-TestSection "🔍 CHECKING PREREQUISITES" "Yellow"
    
    $allGood = $true

    # Check if services are running
    Write-Host "Checking Docker services..." -ForegroundColor Yellow
    $services = @('defenddos-backend', 'defenddos-influxdb', 'defenddos-redis', 'defenddos-ml-service')
    
    foreach ($service in $services) {
        $container = docker ps --filter "name=$service" --format "{{.Names}}"
        if ($container -eq $service) {
            Write-Host "  ✅ $service is running" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $service is NOT running" -ForegroundColor Red
            $allGood = $false
        }
    }

    # Check backend health
    Write-Host "`nChecking backend health..." -ForegroundColor Yellow
    try {
        $health = Invoke-RestMethod -Uri "$BASE_URL/actuator/health" -TimeoutSec 5
        if ($health.status -eq 'UP') {
            Write-Host "  ✅ Backend health: UP" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Backend health: $($health.status)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  ❌ Backend health check failed" -ForegroundColor Red
        $allGood = $false
    }

    # Check K6 installation
    Write-Host "`nChecking K6 installation..." -ForegroundColor Yellow
    try {
        $k6Version = k6 version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ K6 is installed: $($k6Version | Select-Object -First 1)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ K6 is not installed" -ForegroundColor Red
            Write-Host "  Install with: winget install k6.k6" -ForegroundColor Yellow
            $allGood = $false
        }
    }
    catch {
        Write-Host "  ❌ K6 is not installed" -ForegroundColor Red
        $allGood = $false
    }

    if (-not $allGood) {
        Write-Host "`n❌ Prerequisites not met. Please fix the issues above." -ForegroundColor Red
        return $false
    }

    Write-Host "`n✅ All prerequisites met. Ready for testing!" -ForegroundColor Green
    return $true
}

function Start-SmokeTest {
    Write-TestSection "🔥 SMOKE TEST (2 minutes)" "Yellow"
    Write-Host "Purpose: Verify basic functionality before heavy testing`n" -ForegroundColor Gray
    
    $startTime = Get-Date
    k6 run --quiet .\tests\k6-smoke-test.js
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMinutes

    return @{
        Name = "Smoke Test"
        Duration = "$([Math]::Round($duration, 2)) minutes"
        Passed = $LASTEXITCODE -eq 0
    }
}

function Start-LoadTest {
    Write-TestSection "📊 LOAD TEST (15 minutes)" "Cyan"
    Write-Host "Purpose: Simulate normal production traffic`n" -ForegroundColor Gray
    
    $startTime = Get-Date
    k6 run --quiet .\tests\k6-load-test.js
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMinutes

    return @{
        Name = "Load Test"
        Duration = "$([Math]::Round($duration, 2)) minutes"
        Passed = $LASTEXITCODE -eq 0
    }
}

function Start-StressTest {
    Write-TestSection "🔥 STRESS TEST (30 minutes)" "Red"
    Write-Host "Purpose: Find system breaking point`n" -ForegroundColor Gray
    
    $startTime = Get-Date
    k6 run --quiet .\tests\k6-stress-test.js
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMinutes

    return @{
        Name = "Stress Test"
        Duration = "$([Math]::Round($duration, 2)) minutes"
        Passed = $LASTEXITCODE -eq 0
    }
}

function Start-SpikeTest {
    Write-TestSection "⚡ SPIKE TEST (5 minutes)" "Magenta"
    Write-Host "Purpose: Test sudden traffic surges`n" -ForegroundColor Gray
    
    $startTime = Get-Date
    k6 run --quiet .\tests\k6-spike-test.js
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMinutes

    return @{
        Name = "Spike Test"
        Duration = "$([Math]::Round($duration, 2)) minutes"
        Passed = $LASTEXITCODE -eq 0
    }
}

function Start-DatabaseVerification {
    Write-TestSection "💾 DATABASE VERIFICATION (10 minutes)" "Green"
    Write-Host "Purpose: Verify data integrity and performance`n" -ForegroundColor Gray
    
    $startTime = Get-Date
    .\tests\verify-database.ps1 -Action All
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMinutes

    return @{
        Name = "Database Verification"
        Duration = "$([Math]::Round($duration, 2)) minutes"
        Passed = $LASTEXITCODE -eq 0
    }
}

function Get-SystemMetrics {
    Write-Host "`nCollecting system metrics..." -ForegroundColor Yellow
    
    # Docker stats
    $dockerStats = docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | Out-String
    
    # Backend logs (last 50 errors)
    $backendErrors = docker logs defenddos-backend --tail 100 2>&1 | Select-String "ERROR" | Select-Object -Last 50
    
    return @{
        DockerStats = $dockerStats
        ErrorCount = $backendErrors.Count
        Errors = $backendErrors
    }
}

function New-TestReport {
    param([array]$TestResults, [hashtable]$SystemMetrics, [datetime]$StartTime, [datetime]$EndTime)
    
    $reportPath = Join-Path $OutputDir "comprehensive-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
    $totalDuration = ($EndTime - $StartTime).TotalMinutes
    $passedTests = ($TestResults | Where-Object { $_.Passed }).Count
    $failedTests = ($TestResults | Where-Object { -not $_.Passed }).Count

    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>DefenDDoS Comprehensive Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
        h1 { color: #333; font-size: 42px; margin-bottom: 10px; border-bottom: 4px solid #667eea; padding-bottom: 15px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .metric-value { font-size: 48px; font-weight: bold; margin: 10px 0; }
        .metric-label { font-size: 16px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
        .test-result { background: #f8f9fa; border-left: 5px solid #28a745; padding: 20px; margin: 15px 0; border-radius: 5px; }
        .test-result.failed { border-left-color: #dc3545; background: #fff5f5; }
        .test-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .test-duration { color: #666; font-size: 14px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #667eea; color: white; font-weight: 600; }
        tr:hover { background: #f5f5f5; }
        .error-section { background: #fff3cd; border-left: 5px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .code-block { background: #2d2d2d; color: #f8f8f2; padding: 20px; border-radius: 5px; overflow-x: auto; font-family: 'Courier New', monospace; margin: 15px 0; }
        .recommendation { background: #e7f3ff; border-left: 5px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ DefenDDoS - Comprehensive Test Report</h1>
        <p style="font-size: 18px; color: #666;">Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-label">Total Duration</div>
                <div class="metric-value">$([Math]::Round($totalDuration, 1)) min</div>
            </div>
            <div class="metric">
                <div class="metric-label">Tests Passed</div>
                <div class="metric-value">$passedTests</div>
            </div>
            <div class="metric">
                <div class="metric-label">Tests Failed</div>
                <div class="metric-value">$failedTests</div>
            </div>
            <div class="metric">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value">$([Math]::Round(($passedTests / $TestResults.Count) * 100, 1))%</div>
            </div>
        </div>

        <h2>📊 Test Results</h2>
        $(foreach ($result in $TestResults) {
            $statusClass = if ($result.Passed) { "passed" } else { "failed" }
            $statusBadge = if ($result.Passed) { "✅ PASSED" } else { "❌ FAILED" }
            $badgeClass = if ($result.Passed) { "status-passed" } else { "status-failed" }
            @"
        <div class="test-result $statusClass">
            <div class="test-name">$($result.Name)</div>
            <div class="test-duration">Duration: $($result.Duration)</div>
            <span class="status-badge $badgeClass">$statusBadge</span>
        </div>
"@
        })

        <h2>🖥️ System Metrics</h2>
        <div class="code-block">
$($SystemMetrics.DockerStats)
        </div>

        $(if ($SystemMetrics.ErrorCount -gt 0) {
            @"
        <div class="error-section">
            <h3>⚠️ Errors Detected: $($SystemMetrics.ErrorCount)</h3>
            <p>Review backend logs for details. Last 10 errors:</p>
            <div class="code-block">
$(($SystemMetrics.Errors | Select-Object -First 10 | Out-String).Trim())
            </div>
        </div>
"@
        } else {
            @"
        <div class="recommendation">
            <h3>✅ No Errors Detected</h3>
            <p>System is running cleanly without errors.</p>
        </div>
"@
        })

        <div class="recommendation">
            <h3>💡 Recommendations</h3>
            <ul>
                $(if ($failedTests -gt 0) {
                    "<li>🔴 <strong>$failedTests test(s) failed</strong> - Review logs and fix issues before production</li>"
                })
                $(if ($SystemMetrics.ErrorCount -gt 10) {
                    "<li>⚠️ <strong>High error count</strong> ($($SystemMetrics.ErrorCount)) - Investigate backend logs</li>"
                })
                $(if ($passedTests -eq $TestResults.Count) {
                    "<li>✅ <strong>All tests passed</strong> - System is production-ready</li>"
                })
                <li>📊 Review detailed K6 reports in <code>$OutputDir</code> for performance metrics</li>
                <li>💾 Check InfluxDB data retention policies and storage usage</li>
                <li>🔒 Verify security configurations and API key management</li>
                <li>📈 Set up continuous monitoring with Prometheus/Grafana</li>
            </ul>
        </div>

        <div class="footer">
            <p>DefenDDoS Backend Testing Suite v1.0</p>
            <p>For questions or issues, refer to the testing documentation</p>
        </div>
    </div>
</body>
</html>
"@

    $html | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host "`n📄 Report generated: $reportPath" -ForegroundColor Green
    
    return $reportPath
}

# Main execution
Write-Host @"

╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     DefenDDoS Backend - Comprehensive Testing Suite v1.0          ║
║                                                                    ║
║     Testing: $TestType
║     Output: $OutputDir
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green -BackgroundColor DarkGreen

$overallStartTime = Get-Date

# Prerequisites check
if (-not $SkipPreChecks) {
    if (-not (Test-Prerequisites)) {
        Write-Host "`n❌ Exiting due to failed prerequisites." -ForegroundColor Red
        exit 1
    }
}

$testResults = @()

# Run tests based on type
switch ($TestType) {
    'smoke' {
        $testResults += Start-SmokeTest
    }
    'load' {
        $testResults += Start-LoadTest
    }
    'stress' {
        $testResults += Start-StressTest
    }
    'spike' {
        $testResults += Start-SpikeTest
    }
    'database' {
        $testResults += Start-DatabaseVerification
    }
    'all' {
        Write-Host "`n⏱️ Running complete test suite (estimated 60 minutes)..." -ForegroundColor Yellow
        Write-Host "You can stop at any time with Ctrl+C`n" -ForegroundColor Gray
        
        $testResults += Start-SmokeTest
        if ($testResults[-1].Passed) {
            $testResults += Start-LoadTest
            $testResults += Start-SpikeTest
            $testResults += Start-DatabaseVerification
            
            # Stress test is optional and takes longest
            $response = Read-Host "`nRun stress test (30 minutes)? [Y/n]"
            if ($response -ne 'n') {
                $testResults += Start-StressTest
            }
        } else {
            Write-Host "`n❌ Smoke test failed. Skipping remaining tests." -ForegroundColor Red
        }
    }
}

$overallEndTime = Get-Date

# Collect system metrics
$systemMetrics = Get-SystemMetrics

# Generate report
if ($GenerateReport) {
    Write-TestSection "📊 GENERATING COMPREHENSIVE REPORT" "Cyan"
    $reportPath = New-TestReport -TestResults $testResults -SystemMetrics $systemMetrics -StartTime $overallStartTime -EndTime $overallEndTime
    
    # Open report in browser
    Start-Process $reportPath
}

# Final summary
Write-TestSection "📋 FINAL SUMMARY" "Green"
Write-Host "Total Duration: $([Math]::Round(($overallEndTime - $overallStartTime).TotalMinutes, 2)) minutes" -ForegroundColor White
Write-Host "Tests Passed: $(($testResults | Where-Object { $_.Passed }).Count) / $($testResults.Count)" -ForegroundColor Green
Write-Host "Tests Failed: $(($testResults | Where-Object { -not $_.Passed }).Count) / $($testResults.Count)" -ForegroundColor $(if (($testResults | Where-Object { -not $_.Passed }).Count -eq 0) { "Green" } else { "Red" })

if (($testResults | Where-Object { -not $_.Passed }).Count -eq 0) {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "║  ✅ ALL TESTS PASSED - SYSTEM IS PRODUCTION-READY                 ║" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green -BackgroundColor DarkGreen
    exit 0
} else {
    Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow -BackgroundColor DarkYellow
    Write-Host "║  ⚠️ SOME TESTS FAILED - REVIEW REPORT FOR DETAILS                 ║" -ForegroundColor Yellow -BackgroundColor DarkYellow
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow -BackgroundColor DarkYellow
    exit 1
}
