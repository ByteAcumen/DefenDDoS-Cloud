# DefenDDoS Data Restore Script
# Restores InfluxDB data from a backup

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupPath
)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "           DEFENDDOS - DATA RESTORE SCRIPT                     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# If no backup path provided, list available backups
if (-not $BackupPath) {
    Write-Host "[INFO] Available backups:" -ForegroundColor Yellow
    $backups = Get-ChildItem -Path ".\backups" -Directory | Sort-Object Name -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "   [ERROR] No backups found!" -ForegroundColor Red
        exit 1
    }
    
    for ($i = 0; $i -lt $backups.Count; $i++) {
        Write-Host "   [$i] $($backups[$i].Name)" -ForegroundColor Cyan
    }
    
    Write-Host ""
    $selection = Read-Host "Enter backup number to restore (or 'q' to quit)"
    
    if ($selection -eq 'q') {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    $BackupPath = $backups[$selection].FullName
}

Write-Host ""
Write-Host "[INFO] Restoring from: $BackupPath" -ForegroundColor Yellow

# Check if backup exists
if (-not (Test-Path $BackupPath)) {
    Write-Host "[ERROR] Backup path does not exist!" -ForegroundColor Red
    exit 1
}

# Check if InfluxDB container is running
$influxContainer = docker ps --filter "name=defenddos-influxdb" --format "{{.Names}}"
if (-not $influxContainer) {
    Write-Host "[ERROR] InfluxDB container is not running!" -ForegroundColor Red
    Write-Host "[INFO] Start the containers first with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Confirm restore
Write-Host ""
Write-Host "[WARNING] This will restore data from backup." -ForegroundColor Yellow
Write-Host "[WARNING] Existing data may be affected." -ForegroundColor Yellow
$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit 0
}

# Copy backup to container
Write-Host ""
Write-Host "[STEP 1] Copying backup to container..." -ForegroundColor Yellow
docker cp "$BackupPath\backup" defenddos-influxdb:/tmp/

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [PASS] Backup copied to container" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Failed to copy backup" -ForegroundColor Red
    exit 1
}

# Restore InfluxDB data
Write-Host ""
Write-Host "[STEP 2] Restoring InfluxDB data..." -ForegroundColor Yellow

docker exec defenddos-influxdb influx restore `
    --bucket ddos-bucket `
    --org defenddos-org `
    --token 7QotbzsDl1Mg2JVkh3WhBHxw9YHLDRZT4fd7thN9015P1xuhs0BCpvVktQ2YJrU0_7fI3JP4yjIav5mrNYkSpg== `
    /tmp/backup

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [PASS] Data restored successfully" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Restore failed" -ForegroundColor Red
    exit 1
}

# Clean up
docker exec defenddos-influxdb rm -rf /tmp/backup

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "           RESTORE COMPLETED SUCCESSFULLY                       " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
