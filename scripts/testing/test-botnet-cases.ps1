# Botnet Attack Test Cases - Multiple Scenarios
# Tests different types of botnet DDoS attacks

param(
    [string]$TestCase = "all"  # all, syn, udp, http, slowloris, amplification, mixed
)

$mlUrl = "http://localhost:8000"

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        BOTNET DDOS ATTACK TEST SCENARIOS                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Generate realistic bot IP
function Get-BotIP {
    param([int]$index)
    $subnets = @("45.142", "185.220", "91.219", "176.123", "31.184", "203.0.113", "198.51.100", "192.0.2")
    "${($subnets[$index % 8])}.$((Get-Random -Min 1 -Max 255))"
}

# Test ML service
Write-Host "`n[CHECK] Testing ML Service..." -ForegroundColor Yellow
try {
    $mlHealth = Invoke-RestMethod -Uri "$mlUrl/health" -TimeoutSec 5
    Write-Host "  ✓ ML Service: $($mlHealth.status)" -ForegroundColor Green
    Write-Host "  • RF Model: $($mlHealth.rf_model_loaded)" -ForegroundColor White
    Write-Host "  • LSTM Model: $($mlHealth.lstm_model_loaded)" -ForegroundColor White
} catch {
    Write-Host "  ✗ ML Service not available" -ForegroundColor Red
    exit 1
}

# Test Case 1: SYN Flood Botnet
if ($TestCase -eq "all" -or $TestCase -eq "syn") {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  TEST CASE 1: SYN FLOOD BOTNET ATTACK                     ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    
    Write-Host "`nScenario:" -ForegroundColor Yellow
    Write-Host "  • Attack Type: TCP SYN Flood" -ForegroundColor White
    Write-Host "  • Characteristics: Small packets, no ACK, half-open connections" -ForegroundColor White
    Write-Host "  • Bot Count: 50 distributed IPs" -ForegroundColor White
    Write-Host "  • Packet Size: 64 bytes" -ForegroundColor White
    Write-Host "  • Expected: HIGH severity, quick detection" -ForegroundColor White
    
    Write-Host "`nTesting ML Detection:" -ForegroundColor Cyan
    
    $synResults = @()
    for ($i = 0; $i -lt 5; $i++) {
        $packet = @{
            source_ip = Get-BotIP -index $i
            destination_ip = "192.168.1.100"
            protocol = 6  # TCP
            dst_port = 80
            flow_duration = Get-Random -Min 50 -Max 500
            
            # SYN flood characteristics
            total_fwd_packets = 1
            total_backward_packets = 0
            fwd_packet_length_mean = 64
            bwd_packet_length_mean = 0
            packet_length_mean = 64
            packet_length_min = 60
            packet_length_max = 68
            packet_length_std = 2.0
            
            # Very high packet rate (botnet)
            flow_packets_s = Get-Random -Min 100000 -Max 180000
            bwd_packets_s = 0
            
            fwd_packets_length_total = 64
            bwd_packets_length_total = 0
            subflow_fwd_bytes = 64
            subflow_bwd_bytes = 0
            
            ack_flag_count = 0  # No ACK (SYN only)
            fwd_psh_flags = 0
            urg_flag_count = 0
            
            init_fwd_win_bytes = Get-Random -Min 5840 -Max 65535
            init_bwd_win_bytes = 0
            
            fwd_iat_mean = Get-Random -Min 1 -Max 10
            fwd_iat_std = Get-Random -Min 1 -Max 5
            fwd_iat_total = Get-Random -Min 10 -Max 100
            flow_iat_mean = Get-Random -Min 1 -Max 20
            flow_iat_std = Get-Random -Min 1 -Max 10
            
            avg_packet_size = 64
            avg_fwd_segment_size = 64
            down_up_ratio = 0
            fwd_act_data_packets = 0
        }
        
        try {
            $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
            $synResults += $result
            
            $color = if ($result.severity -eq "CRITICAL") { "Red" } elseif ($result.severity -eq "HIGH") { "Yellow" } else { "Green" }
            Write-Host "  Bot $($i+1) [$($packet.source_ip)]: $($result.attack_type) | Confidence: $([Math]::Round($result.confidence*100,1))% | Severity: $($result.severity)" -ForegroundColor $color
        } catch {
            Write-Host "  ✗ Prediction failed for bot $($i+1)" -ForegroundColor Red
        }
    }
    
    $attacks = ($synResults | Where-Object { $_.is_attack -eq $true }).Count
    $avgConf = ($synResults | Measure-Object -Property confidence -Average).Average
    
    Write-Host "`nResults:" -ForegroundColor Cyan
    Write-Host "  • Attacks Detected: $attacks/5 ($([Math]::Round($attacks/5*100,1))%)" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
    Write-Host "  • Average Confidence: $([Math]::Round($avgConf*100,1))%" -ForegroundColor White
    Write-Host "  • Verdict: $(if ($attacks -ge 4) { '✓ SYN FLOOD DETECTED' } else { '⚠ PARTIAL DETECTION' })" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
}

# Test Case 2: UDP Amplification Botnet
if ($TestCase -eq "all" -or $TestCase -eq "udp" -or $TestCase -eq "amplification") {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  TEST CASE 2: UDP AMPLIFICATION BOTNET                    ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    
    Write-Host "`nScenario:" -ForegroundColor Yellow
    Write-Host "  • Attack Type: UDP Amplification (NTP/DNS/SSDP)" -ForegroundColor White
    Write-Host "  • Characteristics: Spoofed source, massive amplification" -ForegroundColor White
    Write-Host "  • Bot Count: 30 amplification servers" -ForegroundColor White
    Write-Host "  • Amplification: 1:50 ratio" -ForegroundColor White
    Write-Host "  • Expected: CRITICAL severity, high packet rate" -ForegroundColor White
    
    Write-Host "`nTesting ML Detection:" -ForegroundColor Cyan
    
    $udpResults = @()
    for ($i = 0; $i -lt 5; $i++) {
        $packet = @{
            source_ip = Get-BotIP -index ($i + 20)
            destination_ip = "192.168.1.100"
            protocol = 17  # UDP
            dst_port = @(123, 53, 1900)[(Get-Random -Min 0 -Max 3)]  # NTP/DNS/SSDP
            flow_duration = Get-Random -Min 100 -Max 2000
            
            # UDP amplification characteristics
            total_fwd_packets = Get-Random -Min 1 -Max 3
            total_backward_packets = Get-Random -Min 0 -Max 1
            fwd_packet_length_mean = Get-Random -Min 512 -Max 1400  # Large responses
            bwd_packet_length_mean = 60
            packet_length_mean = Get-Random -Min 400 -Max 1200
            packet_length_min = 50
            packet_length_max = 1400
            packet_length_std = 200.0
            
            # Extremely high packet rate
            flow_packets_s = Get-Random -Min 150000 -Max 250000
            bwd_packets_s = Get-Random -Min 1000 -Max 5000
            
            fwd_packets_length_total = Get-Random -Min 1500 -Max 4000
            bwd_packets_length_total = 60
            subflow_fwd_bytes = Get-Random -Min 1000 -Max 3000
            subflow_bwd_bytes = 60
            
            ack_flag_count = 0
            fwd_psh_flags = 0
            urg_flag_count = 0
            
            init_fwd_win_bytes = 65535
            init_bwd_win_bytes = 0
            
            fwd_iat_mean = Get-Random -Min 1 -Max 5
            fwd_iat_std = Get-Random -Min 1 -Max 3
            fwd_iat_total = Get-Random -Min 10 -Max 50
            flow_iat_mean = Get-Random -Min 1 -Max 10
            flow_iat_std = Get-Random -Min 1 -Max 5
            
            avg_packet_size = Get-Random -Min 500 -Max 1200
            avg_fwd_segment_size = Get-Random -Min 500 -Max 1200
            down_up_ratio = Get-Random -Min 0.01 -Max 0.1
            fwd_act_data_packets = Get-Random -Min 1 -Max 3
        }
        
        try {
            $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
            $udpResults += $result
            
            $color = if ($result.severity -eq "CRITICAL") { "Red" } elseif ($result.severity -eq "HIGH") { "Yellow" } else { "Green" }
            Write-Host "  Bot $($i+1) [$($packet.source_ip):$($packet.dst_port)]: $($result.attack_type) | Conf: $([Math]::Round($result.confidence*100,1))% | Sev: $($result.severity) | LSTM: $($result.lstm_score)" -ForegroundColor $color
        } catch {
            Write-Host "  ✗ Prediction failed" -ForegroundColor Red
        }
    }
    
    $attacks = ($udpResults | Where-Object { $_.is_attack -eq $true }).Count
    $critical = ($udpResults | Where-Object { $_.severity -eq "CRITICAL" }).Count
    
    Write-Host "`nResults:" -ForegroundColor Cyan
    Write-Host "  • Attacks Detected: $attacks/5" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
    Write-Host "  • CRITICAL Severity: $critical/5" -ForegroundColor $(if ($critical -ge 3) { "Green" } else { "Yellow" })
    Write-Host "  • Verdict: $(if ($attacks -ge 4) { '✓ UDP AMPLIFICATION DETECTED' } else { '⚠ PARTIAL DETECTION' })" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
}

# Test Case 3: HTTP Flood Botnet
if ($TestCase -eq "all" -or $TestCase -eq "http") {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  TEST CASE 3: HTTP FLOOD BOTNET (Layer 7)                ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    
    Write-Host "`nScenario:" -ForegroundColor Yellow
    Write-Host "  • Attack Type: HTTP GET Flood" -ForegroundColor White
    Write-Host "  • Characteristics: Valid HTTP, multiple user-agents, high rate" -ForegroundColor White
    Write-Host "  • Bot Count: 40 HTTP bots" -ForegroundColor White
    Write-Host "  • Request Rate: 50K-100K req/s per bot" -ForegroundColor White
    Write-Host "  • Expected: HIGH-CRITICAL severity" -ForegroundColor White
    
    Write-Host "`nTesting ML Detection + Fingerprint Analysis:" -ForegroundColor Cyan
    
    $userAgents = @(
        "python-requests/2.28.0",
        "curl/7.68.0",
        "Go-http-client/1.1",
        "HeadlessChrome/120.0.0.0",
        "Mozilla/5.0 (compatible; bot/1.0)"
    )
    
    $httpResults = @()
    for ($i = 0; $i -lt 5; $i++) {
        $ua = $userAgents[$i]
        
        # ML Prediction
        $packet = @{
            source_ip = Get-BotIP -index ($i + 50)
            destination_ip = "192.168.1.100"
            protocol = 6
            dst_port = 80
            flow_duration = Get-Random -Min 500 -Max 5000
            
            total_fwd_packets = Get-Random -Min 3 -Max 10
            total_backward_packets = Get-Random -Min 1 -Max 5
            fwd_packet_length_mean = Get-Random -Min 200 -Max 800
            bwd_packet_length_mean = Get-Random -Min 100 -Max 500
            packet_length_mean = Get-Random -Min 150 -Max 650
            packet_length_min = 60
            packet_length_max = 1500
            packet_length_std = 150.0
            
            flow_packets_s = Get-Random -Min 60000 -Max 120000
            bwd_packets_s = Get-Random -Min 5000 -Max 15000
            
            fwd_packets_length_total = Get-Random -Min 800 -Max 5000
            bwd_packets_length_total = Get-Random -Min 200 -Max 2000
            subflow_fwd_bytes = Get-Random -Min 600 -Max 4000
            subflow_bwd_bytes = Get-Random -Min 150 -Max 1500
            
            ack_flag_count = Get-Random -Min 2 -Max 8
            fwd_psh_flags = Get-Random -Min 1 -Max 5
            urg_flag_count = 0
            
            init_fwd_win_bytes = 65535
            init_bwd_win_bytes = Get-Random -Min 10000 -Max 65535
            
            fwd_iat_mean = Get-Random -Min 5 -Max 50
            fwd_iat_std = Get-Random -Min 3 -Max 30
            fwd_iat_total = Get-Random -Min 50 -Max 500
            flow_iat_mean = Get-Random -Min 10 -Max 100
            flow_iat_std = Get-Random -Min 5 -Max 50
            
            avg_packet_size = Get-Random -Min 200 -Max 700
            avg_fwd_segment_size = Get-Random -Min 250 -Max 750
            down_up_ratio = Get-Random -Min 0.2 -Max 0.6
            fwd_act_data_packets = Get-Random -Min 2 -Max 8
        }
        
        try {
            $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
            $httpResults += $result
            
            # Fingerprint Analysis
            $fingerprint = @{
                composite_fingerprint = "http-bot-$i"
                tls_fingerprint = "771,49195"
                http2_settings = ""
                tcp_window_size = 65535
                device_type = "Unknown"
                user_agent = $ua
            } | ConvertTo-Json
            
            $fpResult = Invoke-RestMethod -Uri "$mlUrl/predict/fingerprint" -Method Post -Body $fingerprint -ContentType "application/json"
            
            $color = if ($result.severity -eq "CRITICAL") { "Red" } elseif ($result.severity -eq "HIGH") { "Yellow" } else { "Green" }
            Write-Host "  Bot $($i+1) [$($packet.source_ip)]:" -ForegroundColor White
            Write-Host "    ML: $($result.attack_type) | Conf: $([Math]::Round($result.confidence*100,1))% | Sev: $($result.severity)" -ForegroundColor $color
            Write-Host "    FP: Bot Prob: $($fpResult.bot_probability) | Risk: $($fpResult.risk_level) | Action: $($fpResult.recommended_action)" -ForegroundColor $(if ($fpResult.bot_probability -gt 0.5) { "Red" } else { "Yellow" })
            Write-Host "    UA: $ua" -ForegroundColor Gray
        } catch {
            Write-Host "  ✗ Analysis failed for bot $($i+1)" -ForegroundColor Red
        }
    }
    
    $attacks = ($httpResults | Where-Object { $_.is_attack -eq $true }).Count
    Write-Host "`nResults:" -ForegroundColor Cyan
    Write-Host "  • HTTP Flood Detected: $attacks/5" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
    Write-Host "  • Verdict: $(if ($attacks -ge 4) { '✓ HTTP BOTNET DETECTED' } else { '⚠ PARTIAL DETECTION' })" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
}

# Test Case 4: Slowloris Botnet
if ($TestCase -eq "all" -or $TestCase -eq "slowloris") {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  TEST CASE 4: SLOWLORIS BOTNET (Slow Attack)             ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    
    Write-Host "`nScenario:" -ForegroundColor Yellow
    Write-Host "  • Attack Type: Slowloris (Connection Exhaustion)" -ForegroundColor White
    Write-Host "  • Characteristics: Long connections, slow sending, keep-alive abuse" -ForegroundColor White
    Write-Host "  • Bot Count: 20 slow bots" -ForegroundColor White
    Write-Host "  • Connection Duration: 300+ seconds" -ForegroundColor White
    Write-Host "  • Expected: HIGH severity (resource exhaustion)" -ForegroundColor White
    
    Write-Host "`nTesting ML Detection:" -ForegroundColor Cyan
    
    $slowResults = @()
    for ($i = 0; $i -lt 5; $i++) {
        $packet = @{
            source_ip = Get-BotIP -index ($i + 80)
            destination_ip = "192.168.1.100"
            protocol = 6
            dst_port = 80
            flow_duration = Get-Random -Min 300000 -Max 600000  # Very long
            
            total_fwd_packets = Get-Random -Min 10 -Max 50
            total_backward_packets = Get-Random -Min 5 -Max 25
            fwd_packet_length_mean = Get-Random -Min 10 -Max 100  # Small packets
            bwd_packet_length_mean = Get-Random -Min 10 -Max 80
            packet_length_mean = Get-Random -Min 20 -Max 90
            packet_length_min = 1
            packet_length_max = 150
            packet_length_std = 30.0
            
            flow_packets_s = Get-Random -Min 100 -Max 500  # Low rate
            bwd_packets_s = Get-Random -Min 50 -Max 250
            
            fwd_packets_length_total = Get-Random -Min 100 -Max 1000
            bwd_packets_length_total = Get-Random -Min 80 -Max 800
            subflow_fwd_bytes = Get-Random -Min 80 -Max 800
            subflow_bwd_bytes = Get-Random -Min 60 -Max 600
            
            ack_flag_count = Get-Random -Min 8 -Max 40
            fwd_psh_flags = Get-Random -Min 1 -Max 10
            urg_flag_count = 0
            
            init_fwd_win_bytes = 65535
            init_bwd_win_bytes = Get-Random -Min 20000 -Max 65535
            
            fwd_iat_mean = Get-Random -Min 5000 -Max 15000  # Long inter-arrival time
            fwd_iat_std = Get-Random -Min 2000 -Max 8000
            fwd_iat_total = Get-Random -Min 100000 -Max 500000
            flow_iat_mean = Get-Random -Min 8000 -Max 20000
            flow_iat_std = Get-Random -Min 3000 -Max 10000
            
            avg_packet_size = Get-Random -Min 20 -Max 90
            avg_fwd_segment_size = Get-Random -Min 15 -Max 85
            down_up_ratio = Get-Random -Min 0.4 -Max 0.9
            fwd_act_data_packets = Get-Random -Min 5 -Max 30
        }
        
        try {
            $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
            $slowResults += $result
            
            $color = if ($result.severity -in @("CRITICAL", "HIGH")) { "Yellow" } else { "Green" }
            Write-Host "  Bot $($i+1) [$($packet.source_ip)]: $($result.attack_type) | Duration: $([Math]::Round($packet.flow_duration/1000,1))s | Sev: $($result.severity)" -ForegroundColor $color
        } catch {
            Write-Host "  ✗ Prediction failed" -ForegroundColor Red
        }
    }
    
    $attacks = ($slowResults | Where-Object { $_.is_attack -eq $true }).Count
    Write-Host "`nResults:" -ForegroundColor Cyan
    Write-Host "  • Slowloris Detected: $attacks/5" -ForegroundColor $(if ($attacks -ge 3) { "Green" } else { "Yellow" })
    Write-Host "  • Note: Slowloris is harder to detect (low rate, looks legit)" -ForegroundColor Gray
    Write-Host "  • Verdict: $(if ($attacks -ge 3) { '✓ DETECTED' } else { '⚠ NEEDS BEHAVIORAL ANALYSIS' })" -ForegroundColor $(if ($attacks -ge 3) { "Green" } else { "Yellow" })
}

# Test Case 5: Mixed Attack Botnet
if ($TestCase -eq "all" -or $TestCase -eq "mixed") {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  TEST CASE 5: MIXED ATTACK BOTNET (Multi-Vector)         ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    
    Write-Host "`nScenario:" -ForegroundColor Yellow
    Write-Host "  • Attack Type: Multi-vector (SYN + UDP + HTTP combined)" -ForegroundColor White
    Write-Host "  • Characteristics: Sophisticated botnet using multiple techniques" -ForegroundColor White
    Write-Host "  • Bot Count: 100+ distributed" -ForegroundColor White
    Write-Host "  • Difficulty: HIGHEST (mimics legitimate traffic mix)" -ForegroundColor White
    Write-Host "  • Expected: ML should detect patterns" -ForegroundColor White
    
    Write-Host "`nTesting ML Detection on Mixed Traffic:" -ForegroundColor Cyan
    
    $attackTypes = @("SYN", "UDP", "HTTP", "SYN", "UDP")  # Mix
    $mixedResults = @()
    
    for ($i = 0; $i -lt 5; $i++) {
        $type = $attackTypes[$i]
        
        $packet = @{
            source_ip = Get-BotIP -index ($i + 100)
            destination_ip = "192.168.1.100"
        }
        
        switch ($type) {
            "SYN" {
                $packet += @{
                    protocol = 6
                    dst_port = 80
                    total_fwd_packets = 1
                    total_backward_packets = 0
                    flow_packets_s = 120000
                    ack_flag_count = 0
                    packet_length_mean = 64
                }
            }
            "UDP" {
                $packet += @{
                    protocol = 17
                    dst_port = 53
                    total_fwd_packets = 2
                    total_backward_packets = 0
                    flow_packets_s = 180000
                    ack_flag_count = 0
                    packet_length_mean = 512
                }
            }
            "HTTP" {
                $packet += @{
                    protocol = 6
                    dst_port = 80
                    total_fwd_packets = 5
                    total_backward_packets = 2
                    flow_packets_s = 80000
                    ack_flag_count = 4
                    fwd_psh_flags = 2
                    packet_length_mean = 350
                }
            }
        }
        
        # Fill remaining required fields
        $packet += @{
            flow_duration = Get-Random -Min 100 -Max 2000
            fwd_packet_length_mean = $packet.packet_length_mean
            bwd_packet_length_mean = if ($type -eq "SYN") { 0 } else { 100 }
            packet_length_min = $packet.packet_length_mean - 20
            packet_length_max = $packet.packet_length_mean + 20
            packet_length_std = 10.0
            bwd_packets_s = if ($type -eq "SYN") { 0 } else { 5000 }
            fwd_packets_length_total = $packet.packet_length_mean * $packet.total_fwd_packets
            bwd_packets_length_total = if ($type -eq "SYN") { 0 } else { 200 }
            subflow_fwd_bytes = $packet.packet_length_mean * 2
            subflow_bwd_bytes = if ($type -eq "SYN") { 0 } else { 150 }
            fwd_psh_flags = if ($null -eq $packet.fwd_psh_flags) { 0 } else { $packet.fwd_psh_flags }
            urg_flag_count = 0
            init_fwd_win_bytes = 65535
            init_bwd_win_bytes = if ($type -eq "SYN") { 0 } else { 30000 }
            fwd_iat_mean = Get-Random -Min 1 -Max 50
            fwd_iat_std = Get-Random -Min 1 -Max 30
            fwd_iat_total = Get-Random -Min 10 -Max 500
            flow_iat_mean = Get-Random -Min 1 -Max 100
            flow_iat_std = Get-Random -Min 1 -Max 50
            avg_packet_size = $packet.packet_length_mean
            avg_fwd_segment_size = $packet.packet_length_mean
            down_up_ratio = if ($type -eq "SYN") { 0 } else { 0.3 }
            fwd_act_data_packets = if ($type -eq "HTTP") { 3 } else { 0 }
        }
        
        try {
            $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
            $mixedResults += $result
            
            $color = if ($result.severity -eq "CRITICAL") { "Red" } elseif ($result.severity -eq "HIGH") { "Yellow" } else { "Green" }
            Write-Host "  Bot $($i+1) [$type from $($packet.source_ip)]: $($result.attack_type) | Conf: $([Math]::Round($result.confidence*100,1))% | Sev: $($result.severity)" -ForegroundColor $color
        } catch {
            Write-Host "  ✗ Prediction failed" -ForegroundColor Red
        }
    }
    
    $attacks = ($mixedResults | Where-Object { $_.is_attack -eq $true }).Count
    Write-Host "`nResults:" -ForegroundColor Cyan
    Write-Host "  • Mixed Attacks Detected: $attacks/5" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
    Write-Host "  • Verdict: $(if ($attacks -ge 4) { '✓ SOPHISTICATED BOTNET DETECTED' } else { '⚠ NEEDS CORRELATION' })" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              BOTNET TEST CASES COMPLETED                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nTest Cases Available:" -ForegroundColor Yellow
Write-Host "  • syn          - SYN Flood Botnet" -ForegroundColor White
Write-Host "  • udp          - UDP Amplification Botnet" -ForegroundColor White
Write-Host "  • http         - HTTP Flood Botnet (Layer 7)" -ForegroundColor White
Write-Host "  • slowloris    - Slowloris Botnet" -ForegroundColor White
Write-Host "  • mixed        - Multi-vector Attack" -ForegroundColor White
Write-Host "  • all          - Run all test cases (default)" -ForegroundColor White

Write-Host "`nUsage Examples:" -ForegroundColor Cyan
Write-Host "  .\test-botnet-cases.ps1                    # Run all tests" -ForegroundColor Gray
Write-Host "  .\test-botnet-cases.ps1 -TestCase syn      # SYN flood only" -ForegroundColor Gray
Write-Host "  .\test-botnet-cases.ps1 -TestCase http     # HTTP flood only" -ForegroundColor Gray
