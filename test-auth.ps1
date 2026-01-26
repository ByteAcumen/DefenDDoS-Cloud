# DefenDDoS Authentication Security Test
Write-Host "`n=== DefenDDoS Authentication Test ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

$backend = "http://localhost:8081/api/v1"
$passed = 0
$failed = 0

# ========================================
# 1. Health Checks
# ========================================
Write-Host "[1/6] Backend Health Checks" -ForegroundColor Yellow

Write-Host "  Backend Health..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$backend/../actuator/health" -TimeoutSec 5
    Write-Host " ✓ PASS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host " ✗ FAIL (Backend not running)" -ForegroundColor Red
    $failed++
}

Write-Host "  Auth Service Health..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$backend/auth/health" -TimeoutSec 5
    Write-Host " ✓ PASS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    $failed++
}

# ========================================
# 2. Register New User
# ========================================
Write-Host "`n[2/6] User Registration" -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$newUser = @{
    name = "Test User"
    email = "test-$timestamp@example.com"
    password = "TestPass123!"
} | ConvertTo-Json

Write-Host "  Registering new user..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$backend/auth/register" -Method Post -Body $newUser -ContentType "application/json" -TimeoutSec 10
    Write-Host " ✓ PASS" -ForegroundColor Green
    $passed++
    $token = $response.token
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    $failed++
    $token = $null
}

# ========================================
# 3. Login
# ========================================
Write-Host "`n[3/6] Login Tests" -ForegroundColor Yellow

$loginData = @{
    email = "demo@defenddos.com"
    password = "demo123"
    rememberMe = $false
} | ConvertTo-Json

Write-Host "  Login with demo user..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$backend/auth/login" -Method Post -Body $loginData -ContentType "application/json" -TimeoutSec 10
    Write-Host " ✓ PASS" -ForegroundColor Green
    $passed++
    $token = $response.token
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    $failed++
}

$invalidLogin = @{
    email = "invalid@test.com"
    password = "wrong"
    rememberMe = $false
} | ConvertTo-Json

Write-Host "  Invalid credentials (should fail)..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$backend/auth/login" -Method Post -Body $invalidLogin -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    Write-Host " ✗ FAIL (Should have failed)" -ForegroundColor Red
    $failed++
} catch {
    Write-Host " ✓ PASS (Correctly rejected)" -ForegroundColor Green
    $passed++
}

# ========================================
# 4. Token Validation
# ========================================
Write-Host "`n[4/6] Token Validation" -ForegroundColor Yellow

if ($token) {
    Write-Host "  Validate token..." -NoNewline
    try {
        $headers = @{ "Authorization" = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$backend/auth/me" -Headers $headers -TimeoutSec 10
        Write-Host " ✓ PASS" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        $failed++
    }
    
    Write-Host "  Invalid token (should fail)..." -NoNewline
    try {
        $headers = @{ "Authorization" = "Bearer invalid-token" }
        $response = Invoke-RestMethod -Uri "$backend/auth/me" -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        Write-Host " ✗ FAIL (Should have failed)" -ForegroundColor Red
        $failed++
    } catch {
        Write-Host " ✓ PASS (Correctly rejected)" -ForegroundColor Green
        $passed++
    }
} else {
    Write-Host "  ⚠ Skipping (no token)" -ForegroundColor Yellow
}

# ========================================
# 5. Social Login
# ========================================
Write-Host "`n[5/6] Social Login" -ForegroundColor Yellow

$socialData = @{
    email = "social@test.com"
    name = "Social User"
    provider = "google"
    providerId = "google-123"
} | ConvertTo-Json

Write-Host "  Social login endpoint..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$backend/auth/social" -Method Post -Body $socialData -ContentType "application/json" -TimeoutSec 10
    Write-Host " ✓ PASS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    $failed++
}

# ========================================
# 6. Logout
# ========================================
Write-Host "`n[6/6] Logout" -ForegroundColor Yellow

if ($token) {
    Write-Host "  Logout..." -NoNewline
    try {
        $headers = @{ "Authorization" = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$backend/auth/logout" -Method Post -Headers $headers -TimeoutSec 10
        Write-Host " ✓ PASS" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        $failed++
    }
} else {
    Write-Host "  ⚠ Skipping (no token)" -ForegroundColor Yellow
}

# ========================================
# Summary
# ========================================
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

$total = $passed + $failed
if ($total -gt 0) {
    $passRate = [math]::Round(($passed / $total) * 100, 2)
    Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } else { "Yellow" })
}

if ($failed -eq 0 -and $passed -gt 0) {
    Write-Host "`n✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed" -ForegroundColor Yellow
    exit 1
}
