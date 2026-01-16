# Load environment variables from .env file
# Usage: .\load-env.ps1

Write-Host "🔐 Loading DefenDDoS Environment Variables" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file in the backend-service directory" -ForegroundColor Yellow
    exit 1
}

$loadedCount = 0
Get-Content $envFile | ForEach-Object {
    # Skip comments and empty lines
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
        return
    }
    
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Set environment variable for current process
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        
        Write-Host "✅ Loaded: $name" -ForegroundColor Green
        $loadedCount++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Environment variables loaded! ($loadedCount variables)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now run: " -NoNewline -ForegroundColor Yellow
Write-Host ".\mvnw.cmd spring-boot:run" -ForegroundColor White
Write-Host ""
