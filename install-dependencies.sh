#!/bin/bash

# Mini Commerce MSA - Production Environment Setup Script
# ======================================================
# This script installs all required dependencies for production deployment

set -e  # Exit on any error

echo "🚀 Starting Mini Commerce MSA Production Environment Setup..."
echo "=============================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
   print_error "This script should not be run as root for security reasons"
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
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

print_status "Detected OS: $OS"

# Update system packages
print_status "Updating system packages..."
if [[ "$OS" == "debian" ]]; then
    sudo apt-get update
    sudo apt-get upgrade -y
elif [[ "$OS" == "redhat" ]]; then
    sudo yum update -y
elif [[ "$OS" == "macos" ]]; then
    # macOS doesn't need system update here
    print_status "Skipping system update on macOS"
fi

# Install Docker
print_status "Installing Docker..."
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
        print_warning "Please install Docker Desktop for macOS from https://www.docker.com/products/docker-desktop/"
        read -p "Press Enter after installing Docker Desktop..."
    fi
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
else
    print_success "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]]; then
        # Docker Compose is included with Docker CE on newer versions
        print_success "Docker Compose is included with Docker CE"
    elif [[ "$OS" == "macos" ]]; then
        print_success "Docker Compose is included with Docker Desktop"
    fi
else
    print_success "Docker Compose is already installed"
fi

# Install Node.js
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            print_warning "Please install Homebrew first: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    fi
    print_success "Node.js installed successfully"
else
    print_success "Node.js is already installed"
fi

# Install Python
print_status "Installing Python..."
if ! command -v python3 &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y python3 python3-pip python3-venv
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y python3 python3-pip
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install python
        else
            print_warning "Please install Homebrew first"
            exit 1
        fi
    fi
    print_success "Python installed successfully"
else
    print_success "Python is already installed"
fi

# Install Go
print_status "Installing Go..."
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
            print_warning "Please install Homebrew first"
            exit 1
        fi
    fi
    print_success "Go installed successfully"
else
    print_success "Go is already installed"
fi

# Install Java
print_status "Installing Java..."
if ! command -v java &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y openjdk-17-jdk
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y java-17-openjdk-devel
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install openjdk@17
        else
            print_warning "Please install Homebrew first"
            exit 1
        fi
    fi
    print_success "Java installed successfully"
else
    print_success "Java is already installed"
fi

# Install Maven
print_status "Installing Maven..."
if ! command -v mvn &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y maven
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y maven
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install maven
        else
            print_warning "Please install Homebrew first"
            exit 1
        fi
    fi
    print_success "Maven installed successfully"
else
    print_success "Maven is already installed"
fi

# Install PostgreSQL
print_status "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y postgresql postgresql-contrib
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y postgresql-server postgresql-contrib
        sudo postgresql-setup initdb
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql
        else
            print_warning "Please install Homebrew first"
            exit 1
        fi
    fi
    
    # Start PostgreSQL
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]]; then
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    elif [[ "$OS" == "macos" ]]; then
        brew services start postgresql
    fi
    print_success "PostgreSQL installed successfully"
else
    print_success "PostgreSQL is already installed"
fi

# Install Redis (Optional)
print_status "Installing Redis..."
if ! command -v redis-server &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y redis-server
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y redis
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install redis
        else
            print_warning "Please install Homebrew first"
            exit 1
        fi
    fi
    print_success "Redis installed successfully"
else
    print_success "Redis is already installed"
fi

# Install Nginx
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y nginx
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y nginx
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install nginx
        else
            print_warning "Please install Homebrew first"
            exit 1
        fi
    fi
    print_success "Nginx installed successfully"
else
    print_success "Nginx is already installed"
fi

# Install kubectl
print_status "Installing kubectl..."
if ! command -v kubectl &> /dev/null; then
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]]; then
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
        rm kubectl
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install kubectl
        else
            print_warning "Please install Homebrew first"
            exit 1
        fi
    fi
    print_success "kubectl installed successfully"
else
    print_success "kubectl is already installed"
fi

# Install Helm
print_status "Installing Helm..."
if ! command -v helm &> /dev/null; then
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    print_success "Helm installed successfully"
else
    print_success "Helm is already installed"
fi

# Install additional tools
print_status "Installing additional tools..."
if [[ "$OS" == "debian" ]]; then
    sudo apt-get install -y git curl wget jq
elif [[ "$OS" == "redhat" ]]; then
    sudo yum install -y git curl wget jq
elif [[ "$OS" == "macos" ]]; then
    if command -v brew &> /dev/null; then
        brew install git curl wget jq yq
    else
        print_warning "Please install Homebrew first"
        exit 1
    fi
fi

# Create project directory
print_status "Setting up project directory..."
PROJECT_DIR="$HOME/mini-commerce-msa"
if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p "$PROJECT_DIR"
    print_success "Project directory created: $PROJECT_DIR"
else
    print_success "Project directory already exists: $PROJECT_DIR"
fi

# Set up environment variables
print_status "Setting up environment variables..."
cat >> ~/.bashrc << 'EOF'

# Mini Commerce MSA Environment Variables
export MINI_COMMERCE_HOME="$HOME/mini-commerce-msa"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Go environment
export GOPATH="$HOME/go"
export PATH="$PATH:$GOPATH/bin"

# Java environment
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export PATH="$PATH:$JAVA_HOME/bin"
EOF

source ~/.bashrc

# Create systemd services for monitoring
print_status "Setting up systemd services..."
if [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]]; then
    # Create monitoring service
    sudo tee /etc/systemd/system/mini-commerce-monitor.service > /dev/null << 'EOF'
[Unit]
Description=Mini Commerce MSA Monitoring
After=network.target

[Service]
Type=simple
User=root
ExecStart=/bin/bash -c 'while true; do docker ps | grep mini-commerce; sleep 30; done'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable mini-commerce-monitor.service
    print_success "Monitoring service configured"
fi

# Create health check script
print_status "Creating health check script..."
cat > "$PROJECT_DIR/health-check.sh" << 'EOF'
#!/bin/bash

echo "🔍 Mini Commerce MSA Health Check"
echo "=================================="

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
else
    echo "❌ Docker: Not installed"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose: $(docker-compose --version)"
else
    echo "❌ Docker Compose: Not installed"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: Not installed"
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
else
    echo "❌ Python: Not installed"
fi

# Check Go
if command -v go &> /dev/null; then
    echo "✅ Go: $(go version)"
else
    echo "❌ Go: Not installed"
fi

# Check Java
if command -v java &> /dev/null; then
    echo "✅ Java: $(java -version 2>&1 | head -n 1)"
else
    echo "❌ Java: Not installed"
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL: $(psql --version)"
else
    echo "❌ PostgreSQL: Not installed"
fi

# Check Redis
if command -v redis-server &> /dev/null; then
    echo "✅ Redis: $(redis-server --version)"
else
    echo "❌ Redis: Not installed"
fi

# Check Nginx
if command -v nginx &> /dev/null; then
    echo "✅ Nginx: $(nginx -v 2>&1)"
else
    echo "❌ Nginx: Not installed"
fi

# Check kubectl
if command -v kubectl &> /dev/null; then
    echo "✅ kubectl: $(kubectl version --client --short 2>/dev/null || echo 'Installed')"
else
    echo "❌ kubectl: Not installed"
fi

# Check Helm
if command -v helm &> /dev/null; then
    echo "✅ Helm: $(helm version --short)"
else
    echo "❌ Helm: Not installed"
fi

echo ""
echo "🎉 Health check completed!"
EOF

chmod +x "$PROJECT_DIR/health-check.sh"
print_success "Health check script created"

# Create deployment script
print_status "Creating deployment script..."
cat > "$PROJECT_DIR/deploy.sh" << 'EOF'
#!/bin/bash

echo "🚀 Deploying Mini Commerce MSA..."
echo "================================="

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found!"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API Gateway: http://localhost:8080"
echo "📊 Monitoring: http://localhost:3001"
EOF

chmod +x "$PROJECT_DIR/deploy.sh"
print_success "Deployment script created"

# Final setup
print_status "Final setup..."

# Create .env file template
cat > "$PROJECT_DIR/.env.example" << 'EOF'
# Mini Commerce MSA Environment Variables
# ======================================

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mini_commerce
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

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
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
LOKI_PORT=3100
TEMPO_PORT=3200
KIALI_PORT=20001

# CI/CD
JENKINS_PORT=8080
ARGOCD_PORT=8080
EOF

print_success "Environment template created"

# Create README
cat > "$PROJECT_DIR/README.md" << 'EOF'
# Mini Commerce MSA

A complete microservices-based e-commerce application with Istio service mesh.

## Quick Start

1. Run health check:
   ```bash
   ./health-check.sh
   ```

2. Deploy the application:
   ```bash
   ./deploy.sh
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080
   - Monitoring: http://localhost:3001

## Services

- **Frontend**: React + TypeScript + Tailwind CSS
- **API Gateway**: Node.js + Express
- **Auth Service**: Node.js + JWT
- **Catalog Service**: Python + FastAPI
- **Cart Service**: Go + Gin
- **Order Service**: Java + Spring Boot
- **Inventory Service**: Go + Gin
- **Payment Service**: Node.js + Express
- **Notification Service**: Python + FastAPI

## Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards
- **Loki**: Log aggregation
- **Tempo**: Distributed tracing
- **Kiali**: Service mesh visualization

## Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production

For production deployment, see the Kubernetes manifests in the `k8s/` directory.
EOF

print_success "README created"

# Final message
echo ""
echo "🎉 Mini Commerce MSA Production Environment Setup Complete!"
echo "============================================================"
echo ""
echo "📁 Project directory: $PROJECT_DIR"
echo "🔍 Health check: $PROJECT_DIR/health-check.sh"
echo "🚀 Deploy: $PROJECT_DIR/deploy.sh"
echo ""
echo "Next steps:"
echo "1. Run health check: $PROJECT_DIR/health-check.sh"
echo "2. Copy your project files to $PROJECT_DIR"
echo "3. Run deployment: $PROJECT_DIR/deploy.sh"
echo ""
echo "⚠️  Important: Please log out and log back in to apply group changes for Docker access."
echo ""
print_success "Setup completed successfully!"
