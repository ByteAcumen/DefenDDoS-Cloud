# Install Frontend Testing Dependencies
# Run this script to install all testing frameworks for the frontend

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  DefenDDoS Frontend Testing Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Change to frontend directory
Set-Location -Path "defenddos-frontend"

Write-Host "📦 Installing testing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install dependencies
pnpm install

Write-Host ""
Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Install Cypress binary
Write-Host "🌲 Installing Cypress binary..." -ForegroundColor Yellow
pnpm exec cypress install

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available Commands:" -ForegroundColor Yellow
Write-Host "  pnpm test           - Run Jest unit tests in watch mode"
Write-Host "  pnpm test:ci        - Run tests with coverage"
Write-Host "  pnpm test:e2e       - Run Cypress E2E tests"
Write-Host "  pnpm test:e2e:open  - Open Cypress interactive mode"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start the dev server: pnpm dev"
Write-Host "  2. Run unit tests: pnpm test"
Write-Host "  3. Run E2E tests: pnpm test:e2e:open"
Write-Host ""
