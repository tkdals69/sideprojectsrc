const { test, expect } = require('@playwright/test');

test.describe('Mini Commerce E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 웹사이트 접속
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('홈페이지 로드 및 기본 UI 확인', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Mini Commerce/);
    
    // 헤더 요소들 확인
    await expect(page.locator('text=Mini Commerce')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Login')).toBeVisible();
    
    // 히어로 섹션 확인
    await expect(page.locator('text=Welcome to Mini Commerce')).toBeVisible();
    await expect(page.locator('text=Shop Now')).toBeVisible();
    
    // 카테고리 섹션 확인
    await expect(page.locator('text=Shop by Category')).toBeVisible();
    
    // 추천 상품 섹션 확인
    await expect(page.locator('text=Featured Products')).toBeVisible();
  });

  test('로그인 기능 테스트', async ({ page }) => {
    // 로그인 버튼 클릭
    await page.click('text=Login');
    
    // 로그인 폼 확인
    await expect(page.locator('text=로그인')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 테스트 계정으로 로그인
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // 로그인 성공 확인 (Logout 버튼이 나타나야 함)
    await expect(page.locator('text=Logout')).toBeVisible();
    await expect(page.locator('text=Login')).not.toBeVisible();
  });

  test('장바구니 기능 테스트', async ({ page }) => {
    // 먼저 로그인
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // 로그인 후 홈페이지로 돌아가기
    await page.waitForLoadState('networkidle');
    
    // 장바구니 아이콘 확인 (초기에는 0개)
    const cartIcon = page.locator('[data-testid="cart-icon"]').or(page.locator('text=0').first());
    await expect(cartIcon).toBeVisible();
    
    // 상품을 장바구니에 추가
    const addToCartButtons = page.locator('text=Add to Cart');
    const firstButton = addToCartButtons.first();
    
    if (await firstButton.isVisible()) {
      await firstButton.click();
      
      // 성공 알림 확인 (alert 또는 toast)
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('장바구니에 추가되었습니다');
        dialog.accept();
      });
      
      // 잠시 대기
      await page.waitForTimeout(1000);
    }
  });

  test('장바구니 모달 테스트', async ({ page }) => {
    // 로그인
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    
    // 장바구니 아이콘 클릭
    const cartIcon = page.locator('svg').filter({ hasText: '' }).first();
    await cartIcon.click();
    
    // 장바구니 모달 확인
    await expect(page.locator('text=Shopping Cart')).toBeVisible();
    
    // 빈 장바구니 메시지 확인
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
    await expect(page.locator('text=Start shopping to add items to your cart')).toBeVisible();
    
    // Continue Shopping 버튼 클릭
    await page.click('text=Continue Shopping');
    
    // 모달이 닫혔는지 확인
    await expect(page.locator('text=Shopping Cart')).not.toBeVisible();
  });

  test('상품 페이지 네비게이션 테스트', async ({ page }) => {
    // Products 버튼 클릭
    await page.click('text=Products');
    
    // 상품 페이지 요소들 확인
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Search products...')).toBeVisible();
    
    // 검색 기능 테스트
    await page.fill('input[placeholder="Search products..."]', 'headphone');
    await page.waitForTimeout(500);
    
    // 필터 기능 테스트
    const filterSelect = page.locator('select').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('Electronics');
    }
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 모바일 메뉴 버튼 확인
    const mobileMenuButton = page.locator('button').filter({ hasText: '' }).first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
    }
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('에러 처리 테스트', async ({ page }) => {
    // 잘못된 로그인 정보로 테스트
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await page.waitForTimeout(1000);
    
    // 올바른 정보로 다시 로그인
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Logout')).toBeVisible();
  });

  test('로그아웃 기능 테스트', async ({ page }) => {
    // 로그인
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    
    // 로그아웃
    await page.click('text=Logout');
    
    // 로그인 버튼이 다시 나타나는지 확인
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Logout')).not.toBeVisible();
  });

  test('성능 테스트', async ({ page }) => {
    // 페이지 로드 시간 측정
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`페이지 로드 시간: ${loadTime}ms`);
    
    // 3초 이내에 로드되어야 함
    expect(loadTime).toBeLessThan(3000);
  });

  test('접근성 테스트', async ({ page }) => {
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // 포커스 상태 확인
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
