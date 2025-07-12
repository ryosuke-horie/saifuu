import { expect, test } from "@playwright/test";

/**
 * 支出統計コンポーネントのE2Eテスト
 * - 統計情報の表示確認
 * - ローディング状態の確認
 * - エラー状態の確認
 */
test.describe("支出統計 (ExpenseStats)", () => {
	test.beforeEach(async ({ page }) => {
		// 支出管理ページにアクセス
		await page.goto("/expenses");
	});

	test("統計カードが正常に表示される", async ({ page }) => {
		// 統計コンポーネントが表示されるまで待機
		const statsContainer = page.locator('[data-testid="expense-stats"]');
		await expect(statsContainer).toBeVisible();

		// 月間収支カードの確認
		const monthlyBalanceCard = page.locator('[data-testid="monthly-balance-card"]');
		await expect(monthlyBalanceCard).toBeVisible();
		await expect(monthlyBalanceCard.locator('h3')).toContainText('月間収支');

		// 収入金額の表示確認
		const incomeAmount = page.locator('[data-testid="total-income"]');
		await expect(incomeAmount).toBeVisible();
		await expect(incomeAmount).toContainText('¥');

		// 支出金額の表示確認
		const expenseAmount = page.locator('[data-testid="total-expense"]');
		await expect(expenseAmount).toBeVisible();
		await expect(expenseAmount).toContainText('¥');

		// 差額の表示確認
		const balanceAmount = page.locator('[data-testid="balance-amount"]');
		await expect(balanceAmount).toBeVisible();
		await expect(balanceAmount).toContainText('¥');
	});

	test("主要カテゴリ情報が表示される", async ({ page }) => {
		// 主要カテゴリカードの確認
		const topCategoriesCard = page.locator('[data-testid="top-categories-card"]');
		await expect(topCategoriesCard).toBeVisible();
		await expect(topCategoriesCard.locator('h3')).toContainText('主要カテゴリ');

		// 最大支出カテゴリの表示確認
		const topExpenseCategory = page.locator('[data-testid="top-expense-category"]');
		await expect(topExpenseCategory).toBeVisible();

		// 最大収入カテゴリの表示確認
		const topIncomeCategory = page.locator('[data-testid="top-income-category"]');
		await expect(topIncomeCategory).toBeVisible();
	});

	test("期間比較情報が表示される", async ({ page }) => {
		// 期間比較カードの確認
		const periodComparisonCard = page.locator('[data-testid="period-comparison-card"]');
		await expect(periodComparisonCard).toBeVisible();
		await expect(periodComparisonCard.locator('h3')).toContainText('前月比');

		// 前月比の数値確認
		const monthlyComparison = page.locator('[data-testid="monthly-comparison"]');
		await expect(monthlyComparison).toBeVisible();
		await expect(monthlyComparison).toContainText('%');
	});

	test("レスポンシブデザインが正常に動作する", async ({ page }) => {
		// モバイルサイズでのテスト
		await page.setViewportSize({ width: 375, height: 667 });
		
		const statsContainer = page.locator('[data-testid="expense-stats"]');
		await expect(statsContainer).toBeVisible();

		// モバイルでもカードが適切に表示されることを確認
		const cards = page.locator('[data-testid*="-card"]');
		const cardCount = await cards.count();
		expect(cardCount).toBeGreaterThanOrEqual(3);

		// タブレットサイズでのテスト
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(statsContainer).toBeVisible();

		// デスクトップサイズでのテスト
		await page.setViewportSize({ width: 1024, height: 768 });
		await expect(statsContainer).toBeVisible();
	});

	test("ローディング状態が正常に表示される", async ({ page }) => {
		// ネットワークを遅延させてローディング状態をテスト
		await page.route('**/api/transactions/stats', async route => {
			// 2秒の遅延を追加
			await new Promise(resolve => setTimeout(resolve, 2000));
			await route.continue();
		});

		await page.goto("/expenses");

		// ローディングスピナーの確認
		const loadingSpinner = page.locator('[data-testid="stats-loading"]');
		await expect(loadingSpinner).toBeVisible();
		await expect(loadingSpinner).toContainText('読み込み中');

		// ローディング完了後、統計が表示されることを確認
		await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });
		
		const statsContainer = page.locator('[data-testid="expense-stats"]');
		await expect(statsContainer).toBeVisible();
	});

	test("エラー状態が正常に表示される", async ({ page }) => {
		// APIエラーをシミュレート
		await page.route('**/api/transactions/stats', async route => {
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Internal Server Error' })
			});
		});

		await page.goto("/expenses");

		// エラーメッセージの確認
		const errorMessage = page.locator('[data-testid="stats-error"]');
		await expect(errorMessage).toBeVisible();
		await expect(errorMessage).toContainText('エラー');

		// リトライボタンの確認
		const retryButton = page.locator('[data-testid="stats-retry-button"]');
		await expect(retryButton).toBeVisible();
		await expect(retryButton).toContainText('再試行');
	});

	test("空データ状態が正常に表示される", async ({ page }) => {
		// 空の統計データをモック
		await page.route('**/api/transactions/stats', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					totalIncome: 0,
					totalExpense: 0,
					balance: 0,
					transactionCount: 0
				})
			});
		});

		await page.goto("/expenses");

		// 空状態メッセージの確認
		const emptyState = page.locator('[data-testid="stats-empty"]');
		await expect(emptyState).toBeVisible();
		await expect(emptyState).toContainText('データがありません');

		// 取引登録の案内メッセージ確認
		await expect(emptyState).toContainText('取引を登録');
	});

	test("統計数値のフォーマットが正確である", async ({ page }) => {
		// 特定の統計データをモック
		await page.route('**/api/transactions/stats', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					totalIncome: 123456,
					totalExpense: 98765,
					balance: 24691,
					transactionCount: 42
				})
			});
		});

		await page.goto("/expenses");

		// 数値フォーマットの確認（日本円形式）
		const incomeAmount = page.locator('[data-testid="total-income"]');
		await expect(incomeAmount).toContainText('¥123,456');

		const expenseAmount = page.locator('[data-testid="total-expense"]');
		await expect(expenseAmount).toContainText('¥98,765');

		const balanceAmount = page.locator('[data-testid="balance-amount"]');
		await expect(balanceAmount).toContainText('¥24,691');
	});
});