# Mini Commerce MSA - 로컬 PC 설정 스크립트 (Windows)
# ================================================
# Git 클론 후 로컬 PC에서 바로 실행 가능하도록 설정

Write-Host "🚀 Mini Commerce MSA 로컬 PC 설정" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "[ERROR] 이 스크립트는 관리자 권한으로 실행해야 합니다" -ForegroundColor Red
    exit 1
}

# 1. Check if Docker is installed
Write-Host "[INFO] Docker 설치 확인 중..." -ForegroundColor Blue
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[WARNING] Docker가 설치되지 않았습니다." -ForegroundColor Yellow
    Write-Host "[INFO] Docker Desktop을 설치해주세요: https://www.docker.com/products/docker-desktop/" -ForegroundColor Blue
    Read-Host "Docker Desktop 설치 후 Enter를 눌러주세요"
} else {
    Write-Host "[SUCCESS] Docker가 이미 설치되어 있습니다" -ForegroundColor Green
}

# 2. Check if Node.js is installed
Write-Host "[INFO] Node.js 설치 확인 중..." -ForegroundColor Blue
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[WARNING] Node.js가 설치되지 않았습니다." -ForegroundColor Yellow
    Write-Host "[INFO] Node.js를 설치해주세요: https://nodejs.org/" -ForegroundColor Blue
    Read-Host "Node.js 설치 후 Enter를 눌러주세요"
} else {
    Write-Host "[SUCCESS] Node.js가 이미 설치되어 있습니다" -ForegroundColor Green
}

# 3. Install frontend dependencies
Write-Host "[INFO] 프론트엔드 의존성 설치 중..." -ForegroundColor Blue
if (Test-Path "frontend") {
    Set-Location "frontend"
    if (-not (Test-Path "node_modules")) {
        npm install
        Write-Host "[SUCCESS] 프론트엔드 의존성 설치 완료" -ForegroundColor Green
    } else {
        Write-Host "[SUCCESS] 프론트엔드 의존성이 이미 설치되어 있습니다" -ForegroundColor Green
    }
    Set-Location ".."
} else {
    Write-Host "[WARNING] frontend 디렉토리를 찾을 수 없습니다" -ForegroundColor Yellow
}

# 4. Create environment file
Write-Host "[INFO] 환경 설정 파일 생성 중..." -ForegroundColor Blue
$EnvContent = @"
# Mini Commerce MSA - 로컬 개발 환경
# =================================

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mini_commerce
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Services
AUTH_SERVICE_PORT=3001
CATALOG_SERVICE_PORT=3002
CART_SERVICE_PORT=3003
ORDER_SERVICE_PORT=3004
INVENTORY_SERVICE_PORT=3005
PAYMENT_SERVICE_PORT=3006
NOTIFICATION_SERVICE_PORT=3007
GATEWAY_SERVICE_PORT=8080
FRONTEND_PORT=3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-for-local-development
JWT_EXPIRES_IN=24h

# Development
NODE_ENV=development
LOG_LEVEL=debug
"@

$EnvContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "[SUCCESS] 환경 설정 파일 생성 완료" -ForegroundColor Green

# 5. Create start script
Write-Host "[INFO] 시작 스크립트 생성 중..." -ForegroundColor Blue
$StartScript = @"
# Mini Commerce MSA 로컬 실행
Write-Host "🚀 Mini Commerce MSA 로컬 실행" -ForegroundColor Blue
Write-Host "=============================" -ForegroundColor Blue

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker가 실행되지 않았습니다. Docker Desktop을 시작해주세요." -ForegroundColor Red
    exit 1
}

# Start database
Write-Host "🗄️  데이터베이스 시작 중..." -ForegroundColor Blue
docker-compose -f docker-compose.essentials.yml up -d postgres

# Wait for database
Write-Host "⏳ 데이터베이스 준비 대기 중..." -ForegroundColor Blue
Start-Sleep -Seconds 10

# Start all services
Write-Host "🔧 모든 서비스 시작 중..." -ForegroundColor Blue
docker-compose -f docker-compose.essentials.yml up -d

# Wait for services
Write-Host "⏳ 서비스 준비 대기 중..." -ForegroundColor Blue
Start-Sleep -Seconds 30

# Check status
Write-Host "🔍 서비스 상태 확인 중..." -ForegroundColor Blue
docker-compose -f docker-compose.essentials.yml ps

Write-Host ""
Write-Host "✅ 로컬 실행 완료!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API Gateway: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🗄️  Database: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 로그 확인: docker-compose -f docker-compose.essentials.yml logs -f" -ForegroundColor White
Write-Host "🛑 서비스 중지: docker-compose -f docker-compose.essentials.yml down" -ForegroundColor White
"@

$StartScript | Out-File -FilePath "start-local.ps1" -Encoding UTF8
Write-Host "[SUCCESS] 시작 스크립트 생성 완료" -ForegroundColor Green

# 6. Create stop script
Write-Host "[INFO] 중지 스크립트 생성 중..." -ForegroundColor Blue
$StopScript = @"
# Mini Commerce MSA 서비스 중지
Write-Host "🛑 Mini Commerce MSA 서비스 중지" -ForegroundColor Blue
Write-Host "===============================" -ForegroundColor Blue

docker-compose -f docker-compose.essentials.yml down

Write-Host "✅ 모든 서비스가 중지되었습니다" -ForegroundColor Green
"@

$StopScript | Out-File -FilePath "stop-local.ps1" -Encoding UTF8
Write-Host "[SUCCESS] 중지 스크립트 생성 완료" -ForegroundColor Green

# 7. Create health check script
Write-Host "[INFO] 헬스체크 스크립트 생성 중..." -ForegroundColor Blue
$HealthScript = @"
# Mini Commerce MSA 헬스체크
Write-Host "🔍 Mini Commerce MSA 헬스체크" -ForegroundColor Blue
Write-Host "============================" -ForegroundColor Blue

# Check Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker: $(docker --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Docker: 설치되지 않음" -ForegroundColor Red
}

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "✅ Node.js: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js: 설치되지 않음" -ForegroundColor Red
}

# Check services
Write-Host ""
Write-Host "🔍 서비스 상태:" -ForegroundColor Blue
docker-compose -f docker-compose.essentials.yml ps

Write-Host ""
Write-Host "🌐 접속 테스트:" -ForegroundColor Blue
try {
    Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: 연결 실패" -ForegroundColor Red
}

try {
    Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "✅ API Gateway: http://localhost:8080" -ForegroundColor Green
} catch {
    Write-Host "❌ API Gateway: 연결 실패" -ForegroundColor Red
}
"@

$HealthScript | Out-File -FilePath "health-check.ps1" -Encoding UTF8
Write-Host "[SUCCESS] 헬스체크 스크립트 생성 완료" -ForegroundColor Green

# 8. Create quick start guide
Write-Host "[INFO] 빠른 시작 가이드 생성 중..." -ForegroundColor Blue
$QuickStartGuide = @"
# 🚀 빠른 시작 가이드

## 1. 필수 소프트웨어 설치

### Windows:
```powershell
# 관리자 권한으로 실행
.\install-essentials.ps1
```

## 2. 로컬 환경 설정

```powershell
.\setup-local.ps1
```

## 3. 서비스 실행

```powershell
.\start-local.ps1
```

## 4. 서비스 확인

```powershell
.\health-check.ps1
```

## 5. 접속 URL

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Database**: localhost:5432

## 6. 서비스 중지

```powershell
.\stop-local.ps1
```

## 🔧 문제 해결

### Docker 관련 문제:
```powershell
# Docker Desktop 재시작
# 또는 PowerShell에서:
Restart-Service docker
```

### 포트 충돌 문제:
```powershell
# 사용 중인 포트 확인
netstat -an | findstr :3000
netstat -an | findstr :8080

# 프로세스 종료
taskkill /F /IM node.exe
```

### 데이터베이스 연결 문제:
```powershell
# PostgreSQL 컨테이너 재시작
docker-compose -f docker-compose.essentials.yml restart postgres
```
"@

$QuickStartGuide | Out-File -FilePath "QUICK_START.md" -Encoding UTF8
Write-Host "[SUCCESS] 빠른 시작 가이드 생성 완료" -ForegroundColor Green

# Final message
Write-Host ""
Write-Host "🎉 Mini Commerce MSA 로컬 PC 설정 완료!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 다음 단계:" -ForegroundColor Yellow
Write-Host "1. .\start-local.ps1  # 서비스 시작" -ForegroundColor White
Write-Host "2. .\health-check.ps1 # 상태 확인" -ForegroundColor White
Write-Host "3. http://localhost:3000 # 프론트엔드 접속" -ForegroundColor White
Write-Host ""
Write-Host "📖 자세한 내용은 QUICK_START.md 파일을 참조하세요" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SUCCESS] 설정이 완료되었습니다!" -ForegroundColor Green
