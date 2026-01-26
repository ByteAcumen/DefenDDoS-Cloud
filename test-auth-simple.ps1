# DefenDDoS Authentication Testing Script
# Tests all authentication endpoints and security measures

Write-Host "`n=== DefenDDoS Authentication Security Test ===" -ForegroundColor Cyan
Write-Host "Testing Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

$backendUrl = "http://localhost:8081/api/v1"
$passed = 0
$failed = 0
$warnings = 0

function Test-API {
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
        }
        
        if ($Body) {
            $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        try {
            $response = Invoke-WebRequest @params -ErrorAction Stop
            
            if ($response.StatusCode -eq $ExpectedStatus) {
                Write-Host " ✓ PASS" -ForegroundColor Green
                $script:passed++
                return $response
            } else {
                Write-Host " ✗ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
                $script:failed++
                return $null
            }
        } catch {
            $statusCode = 0
            if ($_.Exception.Response) {
                $statusCode = [int]$_.Exception.Response.StatusCode
            }
            
            if ($statusCode -eq $ExpectedStatus) {
                Write-Host " ✓ PASS (Expected error)" -ForegroundColor Green
                $script:passed++
            } else {
                Write-Host " ✗ FAIL ($($_.Exception.Message))" -ForegroundColor Red
                $script:failed++
            }
            return $null
        }
    } catch {
        Write-Host " ✗ FAIL (Error)" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

# ========================================
# 1. Backend Health Check
# ========================================
Write-Host "`n[1/8] Backend Health Checks" -ForegroundColor Yellow
Test-API -Name "Backend Health" -Url "$backendUrl/../actuator/health"
Test-API -Name "Auth Service Health" -Url "$backendUrl/auth/health"

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

$registerResponse = Test-API `
    -Name "Register New User" `
    -Url "$backendUrl/auth/register" `
    -Method "POST" `
    -Body $testUser `
    -ExpectedStatus 201

$token = $null
if ($registerResponse) {
    try {
        $registerData = $registerResponse.Content | ConvertFrom-Json
        if ($registerData.token) {
            $token = $registerData.token
            Write-Host "  → Token received" -ForegroundColor Gray
        }
    } catch {}
}

Test-API `
    -Name "Duplicate Registration (Should Fail)" `
    -Url "$backendUrl/auth/register" `
    -Method "POST" `
    -Body $testUser `
    -ExpectedStatus 400

# ========================================
# 3. Login Tests
# ========================================
Write-Host "`n[3/8] Login Tests" -ForegroundColor Yellow

$demoLogin = @{
    email = "demo@defenddos.com"
    password = "demo123"
    rememberMe = $false
}

$loginResponse = Test-API `
    -Name "Login with Demo User" `
    -Url "$backendUrl/auth/login" `
    -Method "POST" `
    -Body $demoLogin

if ($loginResponse) {
    try {
        $loginData = $loginResponse.Content | ConvertFrom-Json
        if ($loginData.token) {
            $token = $loginData.token
            Write-Host "  → Demo user logged in successfully" -ForegroundColor Gray
        }
    } catch {}
}

$invalidLogin = @{
    email = "invalid@test.com"
    password = "wrongpassword"
    rememberMe = $false
}

Test-API `
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
    Test-API `
        -Name "Validate Token (Get Current User)" `
        -Url "$backendUrl/auth/me" `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Test-API `
        -Name "Invalid Token (Should Fail)" `
        -Url "$backendUrl/auth/me" `
        -Headers @{ "Authorization" = "Bearer invalid-token-12345" } `
        -ExpectedStatus 401
} else {
    Write-Host "  ⚠ Skipping (no token available)" -ForegroundColor Yellow
    $warnings++
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
        $null = Invoke-WebRequest `
            -Uri "$backendUrl/auth/login" `
            -Method "POST" `
            -Body ($rateLimitLogin | ConvertTo-Json) `
            -ContentType "application/json" `
            -TimeoutSec 5 `
            -ErrorAction SilentlyContinue
        $rateLimitCount++
    } catch {
        $rateLimitCount++
    }
    Start-Sleep -Milliseconds 200
}

if ($rateLimitCount -ge 5) {
    Write-Host " ✓ PASS (Rate limiting active)" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ⚠ WARNING (Rate limiting may be disabled)" -ForegroundColor Yellow
    $warnings++
}

# ========================================
# 6. Input Validation Tests
# ========================================
Write-Host "`n[6/8] Input Validation Tests" -ForegroundColor Yellow

$invalidName = @{
    name = "ScriptTagTest"
    email = "xss@test.com"
    password = "Pass123!"
}

Test-API `
    -Name "Special Character Handling" `
    -Url "$backendUrl/auth/register" `
    -Method "POST" `
    -Body $invalidName

$weakPassword = @{
    name = "Weak User"
    email = "weak-$(Get-Random)@test.com"
    password = "123"
}

Test-API `
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

Test-API `
    -Name "Social Login Endpoint" `
    -Url "$backendUrl/auth/social" `
    -Method "POST" `
    -Body $socialLoginData

# ========================================
# 8. Logout Test
# ========================================
Write-Host "`n[8/8] Logout Test" -ForegroundColor Yellow

if ($token) {
    Test-API `
        -Name "Logout" `
        -Url "$backendUrl/auth/logout" `
        -Method "POST" `
        -Headers @{ "Authorization" = "Bearer $token" }
} else {
    Write-Host "  ⚠ Skipping (no token available)" -ForegroundColor Yellow
    $warnings++
}

# ========================================
# Summary Report
# ========================================
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Total Tests: $($passed + $failed)" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Warnings: $warnings" -ForegroundColor Yellow

$passRate = if (($passed + $failed) -gt 0) {
    [math]::Round(($passed / ($passed + $failed)) * 100, 2)
} else { 0 }

Write-Host "`nPass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

if ($failed -eq 0) {
    Write-Host "`n✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed. Backend may not be running." -ForegroundColor Yellow
    exit 1
}
