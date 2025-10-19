#!/bin/bash

# Mini Commerce MSA - 필수 소프트웨어 설치 스크립트
# ================================================
# Docker, Python, Go, Java, Node.js만 설치

set -e

echo "🚀 Mini Commerce MSA 필수 소프트웨어 설치"
echo "========================================"

# Color codes
RED='\033[0;31m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "이 스크립트는 root로 실행하지 마세요"
   exit 1
fi

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
        OS="debian"
    elif [ -f /etc/redhat-release ]; then
        OS="redhat"
    else
        OS="linux"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    print_error "지원하지 않는 운영체제: $OSTYPE"
    exit 1
fi

print_status "감지된 OS: $OS"

# Update system packages
print_status "시스템 패키지 업데이트 중..."
if [[ "$OS" == "debian" ]]; then
    sudo apt-get update
elif [[ "$OS" == "redhat" ]]; then
    sudo yum update -y
fi

# 1. Install Docker
print_status "Docker 설치 중..."
if ! command -v docker &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        # Remove old versions
        sudo apt-get remove -y docker docker-engine docker.io containerd runc
        
        # Install prerequisites
        sudo apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker's official GPG key
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        # Set up repository
        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
            $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif [[ "$OS" == "macos" ]]; then
        print_warning "macOS에서는 Docker Desktop을 수동으로 설치해주세요: https://www.docker.com/products/docker-desktop/"
        read -p "Docker Desktop 설치 후 Enter를 눌러주세요..."
    fi
    
    # Start and enable Docker
    if [[ "$OS" != "macos" ]]; then
        sudo systemctl start docker
        sudo systemctl enable docker
        
        # Add user to docker group
        sudo usermod -aG docker $USER
    fi
    
    print_success "Docker 설치 완료"
else
    print_success "Docker가 이미 설치되어 있습니다"
fi

# 2. Install Node.js
print_status "Node.js 설치 중..."
if ! command -v node &> /dev/null; then
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            print_warning "Homebrew를 먼저 설치해주세요: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    fi
    print_success "Node.js 설치 완료"
else
    print_success "Node.js가 이미 설치되어 있습니다"
fi

# 3. Install Python
print_status "Python 설치 중..."
if ! command -v python3 &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y python3 python3-pip python3-venv
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y python3 python3-pip
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install python
        else
            print_warning "Homebrew를 먼저 설치해주세요"
            exit 1
        fi
    fi
    print_success "Python 설치 완료"
else
    print_success "Python이 이미 설치되어 있습니다"
fi

# 4. Install Go
print_status "Go 설치 중..."
if ! command -v go &> /dev/null; then
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]]; then
        wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
        sudo rm -rf /usr/local/go
        sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
        rm go1.21.0.linux-amd64.tar.gz
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        source ~/.bashrc
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install go
        else
            print_warning "Homebrew를 먼저 설치해주세요"
            exit 1
        fi
    fi
    print_success "Go 설치 완료"
else
    print_success "Go가 이미 설치되어 있습니다"
fi

# 5. Install Java
print_status "Java 설치 중..."
if ! command -v java &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y openjdk-17-jdk
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y java-17-openjdk-devel
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install openjdk@17
        else
            print_warning "Homebrew를 먼저 설치해주세요"
            exit 1
        fi
    fi
    print_success "Java 설치 완료"
else
    print_success "Java가 이미 설치되어 있습니다"
fi

# Create health check script
print_status "헬스체크 스크립트 생성 중..."
cat > health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 Mini Commerce MSA 필수 소프트웨어 체크"
echo "======================================="

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
else
    echo "❌ Docker: 설치되지 않음"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose: $(docker-compose --version)"
else
    echo "❌ Docker Compose: 설치되지 않음"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: 설치되지 않음"
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
else
    echo "❌ Python: 설치되지 않음"
fi

# Check Go
if command -v go &> /dev/null; then
    echo "✅ Go: $(go version)"
else
    echo "❌ Go: 설치되지 않음"
fi

# Check Java
if command -v java &> /dev/null; then
    echo "✅ Java: $(java -version 2>&1 | head -n 1)"
else
    echo "❌ Java: 설치되지 않음"
fi

echo ""
echo "🎉 필수 소프트웨어 체크 완료!"
EOF

chmod +x health-check.sh
print_success "헬스체크 스크립트 생성 완료"

# Final message
echo ""
echo "🎉 필수 소프트웨어 설치 완료!"
echo "============================="
echo ""
echo "🔍 설치 확인: ./health-check.sh"
echo ""
echo "⚠️  중요: Docker 그룹 변경사항을 적용하려면 로그아웃 후 다시 로그인하세요."
echo ""
print_success "설치가 성공적으로 완료되었습니다!"
