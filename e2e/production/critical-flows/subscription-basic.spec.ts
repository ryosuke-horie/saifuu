import { expect, test } from "@playwright/test";

/**
 * 本番環境向けサブスクリプション基本フローテスト
 * - ビジネスクリティカルな機能の最小限の動作確認
 * - 高速実行を重視し、UI表示確認のみ実装
 */
test.describe("サブスクリプション管理 - 基本フロー", () => {
	test("サブスクリプション画面が正常に表示される", async ({ page }) => {
		// サブスクリプション管理画面にアクセス
		await page.goto("/subscriptions");

		// ページタイトルが正しく設定されているか確認
		await expect(page).toHaveTitle(/Saifuu - 家計管理アプリ/);

		// メインヘッダーが表示されているか確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション管理" }),
		).toBeVisible();

		// 基本的なUI要素が表示されているか確認
		await expect(page.getByText("登録サービス数")).toBeVisible();
		await expect(page.getByText("月間合計")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "サブスクリプション一覧" }),
		).toBeVisible();

		// 新規登録ボタンが表示されているか確認
		await expect(page.getByText("新規登録")).toBeVisible();
	});
});