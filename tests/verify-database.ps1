# Database Verification Script
# Tests InfluxDB data integrity, insertion, and retrieval

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('GetCount', 'VerifyInsert', 'VerifyIntegrity', 'QueryPerformance', 'All')]
    [string]$Action,
    
    [int]$ExpectedCount = 0,
    [string]$TimeRange = '-1h'
)

$ErrorActionPreference = 'Stop'
$API_KEY = 'defenddos-secret-key-123'
$BASE_URL = 'http://localhost:8082'
$INFLUX_URL = 'http://localhost:8086'
$INFLUX_TOKEN = '7QotbzsDl1Mg2JVkh3WhBHxw9YHLDRZT4fd7thN9015P1xuhs0BCpvVktQ2YJrU0_7fI3JP4yjIav5mrNYkSpg=='
$INFLUX_ORG = 'defenddos-org'
$INFLUX_BUCKET = 'defenddos'

$headers = @{
    'X-API-KEY' = $API_KEY
    'Content-Type' = 'application/json'
}

$influxHeaders = @{
    'Authorization' = "Token $INFLUX_TOKEN"
    'Content-Type' = 'application/json'
}

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Title" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Get-InfluxDBRecordCount {
    Write-TestHeader "📊 COUNTING INFLUXDB RECORDS"
    
    $flux = @"
from(bucket: "$INFLUX_BUCKET")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "traffic_data")
  |> count()
"@

    try {
        $body = @{
            query = $flux
            type = "flux"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$INFLUX_URL/api/v2/query?org=$INFLUX_ORG" `
            -Method POST `
            -Headers $influxHeaders `
            -Body $body

        # Parse CSV response
        $lines = $response -split "`n" | Where-Object { $_ -match '^\d' }
        $totalCount = 0
        
        foreach ($line in $lines) {
            $fields = $line -split ','
            if ($fields.Count -gt 6) {
                $count = [int]$fields[6]
                $totalCount += $count
            }
        }

        Write-Host "✅ Total Records in InfluxDB: $totalCount" -ForegroundColor Green
        return $totalCount
    }
    catch {
        Write-Host "❌ Error querying InfluxDB: $_" -ForegroundColor Red
        return 0
    }
}

function Test-DataInsertion {
    param([int]$ExpectedCount)
    
    Write-TestHeader "✍️ TESTING DATA INSERTION"
    
    $initialCount = Get-InfluxDBRecordCount
    Write-Host "`nInitial count: $initialCount records" -ForegroundColor Yellow
    Write-Host "Inserting $ExpectedCount test records..." -ForegroundColor Yellow
    
    $insertedCount = 0
    $failedCount = 0
    $startTime = Get-Date

    for ($i = 1; $i -le $ExpectedCount; $i++) {
        $trafficData = @{
            sourceIp = "192.168.$([Math]::Floor($i / 256)).$($i % 256)"
            destinationIp = "10.0.0.1"
            packetCount = Get-Random -Minimum 100 -Maximum 10000
            byteCount = Get-Random -Minimum 50000 -Maximum 5000000
            protocol = "TCP"
        } | ConvertTo-Json

        try {
            $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/traffic/ingest" `
                -Method POST `
                -Headers $headers `
                -Body $trafficData
            
            if ($response.success) {
                $insertedCount++
            } else {
                $failedCount++
            }
        }
        catch {
            $failedCount++
        }

        if ($i % 100 -eq 0) {
            Write-Host "  Inserted $i / $ExpectedCount records..." -ForegroundColor Gray
        }
    }

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    Write-Host "`n✅ Insertion complete" -ForegroundColor Green
    Write-Host "  Successfully inserted: $insertedCount" -ForegroundColor White
    Write-Host "  Failed: $failedCount" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Yellow" })
    Write-Host "  Duration: $($duration.ToString('0.00')) seconds" -ForegroundColor White
    Write-Host "  Rate: $([Math]::Round($insertedCount / $duration, 2)) records/sec" -ForegroundColor White

    # Wait for InfluxDB to process writes
    Write-Host "`nWaiting 5 seconds for InfluxDB to process..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    $finalCount = Get-InfluxDBRecordCount
    $actualInserted = $finalCount - $initialCount

    Write-Host "`nVerification:" -ForegroundColor Cyan
    Write-Host "  Initial count: $initialCount" -ForegroundColor White
    Write-Host "  Final count: $finalCount" -ForegroundColor White
    Write-Host "  Expected inserted: $ExpectedCount" -ForegroundColor White
    Write-Host "  Actually inserted: $actualInserted" -ForegroundColor White

    if ($actualInserted -ge $ExpectedCount * 0.95) {
        Write-Host "`n✅ DATA INSERTION TEST PASSED (>95% success rate)" -ForegroundColor Green -BackgroundColor DarkGreen
        return $true
    } else {
        Write-Host "`n⚠️ DATA INSERTION TEST WARNING (some data loss detected)" -ForegroundColor Yellow -BackgroundColor DarkYellow
        return $false
    }
}

function Test-QueryPerformance {
    param([string]$TimeRange)
    
    Write-TestHeader "⚡ TESTING QUERY PERFORMANCE"
    
    $timeRanges = @('-5m', '-1h', '-6h', '-24h')
    $results = @()

    foreach ($range in $timeRanges) {
        Write-Host "`nTesting query for range: $range" -ForegroundColor Yellow
        
        $iterations = 10
        $times = @()

        for ($i = 1; $i -le $iterations; $i++) {
            try {
                $start = Get-Date
                $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/traffic/query?range=$range" `
                    -Headers $headers
                $end = Get-Date
                $duration = ($end - $start).TotalMilliseconds
                $times += $duration
            }
            catch {
                Write-Host "  ❌ Query failed: $_" -ForegroundColor Red
            }
        }

        if ($times.Count -gt 0) {
            $avgTime = ($times | Measure-Object -Average).Average
            $minTime = ($times | Measure-Object -Minimum).Minimum
            $maxTime = ($times | Measure-Object -Maximum).Maximum

            $result = [PSCustomObject]@{
                TimeRange = $range
                AvgMs = [Math]::Round($avgTime, 2)
                MinMs = [Math]::Round($minTime, 2)
                MaxMs = [Math]::Round($maxTime, 2)
                Status = if ($avgTime -lt 500) { "✅ Excellent" } elseif ($avgTime -lt 1000) { "✅ Good" } elseif ($avgTime -lt 2000) { "⚠️ Acceptable" } else { "❌ Slow" }
            }

            $results += $result

            Write-Host "  Avg: $($result.AvgMs)ms | Min: $($result.MinMs)ms | Max: $($result.MaxMs)ms | $($result.Status)" -ForegroundColor White
        }
    }

    Write-Host "`n📊 Query Performance Summary:" -ForegroundColor Cyan
    $results | Format-Table -AutoSize

    $allGood = $results | Where-Object { $_.AvgMs -lt 2000 }
    if ($allGood.Count -eq $results.Count) {
        Write-Host "`n✅ QUERY PERFORMANCE TEST PASSED" -ForegroundColor Green -BackgroundColor DarkGreen
        return $true
    } else {
        Write-Host "`n⚠️ QUERY PERFORMANCE NEEDS IMPROVEMENT" -ForegroundColor Yellow -BackgroundColor DarkYellow
        return $false
    }
}

function Test-DataIntegrity {
    Write-TestHeader "🔍 TESTING DATA INTEGRITY"
    
    Write-Host "Inserting 100 test records with known values..." -ForegroundColor Yellow
    $testRecords = @()
    $startTimestamp = Get-Date

    for ($i = 1; $i -le 100; $i++) {
        $record = @{
            sourceIp = "10.10.$i.1"
            destinationIp = "10.20.$i.1"
            packetCount = $i * 100
            byteCount = $i * 50000
            protocol = "INTEGRITY_TEST"
        }

        $testRecords += $record
        
        $body = $record | ConvertTo-Json
        Invoke-RestMethod -Uri "$BASE_URL/api/v1/traffic/ingest" `
            -Method POST `
            -Headers $headers `
            -Body $body | Out-Null
    }

    Write-Host "  ✅ Inserted 100 test records" -ForegroundColor Green
    Start-Sleep -Seconds 3

    Write-Host "`nVerifying data integrity..." -ForegroundColor Yellow
    
    # Query back the data
    $flux = @"
from(bucket: "$INFLUX_BUCKET")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "traffic_data")
  |> filter(fn: (r) => r.sourceIp =~ /^10\.10\./)
"@

    $body = @{
        query = $flux
        type = "flux"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$INFLUX_URL/api/v2/query?org=$INFLUX_ORG" `
        -Method POST `
        -Headers $influxHeaders `
        -Body $body

    $lines = $response -split "`n" | Where-Object { $_ -match '^10\.10\.' }
    $foundCount = ($lines | Select-Object -Unique).Count

    Write-Host "`nIntegrity Check Results:" -ForegroundColor Cyan
    Write-Host "  Inserted: 100 records" -ForegroundColor White
    Write-Host "  Found: $foundCount records" -ForegroundColor White
    Write-Host "  Match: $($foundCount -eq 100)" -ForegroundColor $(if ($foundCount -eq 100) { "Green" } else { "Red" })

    if ($foundCount -ge 95) {
        Write-Host "`n✅ DATA INTEGRITY TEST PASSED" -ForegroundColor Green -BackgroundColor DarkGreen
        return $true
    } else {
        Write-Host "`n❌ DATA INTEGRITY TEST FAILED" -ForegroundColor Red -BackgroundColor DarkRed
        return $false
    }
}

# Main execution
switch ($Action) {
    'GetCount' {
        Get-InfluxDBRecordCount
    }
    'VerifyInsert' {
        Test-DataInsertion -ExpectedCount $ExpectedCount
    }
    'QueryPerformance' {
        Test-QueryPerformance -TimeRange $TimeRange
    }
    'VerifyIntegrity' {
        Test-DataIntegrity
    }
    'All' {
        Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green -BackgroundColor DarkGreen
        Write-Host "║  COMPREHENSIVE DATABASE VERIFICATION SUITE                        ║" -ForegroundColor Green -BackgroundColor DarkGreen
        Write-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green -BackgroundColor DarkGreen
        
        $results = @{
            'GetCount' = Get-InfluxDBRecordCount
            'DataInsertion' = Test-DataInsertion -ExpectedCount 500
            'QueryPerformance' = Test-QueryPerformance -TimeRange '-1h'
            'DataIntegrity' = Test-DataIntegrity
        }

        Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
        Write-Host "║  FINAL RESULTS                                                     ║" -ForegroundColor Cyan
        Write-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

        Write-Host "Current Record Count: $($results['GetCount'])" -ForegroundColor White
        Write-Host "Data Insertion Test: $(if ($results['DataInsertion']) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($results['DataInsertion']) { "Green" } else { "Red" })
        Write-Host "Query Performance Test: $(if ($results['QueryPerformance']) { '✅ PASSED' } else { '⚠️ WARNING' })" -ForegroundColor $(if ($results['QueryPerformance']) { "Green" } else { "Yellow" })
        Write-Host "Data Integrity Test: $(if ($results['DataIntegrity']) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($results['DataIntegrity']) { "Green" } else { "Red" })

        $allPassed = $results.Values | Where-Object { $_ -eq $false }
        if ($allPassed.Count -eq 0) {
            Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green -BackgroundColor DarkGreen
            Write-Host "║  ✅ ALL DATABASE TESTS PASSED - SYSTEM IS RELIABLE                ║" -ForegroundColor Green -BackgroundColor DarkGreen
            Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green -BackgroundColor DarkGreen
        } else {
            Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow -BackgroundColor DarkYellow
            Write-Host "║  ⚠️ SOME TESTS FAILED - REVIEW RESULTS ABOVE                      ║" -ForegroundColor Yellow -BackgroundColor DarkYellow
            Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow -BackgroundColor DarkYellow
        }
    }
}
