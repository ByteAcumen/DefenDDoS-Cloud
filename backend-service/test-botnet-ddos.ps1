# Botnet DDoS Attack Simulation
# Tests small packets from distributed bot IPs

param(
    [int]$BotCount = 100,
    [int]$PacketsPerBot = 500,
    [int]$PacketSize = 64
)

$baseUrl = "http://localhost:8082"
$mlUrl = "http://localhost:8000"

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "   BOTNET DDOS ATTACK SIMULATION TEST" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nConfiguration:" -ForegroundColor Yellow
Write-Host "  Bot IPs: $BotCount distributed sources" -ForegroundColor White
Write-Host "  Packets per bot: $PacketsPerBot small packets" -ForegroundColor White
Write-Host "  Packet size: $PacketSize bytes" -ForegroundColor White
Write-Host "  Total volume: $($BotCount * $PacketsPerBot) packets`n" -ForegroundColor White

# Generate bot IP
function Get-BotIP {
    param([int]$index)
    $subnets = @("203.0.113", "198.51.100", "192.0.2", "185.220", "45.142", "91.219", "176.123", "31.184")
    $subnet = $subnets[$index % $subnets.Length]
    $last = ($index % 254) + 1
    return "${subnet}.${last}"
}

# Test 1: Health Check
Write-Host "[1/6] Checking services..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -TimeoutSec 5
    $mlHealth = Invoke-RestMethod -Uri "$mlUrl/health" -TimeoutSec 5
    Write-Host "  PASS - Backend: UP, ML: $($mlHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "  FAIL - Services not available" -ForegroundColor Red
    exit 1
}

# Test 2: Baseline
Write-Host "`n[2/6] Capturing baseline..." -ForegroundColor Cyan
$baseline = Invoke-RestMethod -Uri "$baseUrl/api/statistics/detailed"
Write-Host "  Baseline packets: $($baseline.totalPackets)" -ForegroundColor White
Write-Host "  Baseline blocked IPs: $($baseline.blockedIPs)" -ForegroundColor White

# Test 3: Simulate Botnet Attack - SYN Flood
Write-Host "`n[3/6] Simulating SYN Flood from botnet..." -ForegroundColor Cyan
Write-Host "  Sending small packets from distributed IPs..." -ForegroundColor Yellow

$totalPackets = 0
$synBots = [Math]::Min(50, $BotCount)
$packetsPerSynBot = [Math]::Floor($PacketsPerBot / 2)

for ($b = 0; $b -lt $synBots; $b++) {
    $botIP = Get-BotIP -index $b
    
    for ($p = 0; $p -lt $packetsPerSynBot; $p++) {
        $packet = @{
            source_ip = $botIP
            destination_ip = "192.168.1.100"
            protocol = 6
            dst_port = 80
            flow_duration = Get-Random -Minimum 100 -Maximum 2000
            total_fwd_packets = Get-Random -Minimum 1 -Maximum 3
            total_backward_packets = 0
            fwd_packet_length_mean = $PacketSize
            bwd_packet_length_mean = 0
            packet_length_mean = $PacketSize
            packet_length_min = $PacketSize - 5
            packet_length_max = $PacketSize + 5
            packet_length_std = 2.0
            flow_packets_s = Get-Random -Minimum 80000 -Maximum 150000
            bwd_packets_s = 0
            fwd_packets_length_total = $PacketSize * 2
            bwd_packets_length_total = 0
            subflow_fwd_bytes = $PacketSize * 2
            subflow_bwd_bytes = 0
            ack_flag_count = 0
            fwd_psh_flags = 0
            urg_flag_count = 0
            init_fwd_win_bytes = Get-Random -Minimum 5840 -Maximum 65535
            init_bwd_win_bytes = 0
            fwd_iat_mean = Get-Random -Minimum 1 -Maximum 30
            fwd_iat_std = Get-Random -Minimum 1 -Maximum 20
            fwd_iat_total = Get-Random -Minimum 10 -Maximum 300
            flow_iat_mean = Get-Random -Minimum 1 -Maximum 50
            flow_iat_std = Get-Random -Minimum 1 -Maximum 40
            avg_packet_size = $PacketSize
            avg_fwd_segment_size = $PacketSize
            down_up_ratio = 0
            fwd_act_data_packets = 0
        }
        
        try {
            $null = Invoke-RestMethod -Uri "$baseUrl/api/traffic/ingest" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 3
            $totalPackets++
            
            if ($totalPackets % 500 -eq 0) {
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
        } catch {
            # Continue on error
        }
    }
}

Write-Host "`n  Sent $totalPackets SYN flood packets from $synBots bot IPs" -ForegroundColor White

# Test 4: Simulate UDP Flood
Write-Host "`n[4/6] Simulating UDP Flood from botnet..." -ForegroundColor Cyan
$udpPackets = 0
$udpBots = [Math]::Min(30, $BotCount)
$packetsPerUdpBot = [Math]::Floor($PacketsPerBot / 2)

for ($b = 0; $b -lt $udpBots; $b++) {
    $botIP = Get-BotIP -index ($b + 50)
    
    for ($p = 0; $p -lt $packetsPerUdpBot; $p++) {
        $packet = @{
            source_ip = $botIP
            destination_ip = "192.168.1.100"
            protocol = 17
            dst_port = Get-Random -Minimum 1024 -Maximum 65535
            flow_duration = Get-Random -Minimum 50 -Maximum 1000
            total_fwd_packets = Get-Random -Minimum 1 -Maximum 5
            total_backward_packets = Get-Random -Minimum 0 -Maximum 1
            fwd_packet_length_mean = $PacketSize
            bwd_packet_length_mean = Get-Random -Minimum 0 -Maximum 50
            packet_length_mean = $PacketSize
            packet_length_min = $PacketSize - 10
            packet_length_max = $PacketSize + 10
            packet_length_std = 5.0
            flow_packets_s = Get-Random -Minimum 100000 -Maximum 200000
            bwd_packets_s = Get-Random -Minimum 0 -Maximum 5000
            fwd_packets_length_total = $PacketSize * 3
            bwd_packets_length_total = Get-Random -Minimum 0 -Maximum 100
            subflow_fwd_bytes = $PacketSize * 2
            subflow_bwd_bytes = Get-Random -Minimum 0 -Maximum 80
            ack_flag_count = Get-Random -Minimum 0 -Maximum 2
            fwd_psh_flags = 0
            urg_flag_count = 0
            init_fwd_win_bytes = 65535
            init_bwd_win_bytes = Get-Random -Minimum 0 -Maximum 20000
            fwd_iat_mean = Get-Random -Minimum 1 -Maximum 25
            fwd_iat_std = Get-Random -Minimum 1 -Maximum 15
            fwd_iat_total = Get-Random -Minimum 10 -Maximum 250
            flow_iat_mean = Get-Random -Minimum 1 -Maximum 40
            flow_iat_std = Get-Random -Minimum 1 -Maximum 30
            avg_packet_size = $PacketSize
            avg_fwd_segment_size = $PacketSize
            down_up_ratio = Get-Random -Minimum 0.0 -Maximum 0.3
            fwd_act_data_packets = Get-Random -Minimum 0 -Maximum 2
        }
        
        try {
            $null = Invoke-RestMethod -Uri "$baseUrl/api/traffic/ingest" -Method Post -Body ($packet | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 3
            $udpPackets++
            
            if ($udpPackets % 500 -eq 0) {
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
        } catch {
            # Continue
        }
    }
}

Write-Host "`n  Sent $udpPackets UDP flood packets from $udpBots bot IPs" -ForegroundColor White

# Wait for detection
Write-Host "`n[5/6] Waiting for attack detection (30 seconds)..." -ForegroundColor Cyan
for ($i = 30; $i -gt 0; $i--) {
    Write-Host "`r  Analyzing... ${i}s  " -NoNewline -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}
Write-Host ""

# Test 5: Check Detection
Write-Host "`n[6/6] Analyzing results..." -ForegroundColor Cyan

$events = Invoke-RestMethod -Uri "$baseUrl/api/detection-events/all"
$critical = ($events | Where-Object { $_.severity -eq "CRITICAL" }).Count
$high = ($events | Where-Object { $_.severity -eq "HIGH" }).Count

Write-Host "  Detection Events: $($events.Count)" -ForegroundColor White
Write-Host "  CRITICAL: $critical" -ForegroundColor Red
Write-Host "  HIGH: $high" -ForegroundColor Yellow

if ($critical -gt 0 -or $high -gt 0) {
    Write-Host "  PASS - Botnet attack detected!" -ForegroundColor Green
} else {
    Write-Host "  WARNING - No critical detections" -ForegroundColor Yellow
}

# Check blocking
$blocked = Invoke-RestMethod -Uri "$baseUrl/api/blocked-ips"
$newBlocks = $blocked.Count - $baseline.blockedIPs

Write-Host "`n  Blocked IPs: $($blocked.Count)" -ForegroundColor White
Write-Host "  New blocks: $newBlocks" -ForegroundColor Red

if ($newBlocks -gt 0) {
    Write-Host "  PASS - $newBlocks bot IPs blocked!" -ForegroundColor Green
    
    $recent = $blocked | Select-Object -Last ([Math]::Min(5, $newBlocks))
    Write-Host "`n  Sample blocked bots:" -ForegroundColor Cyan
    foreach ($ip in $recent) {
        Write-Host "    - $($ip.ipAddress)" -ForegroundColor White
    }
} else {
    Write-Host "  WARNING - No IPs blocked" -ForegroundColor Yellow
}

# Test ML Fingerprinting
Write-Host "`n  Testing bot fingerprint detection..." -ForegroundColor Cyan

$testBot = @{
    composite_fingerprint = "botnet-attack-pattern"
    tls_fingerprint = "771,49195"
    http2_settings = ""
    tcp_window_size = 65535
    device_type = "Unknown"
    user_agent = "python-requests/2.28.0"
} | ConvertTo-Json

$fpResult = Invoke-RestMethod -Uri "$mlUrl/predict/fingerprint" -Method Post -Body $testBot -ContentType "application/json"

Write-Host "  Bot probability: $($fpResult.bot_probability)" -ForegroundColor $(if ($fpResult.bot_probability -gt 0.5) { "Red" } else { "Yellow" })
Write-Host "  Risk level: $($fpResult.risk_level)" -ForegroundColor White
Write-Host "  Action: $($fpResult.recommended_action)" -ForegroundColor White

if ($fpResult.bot_probability -gt 0.3) {
    Write-Host "  PASS - Bot correctly identified!" -ForegroundColor Green
}

# Final stats
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "              FINAL STATISTICS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$final = Invoke-RestMethod -Uri "$baseUrl/api/statistics/detailed"
$predictions = Invoke-RestMethod -Uri "$baseUrl/api/ml-predictions/all"

Write-Host "`n  Total packets: $($final.totalPackets)" -ForegroundColor White
Write-Host "  Attack events: $($final.attackEvents)" -ForegroundColor Red
Write-Host "  Blocked IPs: $($final.blockedIPs)" -ForegroundColor Red
Write-Host "  ML predictions: $($predictions.Count)" -ForegroundColor White

$attacks = $predictions | Where-Object { $_.attackType -ne "BENIGN" }
Write-Host "  Attacks detected: $($attacks.Count)" -ForegroundColor Red

if ($attacks.Count -gt 0) {
    $types = $attacks | Group-Object -Property attackType
    Write-Host "`n  Attack types:" -ForegroundColor Yellow
    foreach ($t in $types) {
        Write-Host "    - $($t.Name): $($t.Count)" -ForegroundColor White
    }
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "  BOTNET DDOS TEST COMPLETED!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
