# 🛒 Mini Commerce MSA

**마이크로서비스 아키텍처 기반 이커머스 시스템**

## 📋 프로젝트 개요

이 프로젝트는 **Istio Service Mesh**와 **Kubernetes**를 활용한 완전한 마이크로서비스 아키텍처 이커머스 시스템입니다. 각 서비스는 서로 다른 프로그래밍 언어로 구현되어 **Polyglot Programming**을 실현합니다.

## 🏗️ 아키텍처

### 서비스 구성
- **Frontend**: React + TypeScript + Tailwind CSS
- **API Gateway**: Node.js + Express
- **Auth Service**: Node.js + JWT
- **Catalog Service**: Python + FastAPI
- **Cart Service**: Go + Gin
- **Order Service**: Java + Spring Boot
- **Inventory Service**: Go + Gin
- **Payment Service**: Node.js + Express
- **Notification Service**: Python + FastAPI

### 인프라 구성
- **Container**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **Service Mesh**: Istio
- **Database**: PostgreSQL
- **Cache**: Redis (선택사항)
- **Monitoring**: Prometheus + Grafana + Loki + Tempo
- **CI/CD**: Jenkins + Argo CD

## 🚀 빠른 시작

### 1. 필수 소프트웨어 설치

#### Windows:
```powershell
# 관리자 권한으로 실행
.\install-essentials.ps1
```

#### Linux/macOS:
```bash
chmod +x install-essentials.sh
./install-essentials.sh
```

### 2. 프로젝트 클론 및 실행

```bash
# 프로젝트 클론
git clone <repository-url>
cd mini-commerce-msa

# 의존성 설치
cd frontend
npm install

# 서비스 실행
cd ..
docker-compose -f docker-compose.essentials.yml up -d
```

### 3. 접속 URL

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Auth Service**: http://localhost:3001
- **Catalog Service**: http://localhost:3002
- **Cart Service**: http://localhost:3003
- **Order Service**: http://localhost:3004
- **Inventory Service**: http://localhost:3005
- **Payment Service**: http://localhost:3006
- **Notification Service**: http://localhost:3007

## 🛠️ 개발 환경 설정

### 필수 요구사항
- **Docker** 24.0.0+
- **Docker Compose** 2.20.0+
- **Node.js** 18.17.0+
- **Python** 3.9.0+
- **Go** 1.21.0+
- **Java** 17.0.0+

### 로컬 개발 실행

```bash
# 1. 데이터베이스 시작
docker-compose up -d postgres

# 2. 개별 서비스 실행 (개발 모드)
cd services/auth && npm start &
cd services/catalog && python main.py &
cd services/cart && go run main.go &
cd services/order && mvn spring-boot:run &
cd services/inventory && go run main.go &
cd services/payment-mock && npm start &
cd services/notification && python main.py &
cd services/gateway && npm start &

# 3. 프론트엔드 실행
cd frontend && npm start
```

## 📊 모니터링

### 개발 환경
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Loki**: http://localhost:3100
- **Tempo**: http://localhost:3200

### 프로덕션 환경
- **Kiali**: Service Mesh 시각화
- **Jaeger**: 분산 추적
- **Istio Dashboard**: 트래픽 모니터링

## 🔧 스크립트

### 필수 소프트웨어 설치
- `install-essentials.sh` - Linux/macOS용
- `install-essentials.ps1` - Windows용

### 서비스 실행
- `start-essentials.sh` - Linux/macOS용
- `start-essentials.ps1` - Windows용

### 헬스체크
- `health-check.sh` - Linux/macOS용
- `health-check.ps1` - Windows용

## 📁 프로젝트 구조

```
mini-commerce-msa/
├── frontend/                 # React 프론트엔드
├── services/
│   ├── auth/                # 인증 서비스 (Node.js)
│   ├── catalog/             # 상품 카탈로그 (Python)
│   ├── cart/                # 장바구니 (Go)
│   ├── order/               # 주문 관리 (Java)
│   ├── inventory/           # 재고 관리 (Go)
│   ├── payment-mock/        # 결제 모킹 (Node.js)
│   ├── notification/        # 알림 (Python)
│   └── gateway/             # API 게이트웨이 (Node.js)
├── k8s/                     # Kubernetes 매니페스트
├── monitoring/              # 모니터링 설정
├── nginx/                   # 로드 밸런서 설정
└── scripts/                 # 유틸리티 스크립트
```

## 🧪 테스트

### API 테스트
```bash
# 헬스체크
curl http://localhost:8080/health

# 인증 테스트
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 상품 목록 조회
curl http://localhost:8080/api/catalog
```

### 프론트엔드 테스트
```bash
cd frontend
npm test
```

## 🚀 배포

### Docker Compose (개발/테스트)
```bash
docker-compose -f docker-compose.essentials.yml up -d
```

### Kubernetes (프로덕션)
```bash
kubectl apply -f k8s/
```

## 🔒 보안

- **JWT 토큰** 기반 인증
- **HTTPS** 강제 (프로덕션)
- **Rate Limiting** 적용
- **Input Validation** 구현
- **SQL Injection** 방지

## 📈 성능 최적화

- **Connection Pooling** (데이터베이스)
- **Caching** (Redis)
- **Load Balancing** (Nginx)
- **CDN** (정적 자원)
- **Database Indexing**

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 있으시면 이슈를 생성해주세요.

---

**🎯 학습 목적의 프로젝트입니다. 실제 상용 서비스에 사용하기 전에 보안 및 성능 검토가 필요합니다.**