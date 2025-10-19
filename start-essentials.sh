#!/bin/bash

# Mini Commerce MSA - 필수 서비스 시작 스크립트
# ===========================================
# 필수 소프트웨어로 구동되는 핵심 서비스들만 실행

echo "🚀 Mini Commerce MSA 필수 서비스 시작"
echo "===================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if docker-compose.essentials.yml exists
if [ ! -f "docker-compose.essentials.yml" ]; then
    print_warning "docker-compose.essentials.yml 파일이 없습니다!"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_warning "Docker가 실행되지 않았습니다. Docker를 시작해주세요."
    exit 1
fi

# Stop existing containers
print_status "기존 컨테이너 중지 중..."
docker-compose -f docker-compose.essentials.yml down

# Build and start services
print_status "서비스 빌드 및 시작 중..."
docker-compose -f docker-compose.essentials.yml up --build -d

# Wait for services to be ready
print_status "서비스 준비 대기 중..."
sleep 30

# Check service health
print_status "서비스 상태 확인 중..."
docker-compose -f docker-compose.essentials.yml ps

# Display access information
echo ""
print_success "필수 서비스 시작 완료!"
echo "=========================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API Gateway: http://localhost:8080"
echo "🔐 Auth Service: http://localhost:3001"
echo "📦 Catalog Service: http://localhost:3002"
echo "🛒 Cart Service: http://localhost:3003"
echo "📋 Order Service: http://localhost:3004"
echo "📊 Inventory Service: http://localhost:3005"
echo "💳 Payment Service: http://localhost:3006"
echo "🔔 Notification Service: http://localhost:3007"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📝 로그 확인: docker-compose -f docker-compose.essentials.yml logs -f"
echo "🛑 서비스 중지: docker-compose -f docker-compose.essentials.yml down"
echo ""
