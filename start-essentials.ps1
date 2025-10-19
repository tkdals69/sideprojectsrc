# Mini Commerce MSA - 필수 서비스 시작 스크립트 (Windows)
# ===================================================
# 필수 소프트웨어로 구동되는 핵심 서비스들만 실행

Write-Host "🚀 Mini Commerce MSA 필수 서비스 시작" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue

# Check if docker-compose.essentials.yml exists
if (-not (Test-Path "docker-compose.essentials.yml")) {
    Write-Host "[WARNING] docker-compose.essentials.yml 파일이 없습니다!" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "[WARNING] Docker가 실행되지 않았습니다. Docker Desktop을 시작해주세요." -ForegroundColor Yellow
    exit 1
}

# Stop existing containers
Write-Host "[INFO] 기존 컨테이너 중지 중..." -ForegroundColor Blue
docker-compose -f docker-compose.essentials.yml down

# Build and start services
Write-Host "[INFO] 서비스 빌드 및 시작 중..." -ForegroundColor Blue
docker-compose -f docker-compose.essentials.yml up --build -d

# Wait for services to be ready
Write-Host "[INFO] 서비스 준비 대기 중..." -ForegroundColor Blue
Start-Sleep -Seconds 30

# Check service health
Write-Host "[INFO] 서비스 상태 확인 중..." -ForegroundColor Blue
docker-compose -f docker-compose.essentials.yml ps

# Display access information
Write-Host ""
Write-Host "[SUCCESS] 필수 서비스 시작 완료!" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API Gateway: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🔐 Auth Service: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📦 Catalog Service: http://localhost:3002" -ForegroundColor Cyan
Write-Host "🛒 Cart Service: http://localhost:3003" -ForegroundColor Cyan
Write-Host "📋 Order Service: http://localhost:3004" -ForegroundColor Cyan
Write-Host "📊 Inventory Service: http://localhost:3005" -ForegroundColor Cyan
Write-Host "💳 Payment Service: http://localhost:3006" -ForegroundColor Cyan
Write-Host "🔔 Notification Service: http://localhost:3007" -ForegroundColor Cyan
Write-Host "🗄️  Database: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 로그 확인: docker-compose -f docker-compose.essentials.yml logs -f" -ForegroundColor White
Write-Host "🛑 서비스 중지: docker-compose -f docker-compose.essentials.yml down" -ForegroundColor White
Write-Host ""
