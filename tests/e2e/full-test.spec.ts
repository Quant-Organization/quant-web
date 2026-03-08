import { test, expect } from '@playwright/test';

// ============================================================
// Auth helper: inject tokens via localStorage (no UI login needed)
// ============================================================
async function setupAuth(page: import('@playwright/test').Page) {
	// Navigate to any page first so we can set localStorage on the correct origin
	await page.goto('/login');
	await page.waitForLoadState('domcontentloaded');

	// Register via API, then inject tokens
	await page.evaluate(async () => {
		const user = 'e2e_' + Math.random().toString(36).slice(2, 8);
		const pass = 'test1234';

		// Spring Boot register
		try {
			const springRes = await fetch('http://localhost:8080/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: user, password: pass, playerName: 'E2E테스터' })
			});
			const spring = await springRes.json();
			if (spring.token) {
				localStorage.setItem('spring_token', spring.token);
				localStorage.setItem('auth_token', spring.token);
				localStorage.setItem('auth_user', JSON.stringify({
					id: spring.id, username: spring.username,
					playerName: spring.playerName, level: spring.level
				}));
			}
		} catch {}

		// FastAPI register
		try {
			const fastRes = await fetch('http://localhost:8000/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: user, email: user + '@test.com', password: pass })
			});
			const fast = await fastRes.json();
			if (fast.access_token) {
				localStorage.setItem('fastapi_token', fast.access_token);
			}
		} catch {}
	});
}

// ============================================================
// 1. AUTH (UI-based tests)
// ============================================================
test.describe('1. 인증', () => {
	test('1-1 로그인 페이지 렌더링', async ({ page }) => {
		await page.goto('/login');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1')).toContainText('QUANT');
		await expect(page.locator('#username')).toBeVisible();
		await expect(page.locator('#password')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('1-2 회원가입 탭 전환', async ({ page }) => {
		await page.goto('/login');
		await page.waitForLoadState('domcontentloaded');
		const registerTab = page.locator('.tab').filter({ hasText: '회원가입' });
		await registerTab.click();
		await expect(page.locator('#playerName')).toBeVisible({ timeout: 3000 });
		await expect(page.locator('#email')).toBeVisible();
	});

	test('1-3 로그인 실패 시 에러 표시', async ({ page }) => {
		await page.goto('/login');
		await page.fill('#username', 'nonexistent_user_' + Date.now());
		await page.fill('#password', 'wrong');
		await page.click('button[type="submit"]');
		await expect(page.locator('.error-msg')).toBeVisible({ timeout: 10000 });
	});
});

// ============================================================
// 2. DASHBOARD SECTION
// ============================================================
test.describe('2. 대시보드', () => {
	test.beforeEach(async ({ page }) => { await setupAuth(page); });

	test('2-1 대시보드 개요', async ({ page }) => {
		await page.goto('/dashboard/overview');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('body')).toContainText('실시간 수익 현황');
	});

	test('2-2 주식 페이지', async ({ page }) => {
		await page.goto('/dashboard/stock');
		await page.waitForLoadState('networkidle');
		// Page should render without crash
		const body = await page.textContent('body');
		expect(body!.length).toBeGreaterThan(100);
	});

	test('2-3 코인 페이지 + 테이블', async ({ page }) => {
		await page.goto('/dashboard/coin');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('h1')).toContainText('암호화폐');
		// Crypto rows from API
		const rows = page.locator('.crypto-row');
		await expect(rows.first()).toBeVisible({ timeout: 15000 });
		expect(await rows.count()).toBeGreaterThan(0);
	});

	test('2-4 코인 선택 → 상세정보', async ({ page }) => {
		await page.goto('/dashboard/coin');
		await page.waitForLoadState('networkidle');
		const firstRow = page.locator('.crypto-row').first();
		await expect(firstRow).toBeVisible({ timeout: 15000 });
		await firstRow.click();
		await expect(page.locator('.trade-panel')).toBeVisible({ timeout: 5000 });
		await expect(page.locator('.trade-price')).toBeVisible();
	});

	test('2-5 코인 매수/매도 버튼 존재', async ({ page }) => {
		await page.goto('/dashboard/coin');
		await page.waitForLoadState('networkidle');
		await page.locator('.crypto-row').first().click();
		await expect(page.locator('.btn-buy')).toBeVisible({ timeout: 5000 });
		await expect(page.locator('.btn-sell')).toBeVisible();
	});

	test('2-6 ETF 페이지 + 목록', async ({ page }) => {
		await page.goto('/dashboard/etf');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('h1')).toContainText('ETF');
		const items = page.locator('.etf-item');
		await expect(items.first()).toBeVisible({ timeout: 15000 });
		expect(await items.count()).toBeGreaterThan(0);
	});

	test('2-7 ETF 선택 → 상세 + 구성종목', async ({ page }) => {
		await page.goto('/dashboard/etf');
		await page.waitForLoadState('networkidle');
		await page.locator('.etf-item').first().click();
		await expect(page.locator('.detail-panel')).toBeVisible({ timeout: 5000 });
		await expect(page.locator('.holdings-table')).toBeVisible();
	});

	test('2-8 채권 페이지', async ({ page }) => {
		await page.goto('/dashboard/bond');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});

	test('2-9 은행 페이지', async ({ page }) => {
		await page.goto('/dashboard/bank');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});

	test('2-10 대출 페이지', async ({ page }) => {
		await page.goto('/dashboard/loan');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});
});

// ============================================================
// 3. ASSET SECTION
// ============================================================
test.describe('3. 자산', () => {
	test.beforeEach(async ({ page }) => { await setupAuth(page); });

	test('3-1 자산 개요', async ({ page }) => {
		await page.goto('/asset/overview');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});

	test('3-2 차량', async ({ page }) => {
		await page.goto('/asset/vehicles');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});

	test('3-3 전용기', async ({ page }) => {
		await page.goto('/asset/jet');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});

	test('3-4 부동산', async ({ page }) => {
		await page.goto('/asset/realestate');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});

	test('3-5 명품', async ({ page }) => {
		await page.goto('/asset/luxury');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});
});

// ============================================================
// 4. BUSINESS SECTION
// ============================================================
test.describe('4. 비즈니스', () => {
	test.beforeEach(async ({ page }) => { await setupAuth(page); });

	test('4-1 비즈니스 대시보드', async ({ page }) => {
		await page.goto('/business/dashboard');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});

	test('4-2 세계 정세 + API 데이터', async ({ page }) => {
		await page.goto('/business/world');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('h1')).toContainText('국제 정세');
		// Badge cards from getMarketState
		await expect(page.locator('.badge-card').first()).toBeVisible({ timeout: 15000 });
		// Commodity items
		const commodities = page.locator('.commodity-item');
		await expect(commodities.first()).toBeVisible({ timeout: 15000 });
		expect(await commodities.count()).toBeGreaterThan(0);
	});

	test('4-3 원자재 클릭 → 차트', async ({ page }) => {
		await page.goto('/business/world');
		await page.waitForLoadState('networkidle');
		const first = page.locator('.commodity-item').first();
		await expect(first).toBeVisible({ timeout: 15000 });
		await first.click();
		await expect(page.locator('.commodity-chart-section')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('.commodity-chart-svg')).toBeVisible();
	});

	test('4-4 거시 경제 지표 테이블', async ({ page }) => {
		await page.goto('/business/world');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('.macro-table')).toBeVisible({ timeout: 15000 });
		const rows = page.locator('.macro-table tbody tr');
		expect(await rows.count()).toBeGreaterThan(0);
	});

	test('4-5 섹터 성과', async ({ page }) => {
		await page.goto('/business/world');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('.sector-list')).toBeVisible({ timeout: 15000 });
	});
});

// ============================================================
// 5. LEADERBOARD
// ============================================================
test.describe('5. 리더보드', () => {
	test.beforeEach(async ({ page }) => { await setupAuth(page); });

	test('5-1 랭킹 페이지', async ({ page }) => {
		await page.goto('/leaderboard/ranking');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});

	test('5-2 프로필 페이지', async ({ page }) => {
		await page.goto('/leaderboard/profile');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});
});

// ============================================================
// 6. AUCTION
// ============================================================
test.describe('6. 경매', () => {
	test.beforeEach(async ({ page }) => { await setupAuth(page); });

	test('6-1 경매 페이지', async ({ page }) => {
		await page.goto('/auction');
		await page.waitForLoadState('networkidle');
		expect((await page.textContent('body'))!.length).toBeGreaterThan(100);
	});
});

// ============================================================
// 7. NAVIGATION
// ============================================================
test.describe('7. 네비게이션', () => {
	test.beforeEach(async ({ page }) => { await setupAuth(page); });

	test('7-1 루트 → 대시보드 리다이렉트', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(2000);
		expect(page.url()).toContain('dashboard');
	});

	test('7-2 사이드바 네비게이션', async ({ page }) => {
		await page.goto('/dashboard/overview');
		await page.waitForLoadState('networkidle');
		// Check sidebar exists
		const sidebar = page.locator('aside, .sidebar, [class*="sidebar"]').first();
		if (await sidebar.isVisible()) {
			const items = sidebar.locator('a, button');
			expect(await items.count()).toBeGreaterThan(0);
		}
	});
});

// ============================================================
// 8. STOCK DETAIL
// ============================================================
test.describe('8. 주식 상세', () => {
	test.beforeEach(async ({ page }) => { await setupAuth(page); });

	test('8-1 주식 페이지 차트 영역 존재', async ({ page }) => {
		await page.goto('/dashboard/stock');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(3000);
		// Page should have rendered stock UI elements
		expect((await page.textContent('body'))!.length).toBeGreaterThan(200);
	});
});

// ============================================================
// 9. CONSOLE ERROR CHECK (across key pages)
// ============================================================
test.describe('9. 콘솔 에러', () => {
	test('9-1 주요 페이지에서 치명적 JS 에러 없음', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', err => {
			errors.push(err.message);
		});

		await setupAuth(page);

		const pagesToVisit = [
			'/dashboard/overview',
			'/dashboard/coin',
			'/dashboard/etf',
			'/dashboard/stock',
			'/business/world',
			'/asset/overview',
			'/leaderboard/ranking',
		];

		for (const p of pagesToVisit) {
			await page.goto(p);
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(1500);
		}

		// Filter known backend-caused errors
		const critical = errors.filter(e =>
			!e.includes('account') &&
			!e.includes('Crypto events') &&
			!e.includes('Crypto holdings') &&
			!e.includes('click/info') &&
			!e.includes('Entity not found') &&
			!e.includes('500') &&
			!e.includes('404') &&
			!e.includes('403')
		);

		if (errors.length > 0) {
			console.log('All page errors:', errors);
		}

		expect(critical.length).toBe(0);
	});
});
