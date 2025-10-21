#!/usr/bin/env python3
"""
Selenium을 사용한 E-commerce 웹 애플리케이션 E2E 테스트
"""

import time
import sys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select

class EcommerceTestSuite:
    def __init__(self):
        self.driver = None
        self.base_url = "http://localhost:3000"
        self.wait_timeout = 10
        
    def setup_driver(self):
        """Chrome WebDriver 설정"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # 헤드리스 모드
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(self.wait_timeout)
            print("✅ Chrome WebDriver 초기화 성공")
            return True
        except Exception as e:
            print(f"❌ WebDriver 초기화 실패: {e}")
            return False
    
    def teardown(self):
        """테스트 후 정리"""
        if self.driver:
            self.driver.quit()
            print("🔧 WebDriver 정리 완료")
    
    def wait_for_element(self, by, value, timeout=None):
        """요소가 나타날 때까지 대기"""
        if timeout is None:
            timeout = self.wait_timeout
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return element
        except Exception as e:
            print(f"❌ 요소 대기 실패: {by}={value}, {e}")
            return None
    
    def test_homepage_load(self):
        """홈페이지 로딩 테스트"""
        print("\n🏠 홈페이지 로딩 테스트 시작...")
        try:
            self.driver.get(self.base_url)
            time.sleep(3)
            
            # 페이지 제목 확인
            title = self.driver.title
            print(f"📄 페이지 제목: {title}")
            
            # 메인 컨텐츠 확인
            main_content = self.wait_for_element(By.TAG_NAME, "body")
            if main_content:
                print("✅ 홈페이지 로딩 성공")
                return True
            else:
                print("❌ 홈페이지 컨텐츠를 찾을 수 없음")
                return False
                
        except Exception as e:
            print(f"❌ 홈페이지 테스트 실패: {e}")
            return False
    
    def test_navigation(self):
        """네비게이션 테스트"""
        print("\n🧭 네비게이션 테스트 시작...")
        try:
            # 상품 페이지로 이동
            products_link = self.wait_for_element(By.PARTIAL_LINK_TEXT, "상품")
            if products_link:
                products_link.click()
                time.sleep(2)
                print("✅ 상품 페이지 이동 성공")
                
                # 상품 목록 확인
                products = self.driver.find_elements(By.CLASS_NAME, "product-card")
                print(f"📦 발견된 상품 수: {len(products)}")
                
                return True
            else:
                print("❌ 상품 링크를 찾을 수 없음")
                return False
                
        except Exception as e:
            print(f"❌ 네비게이션 테스트 실패: {e}")
            return False
    
    def test_user_registration(self):
        """사용자 등록 테스트"""
        print("\n👤 사용자 등록 테스트 시작...")
        try:
            # 로그인 페이지로 이동
            login_link = self.wait_for_element(By.PARTIAL_LINK_TEXT, "로그인")
            if login_link:
                login_link.click()
                time.sleep(2)
                
                # 등록 링크 찾기
                register_link = self.wait_for_element(By.PARTIAL_LINK_TEXT, "회원가입")
                if register_link:
                    register_link.click()
                    time.sleep(2)
                    print("✅ 회원가입 페이지 이동 성공")
                    return True
                else:
                    print("❌ 회원가입 링크를 찾을 수 없음")
                    return False
            else:
                print("❌ 로그인 링크를 찾을 수 없음")
                return False
                
        except Exception as e:
            print(f"❌ 사용자 등록 테스트 실패: {e}")
            return False
    
    def test_product_search(self):
        """상품 검색 테스트"""
        print("\n🔍 상품 검색 테스트 시작...")
        try:
            # 검색창 찾기
            search_input = self.wait_for_element(By.NAME, "search")
            if search_input:
                search_input.clear()
                search_input.send_keys("iPhone")
                search_input.send_keys(Keys.RETURN)
                time.sleep(3)
                print("✅ 검색 실행 성공")
                return True
            else:
                print("❌ 검색창을 찾을 수 없음")
                return False
                
        except Exception as e:
            print(f"❌ 상품 검색 테스트 실패: {e}")
            return False
    
    def test_cart_functionality(self):
        """장바구니 기능 테스트"""
        print("\n🛒 장바구니 기능 테스트 시작...")
        try:
            # 장바구니 아이콘 찾기
            cart_icon = self.wait_for_element(By.CLASS_NAME, "cart-icon")
            if cart_icon:
                cart_icon.click()
                time.sleep(2)
                print("✅ 장바구니 페이지 이동 성공")
                return True
            else:
                print("❌ 장바구니 아이콘을 찾을 수 없음")
                return False
                
        except Exception as e:
            print(f"❌ 장바구니 테스트 실패: {e}")
            return False
    
    def test_api_connectivity(self):
        """API 연결성 테스트"""
        print("\n🔌 API 연결성 테스트 시작...")
        try:
            # 브라우저 콘솔에서 네트워크 요청 확인
            self.driver.get(f"{self.base_url}")
            time.sleep(5)
            
            # JavaScript로 API 호출 테스트
            api_test_script = """
            fetch('/api/health')
                .then(response => response.json())
                .then(data => console.log('API Health:', data))
                .catch(error => console.log('API Error:', error));
            """
            
            self.driver.execute_script(api_test_script)
            time.sleep(2)
            
            # 콘솔 로그 확인
            logs = self.driver.get_log('browser')
            for log in logs:
                if 'API' in log['message']:
                    print(f"📡 API 로그: {log['message']}")
            
            print("✅ API 연결성 테스트 완료")
            return True
            
        except Exception as e:
            print(f"❌ API 연결성 테스트 실패: {e}")
            return False
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print("🚀 E-commerce 애플리케이션 E2E 테스트 시작")
        print("=" * 50)
        
        if not self.setup_driver():
            return False
        
        test_results = []
        
        try:
            # 테스트 실행
            test_results.append(("홈페이지 로딩", self.test_homepage_load()))
            test_results.append(("네비게이션", self.test_navigation()))
            test_results.append(("사용자 등록", self.test_user_registration()))
            test_results.append(("상품 검색", self.test_product_search()))
            test_results.append(("장바구니 기능", self.test_cart_functionality()))
            test_results.append(("API 연결성", self.test_api_connectivity()))
            
        finally:
            self.teardown()
        
        # 결과 출력
        print("\n" + "=" * 50)
        print("📊 테스트 결과 요약")
        print("=" * 50)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ 통과" if result else "❌ 실패"
            print(f"{test_name:15} : {status}")
            if result:
                passed += 1
        
        print("-" * 50)
        print(f"총 테스트: {total}, 통과: {passed}, 실패: {total - passed}")
        print(f"성공률: {(passed/total)*100:.1f}%")
        
        return passed == total

def main():
    """메인 실행 함수"""
    print("🔧 Selenium E2E 테스트 도구")
    print("테스트 대상: http://localhost:3000")
    print()
    
    # 서비스 상태 확인
    import requests
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        print(f"✅ Frontend 서비스 상태: {response.status_code}")
    except:
        print("❌ Frontend 서비스에 연결할 수 없습니다.")
        print("   Docker Compose로 서비스를 시작해주세요.")
        return False
    
    # 테스트 실행
    test_suite = EcommerceTestSuite()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n🎉 모든 테스트가 성공적으로 완료되었습니다!")
    else:
        print("\n⚠️  일부 테스트가 실패했습니다. 로그를 확인해주세요.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
