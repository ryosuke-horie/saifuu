import { expect, test } from "@playwright/test";

/**
 * 本番環境向けホームページスモークテスト
 * - サイトの基本的な可用性を確認
 * - 高速実行を重視し、必要最小限のチェックのみ実装
 */
test.describe("ホームページ - スモークテスト", () => {
	test("サイトが正常にロードされる", async ({ page }) => {
		// トップページにアクセス
		await page.goto("/");

		// ページタイトルが正しく設定されているか確認
		await expect(page).toHaveTitle(/Saifuu - 家計管理アプリ/);

		// メインコンテンツが表示されているか確認
		await expect(page.locator("main")).toBeVisible();

		// 基本的なナビゲーション要素が存在するか確認
		await expect(page.locator("footer")).toBeVisible();
	});
});