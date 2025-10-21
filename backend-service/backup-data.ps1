# DefenDDoS Data Backup Script
# Backs up InfluxDB data to a local directory

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "           DEFENDDOS - DATA BACKUP SCRIPT                      " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory
$backupDir = ".\backups\$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "[INFO] Backup directory: $backupDir" -ForegroundColor Yellow

# Check if InfluxDB container is running
$influxContainer = docker ps --filter "name=defenddos-influxdb" --format "{{.Names}}"
if (-not $influxContainer) {
    Write-Host "[ERROR] InfluxDB container is not running!" -ForegroundColor Red
    exit 1
}

# Backup InfluxDB data
Write-Host ""
Write-Host "[STEP 1] Backing up InfluxDB data..." -ForegroundColor Yellow

# Export all data as line protocol
docker exec defenddos-influxdb influx backup `
    --bucket ddos-bucket `
    --org defenddos-org `
    --token 7QotbzsDl1Mg2JVkh3WhBHxw9YHLDRZT4fd7thN9015P1xuhs0BCpvVktQ2YJrU0_7fI3JP4yjIav5mrNYkSpg== `
    /tmp/backup

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [PASS] InfluxDB backup created" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] InfluxDB backup failed" -ForegroundColor Red
    exit 1
}

# Copy backup from container to host
Write-Host ""
Write-Host "[STEP 2] Copying backup to host..." -ForegroundColor Yellow
docker cp defenddos-influxdb:/tmp/backup $backupDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [PASS] Backup copied successfully" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Failed to copy backup" -ForegroundColor Red
    exit 1
}

# Clean up container backup
docker exec defenddos-influxdb rm -rf /tmp/backup

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "           BACKUP COMPLETED SUCCESSFULLY                        " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup location: $backupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "To restore this backup, run: .\restore-data.ps1 $backupDir" -ForegroundColor Yellow
Write-Host ""
