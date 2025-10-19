#!/bin/bash

# Mini Commerce MSA - 로컬 PC 설정 스크립트
# =========================================
# Git 클론 후 로컬 PC에서 바로 실행 가능하도록 설정

set -e

echo "🚀 Mini Commerce MSA 로컬 PC 설정"
echo "================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "이 스크립트는 root로 실행하지 마세요"
   exit 1
fi

# 1. Check if Docker is installed
print_status "Docker 설치 확인 중..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker가 설치되지 않았습니다."
    print_status "Docker 설치를 진행합니다..."
    
    # Install Docker
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            # Ubuntu/Debian
            sudo apt-get update
            sudo apt-get install -y docker.io docker-compose
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker $USER
        elif [ -f /etc/redhat-release ]; then
            # CentOS/RHEL
            sudo yum install -y docker docker-compose
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker $USER
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_warning "macOS에서는 Docker Desktop을 수동으로 설치해주세요: https://www.docker.com/products/docker-desktop/"
        read -p "Docker Desktop 설치 후 Enter를 눌러주세요..."
    fi
else
    print_success "Docker가 이미 설치되어 있습니다"
fi

# 2. Check if Node.js is installed
print_status "Node.js 설치 확인 중..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js가 설치되지 않았습니다."
    print_status "Node.js 설치를 진행합니다..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            print_warning "Homebrew를 먼저 설치해주세요"
            exit 1
        fi
    fi
else
    print_success "Node.js가 이미 설치되어 있습니다"
fi

# 3. Install frontend dependencies
print_status "프론트엔드 의존성 설치 중..."
if [ -d "frontend" ]; then
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "프론트엔드 의존성 설치 완료"
    else
        print_success "프론트엔드 의존성이 이미 설치되어 있습니다"
    fi
    cd ..
else
    print_warning "frontend 디렉토리를 찾을 수 없습니다"
fi

# 4. Create environment file
print_status "환경 설정 파일 생성 중..."
cat > .env << 'EOF'
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
EOF

print_success "환경 설정 파일 생성 완료"

# 5. Create start script
print_status "시작 스크립트 생성 중..."
cat > start-local.sh << 'EOF'
#!/bin/bash

echo "🚀 Mini Commerce MSA 로컬 실행"
echo "============================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker가 실행되지 않았습니다. Docker를 시작해주세요."
    exit 1
fi

# Start database
echo "🗄️  데이터베이스 시작 중..."
docker-compose -f docker-compose.essentials.yml up -d postgres

# Wait for database
echo "⏳ 데이터베이스 준비 대기 중..."
sleep 10

# Start all services
echo "🔧 모든 서비스 시작 중..."
docker-compose -f docker-compose.essentials.yml up -d

# Wait for services
echo "⏳ 서비스 준비 대기 중..."
sleep 30

# Check status
echo "🔍 서비스 상태 확인 중..."
docker-compose -f docker-compose.essentials.yml ps

echo ""
echo "✅ 로컬 실행 완료!"
echo "=================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API Gateway: http://localhost:8080"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📝 로그 확인: docker-compose -f docker-compose.essentials.yml logs -f"
echo "🛑 서비스 중지: docker-compose -f docker-compose.essentials.yml down"
EOF

chmod +x start-local.sh
print_success "시작 스크립트 생성 완료"

# 6. Create stop script
print_status "중지 스크립트 생성 중..."
cat > stop-local.sh << 'EOF'
#!/bin/bash

echo "🛑 Mini Commerce MSA 서비스 중지"
echo "==============================="

docker-compose -f docker-compose.essentials.yml down

echo "✅ 모든 서비스가 중지되었습니다"
EOF

chmod +x stop-local.sh
print_success "중지 스크립트 생성 완료"

# 7. Create health check script
print_status "헬스체크 스크립트 생성 중..."
cat > health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 Mini Commerce MSA 헬스체크"
echo "============================"

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
else
    echo "❌ Docker: 설치되지 않음"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: 설치되지 않음"
fi

# Check services
echo ""
echo "🔍 서비스 상태:"
docker-compose -f docker-compose.essentials.yml ps

echo ""
echo "🌐 접속 테스트:"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend: http://localhost:3000" || echo "❌ Frontend: 연결 실패"
curl -s http://localhost:8080/health > /dev/null && echo "✅ API Gateway: http://localhost:8080" || echo "❌ API Gateway: 연결 실패"
EOF

chmod +x health-check.sh
print_success "헬스체크 스크립트 생성 완료"

# 8. Create quick start guide
print_status "빠른 시작 가이드 생성 중..."
cat > QUICK_START.md << 'EOF'
# 🚀 빠른 시작 가이드

## 1. 필수 소프트웨어 설치

### Windows:
```powershell
# 관리자 권한으로 실행
.\install-essentials.ps1
```

### Linux/macOS:
```bash
chmod +x install-essentials.sh
./install-essentials.sh
```

## 2. 로컬 환경 설정

```bash
chmod +x setup-local.sh
./setup-local.sh
```

## 3. 서비스 실행

```bash
./start-local.sh
```

## 4. 서비스 확인

```bash
./health-check.sh
```

## 5. 접속 URL

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Database**: localhost:5432

## 6. 서비스 중지

```bash
./stop-local.sh
```

## 🔧 문제 해결

### Docker 관련 문제:
```bash
# Docker 서비스 시작
sudo systemctl start docker

# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER
# 로그아웃 후 다시 로그인 필요
```

### 포트 충돌 문제:
```bash
# 사용 중인 포트 확인
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080

# 프로세스 종료
sudo kill -9 <PID>
```

### 데이터베이스 연결 문제:
```bash
# PostgreSQL 컨테이너 재시작
docker-compose -f docker-compose.essentials.yml restart postgres
```
EOF

print_success "빠른 시작 가이드 생성 완료"

# Final message
echo ""
echo "🎉 Mini Commerce MSA 로컬 PC 설정 완료!"
echo "====================================="
echo ""
echo "📋 다음 단계:"
echo "1. ./start-local.sh  # 서비스 시작"
echo "2. ./health-check.sh # 상태 확인"
echo "3. http://localhost:3000 # 프론트엔드 접속"
echo ""
echo "📖 자세한 내용은 QUICK_START.md 파일을 참조하세요"
echo ""
print_success "설정이 완료되었습니다!"
