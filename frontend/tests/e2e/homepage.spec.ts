import { expect, test } from "@playwright/test";

/**
 * トップページのE2Eテスト
 * - Next.jsテンプレートページへの基本的なアクセステスト
 * - 主要な要素の表示確認
 */
test.describe("トップページ", () => {
	test("ページが正常に表示される", async ({ page }) => {
		// トップページにアクセス
		await page.goto("/");

		// ページタイトルが正しく設定されているか確認
		await expect(page).toHaveTitle(/Create Next App/);

		// Next.jsロゴが表示されているか確認
		const nextLogo = page.locator('img[alt="Next.js logo"]');
		await expect(nextLogo).toBeVisible();

		// メインコンテンツが表示されているか確認
		await expect(page.locator("main")).toBeVisible();

		// 「Get started by editing」テキストが表示されているか確認
		await expect(page.getByText("Get started by editing")).toBeVisible();

		// 「Deploy now」ボタンが表示されているか確認
		const deployButton = page.getByRole("link", { name: "Deploy now" });
		await expect(deployButton).toBeVisible();

		// 「Read our docs」ボタンが表示されているか確認
		const docsButton = page.getByRole("link", { name: "Read our docs" });
		await expect(docsButton).toBeVisible();

		// フッターが表示されているか確認
		await expect(page.locator("footer")).toBeVisible();

		// フッターのリンクが表示されているか確認
		await expect(page.getByRole("link", { name: "Learn" })).toBeVisible();
		await expect(page.getByRole("link", { name: "Examples" })).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Go to nextjs.org →" }),
		).toBeVisible();
	});

	test("外部リンクが正しく設定されている", async ({ page }) => {
		await page.goto("/");

		// Deploy nowボタンのリンクが正しく設定されているか確認
		const deployButton = page.getByRole("link", { name: "Deploy now" });
		await expect(deployButton).toHaveAttribute("href", /vercel\.com/);
		await expect(deployButton).toHaveAttribute("target", "_blank");

		// Read our docsボタンのリンクが正しく設定されているか確認
		const docsButton = page.getByRole("link", { name: "Read our docs" });
		await expect(docsButton).toHaveAttribute("href", /nextjs\.org\/docs/);
		await expect(docsButton).toHaveAttribute("target", "_blank");
	});
});
