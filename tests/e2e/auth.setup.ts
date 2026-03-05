import { test, expect, type Page } from '@playwright/test';

const TEST_USER = 'e2e_tester_' + Date.now();
const TEST_PASS = 'testpass1234';
const TEST_PLAYER = 'E2E테스터';

/** Register a new user and verify redirect to dashboard */
export async function registerAndLogin(page: Page) {
	await page.goto('/login');
	await expect(page.locator('h1')).toContainText('QUANT');

	// Switch to register tab
	await page.click('button:has-text("회원가입")');
	await expect(page.locator('#playerName')).toBeVisible();

	// Fill registration form
	await page.fill('#username', TEST_USER);
	await page.fill('#password', TEST_PASS);
	await page.fill('#playerName', TEST_PLAYER);

	// Submit
	await page.click('button[type="submit"]');

	// Should redirect to dashboard
	await page.waitForURL(/dashboard/, { timeout: 10000 });
	await expect(page).toHaveURL(/dashboard\/overview/);
}

/** Login with existing credentials */
export async function login(page: Page, username: string, password: string) {
	await page.goto('/login');

	// Ensure login tab is active
	await page.click('button:has-text("로그인")');

	await page.fill('#username', username);
	await page.fill('#password', password);
	await page.click('button[type="submit"]');

	await page.waitForURL(/dashboard/, { timeout: 10000 });
}

test.describe('인증', () => {
	test('회원가입 후 대시보드로 이동', async ({ page }) => {
		await registerAndLogin(page);

		// Verify we're on the dashboard
		const content = await page.textContent('body');
		expect(content).toBeTruthy();
	});

	test('로그인 실패 시 에러 표시', async ({ page }) => {
		await page.goto('/login');
		await page.fill('#username', 'nonexistent_user_xyz');
		await page.fill('#password', 'wrongpassword');
		await page.click('button[type="submit"]');

		// Should show error message
		await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5000 });
	});
});
