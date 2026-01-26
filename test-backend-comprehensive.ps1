# DefenDDoS Backend - COMPREHENSIVE FEATURE TEST
# Tests every endpoint, service, and feature of the backend

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DefenDDoS Backend - Full Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

$backend = "http://localhost:8082"
$apiBase = "$backend/api/v1"
$mlService = "http://localhost:8000"

# Test Results
$results = @{
    total = 0
    passed = 0
    failed = 0
    warnings = 0
    categories = @{}
}

function Test-API {
    param(
        [string]$Category,
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200,
        [switch]$Silent
    )
    
    if (-not $results.categories.ContainsKey($Category)) {
        $results.categories[$Category] = @{ passed = 0; failed = 0; tests = @() }
    }
    
    $results.total++
    
    if (-not $Silent) {
        Write-Host "  Testing: $Name..." -NoNewline
    }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 15
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        try {
            $response = Invoke-WebRequest @params -ErrorAction Stop
            
            if ($response.StatusCode -eq $ExpectedStatus) {
                if (-not $Silent) { Write-Host " ✓" -ForegroundColor Green }
                $results.passed++
                $results.categories[$Category].passed++
                $results.categories[$Category].tests += @{
                    name = $Name
                    status = "PASS"
                    statusCode = $response.StatusCode
                }
                return @{ success = $true; response = $response; data = ($response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue) }
            } else {
                if (-not $Silent) { Write-Host " ✗ (Status: $($response.StatusCode))" -ForegroundColor Red }
                $results.failed++
                $results.categories[$Category].failed++
                return @{ success = $false; error = "Unexpected status code" }
            }
        } catch {
            $statusCode = 0
            if ($_.Exception.Response) {
                $statusCode = [int]$_.Exception.Response.StatusCode
            }
            
            if ($statusCode -eq $ExpectedStatus) {
                if (-not $Silent) { Write-Host " ✓ (Expected error)" -ForegroundColor Green }
                $results.passed++
                $results.categories[$Category].passed++
                return @{ success = $true; expectedError = $true }
            } else {
                if (-not $Silent) { 
                    Write-Host " ✗ (Failed: $statusCode)" -ForegroundColor Red 
                    if ($statusCode -eq 0) {
                        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
                    }
                }
                $results.failed++
                $results.categories[$Category].failed++
                return @{ success = $false; error = $_.Exception.Message }
            }
        }
    } catch {
        if (-not $Silent) { Write-Host " ✗ (Exception)" -ForegroundColor Red }
        $results.failed++
        $results.categories[$Category].failed++
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# ========================================
# 0. PRE-FLIGHT: Check Services Running
# ========================================
Write-Host "[0/12] Pre-Flight: Service Status Check" -ForegroundColor Yellow

$backendRunning = $false
$mlServiceRunning = $false
$influxRunning = $false

try {
    $null = Invoke-WebRequest -Uri "$backend/actuator/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    $backendRunning = $true
    Write-Host "  ✓ Backend API (8081)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend API (8081) - NOT RUNNING" -ForegroundColor Red
}

try {
    $null = Invoke-WebRequest -Uri "$mlService/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    $mlServiceRunning = $true
    Write-Host "  ✓ ML Service (8000)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ ML Service (8000) - Not available" -ForegroundColor Yellow
}

try {
    $null = Invoke-WebRequest -Uri "http://localhost:8086/ping" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    $influxRunning = $true
    Write-Host "  ✓ InfluxDB (8086)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ InfluxDB (8086) - Not available" -ForegroundColor Yellow
}

if (-not $backendRunning) {
    Write-Host "`n❌ Backend is not running! Start with: docker-compose up -d" -ForegroundColor Red
    Write-Host "Exiting test suite...`n" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ========================================
# 1. HEALTH & ACTUATOR ENDPOINTS
# ========================================
Write-Host "[1/12] Health & Monitoring Endpoints" -ForegroundColor Yellow

Test-API -Category "Health" -Name "Backend Health" -Url "$backend/actuator/health"
Test-API -Category "Health" -Name "Actuator Info" -Url "$backend/actuator/info"
Test-API -Category "Health" -Name "Actuator Metrics" -Url "$backend/actuator/metrics"
Test-API -Category "Health" -Name "Prometheus Metrics" -Url "$backend/actuator/prometheus"

# ========================================
# 2. AUTHENTICATION ENDPOINTS
# ========================================
Write-Host "`n[2/12] Authentication System" -ForegroundColor Yellow

# Auth Health
Test-API -Category "Auth" -Name "Auth Service Health" -Url "$apiBase/auth/health"

# Register new user
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUser = @{
    name = "Test User"
    email = "test-$timestamp@defenddos.com"
    password = "TestPass123!"
}

$registerResult = Test-API -Category "Auth" -Name "User Registration" -Url "$apiBase/auth/register" -Method "POST" -Body $testUser -ExpectedStatus 201

$token = $null
if ($registerResult.success -and $registerResult.data -and $registerResult.data.token) {
    $token = $registerResult.data.token
    Write-Host "    → Token obtained" -ForegroundColor Gray
}

# Login with demo user
$demoLogin = @{
    email = "demo@defenddos.com"
    password = "demo123"
    rememberMe = $false
}

$loginResult = Test-API -Category "Auth" -Name "User Login" -Url "$apiBase/auth/login" -Method "POST" -Body $demoLogin

if ($loginResult.success -and $loginResult.data -and $loginResult.data.token) {
    $token = $loginResult.data.token
    Write-Host "    → Login successful, token updated" -ForegroundColor Gray
}

# Token validation
if ($token) {
    $authHeaders = @{ "Authorization" = "Bearer $token" }
    Test-API -Category "Auth" -Name "Token Validation (Get User)" -Url "$apiBase/auth/me" -Headers $authHeaders
} else {
    Write-Host "    ⚠ Skipping token tests (no token)" -ForegroundColor Yellow
    $results.warnings++
}

# Social login endpoint
$socialData = @{
    email = "social@test.com"
    name = "Social User"
    provider = "google"
    providerId = "google-123"
}
Test-API -Category "Auth" -Name "Social Login" -Url "$apiBase/auth/social" -Method "POST" -Body $socialData

# Logout
if ($token) {
    Test-API -Category "Auth" -Name "User Logout" -Url "$apiBase/auth/logout" -Method "POST" -Headers $authHeaders
}

# ========================================
# 3. TRAFFIC MANAGEMENT
# ========================================
Write-Host "`n[3/12] Traffic Management System" -ForegroundColor Yellow

# Ingest traffic data
$trafficData = @{
    sourceIp = "192.168.1.100"
    destinationIp = "10.0.0.1"
    packetCount = 150
    byteCount = 45000
    protocol = "TCP"
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
}

Test-API -Category "Traffic" -Name "Traffic Ingestion" -Url "$apiBase/traffic/ingest" -Method "POST" -Body $trafficData

# Query traffic
Test-API -Category "Traffic" -Name "Query Traffic Data" -Url "$apiBase/traffic/query?range=-5m"
Test-API -Category "Traffic" -Name "Traffic Summary" -Url "$apiBase/traffic/summary?range=-1h"
Test-API -Category "Traffic" -Name "Traffic Visualization" -Url "$apiBase/traffic/visualization?range=-1h&window=5m"

# ML prediction endpoint
if ($mlServiceRunning) {
    $mlPredictionData = @{
        sourceIp = "192.168.1.100"
        destinationIp = "10.0.0.1"
        packetCount = 1000
        byteCount = 500000
    }
    Test-API -Category "Traffic" -Name "ML Attack Prediction" -Url "$apiBase/traffic/predict-attack" -Method "POST" -Body $mlPredictionData
} else {
    Write-Host "    ⚠ Skipping ML prediction (service not running)" -ForegroundColor Yellow
    $results.warnings++
}

# ========================================
# 4. SECURITY DASHBOARD
# ========================================
Write-Host "`n[4/12] Security Dashboard & Status" -ForegroundColor Yellow

Test-API -Category "Security" -Name "Security Dashboard" -Url "$apiBase/security/dashboard"
Test-API -Category "Security" -Name "System Status" -Url "$apiBase/security/status"

# Manual detection trigger
Test-API -Category "Security" -Name "Trigger Detection" -Url "$apiBase/security/trigger-detection" -Method "POST"

# Analyze specific IP
Test-API -Category "Security" -Name "IP Analysis" -Url "$apiBase/security/analyze/192.168.1.100" -Method "POST"

# ========================================
# 5. STATISTICS & METRICS
# ========================================
Write-Host "`n[5/12] Statistics & Real-time Metrics" -ForegroundColor Yellow

Test-API -Category "Statistics" -Name "Real-time Metrics" -Url "$apiBase/statistics/realtime?window=1m"
Test-API -Category "Statistics" -Name "Detailed Statistics" -Url "$apiBase/statistics/detailed?range=-1h"
Test-API -Category "Statistics" -Name "Attack Statistics" -Url "$apiBase/statistics/attacks?range=-24h"
Test-API -Category "Statistics" -Name "Traffic Patterns" -Url "$apiBase/statistics/traffic-patterns?range=-1h"

# ========================================
# 6. MITIGATION & IP BLOCKING
# ========================================
Write-Host "`n[6/12] Mitigation & IP Blocking" -ForegroundColor Yellow

# Get blocked IPs
Test-API -Category "Mitigation" -Name "List Blocked IPs" -Url "$apiBase/mitigation/blocked-ips"

# Block a test IP
$blockData = @{
    ipAddress = "203.0.113.50"
    reason = "Test block - Automated testing"
}
Test-API -Category "Mitigation" -Name "Block IP Address" -Url "$apiBase/mitigation/block" -Method "POST" -Body $blockData

# Check if IP is blocked
Test-API -Category "Mitigation" -Name "Check IP Status" -Url "$apiBase/mitigation/check/203.0.113.50"

# Get mitigation statistics
Test-API -Category "Mitigation" -Name "Mitigation Statistics" -Url "$apiBase/mitigation/statistics"

# Unblock the test IP
Test-API -Category "Mitigation" -Name "Unblock IP Address" -Url "$apiBase/mitigation/unblock/203.0.113.50" -Method "POST"

# ========================================
# 7. DATA RETRIEVAL (Bulk Access)
# ========================================
Write-Host "`n[7/12] Data Retrieval System" -ForegroundColor Yellow

Test-API -Category "DataRetrieval" -Name "All Traffic Data" -Url "$apiBase/data/traffic/all?range=-1h&limit=100"
Test-API -Category "DataRetrieval" -Name "All ML Predictions" -Url "$apiBase/data/ml-predictions/all?range=-24h"
Test-API -Category "DataRetrieval" -Name "All Detection Events" -Url "$apiBase/data/detection-events/all?range=-24h"
Test-API -Category "DataRetrieval" -Name "All Blocked IPs" -Url "$apiBase/data/blocked-ips/all?range=-30d"

# Get data for specific IP
Test-API -Category "DataRetrieval" -Name "IP-Specific Data" -Url "$apiBase/data/ip/192.168.1.100/all?range=-24h"

# ========================================
# 8. THREAT INTELLIGENCE
# ========================================
Write-Host "`n[8/12] Threat Intelligence System" -ForegroundColor Yellow

Test-API -Category "ThreatIntel" -Name "Threat Dashboard" -Url "$apiBase/threat-intelligence/dashboard"
Test-API -Category "ThreatIntel" -Name "IP Reputation Check" -Url "$apiBase/threat-intelligence/reputation/8.8.8.8"

# Advanced fingerprinting
$fingerprintData = @{
    sourceIp = "192.168.1.100"
    userAgent = "Mozilla/5.0"
    tlsFingerprint = "test-fingerprint"
}
Test-API -Category "ThreatIntel" -Name "Device Fingerprinting" -Url "$apiBase/threat-intelligence/fingerprint" -Method "POST" -Body $fingerprintData

# ========================================
# 9. INCIDENT RESPONSE
# ========================================
Write-Host "`n[9/12] Incident Response System" -ForegroundColor Yellow

Test-API -Category "IncidentResponse" -Name "List Incidents" -Url "$apiBase/incidents/list?status=all"
Test-API -Category "IncidentResponse" -Name "Incident Statistics" -Url "$apiBase/incidents/statistics"

# Create test incident
$incidentData = @{
    title = "Test Incident"
    description = "Automated test incident"
    severity = "MEDIUM"
    sourceIp = "192.168.1.100"
}
$incidentResult = Test-API -Category "IncidentResponse" -Name "Create Incident" -Url "$apiBase/incidents/create" -Method "POST" -Body $incidentData

# Get incident details if created
if ($incidentResult.success -and $incidentResult.data -and $incidentResult.data.id) {
    $incidentId = $incidentResult.data.id
    Test-API -Category "IncidentResponse" -Name "Get Incident Details" -Url "$apiBase/incidents/$incidentId"
}

# ========================================
# 10. REAL-TIME VISUALIZATION
# ========================================
Write-Host "`n[10/12] Real-Time Visualization" -ForegroundColor Yellow

Test-API -Category "Visualization" -Name "Live Metrics Stream" -Url "$apiBase/visualization/metrics"
Test-API -Category "Visualization" -Name "Threat Map Data" -Url "$apiBase/visualization/threat-map"
Test-API -Category "Visualization" -Name "Performance Metrics" -Url "$apiBase/visualization/performance"

# ========================================
# 11. ML SERVICE INTEGRATION
# ========================================
Write-Host "`n[11/12] ML Service Integration" -ForegroundColor Yellow

if ($mlServiceRunning) {
    # ML service health
    Test-API -Category "MLService" -Name "ML Service Health" -Url "$mlService/health"
    
    # ML prediction with full features
    $mlFeatures = @{
        source_ip = "192.168.1.100"
        destination_ip = "10.0.0.1"
        urg_flag_count = 0
        bwd_packet_length_mean = 120.5
        bwd_packets_per_s = 50.2
        subflow_bwd_bytes = 15000
        init_bwd_win_bytes = 8192
        bwd_packet_length_max = 1500
        fwd_packet_length_min = 64
        bwd_packets_length_total = 45000
        packet_length_min = 64
        fwd_packets_length_total = 60000
        fwd_act_data_packets = 100
        fwd_iat_total = 5000
        avg_packet_size = 500
        packet_length_std = 200
        init_fwd_win_bytes = 8192
        fwd_iat_mean = 50
        down_up_ratio = 0.75
        packet_length_mean = 500
        subflow_fwd_bytes = 60000
        avg_fwd_segment_size = 600
        ack_flag_count = 50
        fwd_iat_std = 25
        flow_iat_mean = 50
        total_fwd_packets = 100
        flow_iat_std = 25
        fwd_psh_flags = 10
        flow_packets_per_s = 100
        fwd_packet_length_mean = 600
        packet_length_max = 1500
        total_backward_packets = 75
    }
    
    Test-API -Category "MLService" -Name "ML Prediction Request" -Url "$mlService/predict" -Method "POST" -Body $mlFeatures
    
    # ML model info
    Test-API -Category "MLService" -Name "ML Model Information" -Url "$mlService/model-info"
} else {
    Write-Host "    ⚠ ML Service not running - Skipping 4 tests" -ForegroundColor Yellow
    $results.warnings += 4
}

# ========================================
# 12. ERROR HANDLING & EDGE CASES
# ========================================
Write-Host "`n[12/12] Error Handling & Edge Cases" -ForegroundColor Yellow

# Invalid endpoints
Test-API -Category "ErrorHandling" -Name "Invalid Endpoint (404)" -Url "$apiBase/nonexistent" -ExpectedStatus 404

# Invalid authentication
Test-API -Category "ErrorHandling" -Name "Invalid Token" -Url "$apiBase/auth/me" -Headers @{"Authorization"="Bearer invalid"} -ExpectedStatus 401

# Malformed data
$invalidTraffic = @{ invalid = "data" }
Test-API -Category "ErrorHandling" -Name "Malformed Traffic Data" -Url "$apiBase/traffic/ingest" -Method "POST" -Body $invalidTraffic -ExpectedStatus 400

# Invalid IP format
Test-API -Category "ErrorHandling" -Name "Invalid IP Format" -Url "$apiBase/mitigation/check/invalid-ip" -ExpectedStatus 400

# ========================================
# GENERATE REPORT
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nOverall Results:" -ForegroundColor White
Write-Host "  Total Tests:   $($results.total)" -ForegroundColor White
Write-Host "  Passed:        $($results.passed)" -ForegroundColor Green
Write-Host "  Failed:        $($results.failed)" -ForegroundColor Red
Write-Host "  Warnings:      $($results.warnings)" -ForegroundColor Yellow

$passRate = if ($results.total -gt 0) { [math]::Round(($results.passed / $results.total) * 100, 2) } else { 0 }
$passRateColor = if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" }
Write-Host "`n  Pass Rate:     $passRate%" -ForegroundColor $passRateColor

Write-Host "`nResults by Category:" -ForegroundColor White
foreach ($category in $results.categories.Keys | Sort-Object) {
    $cat = $results.categories[$category]
    $total = $cat.passed + $cat.failed
    $catRate = if ($total -gt 0) { [math]::Round(($cat.passed / $total) * 100, 1) } else { 0 }
    $status = if ($cat.failed -eq 0) { "✓" } else { "✗" }
    $color = if ($cat.failed -eq 0) { "Green" } else { "Yellow" }
    
    Write-Host "  $status " -NoNewline -ForegroundColor $color
    Write-Host ("{0,-20} {1,2}/{2,-2} ({3}%)" -f $category, $cat.passed, $total, $catRate) -ForegroundColor White
}

# Service Status
Write-Host "`nService Status:" -ForegroundColor White
Write-Host "  Backend API:   " -NoNewline
Write-Host $(if ($backendRunning) { "✓ Running" } else { "✗ Stopped" }) -ForegroundColor $(if ($backendRunning) { "Green" } else { "Red" })
Write-Host "  ML Service:    " -NoNewline
Write-Host $(if ($mlServiceRunning) { "✓ Running" } else { "⚠ Stopped" }) -ForegroundColor $(if ($mlServiceRunning) { "Green" } else { "Yellow" })
Write-Host "  InfluxDB:      " -NoNewline
Write-Host $(if ($influxRunning) { "✓ Running" } else { "⚠ Stopped" }) -ForegroundColor $(if ($influxRunning) { "Green" } else { "Yellow" })

# Recommendations
Write-Host "`nRecommendations:" -ForegroundColor White
if (-not $mlServiceRunning) {
    Write-Host "  • Start ML Service: cd backend-service/ml-service && python main.py" -ForegroundColor Yellow
}
if ($results.failed -gt 0) {
    Write-Host "  • Review failed tests above for details" -ForegroundColor Yellow
    Write-Host "  • Check backend logs: docker-compose logs backend" -ForegroundColor Yellow
}
if ($passRate -ge 90) {
    Write-Host "  • ✓ Backend is functioning excellently!" -ForegroundColor Green
} elseif ($passRate -ge 70) {
    Write-Host "  • Backend is mostly functional with minor issues" -ForegroundColor Yellow
} else {
    Write-Host "  • Backend has significant issues requiring attention" -ForegroundColor Red
}

# Save detailed report
$reportPath = "backend-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$results | ConvertTo-Json -Depth 10 | Out-File $reportPath
Write-Host "`nDetailed report saved: $reportPath" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Exit code
if ($results.failed -eq 0) {
    exit 0
} else {
    exit 1
}
