# DefenDDoS-Cloud - DDoS Attack Simulation Demo
param(
    [string]$BaseUrl = "http://localhost:8082",
    [ValidateSet("Low", "Medium", "High")]
    [string]$AttackIntensity = "Medium"
)

$AttackConfig = @{
    Low = @{ Waves = 2; RequestsPerWave = 25; Attackers = 3 }
    Medium = @{ Waves = 4; RequestsPerWave = 50; Attackers = 5 }
    High = @{ Waves = 8; RequestsPerWave = 65; Attackers = 10 }
}

$AttackerIPs = @(
    "203.0.113.10", "203.0.113.20", "203.0.113.30", "203.0.113.40", "203.0.113.50",
    "198.51.100.50", "198.51.100.60", "198.51.100.70", "198.51.100.80", "198.51.100.90",
    "192.0.2.100", "192.0.2.150", "192.0.2.200", "192.0.2.250", "192.0.2.50"
)

$AttackTypes = @(
    @{ Type = "SYN_FLOOD"; Protocol = "TCP"; MinPackets = 10000; MaxPackets = 50000; MinBytes = 1000000; MaxBytes = 5000000 }
    @{ Type = "UDP_FLOOD"; Protocol = "UDP"; MinPackets = 20000; MaxPackets = 100000; MinBytes = 2000000; MaxBytes = 10000000 }
    @{ Type = "HTTP_FLOOD"; Protocol = "TCP"; MinPackets = 5000; MaxPackets = 20000; MinBytes = 500000; MaxBytes = 2000000 }
    @{ Type = "ICMP_FLOOD"; Protocol = "ICMP"; MinPackets = 15000; MaxPackets = 60000; MinBytes = 1500000; MaxBytes = 6000000 }
)

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   DefenDDoS-Cloud - DDoS Attack Simulation Demo" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Target: $BaseUrl" -ForegroundColor Yellow
    Write-Host "  Intensity: $AttackIntensity" -ForegroundColor Magenta
    Write-Host "  ML Detection: ENABLED" -ForegroundColor Green
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Get-SystemStatus {
    param([string]$Stage)
    Write-Host "System Status - $Stage" -ForegroundColor White
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    try {
        $health = Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Method GET -ErrorAction Stop
        Write-Host "  Backend: $($health.status)" -ForegroundColor Green
        $stats = Invoke-RestMethod -Uri "$BaseUrl/api/v1/statistics/detailed" -Method GET -ErrorAction Stop
        Write-Host "  Packets: $($stats.data.totalPackets)"
        $blocked = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/blocked" -Method GET -ErrorAction Stop
        Write-Host "  Blocked IPs: $($blocked.count)" -ForegroundColor $(if ($blocked.count -gt 0) { "Red" } else { "Green" })
        if ($blocked.count -gt 0) {
            $blocked.blockedIps | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
        }
        Write-Host ""
    } catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Send-AttackTraffic {
    param([string]$SourceIP, [hashtable]$Pattern, [int]$Count)
    $sent = 0
    $blocked = 0
    for ($i = 1; $i -le $Count; $i++) {
        $payload = @{
            sourceIp = $SourceIP
            destinationIp = "192.168.1.1"
            packetCount = Get-Random -Minimum $Pattern.MinPackets -Maximum $Pattern.MaxPackets
            byteCount = Get-Random -Minimum $Pattern.MinBytes -Maximum $Pattern.MaxBytes
            protocol = $Pattern.Protocol
            attackType = $Pattern.Type
        } | ConvertTo-Json -Compress
        try {
            Invoke-RestMethod -Uri "$BaseUrl/api/v1/traffic/ingest" -Method POST -Body $payload -ContentType "application/json" -TimeoutSec 3 -ErrorAction Stop | Out-Null
            $sent++
        } catch {
            if ($_.Exception.Response.StatusCode.value__ -eq 429) { $blocked++ }
        }
    }
    return @{ Sent = $sent; Blocked = $blocked }
}

function Invoke-AttackWave {
    param([int]$WaveNum, [int]$RequestsPerWave, [array]$Attackers)
    Write-Host "Wave $WaveNum - Launching attack..." -ForegroundColor Magenta
    $totalSent = 0
    $totalBlocked = 0
    foreach ($ip in $Attackers) {
        $pattern = $AttackTypes | Get-Random
        Write-Host "  $ip -> $($pattern.Type)" -ForegroundColor Yellow
        $result = Send-AttackTraffic -SourceIP $ip -Pattern $pattern -Count $RequestsPerWave
        $totalSent += $result.Sent
        $totalBlocked += $result.Blocked
    }
    Write-Host "  Complete: $totalSent sent, $totalBlocked blocked" -ForegroundColor Green
    Write-Host ""
    return @{ Sent = $totalSent; Blocked = $totalBlocked }
}

Write-Banner
Write-Host "Step 1: Pre-Attack Check" -ForegroundColor Cyan
Write-Host ""
Get-SystemStatus -Stage "BEFORE ATTACK"
Start-Sleep -Seconds 2

Write-Host "Step 2: Preparing Attack" -ForegroundColor Cyan
Write-Host ""
$config = $AttackConfig[$AttackIntensity]
$attackers = $AttackerIPs | Get-Random -Count $config.Attackers
Write-Host "  Waves: $($config.Waves)"
Write-Host "  Requests/Wave: $($config.RequestsPerWave)"
Write-Host "  Attackers: $($attackers.Count)"
Write-Host ""
Write-Host "  Attacker IPs:" -ForegroundColor Red
$attackers | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
Write-Host ""
Read-Host "Press ENTER to launch attack"

Write-Host ""
Write-Host "Step 3: Launching Attack" -ForegroundColor Cyan
Write-Host ""
$start = Get-Date
$results = @()
for ($wave = 1; $wave -le $config.Waves; $wave++) {
    $result = Invoke-AttackWave -WaveNum $wave -RequestsPerWave $config.RequestsPerWave -Attackers $attackers
    $results += $result
    Start-Sleep -Milliseconds 500
}
$duration = ((Get-Date) - $start).TotalSeconds
$totalSent = ($results | Measure-Object -Property Sent -Sum).Sum
$totalBlocked = ($results | Measure-Object -Property Blocked -Sum).Sum

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                 ATTACK SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Requests: $totalSent"
Write-Host "  Blocked: $totalBlocked" -ForegroundColor Red
Write-Host "  Success Rate: $(if ($totalSent -gt 0) { [math]::Round((($totalSent - $totalBlocked) / $totalSent * 100), 2) } else { 0 })%"
Write-Host "  Duration: $($duration.ToString('F2'))s"
Write-Host "  Throughput: $([math]::Round($totalSent / $duration, 2)) req/s"
Write-Host ""

Start-Sleep -Seconds 2
Write-Host "Step 4: Post-Attack Analysis" -ForegroundColor Cyan
Write-Host ""
Get-SystemStatus -Stage "AFTER ATTACK"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "               DETECTION RESULTS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
try {
    $blocked = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/blocked" -Method GET
    Write-Host "Blocked Attackers: $($blocked.count)" -ForegroundColor Red
    $blocked.blockedIps | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host ""
    $mlStats = Invoke-RestMethod -Uri "$BaseUrl/api/v1/statistics/ml-stats" -Method GET
    Write-Host "ML Performance:"
    Write-Host "  Predictions: $($mlStats.data.totalPredictions)"
    Write-Host "  Attacks: $($mlStats.data.attackPredictions)" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "               RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "  1. Review blocked IPs: GET /api/v1/mitigation/blocked"
Write-Host "  2. Check ML stats: GET /api/v1/statistics/ml-stats"
Write-Host "  3. Unblock IPs: POST /api/v1/mitigation/clear"
Write-Host ""
Write-Host "Unblock all IPs? (Y/N): " -NoNewline -ForegroundColor Yellow
$cleanup = Read-Host
if ($cleanup -eq 'Y' -or $cleanup -eq 'y') {
    Write-Host ""
    Write-Host "Unblocking..." -ForegroundColor Yellow
    try {
        $clear = Invoke-RestMethod -Uri "$BaseUrl/api/v1/mitigation/clear" -Method POST -ContentType 'application/json'
        Write-Host "Unblocked $($clear.successfullyUnblocked) IPs" -ForegroundColor Green
    } catch {
        Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                 DEMO COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
