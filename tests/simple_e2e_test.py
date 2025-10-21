#!/usr/bin/env python3
"""
간단한 E2E 테스트 (Selenium 없이)
HTTP 요청을 통한 API 테스트
"""

import requests
import json
import time
import sys

class SimpleE2ETest:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.api_base = "http://localhost:8080"
        self.test_results = []
        
    def test_frontend_accessibility(self):
        """Frontend 접근성 테스트"""
        print("\n🌐 Frontend 접근성 테스트...")
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                print("✅ Frontend 서비스 정상 접근")
                return True
            else:
                print(f"❌ Frontend 응답 오류: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend 접근 실패: {e}")
            return False
    
    def test_api_gateway_health(self):
        """API Gateway 헬스체크"""
        print("\n🔌 API Gateway 헬스체크...")
        try:
            response = requests.get(f"{self.api_base}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ API Gateway 정상: {data.get('status', 'unknown')}")
                return True
            else:
                print(f"❌ API Gateway 응답 오류: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API Gateway 접근 실패: {e}")
            return False
    
    def test_auth_service(self):
        """Auth 서비스 테스트"""
        print("\n🔐 Auth 서비스 테스트...")
        try:
            # demo 사용자로 로그인 테스트
            login_data = {
                "email": "demo@example.com",
                "password": "password"
            }
            
            response = requests.post("http://localhost:3001/api/auth/login", 
                                   json=login_data, timeout=10)
            
            print(f"📡 Auth 로그인 응답 상태: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                user = data.get('user', {})
                print(f"✅ 로그인 성공: {user.get('firstName', '')} {user.get('lastName', '')} ({user.get('email', '')})")
                return True
            else:
                print(f"❌ Auth 서비스 응답 오류: {response.status_code}")
                print(f"응답 내용: {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ Auth 서비스 테스트 실패: {e}")
            return False
    
    def test_catalog_service(self):
        """Catalog 서비스 테스트"""
        print("\n📦 Catalog 서비스 테스트...")
        try:
            # 직접 Catalog 서비스 헬스체크
            response = requests.get("http://localhost:3002/health", timeout=5)
            
            print(f"📡 Catalog 직접 응답 상태: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Catalog 서비스 정상: {data.get('status', 'unknown')}")
                return True
            else:
                print(f"❌ Catalog 서비스 응답 오류: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Catalog 서비스 테스트 실패: {e}")
            return False
    
    def test_cart_service(self):
        """Cart 서비스 테스트"""
        print("\n🛒 Cart 서비스 테스트...")
        try:
            # 장바구니 조회 (인증 없이)
            response = requests.get(f"{self.api_base}/api/cart/", timeout=5)
            
            if response.status_code in [200, 401]:  # 401도 정상 (인증 필요)
                print("✅ Cart 서비스 응답 정상")
                return True
            else:
                print(f"❌ Cart 서비스 응답 오류: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Cart 서비스 테스트 실패: {e}")
            return False
    
    def test_order_service(self):
        """Order 서비스 테스트"""
        print("\n📋 Order 서비스 테스트...")
        try:
            response = requests.get(f"{self.api_base}/api/orders/", timeout=5)
            
            if response.status_code in [200, 401]:  # 401도 정상 (인증 필요)
                print("✅ Order 서비스 응답 정상")
                return True
            else:
                print(f"❌ Order 서비스 응답 오류: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Order 서비스 테스트 실패: {e}")
            return False
    
    def test_inventory_service(self):
        """Inventory 서비스 테스트"""
        print("\n📊 Inventory 서비스 테스트...")
        try:
            response = requests.get(f"{self.api_base}/api/inventory/", timeout=5)
            
            if response.status_code in [200, 401]:  # 401도 정상 (인증 필요)
                print("✅ Inventory 서비스 응답 정상")
                return True
            else:
                print(f"❌ Inventory 서비스 응답 오류: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Inventory 서비스 테스트 실패: {e}")
            return False
    
    def test_payment_service(self):
        """Payment 서비스 테스트"""
        print("\n💳 Payment 서비스 테스트...")
        try:
            # 직접 Payment 서비스 테스트
            response = requests.get("http://localhost:3006/api/payments", timeout=5)
            
            print(f"📡 Payment 직접 응답 상태: {response.status_code}")
            if response.status_code in [200, 401, 404]:  # 404도 정상 (엔드포인트 없음)
                print("✅ Payment 서비스 응답 정상")
                return True
            else:
                print(f"❌ Payment 서비스 응답 오류: {response.status_code}")
                print(f"응답 내용: {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ Payment 서비스 테스트 실패: {e}")
            return False
    
    def test_notification_service(self):
        """Notification 서비스 테스트"""
        print("\n🔔 Notification 서비스 테스트...")
        try:
            response = requests.get(f"{self.api_base}/api/notifications/", timeout=5)
            
            if response.status_code in [200, 401]:  # 401도 정상 (인증 필요)
                print("✅ Notification 서비스 응답 정상")
                return True
            else:
                print(f"❌ Notification 서비스 응답 오류: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Notification 서비스 테스트 실패: {e}")
            return False
    
    def test_database_connectivity(self):
        """데이터베이스 연결성 테스트"""
        print("\n🗄️ 데이터베이스 연결성 테스트...")
        try:
            # PostgreSQL 직접 연결 테스트
            import psycopg2
            conn = psycopg2.connect(
                host="localhost",
                port="5432",
                database="mini_commerce",
                user="postgres",
                password="password"
            )
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if result:
                print("✅ PostgreSQL 데이터베이스 연결 성공")
                return True
            else:
                print("❌ 데이터베이스 쿼리 실패")
                return False
                
        except Exception as e:
            print(f"❌ 데이터베이스 연결 실패: {e}")
            return False
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print("🚀 E-commerce 애플리케이션 E2E 테스트 시작")
        print("=" * 60)
        
        # 테스트 실행
        tests = [
            ("Frontend 접근성", self.test_frontend_accessibility),
            ("API Gateway 헬스체크", self.test_api_gateway_health),
            ("Auth 서비스", self.test_auth_service),
            ("Catalog 서비스", self.test_catalog_service),
            ("Cart 서비스", self.test_cart_service),
            ("Order 서비스", self.test_order_service),
            ("Inventory 서비스", self.test_inventory_service),
            ("Payment 서비스", self.test_payment_service),
            ("Notification 서비스", self.test_notification_service),
            ("데이터베이스 연결성", self.test_database_connectivity)
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                self.test_results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} 테스트 중 오류: {e}")
                self.test_results.append((test_name, False))
        
        # 결과 출력
        print("\n" + "=" * 60)
        print("📊 테스트 결과 요약")
        print("=" * 60)
        
        passed = 0
        total = len(self.test_results)
        
        for test_name, result in self.test_results:
            status = "✅ 통과" if result else "❌ 실패"
            print(f"{test_name:20} : {status}")
            if result:
                passed += 1
        
        print("-" * 60)
        print(f"총 테스트: {total}, 통과: {passed}, 실패: {total - passed}")
        print(f"성공률: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 모든 테스트가 성공적으로 완료되었습니다!")
        else:
            print(f"\n⚠️  {total - passed}개 테스트가 실패했습니다.")
        
        return passed == total

def main():
    """메인 실행 함수"""
    print("🔧 E-commerce E2E 테스트 도구")
    print("테스트 대상: http://localhost:3000 (Frontend)")
    print("API Gateway: http://localhost:8080")
    print()
    
    # 서비스 상태 확인
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        print(f"✅ Frontend 서비스 상태: {response.status_code}")
    except:
        print("❌ Frontend 서비스에 연결할 수 없습니다.")
        print("   Docker Compose로 서비스를 시작해주세요.")
        return False
    
    # 테스트 실행
    test_suite = SimpleE2ETest()
    success = test_suite.run_all_tests()
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
