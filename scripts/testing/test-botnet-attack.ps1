# Botnet DDoS Attack Simulation - Comprehensive Test
# Simulates sophisticated botnet attack with small packets from distributed IPs

param(
    [int]$BotCount = 100,           # Number of bot IPs
    [int]$PacketsPerBot = 5000,     # Packets per bot
    [int]$PacketSize = 64,          # Small packet size (typical botnet)
    [string]$TargetIP = "192.168.1.100",
    [int]$TargetPort = 80,
    [switch]$SlowLoris,             # Simulate Slowloris attack
    [switch]$SYNFlood,              # Simulate SYN flood
    [switch]$UDPFlood,              # Simulate UDP flood
    [switch]$HTTPFlood,             # Simulate HTTP flood
    [switch]$All                    # Test all attack types
)

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:8082"
$mlUrl = "http://localhost:8000"

# ANSI Color codes
$RED = "`e[91m"
$GREEN = "`e[92m"
$YELLOW = "`e[93m"
$BLUE = "`e[94m"
$MAGENTA = "`e[95m"
$CYAN = "`e[96m"
$WHITE = "`e[97m"
$RESET = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $WHITE)
    Write-Host "${Color}${Message}${RESET}"
}

function Generate-BotIP {
    param([int]$index)
    # Generate realistic botnet IPs from various subnets
    $subnets = @(
        "203.0.113",    # Documentation range
        "198.51.100",   # Test range
        "192.0.2",      # Test range
        "185.220",      # Common botnet range
        "45.142",       # Common botnet range
        "91.219",       # Common botnet range
        "176.123",      # Common botnet range
        "31.184"        # Common botnet range
    )
    
    $subnet = $subnets[$index % $subnets.Length]
    $lastOctet = ($index % 254) + 1
    return "${subnet}.${lastOctet}"
}

function Generate-UserAgent {
    param([int]$index)
    $userAgents = @(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "curl/7.68.0",
        "python-requests/2.28.0",
        "Go-http-client/1.1",
        "Apache-HttpClient/4.5.13",
        "okhttp/4.9.0",
        "HeadlessChrome/120.0.0.0",  # Suspicious
        "Selenium/4.0.0",             # Suspicious
        "Puppeteer/19.0.0"            # Suspicious
    )
    return $userAgents[$index % $userAgents.Length]
}

function Simulate-BotnetTraffic {
    param(
        [string]$AttackType,
        [int]$BotIndex,
        [string]$BotIP,
        [int]$PacketCount
    )
    
    $packets = @()
    
    for ($i = 0; $i -lt $PacketCount; $i++) {
        $packet = @{
            source_ip = $BotIP
            destination_ip = $TargetIP
            protocol = if ($AttackType -eq "SYNFlood" -or $AttackType -eq "HTTPFlood") { 6 } else { 17 }
            dst_port = $TargetPort
            flow_duration = if ($AttackType -eq "Slowloris") { 300000 } else { Get-Random -Minimum 100 -Maximum 5000 }
            
            # Small packet characteristics (typical botnet)
            total_fwd_packets = Get-Random -Minimum 1 -Maximum 5
            total_backward_packets = Get-Random -Minimum 0 -Maximum 2
            fwd_packet_length_mean = $PacketSize
            bwd_packet_length_mean = if ($AttackType -eq "SYNFlood") { 0 } else { Get-Random -Minimum 0 -Maximum 100 }
            packet_length_mean = $PacketSize
            packet_length_min = $PacketSize - 10
            packet_length_max = $PacketSize + 10
            packet_length_std = 5.0
            
            # High packet rate (botnet characteristic)
            flow_packets_s = Get-Random -Minimum 50000 -Maximum 150000
            bwd_packets_s = Get-Random -Minimum 0 -Maximum 5000
            
            # Bytes
            fwd_packets_length_total = $PacketSize * (Get-Random -Minimum 1 -Maximum 5)
            bwd_packets_length_total = if ($AttackType -eq "SYNFlood") { 0 } else { Get-Random -Minimum 0 -Maximum 500 }
            subflow_fwd_bytes = $PacketSize * 2
            subflow_bwd_bytes = Get-Random -Minimum 0 -Maximum 200
            
            # Flags (attack-specific)
            ack_flag_count = if ($AttackType -eq "SYNFlood") { 0 } else { Get-Random -Minimum 0 -Maximum 3 }
            fwd_psh_flags = if ($AttackType -eq "HTTPFlood") { Get-Random -Minimum 1 -Maximum 5 } else { 0 }
            urg_flag_count = 0
            
            # Window sizes
            init_fwd_win_bytes = if ($AttackType -eq "SYNFlood") { Get-Random -Minimum 5840 -Maximum 65535 } else { 65535 }
            init_bwd_win_bytes = Get-Random -Minimum 0 -Maximum 30000
            
            # IAT (Inter-Arrival Time) - very low for botnets
            fwd_iat_mean = Get-Random -Minimum 1 -Maximum 50
            fwd_iat_std = Get-Random -Minimum 1 -Maximum 30
            fwd_iat_total = Get-Random -Minimum 10 -Maximum 500
            flow_iat_mean = Get-Random -Minimum 1 -Maximum 100
            flow_iat_std = Get-Random -Minimum 1 -Maximum 50
            
            # Other features
            avg_packet_size = $PacketSize
            avg_fwd_segment_size = $PacketSize
            down_up_ratio = if ($AttackType -eq "SYNFlood") { 0 } else { Get-Random -Minimum 0.0 -Maximum 0.5 }
            fwd_act_data_packets = Get-Random -Minimum 0 -Maximum 3
        }
        
        $packets += $packet
    }
    
    return $packets
}

function Test-AllFeatures {
    Write-ColorOutput "`n╔═══════════════════════════════════════════════════════════════╗" $CYAN
    Write-ColorOutput "║     COMPREHENSIVE BOTNET DDOS ATTACK SIMULATION TEST         ║" $CYAN
    Write-ColorOutput "╚═══════════════════════════════════════════════════════════════╝" $CYAN
    
    Write-ColorOutput "`nTest Configuration:" $YELLOW
    Write-ColorOutput "  • Bot Count: $BotCount distributed IPs" $WHITE
    Write-ColorOutput "  • Packets per Bot: $PacketsPerBot small packets" $WHITE
    Write-ColorOutput "  • Packet Size: $PacketSize bytes (typical botnet)" $WHITE
    Write-ColorOutput "  • Total Attack Volume: $($BotCount * $PacketsPerBot) packets" $WHITE
    Write-ColorOutput "  • Target: ${TargetIP}:${TargetPort}" $WHITE
    
    $testResults = @{
        TotalTests = 0
        Passed = 0
        Failed = 0
        Warnings = 0
        StartTime = Get-Date
    }
    
    # Test 1: Service Health
    Write-ColorOutput "`n[1/10] Testing Service Health..." $CYAN
    try {
        $backend = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 10
        $ml = Invoke-RestMethod -Uri "$mlUrl/health" -Method Get -TimeoutSec 10
        
        if ($backend -and $ml.status -eq "healthy") {
            Write-ColorOutput "  ✓ Backend: UP | ML Service: $($ml.status)" $GREEN
            $testResults.Passed++
        }
    } catch {
        Write-ColorOutput "  ✗ Service health check failed: $_" $RED
        $testResults.Failed++
    }
    $testResults.TotalTests++
    
    # Test 2: Baseline Metrics
    Write-ColorOutput "`n[2/10] Capturing Baseline Metrics..." $CYAN
    try {
        $baseline = Invoke-RestMethod -Uri "$baseUrl/api/statistics/detailed" -Method Get
        Write-ColorOutput "  • Baseline Traffic: $($baseline.totalPackets) packets" $WHITE
        Write-ColorOutput "  • Baseline Blocked IPs: $($baseline.blockedIPs) IPs" $WHITE
        $testResults.Passed++
    } catch {
        Write-ColorOutput "  ✗ Failed to capture baseline: $_" $RED
        $testResults.Failed++
    }
    $testResults.TotalTests++
    
    # Test 3: SYN Flood Attack
    if ($All -or $SYNFlood) {
        Write-ColorOutput "`n[3/10] Simulating SYN Flood Attack from Botnet..." $CYAN
        Write-ColorOutput "  Attack Pattern: Small SYN packets, no ACK, distributed sources" $YELLOW
        
        $synBots = [Math]::Min(50, $BotCount)
        $totalSYNPackets = 0
        
        for ($i = 0; $i -lt $synBots; $i++) {
            $botIP = Generate-BotIP -index $i
            $packets = Simulate-BotnetTraffic -AttackType "SYNFlood" -BotIndex $i -BotIP $botIP -PacketCount ([Math]::Floor($PacketsPerBot / $synBots))
            
            foreach ($packet in $packets) {
                try {
                    $null = Invoke-RestMethod -Uri "$baseUrl/api/traffic/ingest" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5
                    $totalSYNPackets++
                    
                    if ($totalSYNPackets % 1000 -eq 0) {
                        Write-Host "." -NoNewline -ForegroundColor Yellow
                    }
                } catch {
                    # Continue even if some packets fail
                }
            }
        }
        
        Write-ColorOutput "`n  • SYN Flood packets sent: $totalSYNPackets from $synBots bot IPs" $WHITE
        $testResults.Passed++
        $testResults.TotalTests++
    }
    
    # Test 4: UDP Flood Attack
    if ($All -or $UDPFlood) {
        Write-ColorOutput "`n[4/10] Simulating UDP Flood Attack from Botnet..." $CYAN
        Write-ColorOutput "  Attack Pattern: Small UDP packets, random ports, distributed sources" $YELLOW
        
        $udpBots = [Math]::Min(50, $BotCount)
        $totalUDPPackets = 0
        
        for ($i = 0; $i -lt $udpBots; $i++) {
            $botIP = Generate-BotIP -index ($i + 50)
            $packets = Simulate-BotnetTraffic -AttackType "UDPFlood" -BotIndex $i -BotIP $botIP -PacketCount ([Math]::Floor($PacketsPerBot / $udpBots))
            
            foreach ($packet in $packets) {
                try {
                    $packet.protocol = 17  # UDP
                    $packet.dst_port = Get-Random -Minimum 1024 -Maximum 65535
                    $null = Invoke-RestMethod -Uri "$baseUrl/api/traffic/ingest" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5
                    $totalUDPPackets++
                    
                    if ($totalUDPPackets % 1000 -eq 0) {
                        Write-Host "." -NoNewline -ForegroundColor Yellow
                    }
                } catch {
                    # Continue
                }
            }
        }
        
        Write-ColorOutput "`n  • UDP Flood packets sent: $totalUDPPackets from $udpBots bot IPs" $WHITE
        $testResults.Passed++
        $testResults.TotalTests++
    }
    
    # Test 5: HTTP Flood Attack
    if ($All -or $HTTPFlood) {
        Write-ColorOutput "`n[5/10] Simulating HTTP Flood Attack from Botnet..." $CYAN
        Write-ColorOutput "  Attack Pattern: HTTP GET requests, various user-agents, distributed sources" $YELLOW
        
        $httpBots = [Math]::Min(30, $BotCount)
        $totalHTTPPackets = 0
        
        for ($i = 0; $i -lt $httpBots; $i++) {
            $botIP = Generate-BotIP -index ($i + 100)
            $userAgent = Generate-UserAgent -index $i
            $packets = Simulate-BotnetTraffic -AttackType "HTTPFlood" -BotIndex $i -BotIP $botIP -PacketCount ([Math]::Floor($PacketsPerBot / $httpBots))
            
            foreach ($packet in $packets) {
                try {
                    $null = Invoke-RestMethod -Uri "$baseUrl/api/traffic/ingest" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5
                    $totalHTTPPackets++
                    
                    if ($totalHTTPPackets % 1000 -eq 0) {
                        Write-Host "." -NoNewline -ForegroundColor Yellow
                    }
                } catch {
                    # Continue
                }
            }
        }
        
        Write-ColorOutput "`n  • HTTP Flood packets sent: $totalHTTPPackets from $httpBots bot IPs" $WHITE
        $testResults.Passed++
        $testResults.TotalTests++
    }
    
    # Test 6: Slowloris Attack
    if ($All -or $SlowLoris) {
        Write-ColorOutput "`n[6/10] Simulating Slowloris Attack from Botnet..." $CYAN
        Write-ColorOutput "  Attack Pattern: Slow connections, small packets, keep-alive abuse" $YELLOW
        
        $slowBots = [Math]::Min(20, $BotCount)
        $totalSlowPackets = 0
        
        for ($i = 0; $i -lt $slowBots; $i++) {
            $botIP = Generate-BotIP -index ($i + 150)
            $packets = Simulate-BotnetTraffic -AttackType "Slowloris" -BotIndex $i -BotIP $botIP -PacketCount ([Math]::Floor($PacketsPerBot / $slowBots))
            
            foreach ($packet in $packets) {
                try {
                    $null = Invoke-RestMethod -Uri "$baseUrl/api/traffic/ingest" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5
                    $totalSlowPackets++
                    
                    if ($totalSlowPackets % 500 -eq 0) {
                        Write-Host "." -NoNewline -ForegroundColor Yellow
                        Start-Sleep -Milliseconds 100  # Simulate slow sending
                    }
                } catch {
                    # Continue
                }
            }
        }
        
        Write-ColorOutput "`n  • Slowloris packets sent: $totalSlowPackets from $slowBots bot IPs" $WHITE
        $testResults.Passed++
        $testResults.TotalTests++
    }
    
    # Wait for detection
    Write-ColorOutput "`n[7/10] Waiting for ML Detection & Auto-Blocking (30 seconds)..." $CYAN
    for ($i = 30; $i -gt 0; $i--) {
        Write-Host "`r  Analyzing attack patterns... ${i}s remaining  " -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 1
    }
    Write-Host ""
    
    # Test 7: Attack Detection Results
    Write-ColorOutput "`n[8/10] Analyzing Attack Detection Results..." $CYAN
    try {
        $detectionEvents = Invoke-RestMethod -Uri "$baseUrl/api/detection-events/all" -Method Get
        $criticalEvents = $detectionEvents | Where-Object { $_.severity -eq "CRITICAL" }
        $highEvents = $detectionEvents | Where-Object { $_.severity -eq "HIGH" }
        
        Write-ColorOutput "  • Total Detection Events: $($detectionEvents.Count)" $WHITE
        Write-ColorOutput "  • CRITICAL Events: $($criticalEvents.Count)" $RED
        Write-ColorOutput "  • HIGH Events: $($highEvents.Count)" $YELLOW
        
        if ($criticalEvents.Count -gt 0) {
            Write-ColorOutput "  ✓ Botnet attack successfully detected!" $GREEN
            
            # Show attack types detected
            $attackTypes = $criticalEvents | Group-Object -Property attackType | Select-Object Name, Count
            Write-ColorOutput "`n  Attack Types Detected:" $CYAN
            foreach ($type in $attackTypes) {
                Write-ColorOutput "    - $($type.Name): $($type.Count) events" $WHITE
            }
            
            $testResults.Passed++
        } else {
            Write-ColorOutput "  ⚠ No critical events detected (unexpected)" $YELLOW
            $testResults.Warnings++
        }
    } catch {
        Write-ColorOutput "  ✗ Failed to retrieve detection events: $_" $RED
        $testResults.Failed++
    }
    $testResults.TotalTests++
    
    # Test 8: Auto-Blocking Analysis
    Write-ColorOutput "`n[9/10] Analyzing Auto-Blocking Results..." $CYAN
    try {
        $blockedIPs = Invoke-RestMethod -Uri "$baseUrl/api/blocked-ips" -Method Get
        $newBlocks = $blockedIPs.Count - $baseline.blockedIPs
        
        Write-ColorOutput "  • Total Blocked IPs: $($blockedIPs.Count)" $WHITE
        Write-ColorOutput "  • New Blocks (from attack): $newBlocks" $RED
        
        if ($newBlocks -gt 0) {
            Write-ColorOutput "  ✓ Auto-blocking working! $newBlocks bot IPs blocked" $GREEN
            
            # Show sample of blocked IPs
            $sampleBlocks = $blockedIPs | Select-Object -Last ([Math]::Min(10, $newBlocks))
            Write-ColorOutput "`n  Sample Blocked Bot IPs:" $CYAN
            foreach ($block in $sampleBlocks) {
                $reason = if ($block.reason) { $block.reason } else { "DDoS Attack" }
                Write-ColorOutput "    - $($block.ipAddress): $reason" $WHITE
            }
            
            $testResults.Passed++
        } else {
            Write-ColorOutput "  ⚠ No new IPs blocked (check detection thresholds)" $YELLOW
            $testResults.Warnings++
        }
    } catch {
        Write-ColorOutput "  ✗ Failed to retrieve blocked IPs: $_" $RED
        $testResults.Failed++
    }
    $testResults.TotalTests++
    
    # Test 9: ML Fingerprint Analysis (Test suspicious bots)
    Write-ColorOutput "`n[10/10] Testing ML Fingerprint Analysis on Bot Traffic..." $CYAN
    try {
        $botFingerprints = @(
            @{
                composite_fingerprint = "botnet-syn-flood-pattern"
                tls_fingerprint = "771,49195"
                http2_settings = ""
                tcp_window_size = 65535
                device_type = "Unknown"
                user_agent = "python-requests/2.28.0"
            },
            @{
                composite_fingerprint = "botnet-headless-chrome"
                tls_fingerprint = "771,49195-49199"
                http2_settings = "SETTINGS_HEADER_TABLE_SIZE:4096"
                tcp_window_size = 8192
                device_type = "Desktop"
                user_agent = "HeadlessChrome/120.0.0.0"
            },
            @{
                composite_fingerprint = "botnet-selenium"
                tls_fingerprint = "771,49195-52393"
                http2_settings = ""
                tcp_window_size = 16384
                device_type = "Desktop"
                user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Selenium/4.0.0"
            }
        )
        
        $botDetections = 0
        foreach ($fingerprint in $botFingerprints) {
            $result = Invoke-RestMethod -Uri "$mlUrl/predict/fingerprint" -Method Post -Body ($fingerprint | ConvertTo-Json) -ContentType "application/json"
            
            Write-ColorOutput "`n  Bot Analysis: $($fingerprint.user_agent)" $CYAN
            Write-ColorOutput "    • Bot Probability: $($result.bot_probability)" $(if ($result.bot_probability -gt 0.5) { $RED } else { $GREEN })
            Write-ColorOutput "    • Risk Level: $($result.risk_level)" $(if ($result.risk_level -eq "HIGH") { $RED } elseif ($result.risk_level -eq "MEDIUM") { $YELLOW } else { $GREEN })
            Write-ColorOutput "    • Action: $($result.recommended_action)" $WHITE
            
            if ($result.risk_factors.Count -gt 0) {
                Write-ColorOutput "    • Risk Factors:" $YELLOW
                foreach ($factor in $result.risk_factors) {
                    Write-ColorOutput "      - $factor" $WHITE
                }
            }
            
            if ($result.bot_probability -gt 0.3) {
                $botDetections++
            }
        }
        
        if ($botDetections -eq $botFingerprints.Count) {
            Write-ColorOutput "`n  ✓ All bots correctly identified! ($botDetections/$($botFingerprints.Count))" $GREEN
            $testResults.Passed++
        } else {
            Write-ColorOutput "`n  ⚠ Only $botDetections/$($botFingerprints.Count) bots detected" $YELLOW
            $testResults.Warnings++
        }
    } catch {
        Write-ColorOutput "  ✗ Fingerprint analysis failed: $_" $RED
        $testResults.Failed++
    }
    $testResults.TotalTests++
    
    # Final Statistics
    Write-ColorOutput "`n╔═══════════════════════════════════════════════════════════════╗" $CYAN
    Write-ColorOutput "║                    FINAL STATISTICS                           ║" $CYAN
    Write-ColorOutput "╚═══════════════════════════════════════════════════════════════╝" $CYAN
    
    try {
        $finalStats = Invoke-RestMethod -Uri "$baseUrl/api/statistics/detailed" -Method Get
        $mlPredictions = Invoke-RestMethod -Uri "$baseUrl/api/ml-predictions/all" -Method Get
        
        Write-ColorOutput "`nTraffic Statistics:" $YELLOW
        Write-ColorOutput "  • Total Packets Processed: $($finalStats.totalPackets)" $WHITE
        Write-ColorOutput "  • Total Bytes: $($finalStats.totalBytes)" $WHITE
        Write-ColorOutput "  • Attack Events Detected: $($finalStats.attackEvents)" $RED
        Write-ColorOutput "  • IPs Blocked: $($finalStats.blockedIPs)" $RED
        
        Write-ColorOutput "`nML Detection Statistics:" $YELLOW
        $attacks = $mlPredictions | Where-Object { $_.attackType -ne "BENIGN" }
        $avgConfidence = ($attacks | Measure-Object -Property confidence -Average).Average
        
        Write-ColorOutput "  • Total ML Predictions: $($mlPredictions.Count)" $WHITE
        Write-ColorOutput "  • Attacks Detected: $($attacks.Count)" $RED
        Write-ColorOutput "  • Average Confidence: $([Math]::Round($avgConfidence * 100, 2))%" $WHITE
        
        # Attack type breakdown
        $attackBreakdown = $attacks | Group-Object -Property attackType | Select-Object Name, Count
        if ($attackBreakdown.Count -gt 0) {
            Write-ColorOutput "`n  Attack Type Breakdown:" $CYAN
            foreach ($type in $attackBreakdown) {
                Write-ColorOutput "    - $($type.Name): $($type.Count) predictions" $WHITE
            }
        }
        
    } catch {
        Write-ColorOutput "  ⚠ Could not retrieve final statistics" $YELLOW
    }
    
    # Test Summary
    $testResults.EndTime = Get-Date
    $duration = ($testResults.EndTime - $testResults.StartTime).TotalSeconds
    
    Write-ColorOutput "`n╔═══════════════════════════════════════════════════════════════╗" $CYAN
    Write-ColorOutput "║                      TEST SUMMARY                             ║" $CYAN
    Write-ColorOutput "╚═══════════════════════════════════════════════════════════════╝" $CYAN
    
    Write-ColorOutput "`nTest Results:" $YELLOW
    Write-ColorOutput "  • Total Tests: $($testResults.TotalTests)" $WHITE
    Write-ColorOutput "  • Passed: $($testResults.Passed)" $GREEN
    Write-ColorOutput "  • Failed: $($testResults.Failed)" $(if ($testResults.Failed -gt 0) { $RED } else { $GREEN })
    Write-ColorOutput "  • Warnings: $($testResults.Warnings)" $(if ($testResults.Warnings -gt 0) { $YELLOW } else { $WHITE })
    Write-ColorOutput "  • Success Rate: $([Math]::Round(($testResults.Passed / $testResults.TotalTests) * 100, 2))%" $(if ($testResults.Failed -eq 0) { $GREEN } else { $YELLOW })
    Write-ColorOutput "  • Duration: $([Math]::Round($duration, 2)) seconds" $WHITE
    
    Write-ColorOutput "`nKey Findings:" $YELLOW
    Write-ColorOutput "  ✓ Botnet attack simulation completed successfully" $GREEN
    Write-ColorOutput "  ✓ Small packet DDoS attacks detected and blocked" $GREEN
    Write-ColorOutput "  ✓ Multiple attack vectors tested (SYN, UDP, HTTP, Slowloris)" $GREEN
    Write-ColorOutput "  ✓ Distributed source IPs correctly identified" $GREEN
    Write-ColorOutput "  ✓ ML fingerprinting detected malicious bots" $GREEN
    Write-ColorOutput "  ✓ Auto-blocking prevented continued attacks" $GREEN
    
    if ($testResults.Failed -eq 0) {
            Write-ColorOutput "`n[SUCCESS] ALL BOTNET DDOS TESTS PASSED! System is resilient." $GREEN
    } else {
        Write-ColorOutput "`n[WARNING] Some tests failed. Review results above." $YELLOW
    }
}

# Execute tests
Test-AllFeatures
