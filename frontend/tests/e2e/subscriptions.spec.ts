import { expect, test } from "@playwright/test";

/**
 * サブスクリプション管理ページのE2Eテスト
 * - サブスクリプション管理ページの基本的な表示確認
 * - 統計情報の表示確認
 * - サブスクリプション一覧の表示確認
 * - 新規登録ボタンの表示確認
 */
test.describe("サブスクリプション管理ページ", () => {
	test("ページが正常に表示される", async ({ page }) => {
		// サブスクリプション管理ページにアクセス
		await page.goto("/subscriptions");

		// ページタイトルが正しく設定されているか確認
		await expect(page).toHaveTitle(/Saifuu - 家計管理アプリ/);

		// メインタイトルが表示されているか確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション管理" }),
		).toBeVisible();

		// 説明文が表示されているか確認
		await expect(
			page.getByText("定期購読サービスの管理と費用の把握"),
		).toBeVisible();

		// 新規登録ボタンが表示されているか確認
		await expect(
			page.getByRole("button", { name: "新しいサブスクリプションを登録" }),
		).toBeVisible();
	});

	test("統計情報が正常に表示される", async ({ page }) => {
		await page.goto("/subscriptions");

		// 登録サービス数の統計が表示されているか確認
		await expect(page.getByText("登録サービス数")).toBeVisible();
		await expect(page.getByText(/\d+ サービス/)).toBeVisible();

		// 月間合計の統計が表示されているか確認
		await expect(page.getByText("月間合計")).toBeVisible();
		await expect(page.locator("text=¥").first()).toBeVisible();

		// 次回請求の統計が表示されているか確認
		await expect(
			page.locator(".text-sm.font-medium.text-gray-500", {
				hasText: "次回請求",
			}),
		).toBeVisible();
	});

	test("サブスクリプション一覧が表示される", async ({ page }) => {
		await page.goto("/subscriptions");

		// サブスクリプション一覧のタイトルが表示されているか確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション一覧" }),
		).toBeVisible();

		// 一覧の説明文が表示されているか確認
		await expect(
			page.getByText("現在登録されているサブスクリプションサービス"),
		).toBeVisible();

		// テーブルが表示されているか確認
		await expect(page.locator("table")).toBeVisible();

		// テーブルヘッダーが表示されているか確認
		await expect(
			page.getByRole("columnheader", { name: "サービス名" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "料金" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "次回請求日" }),
		).toBeVisible();

		// mockデータに基づいて、少なくとも1つのサブスクリプションが表示されることを確認
		const tableRows = page.locator("tbody tr");
		await expect(tableRows.first()).toBeVisible();
	});

	test("新規登録ボタンのクリック動作", async ({ page }) => {
		await page.goto("/subscriptions");

		// 新規登録ボタンを取得
		const newButton = page.getByRole("button", {
			name: "新しいサブスクリプションを登録",
		});
		await expect(newButton).toBeVisible();

		// ボタンがクリック可能な状態であることを確認
		await expect(newButton).toBeEnabled();

		// ボタンをクリック（現在はUIのみなので、クリック可能であることを確認するだけ）
		await newButton.click();
	});

	test("レスポンシブデザインの確認", async ({ page }) => {
		// モバイルサイズでのテスト
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/subscriptions");

		// メインタイトルが表示されているか確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション管理" }),
		).toBeVisible();

		// 新規登録ボタンが表示されているか確認
		await expect(
			page.getByRole("button", { name: "新しいサブスクリプションを登録" }),
		).toBeVisible();

		// 統計情報が表示されているか確認
		await expect(page.getByText("登録サービス数")).toBeVisible();
		await expect(page.getByText("月間合計")).toBeVisible();
		await expect(
			page.locator(".text-sm.font-medium.text-gray-500", {
				hasText: "次回請求",
			}),
		).toBeVisible();

		// デスクトップサイズに戻す
		await page.setViewportSize({ width: 1280, height: 800 });

		// 同様に表示されることを確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション管理" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "新しいサブスクリプションを登録" }),
		).toBeVisible();
	});
});
