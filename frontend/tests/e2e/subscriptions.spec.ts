import { expect, test } from "@playwright/test";

/**
 * サブスクリプション管理のE2Eテスト
 * - 正常系のサブスクリプション登録フローのみテスト
 * - GitHub Actions無料枠節約のため最小限のテストケース
 */
test.describe("サブスクリプション管理", () => {
	test("新規サブスクリプション登録と一覧表示", async ({ page }) => {
		// サブスクリプション管理画面にアクセス
		await page.goto("/subscriptions");

		// ページタイトルが正しく設定されているか確認
		await expect(page).toHaveTitle(/Saifuu - 家計管理アプリ/);

		// メインヘッダーが表示されているか確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション管理" }),
		).toBeVisible();

		// ページのローディングを待つ
		await page.waitForTimeout(2000);

		// デバッグ: 利用可能なボタンを全てログ出力
		const buttons = await page.locator("button").all();
		console.log(
			"Available buttons:",
			await Promise.all(
				buttons.map(async (btn) => {
					const text = await btn.textContent();
					const visible = await btn.isVisible();
					return { text, visible };
				}),
			),
		);

		// 新規登録ボタンを検索してクリック
		const addButton = page.getByText("新規登録");
		await expect(addButton).toBeVisible();

		// 新規登録ボタンをクリックしてダイアログを開く
		await addButton.click();

		// ダイアログが表示されることを確認
		await expect(
			page.getByRole("dialog", { name: "新規サブスクリプション登録" }),
		).toBeVisible();

		// フォームに必要な情報を入力
		await page.getByLabel("サービス名").fill("Netflix");
		await page.getByLabel("料金（円）").fill("1980");

		// 次回請求日を設定（来月の15日）
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		nextMonth.setDate(15);
		const nextBillingDate = nextMonth.toISOString().split("T")[0];
		await page.getByLabel("次回請求日").fill(nextBillingDate);

		// カテゴリデータの読み込みを待つ（カテゴリセレクトボックスが有効になるまで）
		const categorySelect = page.getByLabel("カテゴリ");
		await expect(categorySelect).toBeEnabled({ timeout: 10000 });
		
		// カテゴリを選択
		await categorySelect.click();

		// 利用可能なカテゴリから最初のオプションを選択（プレースホルダー以外）
		const options = page.getByRole("option");
		const optionCount = await options.count();
		if (optionCount > 1) {
			// 最初は「カテゴリを選択してください」なので2番目を選択
			await options.nth(1).click();
		}

		// 登録ボタンをクリック
		const registerButton = page.getByRole("button", { name: "登録" });
		await expect(registerButton).toBeEnabled();
		await registerButton.click();

		// ダイアログが閉じることを確認
		await expect(
			page.getByRole("dialog", { name: "新規サブスクリプション登録" }),
		).not.toBeVisible();

		// 一覧に新しく登録したサブスクリプションが表示されることを確認
		// ローディング状態が終了するまで少し待つ
		await page.waitForTimeout(3000);

		// サブスクリプション一覧テーブルが表示されていることを確認
		const subscriptionTable = page.getByRole("table");
		await expect(subscriptionTable).toBeVisible();

		// 登録したNetflixが一覧に表示されていることを確認
		const netflixRow = page.getByRole("row").filter({ hasText: "Netflix" });
		await expect(netflixRow).toBeVisible();

		// 料金が正しく表示されていることを確認
		await expect(netflixRow).toContainText("1,980");

		// 活性状態が表示されていることを確認（デフォルトで有効）
		await expect(netflixRow).toContainText("有効");
	});
});
