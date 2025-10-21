# DefenDDoS Testing Guide

## 🧪 Complete Testing Reference

This guide provides all commands and scripts to test your DefenDDoS backend.

---

## 🚀 Quick Start Testing

### Option 1: Automated Test Scripts (Recommended)

```powershell
# Quick Health Check (7 tests, ~10 seconds)
.\test-quick.ps1

# Full Comprehensive Test (All 21 endpoints, ~2 minutes)
.\test-all-apis.ps1

# Quick Test (Skip auto-detection)
.\test-all-apis.ps1 -QuickTest

# Verbose Mode (See all response data)
.\test-all-apis.ps1 -Verbose

# Load Testing (50 normal + 10 attack traffic)
.\test-load.ps1

# Custom Load Test
.\test-load.ps1 -NormalTrafficCount 100 -AttackTrafficCount 20
```

### Option 2: Manual Commands

#### 1. Health Checks
```powershell
# Backend Service
Invoke-RestMethod -Uri "http://localhost:8082/actuator/health"

# ML Service
Invoke-RestMethod -Uri "http://localhost:8000/health"

# InfluxDB
Invoke-RestMethod -Uri "http://localhost:8086/health"
```

#### 2. Quick System Test
```powershell
# Ingest normal traffic
$normal = @{
    sourceIp = "192.168.1.1"
    destinationIp = "10.0.0.1"
    packetCount = 500
    byteCount = 32000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
    -Method POST `
    -Body ($normal | ConvertTo-Json) `
    -ContentType "application/json"

# Ingest attack traffic
$attack = @{
    sourceIp = "192.168.1.100"
    destinationIp = "10.0.0.1"
    packetCount = 125000
    byteCount = 8000000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
    -Method POST `
    -Body ($attack | ConvertTo-Json) `
    -ContentType "application/json"

# Wait for detection
Start-Sleep -Seconds 35

# Check blocked IPs
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/blocked"
```

---

## 📊 Traffic Management Tests

### Test 1: Ingest Traffic
```powershell
$traffic = @{
    sourceIp = "203.0.113.50"
    destinationIp = "10.0.0.1"
    packetCount = 1500
    byteCount = 96000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
    -Method POST `
    -Body ($traffic | ConvertTo-Json) `
    -ContentType "application/json"
```

### Test 2: Query Traffic
```powershell
# Last 5 minutes
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/query?range=-5m"

# Last hour
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/query?range=-1h"
```

### Test 3: Get Traffic Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/summary?duration=1h"
```

### Test 4: Get Visualization Data
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/visualization?duration=1h&interval=5m"
```

### Test 5: Manual ML Prediction
```powershell
$testData = @{
    sourceIp = "45.33.32.156"
    destinationIp = "10.0.0.1"
    packetCount = 125000
    byteCount = 8000000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/predict-attack" `
    -Method POST `
    -Body ($testData | ConvertTo-Json) `
    -ContentType "application/json"
```

### Test 6: Check ML Service Health
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ml-health"
```

---

## 🛡️ Mitigation Tests

### Test 7: Block IP Manually
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/block/45.33.32.156?reason=Manual%20test" `
    -Method POST
```

### Test 8: Check If IP is Blocked
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/is-blocked/45.33.32.156"
```

### Test 9: List All Blocked IPs
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/blocked"
```

### Test 10: Unblock IP
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/unblock/45.33.32.156" `
    -Method POST
```

### Test 11: Get Mitigation Stats
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/stats"
```

---

## 🔐 Security Tests

### Test 12: Get Security Dashboard
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/security/dashboard"
```

### Test 13: Manually Trigger Detection
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/security/trigger-detection" `
    -Method POST
```

### Test 14: Analyze Specific IP
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/security/analyze/45.33.32.156" `
    -Method POST
```

### Test 15: Get System Status
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/security/status"
```

### Test 16: Test Alert System
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/security/test-alert" `
    -Method POST
```

---

## 🤖 Direct ML Service Tests

### Test 17: ML Service Health
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

### Test 18: Direct ML Prediction (Simplified)
```powershell
# Note: Direct ML service requires full feature set (78 features)
# Use backend API instead for simplified prediction
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/predict-attack" `
    -Method POST `
    -Body (@{
        sourceIp = "192.168.1.100"
        destinationIp = "10.0.0.1"
        packetCount = 125000
        byteCount = 8000000
    } | ConvertTo-Json) `
    -ContentType "application/json"
```

---

## 📈 Monitoring Tests

### Test 19: Backend Actuator Health
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/actuator/health"
```

### Test 20: Backend Info
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/actuator/info"
```

### Test 21: Backend Metrics
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/actuator/metrics"
```

---

## 🎯 Comprehensive Test Scenarios

### Scenario 1: Normal Traffic Flow
```powershell
Write-Host "Testing normal traffic flow..." -ForegroundColor Cyan

# 1. Ingest normal traffic
$normal = @{
    sourceIp = "192.168.1.1"
    destinationIp = "10.0.0.1"
    packetCount = 500
    byteCount = 32000
}
$result = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
    -Method POST `
    -Body ($normal | ConvertTo-Json) `
    -ContentType "application/json"

Write-Host "✅ Traffic ingested: $($result.data.sourceIp)" -ForegroundColor Green

# 2. Check prediction
$prediction = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/predict-attack" `
    -Method POST `
    -Body ($normal | ConvertTo-Json) `
    -ContentType "application/json"

Write-Host "ML Analysis:" -ForegroundColor Yellow
Write-Host "  Is Attack: $($prediction.data.is_attack)" -ForegroundColor White
Write-Host "  Confidence: $($prediction.data.confidence_percentage)%" -ForegroundColor White
Write-Host "  Severity: $($prediction.data.severity)" -ForegroundColor White
```

### Scenario 2: Attack Detection & Blocking
```powershell
Write-Host "`nTesting attack detection and blocking..." -ForegroundColor Cyan

# 1. Ingest attack traffic
$attack = @{
    sourceIp = "203.0.113.99"
    destinationIp = "10.0.0.1"
    packetCount = 150000
    byteCount = 9600000
}
$result = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
    -Method POST `
    -Body ($attack | ConvertTo-Json) `
    -ContentType "application/json"

Write-Host "✅ Attack traffic ingested: $($result.data.sourceIp)" -ForegroundColor Green

# 2. Wait for auto-detection
Write-Host "⏳ Waiting 35 seconds for auto-detection..." -ForegroundColor Yellow
Start-Sleep -Seconds 35

# 3. Check if blocked
$blocked = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/blocked"

if ($blocked.blockedIps -contains $attack.sourceIp) {
    Write-Host "✅ IP was auto-blocked successfully!" -ForegroundColor Green
    Write-Host "   Blocked IPs: $($blocked.count)" -ForegroundColor White
} else {
    Write-Host "⚠️  IP was not blocked (check logs)" -ForegroundColor Yellow
}
```

### Scenario 3: Manual IP Management
```powershell
Write-Host "`nTesting manual IP management..." -ForegroundColor Cyan

$testIp = "198.51.100.50"

# 1. Block IP manually
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/block/$testIp?reason=Manual%20test" `
    -Method POST | Out-Null
Write-Host "✅ IP $testIp blocked manually" -ForegroundColor Green

# 2. Check if blocked
$status = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/is-blocked/$testIp"
Write-Host "   Is Blocked: $($status.data.isBlocked)" -ForegroundColor White

# 3. Unblock IP
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/unblock/$testIp" `
    -Method POST | Out-Null
Write-Host "✅ IP $testIp unblocked" -ForegroundColor Green
```

---

## 🔧 Load Testing

### Multiple Traffic Ingestion
```powershell
Write-Host "Ingesting multiple traffic samples..." -ForegroundColor Cyan

$ips = @("192.168.1.1", "192.168.1.2", "192.168.1.3", "192.168.1.4", "192.168.1.5")

foreach ($ip in $ips) {
    $traffic = @{
        sourceIp = $ip
        destinationIp = "10.0.0.1"
        packetCount = Get-Random -Minimum 100 -Maximum 50000
        byteCount = Get-Random -Minimum 6400 -Maximum 3200000
    }
    
    try {
        Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
            -Method POST `
            -Body ($traffic | ConvertTo-Json) `
            -ContentType "application/json" | Out-Null
        Write-Host "✅ Ingested: $ip" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed: $ip" -ForegroundColor Red
    }
}

Write-Host "✅ Load test complete!" -ForegroundColor Green
```

---

## 📋 Test Checklist

After running tests, verify:

- [ ] Health checks pass for all services
- [ ] Traffic can be ingested successfully
- [ ] ML predictions return valid responses
- [ ] Auto-detection runs every 30 seconds (check logs)
- [ ] Attack traffic gets auto-blocked
- [ ] Manual blocking/unblocking works
- [ ] Blocked IPs list is accurate
- [ ] Traffic summary returns data
- [ ] Visualization data is formatted correctly
- [ ] Security dashboard shows current status
- [ ] Mitigation stats are accurate
- [ ] All 21 API endpoints respond

---

## 🐛 Troubleshooting Tests

### If Tests Fail

1. **Check Services**:
```powershell
docker-compose ps
```

2. **View Logs**:
```powershell
docker-compose logs -f backend-service
docker-compose logs -f ml-service
```

3. **Restart Services**:
```powershell
docker-compose restart
```

4. **Fresh Start**:
```powershell
.\start-fresh.ps1
```

---

## 📊 Expected Results

### Normal Traffic
- `is_attack`: false
- `confidence`: < 50%
- `severity`: NORMAL or LOW
- `should_block`: false

### Attack Traffic
- `is_attack`: true
- `confidence`: 50-100%
- `severity`: MEDIUM/HIGH/CRITICAL
- `should_block`: true
- Auto-blocked within 30 seconds

---

## 🎯 Performance Benchmarks

- **API Response Time**: < 100ms
- **ML Prediction Time**: 50-200ms
- **Detection Cycle**: 30 seconds
- **Auto-Block Time**: < 35 seconds from ingestion
- **Database Write**: < 10ms
- **Database Query**: < 50ms

---

## 📝 Test Data Files

Located in `test-data/`:
- `test-attack-traffic.json` - Attack traffic samples
- `test-benign-traffic.json` - Normal traffic samples

---

## 📝 Available Test Files

### Automated PowerShell Scripts
1. **`test-quick.ps1`** - Fast health check (7 tests, ~10 seconds)
   - All service health checks
   - Basic traffic ingestion
   - ML prediction test
   - Security dashboard check

2. **`test-all-apis.ps1`** - Comprehensive API testing (21+ tests, ~2 minutes)
   - All API endpoints
   - Normal & attack traffic scenarios
   - Auto-detection testing (35 second wait)
   - Edge case validation
   - Detailed test report

3. **`test-load.ps1`** - Load & performance testing
   - Configurable traffic volumes
   - Performance metrics
   - Throughput measurement
   - Auto-detection validation

### HTTP Test Files (VS Code REST Client)
1. **`requests-comprehensive.http`** - Manual API testing
   - 80+ individual test cases
   - Step-by-step scenarios
   - Copy-paste test requests
   - Expected results documented

### Test Data
Located in `test-data/`:
- `test-attack-traffic.json` - Attack traffic samples
- `test-benign-traffic.json` - Normal traffic samples

---

## 🎯 Recommended Testing Workflow

### 1. Initial Setup Verification
```powershell
# Quick health check
.\test-quick.ps1
```

### 2. Comprehensive Testing
```powershell
# Full test suite with auto-detection
.\test-all-apis.ps1

# Or skip auto-detection for faster testing
.\test-all-apis.ps1 -QuickTest
```

### 3. Performance Testing
```powershell
# Default load test (50 normal + 10 attack)
.\test-load.ps1

# Heavy load test
.\test-load.ps1 -NormalTrafficCount 200 -AttackTrafficCount 50

# With detailed responses
.\test-load.ps1 -ShowResponses
```

### 4. Manual API Testing
- Open `requests-comprehensive.http` in VS Code
- Use REST Client extension to send individual requests
- Test specific scenarios step-by-step

---

## 📊 Test Scripts Features

### test-quick.ps1
✅ Fast execution (~10 seconds)  
✅ Validates all core services  
✅ Perfect for continuous monitoring  
✅ Exit code 0 (success) or 1 (failure)

**Usage:**
```powershell
.\test-quick.ps1
```

### test-all-apis.ps1
✅ Tests all 21 API endpoints  
✅ Validates normal & attack traffic  
✅ Auto-detection testing (30s cycle)  
✅ Edge case validation  
✅ Detailed success/failure report  
✅ Color-coded output

**Usage:**
```powershell
# Full comprehensive test
.\test-all-apis.ps1

# Quick mode (skip auto-detection, saves 35 seconds)
.\test-all-apis.ps1 -QuickTest

# Verbose mode (show all response data)
.\test-all-apis.ps1 -Verbose

# Custom URLs
.\test-all-apis.ps1 -BaseUrl "http://localhost:8082" -MlUrl "http://localhost:8000"
```

### test-load.ps1
✅ Simulates real-world traffic load  
✅ Performance metrics (requests/sec)  
✅ Configurable traffic volumes  
✅ ML prediction validation  
✅ Auto-detection testing  
✅ Detailed timing reports

**Usage:**
```powershell
# Default: 50 normal + 10 attack
.\test-load.ps1

# Custom load
.\test-load.ps1 -NormalTrafficCount 100 -AttackTrafficCount 20

# Show all responses
.\test-load.ps1 -ShowResponses

# Custom URL
.\test-load.ps1 -BaseUrl "http://production-server:8082"
```

---

## 📝 Test Data Files

Located in `test-data/`:

## ✅ All Tests Passing?

If all tests pass, your system is ready for:
- ✅ Frontend integration
- ✅ Production deployment
- ✅ Real traffic analysis

---

**Last Updated**: October 11, 2025  
**Version**: 2.0.0-SNAPSHOT
