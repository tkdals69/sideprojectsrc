#!/bin/bash

echo "🧪 Testing Mini Commerce API..."

BASE_URL="http://localhost:8080"

echo ""
echo "1. 🔍 Health Check"
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"

echo ""
echo "2. 👤 User Registration"
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }' | jq '.' || echo "❌ Registration failed"

echo ""
echo "3. 🔐 User Login"
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo "✅ Login successful, token: ${TOKEN:0:20}..."
else
    echo "❌ Login failed"
    exit 1
fi

echo ""
echo "4. 📦 Get Products"
curl -s "$BASE_URL/api/catalog" | jq '.products[0:2]' || echo "❌ Failed to get products"

echo ""
echo "5. 🛒 Add to Cart"
curl -s -X POST "$BASE_URL/api/cart/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2
  }' | jq '.' || echo "❌ Failed to add to cart"

echo ""
echo "6. 🛒 Get Cart"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/cart" | jq '.' || echo "❌ Failed to get cart"

echo ""
echo "7. 📋 Create Order"
curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "productName": "Test Product",
        "quantity": 1,
        "unitPrice": 29.99
      }
    ],
    "shippingAddress": "123 Test St, Test City",
    "billingAddress": "123 Test St, Test City",
    "totalAmount": 29.99
  }' | jq '.' || echo "❌ Failed to create order"

echo ""
echo "8. 📊 Get Inventory"
curl -s "$BASE_URL/api/inventory" | jq '.inventory[0:2]' || echo "❌ Failed to get inventory"

echo ""
echo "9. 💳 Process Payment"
curl -s -X POST "$BASE_URL/api/payment/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "orderId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 29.99,
    "paymentMethod": "credit_card"
  }' | jq '.' || echo "❌ Failed to process payment"

echo ""
echo "10. 🔔 Get Notifications"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/notifications" | jq '.' || echo "❌ Failed to get notifications"

echo ""
echo "✅ API testing completed!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 API Gateway: http://localhost:8080"
