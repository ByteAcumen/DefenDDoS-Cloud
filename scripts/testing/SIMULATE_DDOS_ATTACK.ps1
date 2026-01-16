# ============================================================================
# DefenDDoS Attack Simulation Script
# ============================================================================
# Purpose: Simulate various DDoS attack patterns to test the complete system
# - Traffic Ingestion API
# - ML Prediction (Random Forest + LSTM)
# - Automatic IP Blocking
# - Database Storage (InfluxDB)
# - Frontend Real-time Updates
# ============================================================================

param(
    [string]$BackendUrl = "http://localhost:8082",
    [string]$MLServiceUrl = "http://localhost:8000",
    [int]$AttackDuration = 60,
    [int]$AttacksPerSecond = 50,
    [switch]$IncludeBenign = $true,
    [switch]$Verbose = $false
)

# ============================================================================
# SECTION 1: Color Output Functions
# ============================================================================

function Write-ColorOutput {
    param([System.ConsoleColor]$ForegroundColor)
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Header {
    param([string]$text)
    Write-ColorOutput Cyan "`n========================================`n$text`n========================================"
}

function Write-Success {
    param([string]$text)
    Write-ColorOutput Green "✓ $text"
}

function Write-ErrorMsg {
    param([string]$text)
    Write-ColorOutput Red "✗ $text"
}

function Write-WarningMsg {
    param([string]$text)
    Write-ColorOutput Yellow "⚠ $text"
}

function Write-Info {
    param([string]$text)
    Write-ColorOutput White "ℹ $text"
}

# ============================================================================
# SECTION 2: Attack Pattern Definitions
# ============================================================================

$script:AttackPatterns = @{
    "SYN_FLOOD" = @{
        Name = "SYN Flood Attack"
        Description = "High packet rate, low bytes per packet"
        PacketRange = @(5000, 50000)
        ByteRange = @(200000, 2000000)
        Severity = "HIGH"
    }
    "UDP_FLOOD" = @{
        Name = "UDP Flood Attack"
        Description = "Medium packet rate, medium bytes"
        PacketRange = @(3000, 30000)
        ByteRange = @(500000, 5000000)
        Severity = "MEDIUM"
    }
    "HTTP_FLOOD" = @{
        Name = "HTTP Flood Attack"
        Description = "Low packet rate, high bytes per packet"
        PacketRange = @(500, 5000)
        ByteRange = @(5000000, 50000000)
        Severity = "HIGH"
    }
    "ICMP_FLOOD" = @{
        Name = "ICMP Flood (Ping of Death)"
        Description = "High packet rate, tiny packets"
        PacketRange = @(10000, 100000)
        ByteRange = @(100000, 1000000)
        Severity = "LOW"
    }
    "DNS_AMPLIFICATION" = @{
        Name = "DNS Amplification Attack"
        Description = "Medium packets, massive bytes (amplified)"
        PacketRange = @(1000, 10000)
        ByteRange = @(10000000, 100000000)
        Severity = "CRITICAL"
    }
    "SLOWLORIS" = @{
        Name = "Slowloris Attack"
        Description = "Very low packets, sustained connections"
        PacketRange = @(50, 500)
        ByteRange = @(10000, 100000)
        Severity = "MEDIUM"
    }
}

$script:BenignPattern = @{
    Name = "Normal Traffic"
    Description = "Regular user traffic"
    PacketRange = @(10, 100)
    ByteRange = @(5000, 50000)
    Severity = "NORMAL"
}

# ============================================================================
# SECTION 3: Helper Functions
# ============================================================================

function Get-RandomIP {
    param([bool]$IsAttack = $true)
    
    if ($IsAttack) {
        # Use suspicious IP ranges for attacks
        $ranges = @(
            "203.0.113",  # TEST-NET-3 (RFC 5737)
            "198.51.100", # TEST-NET-2 (RFC 5737)
            "192.0.2",    # TEST-NET-1 (RFC 5737)
            "185.220",    # Tor exit nodes range
            "45.142",     # Known malicious range
            "91.203"      # Known malicious range
        )
        $prefix = $ranges | Get-Random
        $suffix = Get-Random -Minimum 1 -Maximum 255
        return "$prefix.$suffix"
    } else {
        # Use legitimate IP ranges for benign traffic
        $ranges = @(
            "10.0.0",     # Private network
            "172.16.0",   # Private network
            "192.168.1"   # Private network
        )
        $prefix = $ranges | Get-Random
        $suffix = Get-Random -Minimum 1 -Maximum 255
        return "$prefix.$suffix"
    }
}

function New-AttackTraffic {
    param(
        [string]$AttackType,
        [bool]$IsBenign = $false
    )
    
    if ($IsBenign) {
        $pattern = $script:BenignPattern
        $sourceIP = Get-RandomIP -IsAttack $false
    } else {
        $pattern = $script:AttackPatterns[$AttackType]
        $sourceIP = Get-RandomIP -IsAttack $true
    }
    
    $packets = Get-Random -Minimum $pattern.PacketRange[0] -Maximum $pattern.PacketRange[1]
    $bytes = Get-Random -Minimum $pattern.ByteRange[0] -Maximum $pattern.ByteRange[1]
    
    return @{
        sourceIp = $sourceIP
        destinationIp = "192.168.1.10"
        packetCount = $packets
        byteCount = $bytes
        attackType = if ($IsBenign) { "BENIGN" } else { $AttackType }
        patternName = $pattern.Name
    }
}

# ============================================================================
# SECTION 4: Backend Health Check
# ============================================================================

function Test-BackendHealth {
    Write-Header "Testing Backend Services"
    
    $allHealthy = $true
    
    # Test Backend API
    Write-Info "Checking Backend API ($BackendUrl)..."
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/actuator/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($response.status -eq "UP") {
            Write-Success "Backend API is UP"
        } else {
            Write-WarningMsg "Backend API status: $($response.status)"
            $allHealthy = $false
        }
    } catch {
        Write-ErrorMsg "Backend API is DOWN: $($_.Exception.Message)"
        $allHealthy = $false
    }
    
    # Test ML Service
    Write-Info "Checking ML Service ($MLServiceUrl)..."
    try {
        $response = Invoke-RestMethod -Uri "$MLServiceUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($response.status -eq "healthy") {
            Write-Success "ML Service is UP (RF: $($response.rf_model_loaded), LSTM: $($response.lstm_model_loaded))"
        } else {
            Write-WarningMsg "ML Service status: $($response.status)"
            $allHealthy = $false
        }
    } catch {
        Write-ErrorMsg "ML Service is DOWN: $($_.Exception.Message)"
        $allHealthy = $false
    }
    
    # Test InfluxDB via Backend
    Write-Info "Checking Database connectivity..."
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/v1/data/statistics" -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($response.success) {
            Write-Success "Database is UP (Traffic: $($response.data.traffic_data_count), ML: $($response.data.ml_predictions_count))"
        } else {
            Write-WarningMsg "Database connectivity issue"
            $allHealthy = $false
        }
    } catch {
        Write-ErrorMsg "Database is DOWN: $($_.Exception.Message)"
        $allHealthy = $false
    }
    
    return $allHealthy
}

# ============================================================================
# SECTION 5: Traffic Sending Function
# ============================================================================

function Send-TrafficData {
    param(
        [hashtable]$TrafficData,
        [ref]$Stats
    )
    
    try {
        $body = @{
            sourceIp = $TrafficData.sourceIp
            destinationIp = $TrafficData.destinationIp
            packetCount = $TrafficData.packetCount
            byteCount = $TrafficData.byteCount
        } | ConvertTo-Json
        
        # Ingest traffic
        $ingestResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/traffic/ingest" `
            -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
        
        if ($ingestResponse.success) {
            $Stats.Value.TotalIngested++
            
            # Get ML prediction
            $predictionResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/traffic/predict-attack" `
                -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
            
            if ($predictionResponse.success) {
                $prediction = $predictionResponse.data
                $Stats.Value.TotalPredictions++
                
                $isActualAttack = $TrafficData.attackType -ne "BENIGN"
                $isPredictedAttack = $prediction.is_attack -eq $true
                
                if ($isActualAttack -and $isPredictedAttack) {
                    $Stats.Value.TruePositives++
                    $Stats.Value.BlockedIPs += $TrafficData.sourceIp
                    
                    if ($Verbose) {
                        Write-Success "Detected: $($TrafficData.patternName) from $($TrafficData.sourceIp) [Confidence: $([math]::Round($prediction.confidence * 100, 2))%]"
                    }
                } elseif (-not $isActualAttack -and -not $isPredictedAttack) {
                    $Stats.Value.TrueNegatives++
                } elseif ($isActualAttack -and -not $isPredictedAttack) {
                    $Stats.Value.FalseNegatives++
                    if ($Verbose) {
                        Write-WarningMsg "Missed: $($TrafficData.patternName) from $($TrafficData.sourceIp)"
                    }
                } else {
                    $Stats.Value.FalsePositives++
                }
                
                # Log high-severity detections
                if ($isPredictedAttack -and $prediction.severity -in @("HIGH", "CRITICAL")) {
                    Write-ColorOutput Red "🚨 $($prediction.severity) THREAT: $($prediction.attack_type) from $($TrafficData.sourceIp) [Confidence: $([math]::Round($prediction.confidence * 100, 2))%]"
                }
            }
        }
        
        return $true
    } catch {
        $Stats.Value.Errors++
        if ($Verbose) {
            Write-ErrorMsg "Failed to process traffic: $($_.Exception.Message)"
        }
        return $false
    }
}

# ============================================================================
# SECTION 6: Main Attack Simulation Function
# ============================================================================

function Start-AttackSimulation {
    Write-Header "DefenDDoS Attack Simulation Starting"
    Write-Info "Duration: $AttackDuration seconds"
    Write-Info "Rate: $AttacksPerSecond requests/second"
    Write-Info "Include Benign Traffic: $IncludeBenign"
    
    # Check health
    if (-not (Test-BackendHealth)) {
        Write-ErrorMsg "`nBackend services are not fully operational. Please start all services:"
        Write-Info "Backend: cd backend-service && .\mvnw.cmd spring-boot:run"
        Write-Info "ML Service: cd backend-service\ml-service && python main.py"
        Write-Info "InfluxDB: docker-compose up -d"
        return
    }
    
    Write-Header "Starting Attack Simulation"
    
    $stats = @{
        TotalIngested = 0
        TotalPredictions = 0
        TruePositives = 0
        TrueNegatives = 0
        FalsePositives = 0
        FalseNegatives = 0
        Errors = 0
        BlockedIPs = @()
        AttackTypeCounts = @{}
    }
    
    $attackTypes = $script:AttackPatterns.Keys | ForEach-Object { $_ }
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($AttackDuration)
    $requestInterval = 1.0 / $AttacksPerSecond
    
    Write-Info "Generating attack traffic from $(Get-Date -Format 'HH:mm:ss') to $($endTime.ToString('HH:mm:ss'))`n"
    
    $iteration = 0
    while ((Get-Date) -lt $endTime) {
        $iteration++
        
        # Determine if this should be attack or benign traffic
        $isAttack = if ($IncludeBenign) { 
            (Get-Random -Minimum 1 -Maximum 100) -gt 20  # 80% attacks, 20% benign
        } else { 
            $true 
        }
        
        if ($isAttack) {
            # Select random attack type
            $attackType = $attackTypes | Get-Random
            $traffic = New-AttackTraffic -AttackType $attackType
            
            if (-not $stats.AttackTypeCounts.ContainsKey($attackType)) {
                $stats.AttackTypeCounts[$attackType] = 0
            }
            $stats.AttackTypeCounts[$attackType]++
        } else {
            $traffic = New-AttackTraffic -IsBenign $true
        }
        
        # Send traffic
        $null = Send-TrafficData -TrafficData $traffic -Stats ([ref]$stats)
        
        # Progress indicator
        if ($iteration % 50 -eq 0) {
            $elapsed = ((Get-Date) - $startTime).TotalSeconds
            $progress = [math]::Round(($elapsed / $AttackDuration) * 100, 1)
            
            Write-Progress -Activity "Simulating DDoS Attack" `
                -Status "$progress% Complete | $($stats.TotalIngested) ingested | $($stats.TruePositives) detected" `
                -PercentComplete $progress
        }
        
        # Rate limiting
        Start-Sleep -Milliseconds ($requestInterval * 1000)
    }
    
    Write-Progress -Activity "Simulating DDoS Attack" -Completed
    
    # Generate report
    Write-Header "Attack Simulation Complete - Final Report"
    
    Write-Info "`nTraffic Summary:"
    Write-Output "  Total Requests Sent: $($stats.TotalIngested)"
    Write-Output "  ML Predictions Made: $($stats.TotalPredictions)"
    Write-Output "  Processing Errors: $($stats.Errors)"
    
    Write-Info "`nDetection Accuracy:"
    $accuracy = if ($stats.TotalPredictions -gt 0) {
        [math]::Round((($stats.TruePositives + $stats.TrueNegatives) / $stats.TotalPredictions) * 100, 2)
    } else { 0 }
    
    Write-ColorOutput Green "  True Positives (Correctly Detected Attacks): $($stats.TruePositives)"
    Write-ColorOutput Green "  True Negatives (Correctly Identified Benign): $($stats.TrueNegatives)"
    Write-ColorOutput Yellow "  False Positives (Benign Traffic Flagged): $($stats.FalsePositives)"
    Write-ColorOutput Red "  False Negatives (Missed Attacks): $($stats.FalseNegatives)"
    Write-ColorOutput Cyan "  Overall Accuracy: $accuracy%"
    
    if ($stats.TruePositives -gt 0) {
        $precision = [math]::Round(($stats.TruePositives / ($stats.TruePositives + $stats.FalsePositives)) * 100, 2)
        $recall = [math]::Round(($stats.TruePositives / ($stats.TruePositives + $stats.FalseNegatives)) * 100, 2)
        Write-Output "  Precision: $precision%"
        Write-Output "  Recall: $recall%"
    }
    
    Write-Info "`nAttack Patterns Sent:"
    foreach ($attackType in $stats.AttackTypeCounts.Keys) {
        $count = $stats.AttackTypeCounts[$attackType]
        $pattern = $script:AttackPatterns[$attackType]
        Write-Output "  $($pattern.Name): $count requests [$($pattern.Severity)]"
    }
    
    Write-Info "`nMitigation Status:"
    $uniqueBlockedIPs = $stats.BlockedIPs | Select-Object -Unique
    Write-Output "  Unique IPs Detected as Malicious: $($uniqueBlockedIPs.Count)"
    
    # Get current blocked IPs from backend
    try {
        $blockedResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/mitigation/blocked" -Method Get -ErrorAction Stop
        Write-ColorOutput Red "  Currently Blocked IPs: $($blockedResponse.count)"
        if ($blockedResponse.count -gt 0) {
            Write-Output "  Blocked List: $($blockedResponse.blockedIps -join ', ')"
        }
    } catch {
        Write-WarningMsg "  Could not retrieve blocked IPs list"
    }
    
    Write-Info "`nDatabase Status:"
    try {
        $dbStats = Invoke-RestMethod -Uri "$BackendUrl/api/v1/data/statistics" -Method Get -ErrorAction Stop
        Write-Output "  Traffic Records: $($dbStats.data.traffic_data_count)"
        Write-Output "  ML Predictions: $($dbStats.data.ml_predictions_count)"
        Write-Output "  Blocked IP Records: $($dbStats.data.blocked_ips_count)"
        Write-Output "  Detection Events: $($dbStats.data.detection_events_count)"
    } catch {
        Write-WarningMsg "  Could not retrieve database statistics"
    }
    
    Write-Header "Simulation Complete"
    Write-Success "`nCheck the DefenDDoS frontend at http://localhost:3000 to see real-time updates!"
    Write-Info "View detailed analytics in the Dashboard, Traffic, and Threat Detection pages."
    
    # Save report to file
    $reportFile = "attack-simulation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $reportData = @{
        timestamp = Get-Date -Format "o"
        duration_seconds = $AttackDuration
        rate_per_second = $AttacksPerSecond
        statistics = $stats
        accuracy_percent = $accuracy
    } | ConvertTo-Json -Depth 5
    
    $reportData | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Success "Report saved to: $reportFile"
}

# ============================================================================
# SECTION 7: Entry Point - Execute Main Function  
# ============================================================================

# Execute main function
& {
    Start-AttackSimulation
}
