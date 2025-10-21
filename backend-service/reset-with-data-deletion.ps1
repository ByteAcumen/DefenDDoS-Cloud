# DefenDDoS Complete Reset Script
# WARNING: This will DELETE ALL DATA including blocked IPs and traffic history!
# Only use this when you want a completely fresh start

Write-Host ""
Write-Host "================================================================" -ForegroundColor Red
Write-Host "           DEFENDDOS - COMPLETE RESET (DATA DELETION)          " -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red
Write-Host ""
Write-Host "WARNING: This will DELETE:" -ForegroundColor Yellow
Write-Host "  - All blocked IPs" -ForegroundColor Red
Write-Host "  - All traffic data" -ForegroundColor Red
Write-Host "  - All InfluxDB volumes" -ForegroundColor Red
Write-Host "  - All historical records" -ForegroundColor Red
Write-Host ""

# Confirm action
$confirm1 = Read-Host "Type 'DELETE-ALL-DATA' to confirm"
if ($confirm1 -ne "DELETE-ALL-DATA") {
    Write-Host ""
    Write-Host "Reset cancelled. No data was deleted." -ForegroundColor Green
    Write-Host ""
    Write-Host "TIP: Use '.\start-fresh.ps1' to restart without deleting data" -ForegroundColor Cyan
    exit 0
}

Write-Host ""
$confirm2 = Read-Host "Are you absolutely sure? (yes/no)"
if ($confirm2 -ne "yes") {
    Write-Host ""
    Write-Host "Reset cancelled. No data was deleted." -ForegroundColor Green
    exit 0
}

# Navigate to backend-service directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host ""
Write-Host "[STEP 1] Creating emergency backup before deletion..." -ForegroundColor Yellow

# Try to backup first
$backupFailed = $false
try {
    & ".\backup-data.ps1"
    if ($LASTEXITCODE -ne 0) {
        $backupFailed = $true
    }
} catch {
    $backupFailed = $true
}

if ($backupFailed) {
    Write-Host "   [WARNING] Backup failed or skipped" -ForegroundColor Yellow
    $continueAnyway = Read-Host "Continue with deletion anyway? (yes/no)"
    if ($continueAnyway -ne "yes") {
        Write-Host ""
        Write-Host "Reset cancelled." -ForegroundColor Green
        exit 0
    }
}

# Stop and remove everything including volumes
Write-Host ""
Write-Host "[STEP 2] Stopping containers and deleting ALL data..." -ForegroundColor Red
docker-compose down -v

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [DONE] All containers stopped and data volumes deleted" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Failed to stop containers" -ForegroundColor Red
    exit 1
}

# Remove old images
Write-Host ""
Write-Host "[STEP 3] Removing old images..." -ForegroundColor Yellow
docker-compose rm -f 2>&1 | Out-Null
docker image prune -f 2>&1 | Out-Null
Write-Host "   [DONE] Old images removed" -ForegroundColor Green

# Rebuild and start fresh
Write-Host ""
Write-Host "[STEP 4] Building services..." -ForegroundColor Yellow
docker-compose build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [DONE] Services built" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[STEP 5] Starting services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [DONE] Services started" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "           COMPLETE RESET FINISHED                              " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "System reset complete with fresh database" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 30 seconds for services to initialize" -ForegroundColor White
Write-Host "  2. Run: .\test-quick.ps1" -ForegroundColor White
Write-Host "  3. Ingest new traffic data to begin detection" -ForegroundColor White
Write-Host ""
