# DefenDDoS Backend - Complete API Endpoint Testing
# Tests ALL endpoints with detailed verification

$ErrorActionPreference = "Continue"
$BaseUrl = "http://localhost:8082"
$MlUrl = "http://localhost:8000"
$DefaultHeaders = @{ "X-API-KEY" = "defenddos-secret-key-123" }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DefenDDoS API Endpoint Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$TestsPassed = 0
$TestsFailed = 0
$TestDetails = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [string]$Category = "General"
    )
    
    $result = @{
        Category = $Category
        Name = $Name
        Url = $Url
        Method = $Method
        Status = "UNKNOWN"
        Message = ""
        Data = $null
        Error = $null
    }
    
    try {
        if ($Method -eq "POST" -and $Body) {
            $response = Invoke-RestMethod -Uri $Url -Method POST `
                -Body ($Body | ConvertTo-Json) `
                -Headers $DefaultHeaders `
                -ContentType "application/json" `
                -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $DefaultHeaders -ErrorAction Stop
        }
        
        # Handle different response formats
        $isSuccess = $false
        
        # Standard ApiResponse format
        if ($response.success -eq $true) {
            $isSuccess = $true
            $result.Message = if ($response.message) { $response.message } else { "Success" }
            $result.Data = if ($response.data) { $response.data } else { $response }
        }
        # Health check format
        elseif ($response.status -eq "UP" -or $response.status -eq "healthy" -or $response.status -eq "operational") {
            $isSuccess = $true
            $result.Message = $response.status
            $result.Data = $response
        }
        # Direct data format (mitigation status, blocked IPs, etc.)
        elseif ($response.enabled -ne $null -or $response.blockedIps -ne $null -or $response.activeThreats -ne $null) {
            $isSuccess = $true
            $result.Message = "Success"
            $result.Data = $response
        }
        # Check for error indicators
        elseif ($response.error -or $response.success -eq $false) {
            $isSuccess = $false
            $result.Message = if ($response.error) { $response.error } else { "Request failed" }
        }
        # Actuator endpoints (metrics, prometheus, etc.)
        elseif ($response.names -or $response.GetType().Name -eq "String") {
            $isSuccess = $true
            $result.Message = "Success"
            $result.Data = $response
        }
        # Default: if we got a response without errors, consider it success
        else {
            $isSuccess = $true
            $result.Message = "Success"
            $result.Data = $response
        }
        
        if ($isSuccess) {
            $result.Status = "PASS"
            $script:TestsPassed++
            Write-Host "  PASS" -NoNewline -ForegroundColor Green
        } else {
            $result.Status = "FAIL"
            $result.Error = $response
            $script:TestsFailed++
            Write-Host "  FAIL" -NoNewline -ForegroundColor Red
        }
    } catch {
        $result.Status = "ERROR"
        $result.Message = $_.Exception.Message
        $result.Error = $_
        $script:TestsFailed++
        Write-Host "  ERROR" -NoNewline -ForegroundColor Red
    }
    
    Write-Host " - $Name" -ForegroundColor White
    if ($result.Status -ne "PASS") {
        Write-Host "       Error: $($result.Message)" -ForegroundColor Yellow
    }
    
    $script:TestDetails += $result
    return $result
}

# ========================================
# CATEGORY 1: HEALTH CHECKS
# ========================================
Write-Host "`n=== CATEGORY 1: HEALTH CHECKS ===" -ForegroundColor Yellow

Test-Endpoint -Name "Backend Actuator Health" `
    -Url "$BaseUrl/actuator/health" `
    -Category "Health"

Test-Endpoint -Name "ML Service Health" `
    -Url "$MlUrl/health" `
    -Category "Health"

Test-Endpoint -Name "ML Connection via Backend" `
    -Url "$BaseUrl/api/v1/traffic/ml-health" `
    -Category "Health"

# ========================================
# CATEGORY 2: TRAFFIC ENDPOINTS
# ========================================
Write-Host "`n=== CATEGORY 2: TRAFFIC ENDPOINTS ===" -ForegroundColor Yellow

# Ingest test traffic
$testTraffic = @{
    sourceIp = "10.0.0.100"
    destinationIp = "192.168.1.10"
    packetCount = 1000
    byteCount = 64000
}

$ingestResult = Test-Endpoint -Name "Traffic Ingestion (POST)" `
    -Url "$BaseUrl/api/v1/traffic/ingest" `
    -Method "POST" `
    -Body $testTraffic `
    -Category "Traffic"

Start-Sleep -Seconds 2

Test-Endpoint -Name "Query Traffic (GET)" `
    -Url "$BaseUrl/api/v1/traffic/query?range=-5m" `
    -Category "Traffic"

Test-Endpoint -Name "Traffic Summary (GET)" `
    -Url "$BaseUrl/api/v1/traffic/summary?range=-1h" `
    -Category "Traffic"

Test-Endpoint -Name "Traffic Visualization (GET)" `
    -Url "$BaseUrl/api/v1/traffic/visualization?range=-1h&window=5m" `
    -Category "Traffic"

# ========================================
# CATEGORY 3: ML PREDICTION ENDPOINTS
# ========================================
Write-Host "`n=== CATEGORY 3: ML PREDICTION ENDPOINTS ===" -ForegroundColor Yellow

$mlTraffic = @{
    sourceIp = "10.0.0.101"
    destinationIp = "192.168.1.10"
    packetCount = 5000
    byteCount = 320000
}

$mlResult = Test-Endpoint -Name "Predict Attack (POST)" `
    -Url "$BaseUrl/api/v1/traffic/predict-attack" `
    -Method "POST" `
    -Body $mlTraffic `
    -Category "ML Prediction"

if ($mlResult.Status -eq "PASS" -and $mlResult.Data) {
    Write-Host "    Attack: $($mlResult.Data.is_attack)" -ForegroundColor Cyan
    Write-Host "    Type: $($mlResult.Data.attack_type)" -ForegroundColor Cyan
    Write-Host "    Confidence: $($mlResult.Data.confidence_percentage)%" -ForegroundColor Cyan
    Write-Host "    Severity: $($mlResult.Data.severity)" -ForegroundColor Cyan
}

# ========================================
# CATEGORY 5: DATA RETRIEVAL ENDPOINTS (NEW)
# ========================================
Write-Host "`n=== CATEGORY 5: DATA RETRIEVAL ENDPOINTS ===" -ForegroundColor Yellow

$trafficDataResult = Test-Endpoint -Name "Get All Traffic Data (GET)" `
    -Url "$BaseUrl/api/v1/data/traffic/all?range=-1h" `
    -Category "Data Retrieval"

if ($trafficDataResult.Status -eq "PASS" -and $trafficDataResult.Data) {
    Write-Host "    Traffic Records: $($trafficDataResult.Data.Count)" -ForegroundColor Cyan
}

$mlPredDataResult = Test-Endpoint -Name "Get All ML Predictions (GET)" `
    -Url "$BaseUrl/api/v1/data/ml-predictions/all?range=-1h" `
    -Category "Data Retrieval"

if ($mlPredDataResult.Status -eq "PASS" -and $mlPredDataResult.Data) {
    Write-Host "    ML Prediction Records: $($mlPredDataResult.Data.Count)" -ForegroundColor Cyan
}

$detectionDataResult = Test-Endpoint -Name "Get All Detection Events (GET)" `
    -Url "$BaseUrl/api/v1/data/detection-events/all?range=-1h" `
    -Category "Data Retrieval"

if ($detectionDataResult.Status -eq "PASS" -and $detectionDataResult.Data) {
    Write-Host "    Detection Event Records: $($detectionDataResult.Data.Count)" -ForegroundColor Cyan
}

$blockedDataResult = Test-Endpoint -Name "Get All Blocked IPs from DB (GET)" `
    -Url "$BaseUrl/api/v1/data/blocked-ips/all?range=-30d" `
    -Category "Data Retrieval"

if ($blockedDataResult.Status -eq "PASS" -and $blockedDataResult.Data) {
    Write-Host "    Blocked IP Records: $($blockedDataResult.Data.Count)" -ForegroundColor Cyan
}

Test-Endpoint -Name "Get Database Statistics (GET)" `
    -Url "$BaseUrl/api/v1/data/statistics" `
    -Category "Data Retrieval"

# ========================================
# CATEGORY 6: MITIGATION ENDPOINTS
# ========================================
Write-Host "`n=== CATEGORY 6: MITIGATION ENDPOINTS ===" -ForegroundColor Yellow

$statusResult = Test-Endpoint -Name "Mitigation Status (GET)" `
    -Url "$BaseUrl/api/v1/mitigation/status" `
    -Category "Mitigation"

if ($statusResult.Status -eq "PASS" -and $statusResult.Data) {
    Write-Host "    Active: $($statusResult.Data.active)" -ForegroundColor Cyan
    Write-Host "    Dry Run Mode: $($statusResult.Data.dryRunMode)" -ForegroundColor Cyan
    Write-Host "    Blocked Count: $($statusResult.Data.blockedIpsCount)" -ForegroundColor Cyan
}

$blockedResult = Test-Endpoint -Name "Get Blocked IPs (GET)" `
    -Url "$BaseUrl/api/v1/mitigation/blocked" `
    -Category "Mitigation"

if ($blockedResult.Status -eq "PASS" -and $blockedResult.Data) {
    Write-Host "    Currently Blocked: $($blockedResult.Data.count)" -ForegroundColor Cyan
    if ($blockedResult.Data.blockedIps -and $blockedResult.Data.blockedIps.Count -gt 0) {
        $blockedResult.Data.blockedIps | ForEach-Object {
            Write-Host "      - $_" -ForegroundColor White
        }
    }
}

# Test blocking a specific IP
$testBlockIp = "192.0.2.100"
Test-Endpoint -Name "Block IP (POST)" `
    -Url "$BaseUrl/api/v1/mitigation/block/$testBlockIp`?reason=Test%20block" `
    -Method "POST" `
    -Category "Mitigation"

Start-Sleep -Seconds 1

Test-Endpoint -Name "Check Blocked IP (GET)" `
    -Url "$BaseUrl/api/v1/mitigation/check/$testBlockIp" `
    -Category "Mitigation"

# Unblock the test IP
Test-Endpoint -Name "Unblock IP (POST)" `
    -Url "$BaseUrl/api/v1/mitigation/unblock/$testBlockIp" `
    -Method "POST" `
    -Category "Mitigation"

# ========================================
# CATEGORY 7: SECURITY ENDPOINTS
# ========================================
Write-Host "`n=== CATEGORY 7: SECURITY ENDPOINTS ===" -ForegroundColor Yellow

$dashboardResult = Test-Endpoint -Name "Security Dashboard (GET)" `
    -Url "$BaseUrl/api/v1/security/dashboard" `
    -Category "Security"

if ($dashboardResult.Status -eq "PASS" -and $dashboardResult.Data) {
    Write-Host "    Status: $($dashboardResult.Data.status)" -ForegroundColor Cyan
    Write-Host "    Detection Enabled: $($dashboardResult.Data.detectionEnabled)" -ForegroundColor Cyan
    Write-Host "    System Health: $($dashboardResult.Data.systemHealth)" -ForegroundColor Cyan
    Write-Host "    Active Threats: $($dashboardResult.Data.activeThreats)" -ForegroundColor Cyan
}

# ========================================
# CATEGORY 8: THREAT INTELLIGENCE ENDPOINTS
# ========================================
Write-Host "`n=== CATEGORY 8: THREAT INTELLIGENCE ENDPOINTS ===" -ForegroundColor Yellow

Test-Endpoint -Name "Check IP Reputation (GET)" `
    -Url "$BaseUrl/api/v1/threat-intelligence/check/8.8.8.8" `
    -Category "Threat Intelligence"

Test-Endpoint -Name "Get IP Reputation Score (GET)" `
    -Url "$BaseUrl/api/v1/threat-intelligence/reputation/8.8.8.8" `
    -Category "Threat Intelligence"

Test-Endpoint -Name "Get All Threats (GET)" `
    -Url "$BaseUrl/api/v1/threat-intelligence/threats" `
    -Category "Threat Intelligence"

# ========================================
# CATEGORY 9: ACTUATOR ENDPOINTS
# ========================================
Write-Host "`n=== CATEGORY 9: ACTUATOR ENDPOINTS ===" -ForegroundColor Yellow

Test-Endpoint -Name "Actuator Info (GET)" `
    -Url "$BaseUrl/actuator/info" `
    -Category "Actuator"

Test-Endpoint -Name "Actuator Metrics (GET)" `
    -Url "$BaseUrl/actuator/metrics" `
    -Category "Actuator"

Test-Endpoint -Name "Actuator Prometheus (GET)" `
    -Url "$BaseUrl/actuator/prometheus" `
    -Category "Actuator"

# ========================================
# SUMMARY REPORT
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "         TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$totalTests = $TestsPassed + $TestsFailed
$successRate = if ($totalTests -gt 0) { [math]::Round(($TestsPassed / $totalTests) * 100, 2) } else { 0 }

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Tests Passed: $TestsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $TestsFailed" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { 'Green' } elseif ($successRate -ge 60) { 'Yellow' } else { 'Red' })

# Category breakdown
Write-Host "`n=== RESULTS BY CATEGORY ===`n" -ForegroundColor Yellow

$TestDetails | Group-Object Category | ForEach-Object {
    $category = $_.Name
    $passed = ($_.Group | Where-Object { $_.Status -eq "PASS" }).Count
    $total = $_.Count
    $categoryRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }
    
    Write-Host "$category`: " -NoNewline -ForegroundColor White
    Write-Host "$passed/$total ($categoryRate%)" -ForegroundColor $(if ($categoryRate -eq 100) { 'Green' } elseif ($categoryRate -ge 80) { 'Yellow' } else { 'Red' })
}

# Failed tests detail
$failedTests = $TestDetails | Where-Object { $_.Status -ne "PASS" }
if ($failedTests.Count -gt 0) {
    Write-Host "`n=== FAILED TESTS DETAIL ===`n" -ForegroundColor Red
    $failedTests | ForEach-Object {
        Write-Host "[$($_.Category)] $($_.Name)" -ForegroundColor Yellow
        Write-Host "  URL: $($_.Url)" -ForegroundColor White
        Write-Host "  Error: $($_.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Data verification summary
Write-Host "`n=== DATA VERIFICATION SUMMARY ===`n" -ForegroundColor Yellow

if ($statsResult.Status -eq "PASS") {
    Write-Host "Traffic Statistics:" -ForegroundColor Cyan
    Write-Host "  Packets: $($statsResult.Data.totalPackets)" -ForegroundColor White
    Write-Host "  Bytes: $($statsResult.Data.totalBytes)" -ForegroundColor White
    Write-Host "  Connections: $($statsResult.Data.totalConnections)" -ForegroundColor White
}

if ($trafficDataResult.Status -eq "PASS") {
    Write-Host "`nDatabase Records:" -ForegroundColor Cyan
    Write-Host "  Traffic Records: $($trafficDataResult.Data.Count)" -ForegroundColor White
    Write-Host "  ML Predictions: $($mlPredDataResult.Data.Count)" -ForegroundColor White
    Write-Host "  Detection Events: $($detectionDataResult.Data.Count)" -ForegroundColor White
    Write-Host "  Blocked IP History: $($blockedDataResult.Data.Count)" -ForegroundColor White
}

if ($blockedResult.Status -eq "PASS") {
    Write-Host "`nMitigation Status:" -ForegroundColor Cyan
    Write-Host "  Currently Blocked IPs: $($blockedResult.Data.count)" -ForegroundColor White
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test execution completed!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Export results to file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "test-results-$timestamp.json"
$TestDetails | ConvertTo-Json -Depth 5 | Out-File $reportFile
Write-Host "Detailed results saved to: $reportFile" -ForegroundColor Cyan
