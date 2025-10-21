# Mini Commerce MSA - API 명세서

## 📋 개요

### API 정보
- **Base URL**: `http://localhost:8080` (개발), `https://api.minicommerce.com` (프로덕션)
- **버전**: v1.0.0
- **프로토콜**: HTTP/HTTPS
- **데이터 포맷**: JSON
- **문자 인코딩**: UTF-8

### 대상 사용자
- 프론트엔드 개발자
- 모바일 앱 개발자
- 서드파티 통합 개발자

---

## 🔐 인증 (Authentication)

### JWT Bearer Token 방식

#### 인증 플로우
```
1. POST /api/auth/login → JWT 토큰 발급
2. 이후 모든 요청 Header에 포함: Authorization: Bearer <token>
3. 토큰 만료 시 재로그인 필요
```

#### 헤더 형식
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 토큰 정보
- **유효기간**: 24시간
- **발급 위치**: `/api/auth/login`
- **갱신**: 현재 미지원 (재로그인 필요)

---

## 🔄 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "Success"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": "Detailed error information"
}
```

---

## 📡 API 엔드포인트

## 1. Auth Service

### 1.1 로그인

**POST** `/api/auth/login`

로그인하여 JWT 토큰을 발급받습니다.

#### Request

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `email` | string | ✅ | 사용자 이메일 (형식: email) |
| `password` | string | ✅ | 비밀번호 (최소 8자) |

#### Request Body
```json
{
  "email": "demo@example.com",
  "password": "password"
}
```

#### curl 예시
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "password"
  }'
```

#### Response

**200 OK**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDQiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDk1MzIwMDAsImV4cCI6MTcwOTYxODQwMH0.xyz",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "email": "demo@example.com",
    "name": "Demo User",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "AUTH_FAILED",
  "message": "Invalid email or password"
}
```

**400 Bad Request**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request",
  "details": {
    "email": "Invalid email format"
  }
}
```

---

### 1.2 회원가입

**POST** `/api/auth/register`

새 사용자 계정을 생성합니다.

#### Request

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `email` | string | ✅ | 사용자 이메일 |
| `password` | string | ✅ | 비밀번호 (최소 8자) |
| `name` | string | ✅ | 사용자 이름 |
| `phone` | string | ❌ | 전화번호 (형식: 010-xxxx-xxxx) |

#### Request Body
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

#### Response

**201 Created**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid-generated",
    "email": "newuser@example.com",
    "name": "홍길동",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**409 Conflict**
```json
{
  "success": false,
  "error": "USER_EXISTS",
  "message": "Email already registered"
}
```

---

### 1.3 현재 사용자 조회

**GET** `/api/auth/me`

🔐 **인증 필요**

현재 로그인한 사용자 정보를 조회합니다.

#### Headers
```http
Authorization: Bearer <token>
```

#### Response

**200 OK**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "email": "demo@example.com",
    "name": "Demo User",
    "phone": "010-1234-5678",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "INVALID_TOKEN",
  "message": "Invalid or expired token"
}
```

---

## 2. Catalog Service

### 2.1 상품 목록 조회

**GET** `/`

상품 목록을 페이지네이션과 함께 조회합니다.

#### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `page` | integer | ❌ | 1 | 페이지 번호 |
| `per_page` | integer | ❌ | 20 | 페이지당 항목 수 (최대 100) |
| `category` | string | ❌ | - | 카테고리 필터 |
| `search` | string | ❌ | - | 검색 키워드 |
| `min_price` | number | ❌ | - | 최소 가격 |
| `max_price` | number | ❌ | - | 최대 가격 |

#### curl 예시
```bash
# 기본 조회
curl http://localhost:3002/

# 카테고리 필터링
curl "http://localhost:3002/?category=전자제품&per_page=50"

# 검색
curl "http://localhost:3002/?search=맥북&min_price=1000000"
```

#### Response

**200 OK**
```json
{
  "products": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440060",
      "name": "MacBook Pro 14",
      "description": "Apple M3 Pro 칩 탑재",
      "price": 2890000.00,
      "category": "전자제품",
      "image_url": "https://example.com/macbook.jpg",
      "stock": 50,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "total_pages": 8
}
```

**400 Bad Request**
```json
{
  "success": false,
  "error": "INVALID_PARAMETER",
  "message": "per_page must be between 1 and 100"
}
```

---

### 2.2 상품 상세 조회

**GET** `/{product_id}`

특정 상품의 상세 정보를 조회합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `product_id` | uuid | 상품 ID |

#### curl 예시
```bash
curl http://localhost:3002/650e8400-e29b-41d4-a716-446655440060
```

#### Response

**200 OK**
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440060",
  "name": "MacBook Pro 14",
  "description": "Apple M3 Pro 칩 탑재",
  "price": 2890000.00,
  "category": "전자제품",
  "image_url": "https://example.com/macbook.jpg",
  "stock": 50,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "PRODUCT_NOT_FOUND",
  "message": "Product not found"
}
```

---

## 3. Cart Service

### 3.1 장바구니 조회

**GET** `/api/cart/`

🔐 **인증 필요**

현재 사용자의 장바구니를 조회합니다.

#### Headers
```http
Authorization: Bearer <token>
```

#### curl 예시
```bash
curl http://localhost:3003/api/cart/ \
  -H "Authorization: Bearer eyJhbGc..."
```

#### Response

**200 OK**
```json
{
  "cart": {
    "id": "cart-uuid",
    "user_id": "550e8400-e29b-41d4-a716-446655440004",
    "items": [
      {
        "id": "item-uuid",
        "product_id": "650e8400-e29b-41d4-a716-446655440060",
        "product_name": "MacBook Pro 14",
        "product_price": "2890000.00",
        "quantity": 2,
        "total_price": "5780000.00"
      }
    ],
    "total_items": 2,
    "total_price": "5780000.00",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid token"
}
```

---

### 3.2 장바구니에 상품 추가

**POST** `/api/cart/`

🔐 **인증 필요**

장바구니에 상품을 추가합니다.

#### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `product_id` | uuid | ✅ | 상품 ID |
| `product_name` | string | ✅ | 상품명 |
| `product_price` | string | ✅ | 상품 가격 |
| `quantity` | integer | ✅ | 수량 (1 이상) |

#### Request Body 예시
```json
{
  "product_id": "650e8400-e29b-41d4-a716-446655440060",
  "product_name": "MacBook Pro 14",
  "product_price": "2890000.00",
  "quantity": 1
}
```

#### curl 예시
```bash
curl -X POST http://localhost:3003/api/cart/ \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "650e8400-e29b-41d4-a716-446655440060",
    "product_name": "MacBook Pro 14",
    "product_price": "2890000.00",
    "quantity": 1
  }'
```

#### Response

**201 Created**
```json
{
  "message": "Item added to cart successfully",
  "item": {
    "id": "item-uuid",
    "product_id": "650e8400-e29b-41d4-a716-446655440060",
    "product_name": "MacBook Pro 14",
    "quantity": 1,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**400 Bad Request**
```json
{
  "success": false,
  "error": "INVALID_QUANTITY",
  "message": "Quantity must be greater than 0"
}
```

---

### 3.3 장바구니 항목 수량 수정

**PUT** `/api/cart/{item_id}`

🔐 **인증 필요**

장바구니 항목의 수량을 변경합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `item_id` | uuid | 장바구니 항목 ID |

#### Request Body

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `quantity` | integer | ✅ | 새 수량 (1 이상) |

#### Request Body 예시
```json
{
  "quantity": 3
}
```

#### Response

**200 OK**
```json
{
  "message": "Cart item updated successfully"
}
```

**404 Not Found**
```json
{
  "error": "Item not found"
}
```

---

### 3.4 장바구니 항목 삭제

**DELETE** `/api/cart/{item_id}`

🔐 **인증 필요**

장바구니에서 특정 항목을 삭제합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `item_id` | uuid | 장바구니 항목 ID |

#### Response

**200 OK**
```json
{
  "message": "Cart item deleted successfully"
}
```

---

### 3.5 장바구니 전체 비우기

**DELETE** `/api/cart/`

🔐 **인증 필요**

장바구니의 모든 항목을 삭제합니다.

#### Response

**200 OK**
```json
{
  "message": "Cart cleared successfully"
}
```

---

## 4. Order Service

### 4.1 주문 생성

**POST** `/api/orders`

🔐 **인증 필요**

새 주문을 생성합니다.

#### Request Body

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `user_id` | uuid | ✅ | 사용자 ID |
| `items` | array | ✅ | 주문 항목 목록 |
| `items[].product_id` | uuid | ✅ | 상품 ID |
| `items[].product_name` | string | ✅ | 상품명 |
| `items[].quantity` | integer | ✅ | 수량 |
| `items[].unit_price` | number | ✅ | 단가 |
| `total_amount` | number | ✅ | 총 금액 |
| `shipping_address` | string | ✅ | 배송지 주소 |
| `billing_address` | string | ✅ | 청구지 주소 |
| `payment_id` | uuid | ❌ | 결제 ID |

#### Request Body 예시
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440004",
  "items": [
    {
      "product_id": "650e8400-e29b-41d4-a716-446655440060",
      "product_name": "MacBook Pro 14",
      "quantity": 1,
      "unit_price": 2890000.00
    }
  ],
  "total_amount": 2890000.00,
  "shipping_address": "서울시 강남구 테헤란로 123",
  "billing_address": "서울시 강남구 테헤란로 123"
}
```

#### Response

**201 Created**
```json
{
  "id": "order-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440004",
  "status": "pending",
  "totalAmount": 2890000.00,
  "shippingAddress": "서울시 강남구 테헤란로 123",
  "billingAddress": "서울시 강남구 테헤란로 123",
  "items": [
    {
      "id": "item-uuid",
      "productId": "650e8400-e29b-41d4-a716-446655440060",
      "productName": "MacBook Pro 14",
      "quantity": 1,
      "unitPrice": 2890000.00,
      "totalPrice": 2890000.00
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

---

### 4.2 사용자 주문 목록 조회

**GET** `/api/orders/user/{user_id}`

🔐 **인증 필요**

특정 사용자의 모든 주문을 조회합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `user_id` | uuid | 사용자 ID |

#### Response

**200 OK**
```json
[
  {
    "id": "order-uuid",
    "userId": "550e8400-e29b-41d4-a716-446655440004",
    "status": "pending",
    "totalAmount": 2890000.00,
    "items": [...],
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

---

### 4.3 주문 상세 조회

**GET** `/api/orders/{order_id}`

🔐 **인증 필요**

특정 주문의 상세 정보를 조회합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `order_id` | uuid | 주문 ID |

#### Response

**200 OK**
```json
{
  "id": "order-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440004",
  "status": "pending",
  "totalAmount": 2890000.00,
  "shippingAddress": "서울시 강남구 테헤란로 123",
  "billingAddress": "서울시 강남구 테헤란로 123",
  "items": [...],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**404 Not Found**
```json
{
  "error": "Order not found"
}
```

---

## 5. Payment Service

### 5.1 결제 처리 (오케스트레이션)

**POST** `/api/payments/process`

🔐 **인증 필요**

결제를 처리하고 주문 생성, 장바구니 비우기, 알림 전송을 오케스트레이션합니다.

#### Request Body

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `user_id` | uuid | ✅ | 사용자 ID |
| `items` | array | ✅ | 주문 항목 |
| `total_amount` | number | ✅ | 총 금액 |
| `shipping_address` | string | ✅ | 배송지 |
| `billing_address` | string | ✅ | 청구지 |
| `payment_method` | string | ✅ | 결제 방법 (free_trial) |

#### Request Body 예시
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440004",
  "items": [
    {
      "product_id": "650e8400-e29b-41d4-a716-446655440060",
      "product_name": "MacBook Pro 14",
      "quantity": 1,
      "unit_price": 0
    }
  ],
  "total_amount": 0,
  "shipping_address": "서울시 강남구 테헤란로 123",
  "billing_address": "서울시 강남구 테헤란로 123",
  "payment_method": "free_trial"
}
```

#### Response

**200 OK**
```json
{
  "success": true,
  "payment_id": "payment-uuid",
  "order_id": "order-uuid",
  "amount": 0,
  "payment_method": "free_trial",
  "status": "completed",
  "transaction_id": "FREE_payment-uuid",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

**오케스트레이션 흐름**:
1. ✅ 결제 처리
2. ✅ Order Service → 주문 생성
3. ⚠️ Cart Service → 장바구니 비우기 (JWT 이슈)
4. ✅ Notification Service → 알림 전송

---

## 6. Notification Service

### 6.1 알림 목록 조회

**GET** `/api/notify/?user_id={user_id}`

🔐 **인증 필요**

사용자의 알림 목록을 조회합니다.

#### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `user_id` | uuid | ✅ | 사용자 ID |
| `page` | integer | ❌ | 페이지 번호 |
| `per_page` | integer | ❌ | 페이지당 항목 수 |

#### Response

**200 OK**
```json
{
  "notifications": [
    {
      "id": "notification-uuid",
      "user_id": "550e8400-e29b-41d4-a716-446655440004",
      "order_id": "order-uuid",
      "type": "order_created",
      "title": "주문이 완료되었습니다",
      "message": "주문번호 xxx가 성공적으로 생성되었습니다.",
      "channel": "email",
      "status": "pending",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "per_page": 20
}
```

---

## 📊 HTTP 상태 코드

| 코드 | 의미 | 사용 예시 |
|------|------|----------|
| 200 | OK | 성공적인 GET, PUT, DELETE |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 리소스 충돌 |
| 422 | Unprocessable Entity | 처리 불가 |
| 500 | Internal Server Error | 서버 오류 |

---

## 🚨 에러 코드

| 에러 코드 | HTTP | 설명 |
|----------|------|------|
| `AUTH_FAILED` | 401 | 인증 실패 |
| `TOKEN_EXPIRED` | 401 | 토큰 만료 |
| `INVALID_TOKEN` | 401 | 잘못된 토큰 |
| `USER_EXISTS` | 409 | 사용자 중복 |
| `USER_NOT_FOUND` | 404 | 사용자 없음 |
| `PRODUCT_NOT_FOUND` | 404 | 상품 없음 |
| `VALIDATION_ERROR` | 400 | 유효성 검사 실패 |
| `OUT_OF_STOCK` | 400 | 재고 부족 |

---

## ⚡ Rate Limiting

| 엔드포인트 | 제한 | 기간 |
|-----------|------|------|
| `/api/auth/login` | 5회 | 15분 |
| `/api/auth/register` | 3회 | 1시간 |
| 기타 | 100회 | 15분 |

**초과 시 응답**:
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retry_after": 900
}
```

---

## 🔄 버전 관리

- **현재 버전**: v1.0.0
- **버전 정책**: Semantic Versioning
- **Deprecated**: 3개월 전 공지

---

## 📌 테스트

### 테스트 계정
```json
{
  "email": "demo@example.com",
  "password": "password",
  "user_id": "550e8400-e29b-41d4-a716-446655440004"
}
```

### 테스트 상품 ID
```
650e8400-e29b-41d4-a716-446655440060
```

---

## ⚠️ OpenAPI 명세서와 차이점

| 서비스 | OpenAPI | 실제 구현 | 해결 |
|--------|---------|----------|------|
| Catalog | `/api/catalog/products` | `/` | Istio path rewrite |
| Payment | `/api/payment/process` | `/api/payments/process` | 두 경로 지원 |
| Notification | `/api/notifications/` | `/api/notify/` | Istio path rewrite |

---

## 🔗 관련 문서

- [환경변수](./환경변수.md)
- [OpenAPI Spec](../api-specification.yaml)
- GitHub: https://github.com/YOUR_USERNAME/mini-commerce
