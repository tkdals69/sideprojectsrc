#!/bin/bash

# Mini Commerce MSA - Production Setup Script
# ===========================================
# This script sets up the complete production environment

set -e

echo "🚀 Setting up Mini Commerce MSA Production Environment..."
echo "======================================================="

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
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Create project structure
print_status "Creating project structure..."
mkdir -p mini-commerce-msa/{services,frontend,monitoring,nginx,scripts,k8s}
mkdir -p mini-commerce-msa/services/{auth,catalog,cart,order,inventory,payment-mock,notification,gateway}
mkdir -p mini-commerce-msa/monitoring/{prometheus,grafana,loki,tempo}
mkdir -p mini-commerce-msa/nginx/ssl
mkdir -p mini-commerce-msa/k8s/{namespaces,services,deployments,configmaps,secrets}

# Create environment file
print_status "Creating environment configuration..."
cat > mini-commerce-msa/.env << 'EOF'
# Mini Commerce MSA Production Environment
# ========================================

# Database Configuration
POSTGRES_PASSWORD=secure_production_password_2024
POSTGRES_DB=mini_commerce
POSTGRES_USER=postgres

# Redis Configuration
REDIS_PASSWORD=redis_production_password_2024

# JWT Configuration
JWT_SECRET=super-secret-jwt-key-for-production-2024
JWT_EXPIRES_IN=24h

# Service Ports
AUTH_SERVICE_PORT=3001
CATALOG_SERVICE_PORT=3002
CART_SERVICE_PORT=3003
ORDER_SERVICE_PORT=3004
INVENTORY_SERVICE_PORT=3005
PAYMENT_SERVICE_PORT=3006
NOTIFICATION_SERVICE_PORT=3007
GATEWAY_SERVICE_PORT=8080
FRONTEND_PORT=3000

# Monitoring Ports
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
LOKI_PORT=3100
TEMPO_PORT=3200

# Security
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Production Settings
NODE_ENV=production
LOG_LEVEL=info
ENABLE_METRICS=true
ENABLE_TRACING=true
EOF

# Create database initialization script
print_status "Creating database initialization script..."
cat > mini-commerce-msa/scripts/init-db.sql << 'EOF'
-- Mini Commerce MSA Database Initialization
-- ==========================================

-- Create databases for each service
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS catalog_db;
CREATE DATABASE IF NOT EXISTS cart_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS inventory_db;
CREATE DATABASE IF NOT EXISTS notification_db;

-- Create users for each service
CREATE USER IF NOT EXISTS 'auth_user'@'%' IDENTIFIED BY 'auth_password';
CREATE USER IF NOT EXISTS 'catalog_user'@'%' IDENTIFIED BY 'catalog_password';
CREATE USER IF NOT EXISTS 'cart_user'@'%' IDENTIFIED BY 'cart_password';
CREATE USER IF NOT EXISTS 'order_user'@'%' IDENTIFIED BY 'order_password';
CREATE USER IF NOT EXISTS 'inventory_user'@'%' IDENTIFIED BY 'inventory_password';
CREATE USER IF NOT EXISTS 'notification_user'@'%' IDENTIFIED BY 'notification_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON auth_db.* TO 'auth_user'@'%';
GRANT ALL PRIVILEGES ON catalog_db.* TO 'catalog_user'@'%';
GRANT ALL PRIVILEGES ON cart_db.* TO 'cart_user'@'%';
GRANT ALL PRIVILEGES ON order_db.* TO 'order_user'@'%';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'%';
GRANT ALL PRIVILEGES ON notification_db.* TO 'notification_user'@'%';

FLUSH PRIVILEGES;

-- Create tables for each service
USE auth_db;
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

USE catalog_db;
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(500),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

USE cart_db;
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

USE order_db;
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

USE inventory_db;
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    reserved_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

USE notification_db;
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

# Create Prometheus configuration
print_status "Creating Prometheus configuration..."
cat > mini-commerce-msa/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'mini-commerce-services'
    static_configs:
      - targets: 
        - 'auth-service:3001'
        - 'catalog-service:3002'
        - 'cart-service:3003'
        - 'order-service:3004'
        - 'inventory-service:3005'
        - 'payment-service:3006'
        - 'notification-service:3007'
        - 'gateway-service:8080'
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."
cat > mini-commerce-msa/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream gateway {
        server gateway-service:8080;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API Gateway
        location /api/ {
            proxy_pass http://gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Create Kubernetes manifests
print_status "Creating Kubernetes manifests..."

# Namespace
cat > mini-commerce-msa/k8s/namespaces/mini-commerce.yaml << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: mini-commerce
  labels:
    name: mini-commerce
EOF

# ConfigMap
cat > mini-commerce-msa/k8s/configmaps/app-config.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: mini-commerce-config
  namespace: mini-commerce
data:
  POSTGRES_HOST: "postgres-service"
  POSTGRES_PORT: "5432"
  POSTGRES_DB: "mini_commerce"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  JWT_SECRET: "your-super-secret-jwt-key-here"
  JWT_EXPIRES_IN: "24h"
EOF

# Secret
cat > mini-commerce-msa/k8s/secrets/app-secrets.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: mini-commerce-secrets
  namespace: mini-commerce
type: Opaque
data:
  POSTGRES_PASSWORD: c2VjdXJlX3Bhc3N3b3JkXzEyMw==  # base64 encoded
  REDIS_PASSWORD: cmVkaXNfcGFzc3dvcmRfMTIz  # base64 encoded
EOF

# Create deployment script
print_status "Creating deployment script..."
cat > mini-commerce-msa/deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Mini Commerce MSA to Production..."
echo "=============================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure it"
    exit 1
fi

# Load environment variables
source .env

# Create SSL certificates if they don't exist
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo "🔐 Generating SSL certificates..."
    mkdir -p nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 60

# Check service health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Display access information
echo ""
echo "✅ Deployment completed successfully!"
echo "=================================="
echo "🌐 Frontend: https://localhost"
echo "🔧 API Gateway: https://localhost/api"
echo "📊 Grafana: http://localhost:3001"
echo "📈 Prometheus: http://localhost:9090"
echo "🔍 Loki: http://localhost:3100"
echo "📊 Tempo: http://localhost:3200"
echo ""
echo "🔐 Default Grafana credentials: admin/admin"
echo ""
EOF

chmod +x mini-commerce-msa/deploy.sh

# Create monitoring script
print_status "Creating monitoring script..."
cat > mini-commerce-msa/monitor.sh << 'EOF'
#!/bin/bash

echo "📊 Mini Commerce MSA Monitoring Dashboard"
echo "========================================"

# Check service status
echo "🔍 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📈 Resource Usage:"
docker stats --no-stream

echo ""
echo "🔗 Access URLs:"
echo "Frontend: https://localhost"
echo "API Gateway: https://localhost/api"
echo "Grafana: http://localhost:3001"
echo "Prometheus: http://localhost:9090"
echo "Loki: http://localhost:3100"
echo "Tempo: http://localhost:3200"
EOF

chmod +x mini-commerce-msa/monitor.sh

# Create backup script
print_status "Creating backup script..."
cat > mini-commerce-msa/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup in $BACKUP_DIR..."

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres mini_commerce > "$BACKUP_DIR/database.sql"

# Backup volumes
docker run --rm -v mini-commerce-msa_postgres_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

echo "✅ Backup completed: $BACKUP_DIR"
EOF

chmod +x mini-commerce-msa/backup.sh

# Create restore script
print_status "Creating restore script..."
cat > mini-commerce-msa/restore.sh << 'EOF'
#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_directory>"
    echo "Example: $0 ./backups/20240101_120000"
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "🔄 Restoring from $BACKUP_DIR..."

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
if [ -f "$BACKUP_DIR/database.sql" ]; then
    docker-compose -f docker-compose.prod.yml up -d postgres
    sleep 10
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d mini_commerce < "$BACKUP_DIR/database.sql"
fi

# Restore volumes
if [ -f "$BACKUP_DIR/postgres_data.tar.gz" ]; then
    docker run --rm -v mini-commerce-msa_postgres_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data
fi

# Start services
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Restore completed"
EOF

chmod +x mini-commerce-msa/restore.sh

# Create README
print_status "Creating production README..."
cat > mini-commerce-msa/README.md << 'EOF'
# Mini Commerce MSA - Production Environment

A complete microservices-based e-commerce application with monitoring and observability.

## Quick Start

1. **Deploy the application:**
   ```bash
   ./deploy.sh
   ```

2. **Monitor the application:**
   ```bash
   ./monitor.sh
   ```

3. **Backup the application:**
   ```bash
   ./backup.sh
   ```

## Architecture

### Services
- **Frontend**: React + TypeScript + Tailwind CSS
- **API Gateway**: Node.js + Express
- **Auth Service**: Node.js + JWT
- **Catalog Service**: Python + FastAPI
- **Cart Service**: Go + Gin
- **Order Service**: Java + Spring Boot
- **Inventory Service**: Go + Gin
- **Payment Service**: Node.js + Express
- **Notification Service**: Python + FastAPI

### Infrastructure
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Load Balancer**: Nginx
- **Monitoring**: Prometheus + Grafana
- **Logging**: Loki
- **Tracing**: Tempo

## Access URLs

- **Frontend**: https://localhost
- **API Gateway**: https://localhost/api
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Loki**: http://localhost:3100
- **Tempo**: http://localhost:3200

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Production Checklist

- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Database passwords changed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security hardening applied

## Troubleshooting

### Check service health:
```bash
docker-compose -f docker-compose.prod.yml ps
```

### View logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f [service-name]
```

### Restart services:
```bash
docker-compose -f docker-compose.prod.yml restart [service-name]
```

## Security

- Change all default passwords
- Use strong SSL certificates
- Enable firewall rules
- Regular security updates
- Monitor access logs

## Backup & Recovery

### Create backup:
```bash
./backup.sh
```

### Restore from backup:
```bash
./restore.sh ./backups/20240101_120000
```

## Monitoring

- **Metrics**: Prometheus
- **Dashboards**: Grafana
- **Logs**: Loki
- **Traces**: Tempo
- **Alerts**: Configured in Grafana

## Scaling

To scale services, modify the `docker-compose.prod.yml` file:

```yaml
services:
  auth-service:
    deploy:
      replicas: 3
```

## Maintenance

- Regular backups
- Security updates
- Performance monitoring
- Log rotation
- Database optimization
EOF

# Set permissions
print_status "Setting permissions..."
chmod +x mini-commerce-msa/*.sh
chmod +x mini-commerce-msa/scripts/*.sh

# Final message
echo ""
echo "🎉 Mini Commerce MSA Production Environment Setup Complete!"
echo "============================================================"
echo ""
echo "📁 Project directory: $(pwd)/mini-commerce-msa"
echo "🚀 Deploy: cd mini-commerce-msa && ./deploy.sh"
echo "📊 Monitor: cd mini-commerce-msa && ./monitor.sh"
echo "💾 Backup: cd mini-commerce-msa && ./backup.sh"
echo ""
echo "Next steps:"
echo "1. cd mini-commerce-msa"
echo "2. cp .env.example .env"
echo "3. Edit .env with your production values"
echo "4. ./deploy.sh"
echo ""
print_success "Production environment setup completed successfully!"
