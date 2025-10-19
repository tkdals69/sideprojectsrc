#!/bin/bash

echo "🚀 Starting Mini Commerce MSA locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "📦 Building and starting all services..."

# Build and start all services
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."

# Wait for database to be ready
echo "🗄️  Waiting for database..."
until docker-compose exec postgres pg_isready -U postgres; do
    echo "   Database is not ready yet..."
    sleep 2
done

# Wait for services to be healthy
echo "🔍 Checking service health..."

services=("auth-service" "catalog-service" "cart-service" "order-service" "inventory-service" "payment-service" "notification-service" "api-gateway")

for service in "${services[@]}"; do
    echo "   Checking $service..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            echo "   ✅ $service is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        echo "   ⏳ Attempt $attempt/$max_attempts - waiting for $service..."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "   ❌ $service failed to start"
    fi
done

echo ""
echo "🎉 Mini Commerce MSA is now running!"
echo ""
echo "📋 Service URLs:"
echo "   🌐 Frontend:        http://localhost:3000"
echo "   🔗 API Gateway:     http://localhost:8080"
echo "   🔐 Auth Service:    http://localhost:8081"
echo "   📦 Catalog Service: http://localhost:8082"
echo "   🛒 Cart Service:    http://localhost:8083"
echo "   📋 Order Service:   http://localhost:8084"
echo "   📊 Inventory:       http://localhost:8085"
echo "   💳 Payment:        http://localhost:8086"
echo "   🔔 Notification:   http://localhost:8087"
echo "   🗄️  Database:       localhost:5432"
echo ""
echo "🧪 Test the API:"
echo "   curl http://localhost:8080/health"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f [service-name]"
