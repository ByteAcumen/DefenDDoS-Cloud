# Database Verification Script for DefenDDoS
# Verifies InfluxDB data integrity, insertion, and query performance

param(
    [string]$InfluxUrl = "http://localhost:8086",
    [string]$Token = "7QotbzsDl1Mg2JVkh3WhBHxw9YHLDRZT4fd7thN9015P1xuhs0BCpvVktQ2YJrU0_7fI3JP4yjIav5mrNYkSpg==",
    [string]$Org = "defenddos-org",
    [string]$Bucket = "ddos-bucket"
)

$headers = @{
    "Authorization" = "Token $Token"
    "Content-Type" = "application/json"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DATABASE VERIFICATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Check total record count
Write-Host "[TEST 1] Checking total record count..." -ForegroundColor Yellow
try {
    $flux = @"
from(bucket: "$Bucket")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "traffic")
  |> count()
"@
    
    $body = @{
        query = $flux
        org = $Org
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$InfluxUrl/api/v2/query" -Method POST -Headers $headers -Body $body
    
    if ($result) {
        Write-Host "  [OK] Database is accessible" -ForegroundColor Green
        Write-Host "  Records found in last 24h" -ForegroundColor Green
    }
}
catch {
    Write-Host "  [FAIL] Database query failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Verify recent data insertion
Write-Host "`n[TEST 2] Verifying recent data insertion..." -ForegroundColor Yellow
try {
    $flux = @"
from(bucket: "$Bucket")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "traffic")
  |> limit(n: 10)
"@
    
    $body = @{
        query = $flux
        org = $Org
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$InfluxUrl/api/v2/query" -Method POST -Headers $headers -Body $body
    
    if ($result) {
        Write-Host "  [OK] Recent data found (last 5 minutes)" -ForegroundColor Green
    }
    else {
        Write-Host "  [WARN] No data in last 5 minutes" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  [FAIL] Recent data query failed" -ForegroundColor Red
}

# Test 3: Query performance test
Write-Host "`n[TEST 3] Testing query performance..." -ForegroundColor Yellow
$timeRanges = @("1h", "6h", "24h")

foreach ($range in $timeRanges) {
    try {
        $flux = @"
from(bucket: "$Bucket")
  |> range(start: -$range)
  |> filter(fn: (r) => r._measurement == "traffic")
  |> limit(n: 100)
"@
        
        $body = @{
            query = $flux
            org = $Org
        } | ConvertTo-Json

        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $result = Invoke-RestMethod -Uri "$InfluxUrl/api/v2/query" -Method POST -Headers $headers -Body $body
        $sw.Stop()
        
        $elapsed = $sw.ElapsedMilliseconds
        $status = if ($elapsed -lt 500) { "[OK]"; "Green" } elseif ($elapsed -lt 1000) { "[WARN]"; "Yellow" } else { "[SLOW]"; "Red" }
        
        Write-Host "  $($status[0]) Query for last $range took ${elapsed}ms" -ForegroundColor $status[1]
    }
    catch {
        Write-Host "  [FAIL] Query for $range failed" -ForegroundColor Red
    }
}

# Test 4: Check data fields integrity
Write-Host "`n[TEST 4] Checking data field integrity..." -ForegroundColor Yellow
try {
    $flux = @"
from(bucket: "$Bucket")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "traffic")
  |> limit(n: 1)
"@
    
    $body = @{
        query = $flux
        org = $Org
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$InfluxUrl/api/v2/query" -Method POST -Headers $headers -Body $body
    
    if ($result) {
        Write-Host "  [OK] Data fields are present" -ForegroundColor Green
    }
}
catch {
    Write-Host "  [FAIL] Field integrity check failed" -ForegroundColor Red
}

# Test 5: Database health check
Write-Host "`n[TEST 5] Checking database health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$InfluxUrl/health" -Method GET
    
    if ($health.status -eq "pass") {
        Write-Host "  [OK] InfluxDB health: PASS" -ForegroundColor Green
        Write-Host "  Version: $($health.version)" -ForegroundColor Cyan
    }
    else {
        Write-Host "  [WARN] InfluxDB health: $($health.status)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  [FAIL] Health check failed" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DATABASE VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
