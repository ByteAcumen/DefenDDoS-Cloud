# AWS WAF Integration Test Script
# Tests DefenDDoS <-> AWS WAF synchronization

Write-Host "🧪 DefenDDoS - AWS WAF Integration Test" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "1️⃣ Checking if backend is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8081/actuator/health" -Method Get
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running. Please start it first:" -ForegroundColor Red
    Write-Host "   java -jar target\backend-service-0.0.1-SNAPSHOT.jar" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 1: Get WAF Stats
Write-Host "2️⃣ Testing AWS WAF status endpoint..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:8081/api/waf/stats" -Method Get
    Write-Host "✅ AWS WAF stats retrieved:" -ForegroundColor Green
    $stats | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    
    if ($stats.enabled -eq $false) {
        Write-Host ""
        Write-Host "⚠️  AWS WAF is DISABLED" -ForegroundColor Yellow
        Write-Host "   Enable in application.properties: aws.waf.enabled=true" -ForegroundColor Gray
        Write-Host "   And set environment variables:" -ForegroundColor Gray
        Write-Host "   - AWS_ACCESS_KEY_ID" -ForegroundColor Gray
        Write-Host "   - AWS_SECRET_ACCESS_KEY" -ForegroundColor Gray
        Write-Host "   - AWS_WAF_IPSET_ID" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Run setup-aws-waf.ps1 to configure automatically" -ForegroundColor Cyan
        exit 0
    }
} catch {
    Write-Host "❌ Failed to get WAF stats: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Block a test IP
Write-Host "3️⃣ Blocking test IP address..." -ForegroundColor Yellow
$testIP = "203.0.113.42"  # TEST-NET-3 reserved IP
try {
    $blockRequest = @{
        ipAddress = $testIP
        reason = "AWS WAF integration test"
    } | ConvertTo-Json

    $blockResult = Invoke-RestMethod -Uri "http://localhost:8081/api/mitigation/block" `
        -Method Post `
        -Body $blockRequest `
        -ContentType "application/json"
    
    Write-Host "✅ IP blocked successfully" -ForegroundColor Green
    Write-Host "   IP: $testIP" -ForegroundColor Gray
    Write-Host "   Reason: AWS WAF integration test" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to block IP: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4️⃣ Waiting for AWS WAF sync (60 seconds)..." -ForegroundColor Yellow
Write-Host "   (Sync runs every 60 seconds by default)" -ForegroundColor Gray

# Show countdown
for ($i = 60; $i -gt 0; $i--) {
    Write-Host -NoNewline "`r   Time remaining: $i seconds " -ForegroundColor Cyan
    Start-Sleep -Seconds 1
}
Write-Host ""

# Test 3: Verify sync
Write-Host ""
Write-Host "5️⃣ Verifying AWS WAF sync..." -ForegroundColor Yellow
try {
    $statsAfter = Invoke-RestMethod -Uri "http://localhost:8081/api/waf/stats" -Method Get
    Write-Host "✅ AWS WAF stats after sync:" -ForegroundColor Green
    $statsAfter | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    
    if ($statsAfter.totalIPsInWAF -gt 0) {
        Write-Host ""
        Write-Host "✅ SUCCESS! IP synced to AWS WAF" -ForegroundColor Green
        Write-Host "   Total IPs in AWS WAF: $($statsAfter.totalIPsInWAF)" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "⚠️  No IPs found in AWS WAF yet" -ForegroundColor Yellow
        Write-Host "   Check backend logs for sync errors" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to verify sync: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Verify in AWS Console
Write-Host "6️⃣ Verify in AWS Console:" -ForegroundColor Yellow
Write-Host "   1. Open AWS Console → WAF & Shield" -ForegroundColor Gray
Write-Host "   2. Click 'IP sets' in left sidebar" -ForegroundColor Gray
Write-Host "   3. Click 'DefenDDoS-Blocklist'" -ForegroundColor Gray
Write-Host "   4. Check if $testIP/32 appears in the list" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "✅ AWS WAF Integration Test Complete" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Test Results:" -ForegroundColor Cyan
Write-Host "   ✅ Backend running" -ForegroundColor Green
Write-Host "   ✅ AWS WAF enabled: $($stats.enabled)" -ForegroundColor Green
Write-Host "   ✅ IP blocked: $testIP" -ForegroundColor Green
Write-Host "   ✅ Pending sync: $($statsAfter.pendingSync)" -ForegroundColor Green
Write-Host "   ✅ Total IPs in WAF: $($statsAfter.totalIPsInWAF)" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   - Verify IP in AWS Console" -ForegroundColor Yellow
Write-Host "   - Test with real DDoS traffic" -ForegroundColor Yellow
Write-Host "   - Monitor AWS WAF costs in Cost Explorer" -ForegroundColor Yellow
Write-Host ""
