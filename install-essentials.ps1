# Mini Commerce MSA - 필수 소프트웨어 설치 스크립트 (Windows)
# ========================================================
# Docker, Python, Go, Java, Node.js만 설치

param(
    [switch]$SkipDocker,
    [switch]$SkipNode,
    [switch]$SkipPython,
    [switch]$SkipGo,
    [switch]$SkipJava
)

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

Write-Host "🚀 Mini Commerce MSA 필수 소프트웨어 설치" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Error "이 스크립트는 관리자 권한으로 실행해야 합니다"
    exit 1
fi

# Install Chocolatey if not present
Write-Status "Chocolatey 패키지 매니저 확인 중..."
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Status "Chocolatey 설치 중..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Success "Chocolatey 설치 완료"
} else {
    Write-Success "Chocolatey가 이미 설치되어 있습니다"
}

# 1. Install Docker Desktop
if (-not $SkipDocker) {
    Write-Status "Docker Desktop 설치 중..."
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        choco install docker-desktop -y
        Write-Success "Docker Desktop 설치 완료"
        Write-Warning "컴퓨터를 재시작한 후 Docker Desktop을 시작해주세요"
    } else {
        Write-Success "Docker가 이미 설치되어 있습니다"
    }
}

# 2. Install Node.js
if (-not $SkipNode) {
    Write-Status "Node.js 설치 중..."
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        choco install nodejs -y
        Write-Success "Node.js 설치 완료"
    } else {
        Write-Success "Node.js가 이미 설치되어 있습니다"
    }
}

# 3. Install Python
if (-not $SkipPython) {
    Write-Status "Python 설치 중..."
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        choco install python -y
        Write-Success "Python 설치 완료"
    } else {
        Write-Success "Python이 이미 설치되어 있습니다"
    }
}

# 4. Install Go
if (-not $SkipGo) {
    Write-Status "Go 설치 중..."
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
        choco install golang -y
        Write-Success "Go 설치 완료"
    } else {
        Write-Success "Go가 이미 설치되어 있습니다"
    }
}

# 5. Install Java
if (-not $SkipJava) {
    Write-Status "Java 설치 중..."
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
        choco install openjdk17 -y
        Write-Success "Java 설치 완료"
    } else {
        Write-Success "Java가 이미 설치되어 있습니다"
    }
}

# Create health check script
Write-Status "헬스체크 스크립트 생성 중..."
$HealthCheckScript = @"
# Mini Commerce MSA 필수 소프트웨어 체크
Write-Host "🔍 Mini Commerce MSA 필수 소프트웨어 체크" -ForegroundColor Blue
Write-Host "=======================================" -ForegroundColor Blue

# Check Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker: $(docker --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Docker: 설치되지 않음" -ForegroundColor Red
}

# Check Docker Compose
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker Compose: $(docker-compose --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Docker Compose: 설치되지 않음" -ForegroundColor Red
}

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "✅ Node.js: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js: 설치되지 않음" -ForegroundColor Red
}

# Check Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "✅ Python: $(python --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Python: 설치되지 않음" -ForegroundColor Red
}

# Check Go
if (Get-Command go -ErrorAction SilentlyContinue) {
    Write-Host "✅ Go: $(go version)" -ForegroundColor Green
} else {
    Write-Host "❌ Go: 설치되지 않음" -ForegroundColor Red
}

# Check Java
if (Get-Command java -ErrorAction SilentlyContinue) {
    Write-Host "✅ Java: $(java -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
} else {
    Write-Host "❌ Java: 설치되지 않음" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 필수 소프트웨어 체크 완료!" -ForegroundColor Green
"@

$HealthCheckScript | Out-File -FilePath "health-check.ps1" -Encoding UTF8
Write-Success "헬스체크 스크립트 생성 완료"

# Final message
Write-Host ""
Write-Host "🎉 필수 소프트웨어 설치 완료!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 설치 확인: .\health-check.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  중요: 모든 변경사항을 적용하려면 컴퓨터를 재시작해주세요." -ForegroundColor Yellow
Write-Host ""
Write-Success "설치가 성공적으로 완료되었습니다!"
