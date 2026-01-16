# AWS WAF Integration Setup Script for DefenDDoS
# Run this script to set up AWS WAF integration

Write-Host "🔧 DefenDDoS - AWS WAF Integration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
$awsInstalled = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awsInstalled) {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first:" -ForegroundColor Red
    Write-Host "   https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ AWS CLI found" -ForegroundColor Green
Write-Host ""

# Prompt for AWS credentials
Write-Host "📋 Enter your AWS credentials:" -ForegroundColor Cyan
Write-Host "   (You created these in AWS Console > IAM > Users > defenddos-waf-user > Access keys)" -ForegroundColor Gray
Write-Host ""

$accessKeyId = Read-Host "AWS Access Key ID"
$secretAccessKey = Read-Host "AWS Secret Access Key" -AsSecureString
$secretAccessKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretAccessKey))

# Prompt for region
Write-Host ""
Write-Host "🌍 Select AWS Region:" -ForegroundColor Cyan
Write-Host "   1. us-east-1 (Global CloudFront)" -ForegroundColor Yellow
Write-Host "   2. us-west-2 (Regional)" -ForegroundColor Yellow
Write-Host "   3. eu-west-1 (Regional)" -ForegroundColor Yellow
$regionChoice = Read-Host "Enter choice (1-3)"

switch ($regionChoice) {
    "1" { $region = "us-east-1"; $scope = "CLOUDFRONT" }
    "2" { $region = "us-west-2"; $scope = "REGIONAL" }
    "3" { $region = "eu-west-1"; $scope = "REGIONAL" }
    default { $region = "us-east-1"; $scope = "CLOUDFRONT" }
}

Write-Host ""
Write-Host "📦 Creating AWS WAF IP Set..." -ForegroundColor Cyan

# Create IP Set using AWS CLI
$env:AWS_ACCESS_KEY_ID = $accessKeyId
$env:AWS_SECRET_ACCESS_KEY = $secretAccessKeyPlain
$env:AWS_DEFAULT_REGION = $region

$createResult = aws wafv2 create-ip-set `
    --name DefenDDoS-Blocklist `
    --scope $scope `
    --ip-address-version IPV4 `
    --addresses "[]" `
    --description "Blocked IPs from DefenDDoS ML system" `
    --output json 2>&1

if ($LASTEXITCODE -eq 0) {
    $ipSetData = $createResult | ConvertFrom-Json
    $ipSetId = $ipSetData.Summary.Id
    $ipSetArn = $ipSetData.Summary.ARN
    
    Write-Host "✅ IP Set created successfully!" -ForegroundColor Green
    Write-Host "   IP Set ID: $ipSetId" -ForegroundColor Gray
    Write-Host "   ARN: $ipSetArn" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to create IP Set:" -ForegroundColor Red
    Write-Host $createResult -ForegroundColor Red
    exit 1
}

# Create .env file
Write-Host ""
Write-Host "📝 Creating .env file..." -ForegroundColor Cyan

$envContent = @"
# AWS WAF Integration Credentials
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

AWS_ACCESS_KEY_ID=$accessKeyId
AWS_SECRET_ACCESS_KEY=$secretAccessKeyPlain
AWS_WAF_IPSET_ID=$ipSetArn
AWS_REGION=$region
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8
Write-Host "✅ .env file created" -ForegroundColor Green

# Update application.properties
Write-Host ""
Write-Host "📝 Updating application.properties..." -ForegroundColor Cyan

$propsPath = "src\main\resources\application.properties"
$propsContent = Get-Content $propsPath -Raw

if ($propsContent -match "aws\.waf\.enabled=false") {
    $propsContent = $propsContent -replace "aws\.waf\.enabled=false", "aws.waf.enabled=true"
    $propsContent | Out-File -FilePath $propsPath -Encoding utf8 -NoNewline
    Write-Host "✅ AWS WAF enabled in application.properties" -ForegroundColor Green
} else {
    Write-Host "⚠️  Please manually enable AWS WAF in application.properties:" -ForegroundColor Yellow
    Write-Host "   Set aws.waf.enabled=true" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review .env file for your credentials" -ForegroundColor Yellow
Write-Host "   2. Build the project: .\mvnw clean package" -ForegroundColor Yellow
Write-Host "   3. Run the backend: java -jar target\backend-service-0.0.1-SNAPSHOT.jar" -ForegroundColor Yellow
Write-Host "   4. Test AWS WAF integration: .\test-aws-waf.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  SECURITY WARNING:" -ForegroundColor Red
Write-Host "   - Never commit .env file to version control" -ForegroundColor Yellow
Write-Host "   - Add .env to .gitignore" -ForegroundColor Yellow
Write-Host "   - Use AWS IAM roles in production" -ForegroundColor Yellow
Write-Host ""
