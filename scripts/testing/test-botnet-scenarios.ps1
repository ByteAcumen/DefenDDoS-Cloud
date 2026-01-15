# Botnet Attack Test Cases
# Simple and effective botnet testing

param([string]$TestCase = "all")

$mlUrl = "http://localhost:8000"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "       BOTNET DDOS ATTACK TEST SCENARIOS" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

function Get-BotIP { param([int]$i) "45.142.$((Get-Random -Min 1 -Max 255))" }

# Check ML Service
Write-Host "`n[CHECK] ML Service Status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$mlUrl/health" -TimeoutSec 5
    Write-Host "  OK - ML Service: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "  FAIL - ML Service not available" -ForegroundColor Red
    exit 1
}

# TEST CASE 1: SYN FLOOD
if ($TestCase -in @("all", "syn")) {
    Write-Host "`n======== TEST 1: SYN FLOOD BOTNET ========" -ForegroundColor Magenta
    Write-Host "Attack: TCP SYN flood, no ACK, 64-byte packets, high rate`n" -ForegroundColor Gray
    
    $synResults = @()
    for ($i = 0; $i -lt 5; $i++) {
        $packet = @{
            source_ip = Get-BotIP -i $i
            destination_ip = "192.168.1.100"
            protocol = 6
            dst_port = 80
            flow_duration = 200
            total_fwd_packets = 1
            total_backward_packets = 0
            fwd_packet_length_mean = 64.0
            bwd_packet_length_mean = 0.0
            packet_length_mean = 64.0
            packet_length_min = 60.0
            packet_length_max = 68.0
            packet_length_std = 2.0
            flow_packets_s = 120000.0
            bwd_packets_s = 0.0
            fwd_packets_length_total = 64.0
            bwd_packets_length_total = 0.0
            subflow_fwd_bytes = 64.0
            subflow_bwd_bytes = 0.0
            ack_flag_count = 0.0
            fwd_psh_flags = 0.0
            urg_flag_count = 0.0
            init_fwd_win_bytes = 65535.0
            init_bwd_win_bytes = 0.0
            fwd_iat_mean = 5.0
            fwd_iat_std = 2.0
            fwd_iat_total = 50.0
            flow_iat_mean = 10.0
            flow_iat_std = 5.0
            avg_packet_size = 64.0
            avg_fwd_segment_size = 64.0
            down_up_ratio = 0.0
            fwd_act_data_packets = 0.0
        }
        
        $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
        $synResults += $result
        
        $color = if ($result.severity -eq "CRITICAL") { "Red" } elseif ($result.severity -eq "HIGH") { "Yellow" } else { "Green" }
        Write-Host "  Bot$($i+1) [$($packet.source_ip)]: $($result.attack_type) | Conf: $([Math]::Round($result.confidence*100,1))% | Sev: $($result.severity)" -ForegroundColor $color
    }
    
    $attacks = ($synResults | Where-Object { $_.is_attack }).Count
    Write-Host "`nResult: $attacks/5 attacks detected" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
}

# TEST CASE 2: UDP AMPLIFICATION
if ($TestCase -in @("all", "udp")) {
    Write-Host "`n======== TEST 2: UDP AMPLIFICATION ========" -ForegroundColor Magenta
    Write-Host "Attack: UDP amplification (NTP/DNS), large responses, extreme rate`n" -ForegroundColor Gray
    
    $udpResults = @()
    for ($i = 0; $i -lt 5; $i++) {
        $packet = @{
            source_ip = Get-BotIP -i $i
            destination_ip = "192.168.1.100"
            protocol = 17
            dst_port = @(123, 53)[(Get-Random -Min 0 -Max 2)]
            flow_duration = 500
            total_fwd_packets = 2.0
            total_backward_packets = 0.0
            fwd_packet_length_mean = 1024.0
            bwd_packet_length_mean = 60.0
            packet_length_mean = 900.0
            packet_length_min = 50.0
            packet_length_max = 1400.0
            packet_length_std = 200.0
            flow_packets_s = 200000.0
            bwd_packets_s = 2000.0
            fwd_packets_length_total = 2048.0
            bwd_packets_length_total = 60.0
            subflow_fwd_bytes = 2000.0
            subflow_bwd_bytes = 60.0
            ack_flag_count = 0.0
            fwd_psh_flags = 0.0
            urg_flag_count = 0.0
            init_fwd_win_bytes = 65535.0
            init_bwd_win_bytes = 0.0
            fwd_iat_mean = 2.0
            fwd_iat_std = 1.0
            fwd_iat_total = 20.0
            flow_iat_mean = 5.0
            flow_iat_std = 2.0
            avg_packet_size = 900.0
            avg_fwd_segment_size = 1000.0
            down_up_ratio = 0.05
            fwd_act_data_packets = 2.0
        }
        
        $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
        $udpResults += $result
        
        $color = if ($result.severity -eq "CRITICAL") { "Red" } else { "Yellow" }
        Write-Host "  Bot$($i+1) [$($packet.source_ip):$($packet.dst_port)]: $($result.attack_type) | Sev: $($result.severity) | LSTM: $($result.lstm_score)" -ForegroundColor $color
    }
    
    $attacks = ($udpResults | Where-Object { $_.is_attack }).Count
    Write-Host "`nResult: $attacks/5 attacks detected" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
}

# TEST CASE 3: HTTP FLOOD
if ($TestCase -in @("all", "http")) {
    Write-Host "`n======== TEST 3: HTTP FLOOD BOTNET ========" -ForegroundColor Magenta
    Write-Host "Attack: Layer 7 HTTP GET flood, bot user-agents, high request rate`n" -ForegroundColor Gray
    
    $userAgents = @("python-requests/2.28.0", "curl/7.68.0", "HeadlessChrome/120.0.0.0", "Go-http-client/1.1", "bot/1.0")
    
    $httpResults = @()
    for ($i = 0; $i -lt 5; $i++) {
        $packet = @{
            source_ip = Get-BotIP -i $i
            destination_ip = "192.168.1.100"
            protocol = 6
            dst_port = 80
            flow_duration = 2000
            total_fwd_packets = 5.0
            total_backward_packets = 2.0
            fwd_packet_length_mean = 450.0
            bwd_packet_length_mean = 250.0
            packet_length_mean = 380.0
            packet_length_min = 60.0
            packet_length_max = 1500.0
            packet_length_std = 150.0
            flow_packets_s = 85000.0
            bwd_packets_s = 10000.0
            fwd_packets_length_total = 2250.0
            bwd_packets_length_total = 500.0
            subflow_fwd_bytes = 2000.0
            subflow_bwd_bytes = 450.0
            ack_flag_count = 4.0
            fwd_psh_flags = 3.0
            urg_flag_count = 0.0
            init_fwd_win_bytes = 65535.0
            init_bwd_win_bytes = 40000.0
            fwd_iat_mean = 25.0
            fwd_iat_std = 15.0
            fwd_iat_total = 250.0
            flow_iat_mean = 50.0
            flow_iat_std = 25.0
            avg_packet_size = 400.0
            avg_fwd_segment_size = 450.0
            down_up_ratio = 0.4
            fwd_act_data_packets = 4.0
        }
        
        $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
        $httpResults += $result
        
        # Test fingerprint
        $fp = @{
            composite_fingerprint = "http-bot-$i"
            tls_fingerprint = "771,49195"
            http2_settings = ""
            tcp_window_size = 65535
            device_type = "Unknown"
            user_agent = $userAgents[$i]
        } | ConvertTo-Json
        
        $fpResult = Invoke-RestMethod -Uri "$mlUrl/predict/fingerprint" -Method Post -Body $fp -ContentType "application/json"
        
        Write-Host "  Bot$($i+1) [$($packet.source_ip)]:" -ForegroundColor White
        Write-Host "    ML: $($result.attack_type) | Conf: $([Math]::Round($result.confidence*100,1))% | Sev: $($result.severity)" -ForegroundColor Yellow
        Write-Host "    FP: BotProb=$($fpResult.bot_probability) | Risk=$($fpResult.risk_level) | UA=$($userAgents[$i])" -ForegroundColor $(if ($fpResult.bot_probability -gt 0.5) { "Red" } else { "Gray" })
    }
    
    $attacks = ($httpResults | Where-Object { $_.is_attack }).Count
    Write-Host "`nResult: $attacks/5 HTTP floods detected" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
}

# TEST CASE 4: SLOWLORIS
if ($TestCase -in @("all", "slowloris")) {
    Write-Host "`n======== TEST 4: SLOWLORIS ATTACK ========" -ForegroundColor Magenta
    Write-Host "Attack: Connection exhaustion, long duration, slow sending`n" -ForegroundColor Gray
    
    $slowResults = @()
    for ($i = 0; $i -lt 5; $i++) {
        $packet = @{
            source_ip = Get-BotIP -i $i
            destination_ip = "192.168.1.100"
            protocol = 6
            dst_port = 80
            flow_duration = 400000
            total_fwd_packets = 30.0
            total_backward_packets = 15.0
            fwd_packet_length_mean = 50.0
            bwd_packet_length_mean = 40.0
            packet_length_mean = 45.0
            packet_length_min = 1.0
            packet_length_max = 150.0
            packet_length_std = 30.0
            flow_packets_s = 250.0
            bwd_packets_s = 125.0
            fwd_packets_length_total = 1500.0
            bwd_packets_length_total = 600.0
            subflow_fwd_bytes = 1200.0
            subflow_bwd_bytes = 500.0
            ack_flag_count = 25.0
            fwd_psh_flags = 5.0
            urg_flag_count = 0.0
            init_fwd_win_bytes = 65535.0
            init_bwd_win_bytes = 50000.0
            fwd_iat_mean = 12000.0
            fwd_iat_std = 6000.0
            fwd_iat_total = 360000.0
            flow_iat_mean = 15000.0
            flow_iat_std = 7500.0
            avg_packet_size = 50.0
            avg_fwd_segment_size = 50.0
            down_up_ratio = 0.7
            fwd_act_data_packets = 20.0
        }
        
        $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
        $slowResults += $result
        
        Write-Host "  Bot$($i+1) [$($packet.source_ip)]: $($result.attack_type) | Duration: $([Math]::Round($packet.flow_duration/1000,1))s | Sev: $($result.severity)" -ForegroundColor Yellow
    }
    
    $attacks = ($slowResults | Where-Object { $_.is_attack }).Count
    Write-Host "`nResult: $attacks/5 slowloris detected (low rate = harder)" -ForegroundColor $(if ($attacks -ge 2) { "Green" } else { "Yellow" })
}

# TEST CASE 5: MIXED ATTACK
if ($TestCase -in @("all", "mixed")) {
    Write-Host "`n======== TEST 5: MIXED ATTACK BOTNET ========" -ForegroundColor Magenta
    Write-Host "Attack: Multi-vector (SYN + UDP + HTTP combined)`n" -ForegroundColor Gray
    
    $types = @("SYN", "UDP", "HTTP", "SYN", "UDP")
    $mixedResults = @()
    
    for ($i = 0; $i -lt 5; $i++) {
        if ($types[$i] -eq "SYN") {
            $packet = @{
                source_ip = Get-BotIP -i $i
                destination_ip = "192.168.1.100"
                protocol = 6
                dst_port = 80
                flow_duration = 200
                total_fwd_packets = 1.0
                total_backward_packets = 0.0
                fwd_packet_length_mean = 64.0
                bwd_packet_length_mean = 0.0
                packet_length_mean = 64.0
                packet_length_min = 60.0
                packet_length_max = 68.0
                packet_length_std = 2.0
                flow_packets_s = 130000.0
                bwd_packets_s = 0.0
                fwd_packets_length_total = 64.0
                bwd_packets_length_total = 0.0
                subflow_fwd_bytes = 64.0
                subflow_bwd_bytes = 0.0
                ack_flag_count = 0.0
                fwd_psh_flags = 0.0
                urg_flag_count = 0.0
                init_fwd_win_bytes = 65535.0
                init_bwd_win_bytes = 0.0
                fwd_iat_mean = 5.0
                fwd_iat_std = 2.0
                fwd_iat_total = 50.0
                flow_iat_mean = 10.0
                flow_iat_std = 5.0
                avg_packet_size = 64.0
                avg_fwd_segment_size = 64.0
                down_up_ratio = 0.0
                fwd_act_data_packets = 0.0
            }
        } elseif ($types[$i] -eq "UDP") {
            $packet = @{
                source_ip = Get-BotIP -i $i
                destination_ip = "192.168.1.100"
                protocol = 17
                dst_port = 53
                flow_duration = 300
                total_fwd_packets = 2.0
                total_backward_packets = 0.0
                fwd_packet_length_mean = 512.0
                bwd_packet_length_mean = 0.0
                packet_length_mean = 512.0
                packet_length_min = 500.0
                packet_length_max = 524.0
                packet_length_std = 10.0
                flow_packets_s = 190000.0
                bwd_packets_s = 0.0
                fwd_packets_length_total = 1024.0
                bwd_packets_length_total = 0.0
                subflow_fwd_bytes = 1024.0
                subflow_bwd_bytes = 0.0
                ack_flag_count = 0.0
                fwd_psh_flags = 0.0
                urg_flag_count = 0.0
                init_fwd_win_bytes = 65535.0
                init_bwd_win_bytes = 0.0
                fwd_iat_mean = 3.0
                fwd_iat_std = 1.0
                fwd_iat_total = 30.0
                flow_iat_mean = 6.0
                flow_iat_std = 2.0
                avg_packet_size = 512.0
                avg_fwd_segment_size = 512.0
                down_up_ratio = 0.0
                fwd_act_data_packets = 0.0
            }
        } else {
            $packet = @{
                source_ip = Get-BotIP -i $i
                destination_ip = "192.168.1.100"
                protocol = 6
                dst_port = 80
                flow_duration = 1500
                total_fwd_packets = 5.0
                total_backward_packets = 2.0
                fwd_packet_length_mean = 400.0
                bwd_packet_length_mean = 200.0
                packet_length_mean = 350.0
                packet_length_min = 60.0
                packet_length_max = 1500.0
                packet_length_std = 150.0
                flow_packets_s = 90000.0
                bwd_packets_s = 12000.0
                fwd_packets_length_total = 2000.0
                bwd_packets_length_total = 400.0
                subflow_fwd_bytes = 1800.0
                subflow_bwd_bytes = 380.0
                ack_flag_count = 4.0
                fwd_psh_flags = 2.0
                urg_flag_count = 0.0
                init_fwd_win_bytes = 65535.0
                init_bwd_win_bytes = 35000.0
                fwd_iat_mean = 20.0
                fwd_iat_std = 12.0
                fwd_iat_total = 200.0
                flow_iat_mean = 40.0
                flow_iat_std = 20.0
                avg_packet_size = 350.0
                avg_fwd_segment_size = 400.0
                down_up_ratio = 0.35
                fwd_act_data_packets = 3.0
            }
        }
        
        $result = Invoke-RestMethod -Uri "$mlUrl/predict" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json"
        $mixedResults += $result
        
        Write-Host "  Bot$($i+1) [$($types[$i]) from $($packet.source_ip)]: $($result.attack_type) | Conf: $([Math]::Round($result.confidence*100,1))% | Sev: $($result.severity)" -ForegroundColor $(if ($result.is_attack) { "Red" } else { "Green" })
    }
    
    $attacks = ($mixedResults | Where-Object { $_.is_attack }).Count
    Write-Host "`nResult: $attacks/5 mixed attacks detected" -ForegroundColor $(if ($attacks -ge 4) { "Green" } else { "Yellow" })
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "            BOTNET TEST CASES COMPLETED" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Write-Host "`nAvailable test cases:" -ForegroundColor Yellow
Write-Host "  syn, udp, http, slowloris, mixed, all" -ForegroundColor White
Write-Host "`nUsage: .\test-botnet-cases.ps1 -TestCase <case>" -ForegroundColor Cyan
