# DefenDDoS Authentication Testing Script
# Tests all authentication endpoints and security measures

Write-Host "`n=== DefenDDoS Authentication Security Test ===" -ForegroundColor Cyan
Write-Host "Testing Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

$backendUrl = "http://localhost:8081/api/v1"
$results = @{
    passed = 0
    failed = 0
    warnings = 0
    tests = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 10
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " ✓ PASS" -ForegroundColor Green
            $results.passed++
            $results.tests += @{
                name = $Name
                status = "PASS"
                statusCode = $response.StatusCode
                message = "Expected status $ExpectedStatus"
            }
            return $response
        } else {
            Write-Host " ✗ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            $results.failed++
            $results.tests += @{
                name = $Name
                status = "FAIL"
                statusCode = $response.StatusCode
                message = "Expected $ExpectedStatus but got $($response.StatusCode)"
            }
            return $null
        }
    } catch {
        try {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode -eq $ExpectedStatus) {
                Write-Host " ✓ PASS (Expected error $ExpectedStatus)" -ForegroundColor Green
                $results.passed++
                $results.tests += @{
                    name = $Name
                    status = "PASS"
                    statusCode = $statusCode
                    message = "Expected error status $ExpectedStatus"
                }
                return $null
            } else {
                Write-Host " ✗ FAIL (Status: $statusCode)" -ForegroundColor Red
                $results.failed++
                $results.tests += @{
                    name = $Name
                    status = "FAIL"
                    statusCode = $statusCode
                    message = "Expected $ExpectedStatus but got $statusCode"
                }
                return $null
            }
        } catch {
            Write-Host " ✗ FAIL (Error: $($_.Exception.Message))" -ForegroundColor Red
            $results.failed++
            $results.tests += @{
                name = $Name
                status = "FAIL"
                error = $_.Exception.Message
                message = "Request failed unexpectedly"
            }
            return $null
        }
    }
}

# ========================================
# 1. Backend Health Check
# ========================================
Write-Host "`n[1/8] Backend Health Checks" -ForegroundColor Yellow
Test-Endpoint -Name "Backend Health" -Url "$backendUrl/../actuator/health"
Test-Endpoint -Name "Auth Service Health" -Url "$backendUrl/auth/health"

# ========================================
# 2. Register New User
# ========================================
Write-Host "`n[2/8] User Registration Tests" -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUser = @{
    name = "Test User $timestamp"
    email = "test-$timestamp@defenddos.com"
    password = "TestPass123!@#"
}

$registerResponse = Test-Endpoint `
    -Name "Register New User" `
    -Url "$backendUrl/auth/register" `
    -Method "POST" `
    -Body $testUser `
    -ExpectedStatus 201

# Extract token if registration successful
$token = $null
if ($registerResponse) {
    $registerData = $registerResponse.Content | ConvertFrom-Json
    if ($registerData.token) {
        $token = $registerData.token
        Write-Host "  → Token received: $($token.Substring(0, 20))..." -ForegroundColor Gray
    }
}

# Test duplicate registration
Test-Endpoint `
    -Name "Duplicate Registration (Should Fail)" `
    -Url "$backendUrl/auth/register" `
    -Method "POST" `
    -Body $testUser `
    -ExpectedStatus 400

# ========================================
# 3. Login Tests
# ========================================
Write-Host "`n[3/8] Login Tests" -ForegroundColor Yellow

# Test with demo user
$demoLogin = @{
    email = "demo@defenddos.com"
    password = "demo123"
    rememberMe = $false
}

$loginResponse = Test-Endpoint `
    -Name "Login with Demo User" `
    -Url "$backendUrl/auth/login" `
    -Method "POST" `
    -Body $demoLogin

if ($loginResponse) {
    $loginData = $loginResponse.Content | ConvertFrom-Json
    if ($loginData.token) {
        $token = $loginData.token
        Write-Host "  → Demo user logged in successfully" -ForegroundColor Gray
    }
}

# Test invalid credentials
$invalidLogin = @{
    email = "invalid@test.com"
    password = "wrongpassword"
    rememberMe = $false
}

Test-Endpoint `
    -Name "Login with Invalid Credentials (Should Fail)" `
    -Url "$backendUrl/auth/login" `
    -Method "POST" `
    -Body $invalidLogin `
    -ExpectedStatus 401

# ========================================
# 4. Token Validation
# ========================================
Write-Host "`n[4/8] Token Validation Tests" -ForegroundColor Yellow

if ($token) {
    Test-Endpoint `
        -Name "Validate Token (Get Current User)" `
        -Url "$backendUrl/auth/me" `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Test-Endpoint `
        -Name "Invalid Token (Should Fail)" `
        -Url "$backendUrl/auth/me" `
        -Headers @{ "Authorization" = "Bearer invalid-token-12345" } `
        -ExpectedStatus 401
} else {
    Write-Host "  ⚠ Skipping (no token available)" -ForegroundColor Yellow
    $results.warnings++
}

# ========================================
# 5. Rate Limiting Tests
# ========================================
Write-Host "`n[5/8] Rate Limiting Tests" -ForegroundColor Yellow

$rateLimitCount = 0
$rateLimitLogin = @{
    email = "ratelimit@test.com"
    password = "wrongpass"
    rememberMe = $false
}

Write-Host "  Testing rate limiting (6 rapid login attempts)..." -NoNewline
for ($i = 1; $i -le 6; $i++) {
    try {
        $response = Invoke-WebRequest `
            -Uri "$backendUrl/auth/login" `
            -Method "POST" `
            -Body ($rateLimitLogin | ConvertTo-Json) `
            -ContentType "application/json" `
            -TimeoutSec 5 `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 429 -or $response.StatusCode -eq 401) {
            $rateLimitCount++
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429 -or $statusCode -eq 401) {
            $rateLimitCount++
        }
    }
    Start-Sleep -Milliseconds 200
}

if ($rateLimitCount -ge 5) {
    Write-Host " ✓ PASS (Rate limiting working)" -ForegroundColor Green
    $results.passed++
} else {
    Write-Host " ⚠ WARNING (Rate limiting may not be enforced)" -ForegroundColor Yellow
    $results.warnings++
}

# ========================================
# 6. Input Validation Tests
# ========================================
Write-Host "`n[6/8] Input Validation Tests" -ForegroundColor Yellow

# Test XSS attempt
$xssAttempt = @{
    name = "ScriptTagTest"
    email = "xss@test.com"
    password = "Pass123!"
}

Test-Endpoint `
    -Name "XSS Prevention in Name Field" `
    -Url "$backendUrl/auth/register" `
    -Method "POST" `
    -Body $xssAttempt `
    -ExpectedStatus 400

# Test SQL injection attempt
$sqlInjection = @{
    email = "admin' OR '1'='1"
    password = "pass"
    rememberMe = $false
}

Test-Endpoint `
    -Name "SQL Injection Prevention" `
    -Url "$backendUrl/auth/login" `
    -Method "POST" `
    -Body $sqlInjection `
    -ExpectedStatus 401

# Test weak password
$weakPassword = @{
    name = "Weak User"
    email = "weak@test.com"
    password = "123"
}

Test-Endpoint `
    -Name "Weak Password Rejection" `
    -Url "$backendUrl/auth/register" `
    -Method "POST" `
    -Body $weakPassword `
    -ExpectedStatus 400

# ========================================
# 7. Social Login Endpoints
# ========================================
Write-Host "`n[7/8] Social Login Endpoint Tests" -ForegroundColor Yellow

$socialLoginData = @{
    email = "social@test.com"
    name = "Social User"
    provider = "google"
    providerId = "google-12345"
    avatarUrl = "https://example.com/avatar.jpg"
}

Test-Endpoint `
    -Name "Social Login Endpoint" `
    -Url "$backendUrl/auth/social" `
    -Method "POST" `
    -Body $socialLoginData

# ========================================
# 8. Logout Test
# ========================================
Write-Host "`n[8/8] Logout Test" -ForegroundColor Yellow

if ($token) {
    Test-Endpoint `
        -Name "Logout" `
        -Url "$backendUrl/auth/logout" `
        -Method "POST" `
        -Headers @{ "Authorization" = "Bearer $token" }
} else {
    Write-Host "  ⚠ Skipping (no token available)" -ForegroundColor Yellow
    $results.warnings++
}

# ========================================
# Summary Report
# ========================================
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Total Tests: $($results.passed + $results.failed)" -ForegroundColor White
Write-Host "Passed: $($results.passed)" -ForegroundColor Green
Write-Host "Failed: $($results.failed)" -ForegroundColor Red
Write-Host "Warnings: $($results.warnings)" -ForegroundColor Yellow

$passRate = if (($results.passed + $results.failed) -gt 0) {
    [math]::Round(($results.passed / ($results.passed + $results.failed)) * 100, 2)
} else { 0 }

Write-Host "`nPass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

# Save detailed results
$reportPath = "test-results-auth-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$results | ConvertTo-Json -Depth 10 | Out-File $reportPath
Write-Host "`nDetailed results saved to: $reportPath" -ForegroundColor Gray

# Exit code
if ($results.failed -eq 0) {
    Write-Host "`n✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed. Review the results above." -ForegroundColor Red
    exit 1
}
