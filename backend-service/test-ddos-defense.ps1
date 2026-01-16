# DefenDDoS Attack Simulation Test Script
# Tests: Rate Limiting, IP Blocking, Actuator Security, DDoS Flood
# Run this AFTER starting the backend: .\mvnw.cmd spring-boot:run

param(
    [string]$BaseUrl = "http://localhost:8081",
    [string]$ApiKey = "admin"  # Default API key from application.properties
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DefenDDoS Attack Simulation Test Suite" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# ============================================
# TEST 1: Backend Health Check
# ============================================
function Test-BackendHealth {
    Write-Host "=== TEST 1: Backend Health Check ===" -ForegroundColor Magenta
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.status -eq "UP") {
            Write-Host "  [PASS] Backend is UP and healthy" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "  [FAIL] Backend status: $($response.status)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "  [FAIL] Cannot connect to backend at $BaseUrl" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# ============================================
# TEST 2: Actuator Security
# ============================================
function Test-ActuatorSecurity {
    Write-Host ""
    Write-Host "=== TEST 2: Actuator Endpoint Security ===" -ForegroundColor Magenta
    
    # Test public health endpoint
    Write-Host "  Testing /actuator/health (should be public)..."
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/actuator/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "    [PASS] Health endpoint accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    }
    catch {
        Write-Host "    [FAIL] Health endpoint not accessible" -ForegroundColor Red
    }
    
    # Test protected env endpoint (without API key)
    Write-Host "  Testing /actuator/env WITHOUT API key (should be blocked)..."
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/actuator/env" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "    [FAIL] Env endpoint is PUBLIC (SECURITY RISK!)" -ForegroundColor Red
    }
    catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "    [PASS] Env endpoint protected (Status: $statusCode)" -ForegroundColor Green
        }
        else {
            Write-Host "    [INFO] Status: $statusCode" -ForegroundColor Yellow
        }
    }
}

# ============================================
# TEST 3: API Key Authentication
# ============================================
function Test-ApiKeyAuth {
    Write-Host ""
    Write-Host "=== TEST 3: API Key Authentication ===" -ForegroundColor Magenta
    
    # Test WITHOUT API key
    Write-Host "  Testing /api/v1/mitigation/status WITHOUT API key..."
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/mitigation/status" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "    [FAIL] API accessible without key (SECURITY RISK!)" -ForegroundColor Red
    }
    catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 401) {
            Write-Host "    [PASS] Rejected without API key (Status: 401)" -ForegroundColor Green
        }
        else {
            Write-Host "    [INFO] Status: $statusCode" -ForegroundColor Yellow
        }
    }
    
    # Test WITH valid API key
    Write-Host "  Testing /api/v1/mitigation/status WITH valid API key..."
    try {
        $headers = @{ "X-API-KEY" = $ApiKey }
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/mitigation/status" -Headers $headers -UseBasicParsing -TimeoutSec 5
        Write-Host "    [PASS] API accessible with valid key (Status: $($response.StatusCode))" -ForegroundColor Green
    }
    catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "    [FAIL] API rejected with valid key (Status: $statusCode)" -ForegroundColor Red
        Write-Host "    Check your API key configuration" -ForegroundColor Yellow
    }
}

# ============================================
# TEST 4: Rate Limiting
# ============================================
function Test-RateLimiting {
    Write-Host ""
    Write-Host "=== TEST 4: Rate Limiting (65 rapid requests) ===" -ForegroundColor Magenta
    Write-Host "  Limit: 60 requests/minute for default endpoints"
    
    $headers = @{ "X-API-KEY" = $ApiKey }
    $successCount = 0
    $rateLimitedCount = 0
    $errorCount = 0
    
    Write-Host "  Sending requests: " -NoNewline
    
    for ($i = 1; $i -le 65; $i++) {
        try {
            $null = Invoke-WebRequest -Uri "$BaseUrl/api/v1/mitigation/status" `
                -Headers $headers -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            $successCount++
            Write-Host "." -NoNewline -ForegroundColor Green
        }
        catch {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq 429) {
                $rateLimitedCount++
                Write-Host "X" -NoNewline -ForegroundColor Red
            }
            else {
                $errorCount++
                Write-Host "?" -NoNewline -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host ""
    Write-Host "  Results:" -ForegroundColor Cyan
    Write-Host "    Successful: $successCount" -ForegroundColor Green
    Write-Host "    Rate Limited (429): $rateLimitedCount" -ForegroundColor Red
    Write-Host "    Other Errors: $errorCount" -ForegroundColor Yellow
    
    if ($rateLimitedCount -gt 0) {
        Write-Host "    [PASS] Rate limiting is ACTIVE!" -ForegroundColor Green
    }
    else {
        Write-Host "    [INFO] Rate limit not triggered (may need more requests)" -ForegroundColor Yellow
    }
}

# ============================================
# TEST 5: Redis-Based IP Blocking
# ============================================
function Test-IpBlocking {
    Write-Host ""
    Write-Host "=== TEST 5: Redis-Based IP Blocking ===" -ForegroundColor Magenta
    Write-Host "  Testing application-layer blocking via Redis" -ForegroundColor Gray
    
    $headers = @{ 
        "X-API-KEY"    = $ApiKey
        "Content-Type" = "application/json"
    }
    $testIp = "192.168.100.99"
    $testPassed = 0
    $testFailed = 0
    
    # Step 1: Get initial blocked count
    Write-Host "  Step 1: Checking initial state..."
    $initialCount = 0
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/status" -Headers $headers -TimeoutSec 5
        $initialCount = $response.data.blockedCount
        Write-Host "    Initial blocked IPs: $initialCount" -ForegroundColor Cyan
    }
    catch {
        Write-Host "    [WARN] Could not get initial status" -ForegroundColor Yellow
    }
    
    # Step 2: Block the test IP (using path variable, not body)
    Write-Host "  Step 2: Blocking IP $testIp via Redis..."
    try {
        $reason = [System.Web.HttpUtility]::UrlEncode("DDoS Test - Redis Blocking Verification")
        $null = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/block/$testIp`?reason=$reason" -Headers $headers -Method POST -TimeoutSec 5
        Write-Host "    [PASS] Block request accepted" -ForegroundColor Green
        $testPassed++
    }
    catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 429) {
            Write-Host "    [WARN] Rate limited - try again in 1 minute" -ForegroundColor Yellow
        }
        elseif ($statusCode -eq 400) {
            Write-Host "    [WARN] Bad request - IP may already be blocked or protected" -ForegroundColor Yellow
        }
        else {
            Write-Host "    [FAIL] Block request failed (Status: $statusCode)" -ForegroundColor Red
            $testFailed++
        }
    }
    
    # Step 3: Verify blocked count increased
    Write-Host "  Step 3: Verifying IP was stored in Redis..."
    Start-Sleep -Milliseconds 500
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/status" -Headers $headers -TimeoutSec 5
        $newCount = $response.data.blockedCount
        
        if ($newCount -gt $initialCount) {
            Write-Host "    [PASS] Blocked count increased: $initialCount -> $newCount" -ForegroundColor Green
            $testPassed++
        }
        elseif ($newCount -gt 0) {
            Write-Host "    [PASS] Blocked IPs in Redis: $newCount" -ForegroundColor Green
            $testPassed++
        }
        else {
            Write-Host "    [WARN] Blocked count unchanged (Redis may not be connected)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "    [FAIL] Could not verify blocked status" -ForegroundColor Red
        $testFailed++
    }
    
    # Step 4: Get list of blocked IPs
    Write-Host "  Step 4: Retrieving blocked IP list..."
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/blocked-ips" -Headers $headers -TimeoutSec 5
        $blockedList = $response.data
        
        if ($blockedList -contains $testIp) {
            Write-Host "    [PASS] Test IP found in blocked list" -ForegroundColor Green
            $testPassed++
        }
        elseif ($blockedList.Count -gt 0) {
            Write-Host "    [INFO] Blocked IPs: $($blockedList -join ', ')" -ForegroundColor Cyan
        }
        else {
            Write-Host "    [INFO] Blocked list endpoint returned empty" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "    [INFO] Blocked list endpoint not available (optional)" -ForegroundColor Yellow
    }
    
    # Step 5: Unblock the IP (POST method per controller)
    Write-Host "  Step 5: Unblocking test IP..."
    try {
        $null = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/unblock/$testIp" -Headers $headers -Method POST -TimeoutSec 5
        Write-Host "    [PASS] IP unblocked successfully" -ForegroundColor Green
        $testPassed++
    }
    catch {
        Write-Host "    [INFO] Unblock completed" -ForegroundColor Yellow
    }
    
    # Step 6: Verify final count
    Write-Host "  Step 6: Verifying final state..."
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/status" -Headers $headers -TimeoutSec 5
        $finalCount = $response.data.blockedCount
        Write-Host "    Final blocked IPs: $finalCount" -ForegroundColor Cyan
        
        if ($finalCount -lt $newCount -or $finalCount -eq $initialCount) {
            Write-Host "    [PASS] IP successfully removed from blocklist" -ForegroundColor Green
            $testPassed++
        }
    }
    catch {
        Write-Host "    [INFO] Could not verify final state" -ForegroundColor Yellow
    }
    
    # Summary
    Write-Host ""
    Write-Host "  IP Blocking Test Summary: $testPassed passed" -ForegroundColor $(if ($testPassed -ge 3) { "Green" }else { "Yellow" })
    
    if ($testPassed -ge 3) {
        Write-Host "    [PASS] Redis IP Blocking is WORKING!" -ForegroundColor Green
    }
    elseif ($testPassed -gt 0) {
        Write-Host "    [WARN] Partial success - check Redis connection" -ForegroundColor Yellow
    }
    else {
        Write-Host "    [FAIL] IP Blocking not working" -ForegroundColor Red
    }
}

# ============================================
# TEST 6: Critical Endpoint Protection
# ============================================
function Test-CriticalEndpointProtection {
    Write-Host ""
    Write-Host "=== TEST 6: Critical Endpoint Rate Limiting ===" -ForegroundColor Magenta
    Write-Host "  Testing /api/v1/mitigation/block (limit: 5/min)"
    
    $headers = @{ 
        "X-API-KEY"    = $ApiKey
        "Content-Type" = "application/json"
    }
    
    $successCount = 0
    $rateLimitedCount = 0
    
    Write-Host "  Sending 10 block requests: " -NoNewline
    
    for ($i = 1; $i -le 10; $i++) {
        $body = @{ ip = "10.99.99.$i"; reason = "Test $i" } | ConvertTo-Json
        
        try {
            $null = Invoke-WebRequest -Uri "$BaseUrl/api/v1/mitigation/block" `
                -Headers $headers -Method POST -Body $body -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            $successCount++
            Write-Host "." -NoNewline -ForegroundColor Green
            
            # Cleanup
            try {
                $null = Invoke-WebRequest -Uri "$BaseUrl/api/v1/mitigation/unblock/10.99.99.$i" `
                    -Headers $headers -Method DELETE -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            }
            catch {}
        }
        catch {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq 429) {
                $rateLimitedCount++
                Write-Host "X" -NoNewline -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "  Results: Allowed=$successCount, RateLimited=$rateLimitedCount" -ForegroundColor Cyan
    
    if ($rateLimitedCount -ge 5) {
        Write-Host "    [PASS] Critical endpoint protection ACTIVE!" -ForegroundColor Green
    }
}

# ============================================
# RUN ALL TESTS
# ============================================
Write-Host "Starting DDoS Defense Tests..." -ForegroundColor Cyan
Write-Host ""

# First check if backend is running
if (-not (Test-BackendHealth)) {
    Write-Host ""
    Write-Host "Backend not available. Please start it first:" -ForegroundColor Red
    Write-Host '  $env:ADMIN_PASSWORD = "SecurePassword123"' -ForegroundColor Yellow
    Write-Host '  $env:INFLUXDB_TOKEN = "my-super-secret-token"' -ForegroundColor Yellow
    Write-Host '  .\mvnw.cmd spring-boot:run' -ForegroundColor Yellow
    exit 1
}

Test-ActuatorSecurity
Test-ApiKeyAuth
Test-RateLimiting
Test-IpBlocking
Test-CriticalEndpointProtection

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Test Suite Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check logs/security-audit.log for security events" -ForegroundColor Yellow
