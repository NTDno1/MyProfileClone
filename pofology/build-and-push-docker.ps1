# Script to build and push Docker image to DockerHub
param(
    [Parameter(Mandatory=$true)]
    [string]$DockerHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$ImageName = "pofology",
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest"
)

$ImageTag = "${DockerHubUsername}/${ImageName}:${Tag}"
$FullImageName = "${DockerHubUsername}/${ImageName}"

Write-Host "🐳 Building Docker image: $ImageTag" -ForegroundColor Yellow

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first!" -ForegroundColor Red
    exit 1
}

# Build image
Write-Host "`n📦 Building image..." -ForegroundColor Cyan
docker build -t $ImageTag .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Tag as latest
Write-Host "`n🏷️  Tagging image..." -ForegroundColor Cyan
docker tag $ImageTag "${FullImageName}:latest"

# Login to DockerHub
Write-Host "`n🔐 Please login to DockerHub..." -ForegroundColor Yellow
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker login failed!" -ForegroundColor Red
    exit 1
}

# Push image
Write-Host "`n📤 Pushing image to DockerHub..." -ForegroundColor Cyan
docker push $ImageTag
docker push "${FullImageName}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Successfully pushed to DockerHub!" -ForegroundColor Green
Write-Host "   Image: $ImageTag" -ForegroundColor Cyan
$LatestTag = "$FullImageName:latest"
Write-Host "   Latest: $LatestTag" -ForegroundColor Cyan

