# Mini Commerce MSA - Windows Production Environment Setup Script
# ===============================================================
# This script installs all required dependencies for production deployment on Windows

param(
    [switch]$SkipDocker,
    [switch]$SkipNode,
    [switch]$SkipPython,
    [switch]$SkipGo,
    [switch]$SkipJava,
    [switch]$SkipDatabase,
    [switch]$SkipMonitoring
)

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

Write-Host "🚀 Starting Mini Commerce MSA Production Environment Setup..." -ForegroundColor Blue
Write-Host "==============================================================" -ForegroundColor Blue

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
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Install Chocolatey if not present
Write-Status "Checking Chocolatey package manager..."
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Status "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Success "Chocolatey installed successfully"
} else {
    Write-Success "Chocolatey is already installed"
}

# Install Git
Write-Status "Installing Git..."
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    choco install git -y
    Write-Success "Git installed successfully"
} else {
    Write-Success "Git is already installed"
}

# Install Docker Desktop
if (-not $SkipDocker) {
    Write-Status "Installing Docker Desktop..."
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        choco install docker-desktop -y
        Write-Success "Docker Desktop installed successfully"
        Write-Warning "Please restart your computer after installation and start Docker Desktop"
    } else {
        Write-Success "Docker is already installed"
    }
}

# Install Node.js
if (-not $SkipNode) {
    Write-Status "Installing Node.js..."
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        choco install nodejs -y
        Write-Success "Node.js installed successfully"
    } else {
        Write-Success "Node.js is already installed"
    }
}

# Install Python
if (-not $SkipPython) {
    Write-Status "Installing Python..."
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        choco install python -y
        Write-Success "Python installed successfully"
    } else {
        Write-Success "Python is already installed"
    }
}

# Install Go
if (-not $SkipGo) {
    Write-Status "Installing Go..."
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
        choco install golang -y
        Write-Success "Go installed successfully"
    } else {
        Write-Success "Go is already installed"
    }
}

# Install Java
if (-not $SkipJava) {
    Write-Status "Installing Java..."
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
        choco install openjdk17 -y
        Write-Success "Java installed successfully"
    } else {
        Write-Success "Java is already installed"
    }
}

# Install Maven
Write-Status "Installing Maven..."
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    choco install maven -y
    Write-Success "Maven installed successfully"
} else {
    Write-Success "Maven is already installed"
}

# Install PostgreSQL
if (-not $SkipDatabase) {
    Write-Status "Installing PostgreSQL..."
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        choco install postgresql -y
        Write-Success "PostgreSQL installed successfully"
    } else {
        Write-Success "PostgreSQL is already installed"
    }
}

# Install Redis
Write-Status "Installing Redis..."
if (-not (Get-Command redis-server -ErrorAction SilentlyContinue)) {
    choco install redis-64 -y
    Write-Success "Redis installed successfully"
} else {
    Write-Success "Redis is already installed"
}

# Install Nginx
Write-Status "Installing Nginx..."
if (-not (Get-Command nginx -ErrorAction SilentlyContinue)) {
    choco install nginx -y
    Write-Success "Nginx installed successfully"
} else {
    Write-Success "Nginx is already installed"
}

# Install kubectl
Write-Status "Installing kubectl..."
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    choco install kubernetes-cli -y
    Write-Success "kubectl installed successfully"
} else {
    Write-Success "kubectl is already installed"
}

# Install Helm
Write-Status "Installing Helm..."
if (-not (Get-Command helm -ErrorAction SilentlyContinue)) {
    choco install kubernetes-helm -y
    Write-Success "Helm installed successfully"
} else {
    Write-Success "Helm is already installed"
}

# Install additional tools
Write-Status "Installing additional tools..."
choco install curl wget jq yq -y
Write-Success "Additional tools installed successfully"

# Create project directory
$ProjectDir = "$env:USERPROFILE\mini-commerce-msa"
Write-Status "Setting up project directory: $ProjectDir"
if (-not (Test-Path $ProjectDir)) {
    New-Item -ItemType Directory -Path $ProjectDir -Force
    Write-Success "Project directory created: $ProjectDir"
} else {
    Write-Success "Project directory already exists: $ProjectDir"
}

# Set up environment variables
Write-Status "Setting up environment variables..."
[Environment]::SetEnvironmentVariable("MINI_COMMERCE_HOME", $ProjectDir, "User")
[Environment]::SetEnvironmentVariable("DOCKER_BUILDKIT", "1", "User")
[Environment]::SetEnvironmentVariable("COMPOSE_DOCKER_CLI_BUILD", "1", "User")

# Create health check script
Write-Status "Creating health check script..."
$HealthCheckScript = @"
# Mini Commerce MSA Health Check
Write-Host "🔍 Mini Commerce MSA Health Check" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

# Check Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker: $(docker --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Docker: Not installed" -ForegroundColor Red
}

# Check Docker Compose
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker Compose: $(docker-compose --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Docker Compose: Not installed" -ForegroundColor Red
}

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "✅ Node.js: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js: Not installed" -ForegroundColor Red
}

# Check Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "✅ Python: $(python --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Python: Not installed" -ForegroundColor Red
}

# Check Go
if (Get-Command go -ErrorAction SilentlyContinue) {
    Write-Host "✅ Go: $(go version)" -ForegroundColor Green
} else {
    Write-Host "❌ Go: Not installed" -ForegroundColor Red
}

# Check Java
if (Get-Command java -ErrorAction SilentlyContinue) {
    Write-Host "✅ Java: $(java -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
} else {
    Write-Host "❌ Java: Not installed" -ForegroundColor Red
}

# Check PostgreSQL
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "✅ PostgreSQL: $(psql --version)" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL: Not installed" -ForegroundColor Red
}

# Check Redis
if (Get-Command redis-server -ErrorAction SilentlyContinue) {
    Write-Host "✅ Redis: $(redis-server --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Redis: Not installed" -ForegroundColor Red
}

# Check Nginx
if (Get-Command nginx -ErrorAction SilentlyContinue) {
    Write-Host "✅ Nginx: $(nginx -v 2>&1)" -ForegroundColor Green
} else {
    Write-Host "❌ Nginx: Not installed" -ForegroundColor Red
}

# Check kubectl
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    Write-Host "✅ kubectl: $(kubectl version --client --short 2>$null)" -ForegroundColor Green
} else {
    Write-Host "❌ kubectl: Not installed" -ForegroundColor Red
}

# Check Helm
if (Get-Command helm -ErrorAction SilentlyContinue) {
    Write-Host "✅ Helm: $(helm version --short)" -ForegroundColor Green
} else {
    Write-Host "❌ Helm: Not installed" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Health check completed!" -ForegroundColor Green
"@

$HealthCheckScript | Out-File -FilePath "$ProjectDir\health-check.ps1" -Encoding UTF8
Write-Success "Health check script created"

# Create deployment script
Write-Status "Creating deployment script..."
$DeployScript = @"
# Mini Commerce MSA Deployment Script
Write-Host "🚀 Deploying Mini Commerce MSA..." -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found!" -ForegroundColor Red
    exit 1
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Blue
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Blue
docker-compose ps

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API Gateway: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📊 Monitoring: http://localhost:3001" -ForegroundColor Cyan
"@

$DeployScript | Out-File -FilePath "$ProjectDir\deploy.ps1" -Encoding UTF8
Write-Success "Deployment script created"

# Create .env file template
Write-Status "Creating environment template..."
$EnvTemplate = @"
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
"@

$EnvTemplate | Out-File -FilePath "$ProjectDir\.env.example" -Encoding UTF8
Write-Success "Environment template created"

# Create README
Write-Status "Creating README..."
$Readme = @"
# Mini Commerce MSA

A complete microservices-based e-commerce application with Istio service mesh.

## Quick Start

1. Run health check:
   ```powershell
   .\health-check.ps1
   ```

2. Deploy the application:
   ```powershell
   .\deploy.ps1
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

```powershell
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production

For production deployment, see the Kubernetes manifests in the `k8s/` directory.
"@

$Readme | Out-File -FilePath "$ProjectDir\README.md" -Encoding UTF8
Write-Success "README created"

# Final message
Write-Host ""
Write-Host "🎉 Mini Commerce MSA Production Environment Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Project directory: $ProjectDir" -ForegroundColor Cyan
Write-Host "🔍 Health check: $ProjectDir\health-check.ps1" -ForegroundColor Cyan
Write-Host "🚀 Deploy: $ProjectDir\deploy.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run health check: $ProjectDir\health-check.ps1" -ForegroundColor White
Write-Host "2. Copy your project files to $ProjectDir" -ForegroundColor White
Write-Host "3. Run deployment: $ProjectDir\deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Please restart your computer to apply all changes." -ForegroundColor Yellow
Write-Host ""
Write-Success "Setup completed successfully!"
