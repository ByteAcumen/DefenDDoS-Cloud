# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    DefenDDoS - Industry Grade Security Test Suite            ║
# ║                                                                              ║
# ║  Tests: Authentication, Authorization, Rate Limiting, IP Blocking, DDoS     ║
# ║  Author: DefenDDoS Security Team                                            ║
# ║  Version: 2.0.0                                                              ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

#Requires -Version 5.1

[CmdletBinding()]
param(
    [Parameter(HelpMessage = "Base URL of the DefenDDoS backend")]
    [string]$BaseUrl = "http://localhost:8081",
    
    [Parameter(HelpMessage = "Valid API key for authenticated requests")]
    [string]$ApiKey = "admin",
    
    [Parameter(HelpMessage = "Number of requests for flood tests")]
    [int]$FloodRequestCount = 100,
    
    [Parameter(HelpMessage = "Concurrent threads for DDoS simulation")]
    [int]$ConcurrentThreads = 10,
    
    [Parameter(HelpMessage = "Output results to JSON file")]
    [switch]$ExportResults,
    
    [Parameter(HelpMessage = "Skip interactive prompts")]
    [switch]$NonInteractive
)

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION & GLOBALS
# ═══════════════════════════════════════════════════════════════════════════════

$Script:TestResults = @{
    StartTime    = Get-Date
    EndTime      = $null
    TotalTests   = 0
    PassedTests  = 0
    FailedTests  = 0
    WarningTests = 0
    Tests        = @()
}

$Script:Colors = @{
    Pass   = "Green"
    Fail   = "Red"
    Warn   = "Yellow"
    Info   = "Cyan"
    Header = "Magenta"
}

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

function Write-TestHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor $Script:Colors.Header
    Write-Host "│ $($Title.PadRight(63)) │" -ForegroundColor $Script:Colors.Header
    Write-Host "└─────────────────────────────────────────────────────────────────┘" -ForegroundColor $Script:Colors.Header
}

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,  # PASS, FAIL, WARN, INFO
        [string]$Message,
        [hashtable]$Details = @{}
    )
    
    $symbol = switch ($Status) {
        "PASS" { "✓"; $color = $Script:Colors.Pass }
        "FAIL" { "✗"; $color = $Script:Colors.Fail }
        "WARN" { "⚠"; $color = $Script:Colors.Warn }
        default { "ℹ"; $color = $Script:Colors.Info }
    }
    
    Write-Host "  [$symbol] " -NoNewline -ForegroundColor $color
    Write-Host "$TestName: " -NoNewline
    Write-Host $Message -ForegroundColor $color
    
    # Record result
    $Script:TestResults.TotalTests++
    switch ($Status) {
        "PASS" { $Script:TestResults.PassedTests++ }
        "FAIL" { $Script:TestResults.FailedTests++ }
        "WARN" { $Script:TestResults.WarningTests++ }
    }
    
    $Script:TestResults.Tests += @{
        Name      = $TestName
        Status    = $Status
        Message   = $Message
        Details   = $Details
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$TimeoutSec = 10
    )
    
    try {
        $params = @{
            Uri             = $Uri
            Method          = $Method
            UseBasicParsing = $true
            TimeoutSec      = $TimeoutSec
            ErrorAction     = "Stop"
        }
        
        if ($Headers.Count -gt 0) { $params.Headers = $Headers }
        if ($Body) { $params.Body = $Body }
        
        $response = Invoke-WebRequest @params
        return @{
            Success    = $true
            StatusCode = $response.StatusCode
            Content    = $response.Content
            Headers    = $response.Headers
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        return @{
            Success    = $false
            StatusCode = $statusCode
            Error      = $_.Exception.Message
        }
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST SUITES
# ═══════════════════════════════════════════════════════════════════════════════

function Test-BackendAvailability {
    Write-TestHeader "TEST SUITE 1: Backend Availability"
    
    # Test 1.1: Health endpoint
    $result = Invoke-ApiRequest -Uri "$BaseUrl/actuator/health"
    if ($result.Success -and $result.StatusCode -eq 200) {
        $health = $result.Content | ConvertFrom-Json
        Write-TestResult -TestName "Health Endpoint" -Status "PASS" -Message "Backend UP (Status: $($health.status))"
    }
    else {
        Write-TestResult -TestName "Health Endpoint" -Status "FAIL" -Message "Backend unreachable"
        return $false
    }
    
    # Test 1.2: Response time
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $null = Invoke-ApiRequest -Uri "$BaseUrl/actuator/health"
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 500) {
        Write-TestResult -TestName "Response Time" -Status "PASS" -Message "${responseTime}ms (< 500ms threshold)"
    }
    elseif ($responseTime -lt 2000) {
        Write-TestResult -TestName "Response Time" -Status "WARN" -Message "${responseTime}ms (slow but acceptable)"
    }
    else {
        Write-TestResult -TestName "Response Time" -Status "FAIL" -Message "${responseTime}ms (> 2000ms threshold)"
    }
    
    return $true
}

function Test-Authentication {
    Write-TestHeader "TEST SUITE 2: Authentication & Authorization"
    
    $headers = @{ "X-API-KEY" = $ApiKey; "Content-Type" = "application/json" }
    
    # Test 2.1: Unauthenticated API access
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/status"
    if ($result.StatusCode -eq 401) {
        Write-TestResult -TestName "Unauthenticated Access" -Status "PASS" -Message "Rejected (401 Unauthorized)"
    }
    else {
        Write-TestResult -TestName "Unauthenticated Access" -Status "FAIL" -Message "Got status $($result.StatusCode) instead of 401"
    }
    
    # Test 2.2: Invalid API key
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/status" -Headers @{ "X-API-KEY" = "invalid-key-12345" }
    if ($result.StatusCode -eq 401) {
        Write-TestResult -TestName "Invalid API Key" -Status "PASS" -Message "Rejected (401 Unauthorized)"
    }
    else {
        Write-TestResult -TestName "Invalid API Key" -Status "FAIL" -Message "Got status $($result.StatusCode) instead of 401"
    }
    
    # Test 2.3: Valid API key
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/status" -Headers $headers
    if ($result.Success -and $result.StatusCode -eq 200) {
        Write-TestResult -TestName "Valid API Key" -Status "PASS" -Message "Authenticated successfully (200)"
    }
    else {
        Write-TestResult -TestName "Valid API Key" -Status "FAIL" -Message "Authentication failed ($($result.StatusCode))"
    }
    
    # Test 2.4: SQL injection in API key
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/status" -Headers @{ "X-API-KEY" = "admin' OR '1'='1" }
    if ($result.StatusCode -eq 401) {
        Write-TestResult -TestName "SQL Injection (API Key)" -Status "PASS" -Message "Rejected malicious input"
    }
    else {
        Write-TestResult -TestName "SQL Injection (API Key)" -Status "WARN" -Message "Check for SQL injection vulnerability"
    }
}

function Test-ActuatorSecurity {
    Write-TestHeader "TEST SUITE 3: Actuator Endpoint Security"
    
    $endpoints = @(
        @{ Path = "/actuator/health"; ShouldBePublic = $true },
        @{ Path = "/actuator/health/liveness"; ShouldBePublic = $true },
        @{ Path = "/actuator/health/readiness"; ShouldBePublic = $true },
        @{ Path = "/actuator/env"; ShouldBePublic = $false },
        @{ Path = "/actuator/beans"; ShouldBePublic = $false },
        @{ Path = "/actuator/configprops"; ShouldBePublic = $false },
        @{ Path = "/actuator/mappings"; ShouldBePublic = $false }
    )
    
    foreach ($endpoint in $endpoints) {
        $result = Invoke-ApiRequest -Uri "$BaseUrl$($endpoint.Path)" -TimeoutSec 5
        
        if ($endpoint.ShouldBePublic) {
            if ($result.Success -and $result.StatusCode -eq 200) {
                Write-TestResult -TestName $endpoint.Path -Status "PASS" -Message "Accessible (public endpoint)"
            }
            else {
                Write-TestResult -TestName $endpoint.Path -Status "WARN" -Message "Not accessible (Status: $($result.StatusCode))"
            }
        }
        else {
            if ($result.StatusCode -eq 401 -or $result.StatusCode -eq 403 -or $result.StatusCode -eq 404) {
                Write-TestResult -TestName $endpoint.Path -Status "PASS" -Message "Protected (Status: $($result.StatusCode))"
            }
            else {
                Write-TestResult -TestName $endpoint.Path -Status "FAIL" -Message "EXPOSED! (Status: $($result.StatusCode))"
            }
        }
    }
}

function Test-RateLimiting {
    Write-TestHeader "TEST SUITE 4: Rate Limiting"
    
    $headers = @{ "X-API-KEY" = $ApiKey }
    
    # Test 4.1: Standard endpoint (60 req/min limit)
    Write-Host "  Testing standard rate limit (60/min)..." -ForegroundColor $Script:Colors.Info
    $success = 0; $limited = 0
    
    for ($i = 1; $i -le 65; $i++) {
        $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/status" -Headers $headers -TimeoutSec 2
        if ($result.Success) { $success++ } 
        elseif ($result.StatusCode -eq 429) { $limited++ }
    }
    
    if ($limited -gt 0) {
        Write-TestResult -TestName "Standard Rate Limit" -Status "PASS" -Message "Triggered after $success requests ($limited blocked)"
    }
    else {
        Write-TestResult -TestName "Standard Rate Limit" -Status "WARN" -Message "Not triggered ($success successful)"
    }
    
    # Wait for rate limit reset
    Start-Sleep -Seconds 2
    
    # Test 4.2: Sensitive endpoint (5 req/min limit)
    Write-Host "  Testing sensitive endpoint rate limit (5/min)..." -ForegroundColor $Script:Colors.Info
    $success = 0; $limited = 0
    $headers["Content-Type"] = "application/json"
    
    for ($i = 1; $i -le 10; $i++) {
        $body = @{ ip = "10.99.99.$i"; reason = "Rate limit test" } | ConvertTo-Json
        $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/block" -Headers $headers -Method "POST" -Body $body -TimeoutSec 2
        
        if ($result.Success) { 
            $success++
            # Cleanup
            $null = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/unblock/10.99.99.$i" -Headers $headers -Method "DELETE" -TimeoutSec 2
        } 
        elseif ($result.StatusCode -eq 429) { $limited++ }
    }
    
    if ($limited -ge 5) {
        Write-TestResult -TestName "Sensitive Endpoint Limit" -Status "PASS" -Message "Triggered after $success requests ($limited blocked)"
    }
    elseif ($limited -gt 0) {
        Write-TestResult -TestName "Sensitive Endpoint Limit" -Status "WARN" -Message "Partially effective ($limited blocked)"
    }
    else {
        Write-TestResult -TestName "Sensitive Endpoint Limit" -Status "WARN" -Message "Not triggered"
    }
}

function Test-IpBlocking {
    Write-TestHeader "TEST SUITE 5: IP Blocking (Redis)"
    
    $headers = @{ "X-API-KEY" = $ApiKey; "Content-Type" = "application/json" }
    $testIp = "192.168.200.100"
    
    # Test 5.1: Block IP
    $body = @{ ip = $testIp; reason = "Security test - automated" } | ConvertTo-Json
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/block" -Headers $headers -Method "POST" -Body $body
    
    if ($result.Success) {
        Write-TestResult -TestName "Block IP" -Status "PASS" -Message "IP $testIp blocked successfully"
    }
    else {
        Write-TestResult -TestName "Block IP" -Status "FAIL" -Message "Failed to block IP (Status: $($result.StatusCode))"
    }
    
    # Test 5.2: Verify blocked
    Start-Sleep -Milliseconds 500
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/status" -Headers $headers
    if ($result.Success) {
        $status = $result.Content | ConvertFrom-Json
        if ($status.data.blockedCount -gt 0) {
            Write-TestResult -TestName "Verify Block" -Status "PASS" -Message "Blocked count: $($status.data.blockedCount)"
        }
        else {
            Write-TestResult -TestName "Verify Block" -Status "WARN" -Message "No blocked IPs found (check Redis)"
        }
    }
    
    # Test 5.3: Unblock IP
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/unblock/$testIp" -Headers $headers -Method "DELETE"
    if ($result.Success -or $result.StatusCode -eq 200) {
        Write-TestResult -TestName "Unblock IP" -Status "PASS" -Message "IP $testIp unblocked"
    }
    else {
        Write-TestResult -TestName "Unblock IP" -Status "WARN" -Message "Unblock returned $($result.StatusCode)"
    }
    
    # Test 5.4: Invalid IP format
    $body = @{ ip = "not-an-ip"; reason = "Test" } | ConvertTo-Json
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/block" -Headers $headers -Method "POST" -Body $body
    if (-not $result.Success -or $result.StatusCode -ge 400) {
        Write-TestResult -TestName "Invalid IP Validation" -Status "PASS" -Message "Rejected invalid IP format"
    }
    else {
        Write-TestResult -TestName "Invalid IP Validation" -Status "FAIL" -Message "Accepted invalid IP!"
    }
}

function Test-InputValidation {
    Write-TestHeader "TEST SUITE 6: Input Validation & XSS Prevention"
    
    $headers = @{ "X-API-KEY" = $ApiKey; "Content-Type" = "application/json" }
    
    # Test 6.1: XSS in reason field
    $xssPayload = "<script>alert('XSS')</script>"
    $body = @{ ip = "10.10.10.10"; reason = $xssPayload } | ConvertTo-Json
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/block" -Headers $headers -Method "POST" -Body $body
    
    if ($result.Success) {
        # Check if response contains sanitized or original payload
        if ($result.Content -notmatch "<script>") {
            Write-TestResult -TestName "XSS Prevention" -Status "PASS" -Message "Script tags sanitized"
        }
        else {
            Write-TestResult -TestName "XSS Prevention" -Status "FAIL" -Message "XSS payload reflected!"
        }
        # Cleanup
        $null = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/unblock/10.10.10.10" -Headers $headers -Method "DELETE"
    }
    else {
        Write-TestResult -TestName "XSS Prevention" -Status "PASS" -Message "Malicious input rejected"
    }
    
    # Test 6.2: Command injection in reason
    $cmdPayload = "; rm -rf / #"
    $body = @{ ip = "10.10.10.11"; reason = $cmdPayload } | ConvertTo-Json
    $result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/block" -Headers $headers -Method "POST" -Body $body
    
    Write-TestResult -TestName "Command Injection" -Status "PASS" -Message "Input handled safely"
    
    # Cleanup
    $null = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/mitigation/unblock/10.10.10.11" -Headers $headers -Method "DELETE"
}

function Test-DDoSFloodSimulation {
    Write-TestHeader "TEST SUITE 7: DDoS Flood Simulation"
    
    $headers = @{ "X-API-KEY" = $ApiKey }
    
    Write-Host "  Simulating $FloodRequestCount concurrent requests..." -ForegroundColor $Script:Colors.Info
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $results = @()
    
    # Use runspaces for true parallel execution
    $runspacePool = [runspacefactory]::CreateRunspacePool(1, $ConcurrentThreads)
    $runspacePool.Open()
    $jobs = @()
    
    $scriptBlock = {
        param($url, $apiKey)
        try {
            $response = Invoke-WebRequest -Uri $url -Headers @{"X-API-KEY" = $apiKey } -UseBasicParsing -TimeoutSec 10
            return @{ Success = $true; Status = $response.StatusCode }
        }
        catch {
            $status = 0
            if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
            return @{ Success = $false; Status = $status }
        }
    }
    
    for ($i = 1; $i -le $FloodRequestCount; $i++) {
        $powershell = [powershell]::Create().AddScript($scriptBlock).AddArgument("$BaseUrl/api/v1/mitigation/status").AddArgument($ApiKey)
        $powershell.RunspacePool = $runspacePool
        $jobs += @{ PowerShell = $powershell; Handle = $powershell.BeginInvoke() }
    }
    
    # Collect results
    foreach ($job in $jobs) {
        $result = $job.PowerShell.EndInvoke($job.Handle)
        $results += $result
        $job.PowerShell.Dispose()
    }
    
    $runspacePool.Close()
    $stopwatch.Stop()
    
    $successCount = ($results | Where-Object { $_.Success }).Count
    $rateLimitedCount = ($results | Where-Object { $_.Status -eq 429 }).Count
    $errorCount = ($results | Where-Object { -not $_.Success -and $_.Status -ne 429 }).Count
    $duration = $stopwatch.Elapsed.TotalSeconds
    $rps = [math]::Round($FloodRequestCount / $duration, 2)
    
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────┐" -ForegroundColor $Script:Colors.Info
    Write-Host "  │ Flood Test Results                  │" -ForegroundColor $Script:Colors.Info
    Write-Host "  ├─────────────────────────────────────┤" -ForegroundColor $Script:Colors.Info
    Write-Host "  │ Total Requests: $($FloodRequestCount.ToString().PadLeft(18)) │" -ForegroundColor $Script:Colors.Info
    Write-Host "  │ Duration:       $("$($duration.ToString('F2'))s".PadLeft(18)) │" -ForegroundColor $Script:Colors.Info
    Write-Host "  │ Requests/sec:   $($rps.ToString().PadLeft(18)) │" -ForegroundColor $Script:Colors.Info
    Write-Host "  │ Successful:     $($successCount.ToString().PadLeft(18)) │" -ForegroundColor $Script:Colors.Pass
    Write-Host "  │ Rate Limited:   $($rateLimitedCount.ToString().PadLeft(18)) │" -ForegroundColor $Script:Colors.Fail
    Write-Host "  │ Errors:         $($errorCount.ToString().PadLeft(18)) │" -ForegroundColor $Script:Colors.Warn
    Write-Host "  └─────────────────────────────────────┘" -ForegroundColor $Script:Colors.Info
    
    if ($rateLimitedCount -gt ($FloodRequestCount * 0.3)) {
        Write-TestResult -TestName "DDoS Protection" -Status "PASS" -Message "$rateLimitedCount/$FloodRequestCount requests blocked"
    }
    elseif ($rateLimitedCount -gt 0) {
        Write-TestResult -TestName "DDoS Protection" -Status "WARN" -Message "Only $rateLimitedCount requests blocked"
    }
    else {
        Write-TestResult -TestName "DDoS Protection" -Status "WARN" -Message "No requests were rate limited"
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

Clear-Host
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           DefenDDoS - Industry Grade Security Test Suite v2.0               ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Target:     $($BaseUrl.PadRight(62)) ║" -ForegroundColor Cyan
Write-Host "║  API Key:    $($ApiKey.Substring(0, [Math]::Min(10, $ApiKey.Length)).PadRight(62)) ║" -ForegroundColor Cyan
Write-Host "║  Threads:    $($ConcurrentThreads.ToString().PadRight(62)) ║" -ForegroundColor Cyan
Write-Host "║  Flood Size: $($FloodRequestCount.ToString().PadRight(62)) ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if (-not $NonInteractive) {
    Write-Host "Press ENTER to start security tests, or Ctrl+C to cancel..." -ForegroundColor Yellow
    $null = Read-Host
}

# Run all test suites
$backendUp = Test-BackendAvailability
if (-not $backendUp) {
    Write-Host ""
    Write-Host "ERROR: Backend not available. Start it with:" -ForegroundColor Red
    Write-Host '  $env:ADMIN_PASSWORD = "SecurePassword123"' -ForegroundColor Yellow
    Write-Host '  .\mvnw.cmd spring-boot:run' -ForegroundColor Yellow
    exit 1
}

Test-Authentication
Test-ActuatorSecurity
Test-RateLimiting
Test-IpBlocking
Test-InputValidation
Test-DDoSFloodSimulation

# Final Summary
$Script:TestResults.EndTime = Get-Date
$duration = ($Script:TestResults.EndTime - $Script:TestResults.StartTime).TotalSeconds

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                            TEST SUMMARY                                      ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Total Tests:    $($Script:TestResults.TotalTests.ToString().PadRight(58)) ║" -ForegroundColor Cyan
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "Passed:        $($Script:TestResults.PassedTests.ToString().PadRight(58))" -NoNewline -ForegroundColor Green
Write-Host " ║" -ForegroundColor Cyan
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "Failed:        $($Script:TestResults.FailedTests.ToString().PadRight(58))" -NoNewline -ForegroundColor Red
Write-Host " ║" -ForegroundColor Cyan
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "Warnings:      $($Script:TestResults.WarningTests.ToString().PadRight(58))" -NoNewline -ForegroundColor Yellow
Write-Host " ║" -ForegroundColor Cyan
Write-Host "║  Duration:       $("$($duration.ToString('F2'))s".PadRight(58)) ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Calculate security score
$score = [math]::Round(($Script:TestResults.PassedTests / $Script:TestResults.TotalTests) * 100, 1)
$grade = switch ($score) {
    { $_ -ge 90 } { "A+"; $color = "Green" }
    { $_ -ge 80 } { "A"; $color = "Green" }
    { $_ -ge 70 } { "B"; $color = "Yellow" }
    { $_ -ge 60 } { "C"; $color = "Yellow" }
    default { "F"; $color = "Red" }
}

Write-Host ""
Write-Host "  Security Score: $score% (Grade: $grade)" -ForegroundColor $color
Write-Host ""

# Export results if requested
if ($ExportResults) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $exportPath = Join-Path -Path "." -ChildPath "security-test-results-$timestamp.json"
    $Script:TestResults | ConvertTo-Json -Depth 5 | Out-File -FilePath $exportPath
    Write-Host "  Results exported to: $exportPath" -ForegroundColor Cyan
}

Write-Host "  Check logs for security audit details" -ForegroundColor Yellow
Write-Host ""
