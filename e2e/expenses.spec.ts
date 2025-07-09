import { expect, test } from "@playwright/test";

/**
 * 支出・収入管理のE2Eテスト
 * - 正常系の支出・収入登録フローのみテスト
 * - GitHub Actions無料枠節約のため最小限のテストケース
 * - 基本的な表示確認と統合フロー確認を含む
 */
test.describe("支出・収入管理", () => {
	test("新規支出の登録と一覧表示", async ({ page }) => {
		// E2E環境のAPI準備状態を確認
		console.log("[E2E] API準備状態の確認を開始");
		const apiHealthResponse = await page.request.get(
			"http://localhost:3003/api/health",
		);
		expect(apiHealthResponse.status()).toBe(200);

		const healthData = await apiHealthResponse.json();
		console.log("[E2E] API Health Check:", healthData);

		// カテゴリデータの事前確認
		const categoriesResponse = await page.request.get(
			"http://localhost:3003/api/categories",
		);
		expect(categoriesResponse.status()).toBe(200);

		const categories = await categoriesResponse.json();
		console.log("[E2E] Available categories:", categories.length);
		expect(categories.length).toBeGreaterThan(0); // カテゴリが少なくとも1つは存在することを確認

		// 支出・収入管理画面にアクセス
		await page.goto("/expenses");

		// ページタイトルが正しく設定されているか確認
		await expect(page).toHaveTitle(/Saifuu - 家計管理アプリ/);

		// メインヘッダーが表示されているか確認
		await expect(
			page.getByRole("heading", { name: "支出・収入管理" }),
		).toBeVisible();

		// 説明文が表示されているか確認
		await expect(
			page.getByText("支出・収入の記録と管理"),
		).toBeVisible();

		// ページのローディングを待つ
		await page.waitForTimeout(2000);

		// 新規登録ボタンを検索してクリック
		const addButton = page.getByText("新規登録");
		await expect(addButton).toBeVisible();

		// 新規登録ボタンをクリックしてダイアログを開く
		await addButton.click();

		// ダイアログが表示されることを確認
		await expect(
			page.getByRole("dialog", { name: "新規支出・収入登録" }),
		).toBeVisible();

		// フォームに必要な情報を入力
		await page.getByLabel("金額（円）").fill("1000");
		
		// 種別を選択（支出）
		await page.getByLabel("種別").selectOption("expense");
		
		// 日付を入力（今日の日付）
		const today = new Date().toISOString().split("T")[0];
		await page.getByLabel("日付").fill(today);
		
		// 説明を入力
		await page.getByLabel("説明").fill("コンビニ弁当");

		// カテゴリデータの読み込みを待つ（カテゴリセレクトボックスが有効になるまで）
		const categorySelect = page.getByLabel("カテゴリ");
		console.log("[E2E] カテゴリセレクトボックスの有効化を待機中...");
		await expect(categorySelect).toBeEnabled({ timeout: 15000 });

		// カテゴリが実際に読み込まれていることを確認（プレースホルダーではないことを確認）
		await page.waitForFunction(
			() => {
				const select = document.querySelector("#expense-category");
				return (
					select &&
					select instanceof HTMLSelectElement &&
					select.options.length > 1
				); // デフォルトオプション以外にも選択肢があることを確認
			},
			{ timeout: 10000 },
		);

		console.log("[E2E] カテゴリセレクトボックスが有効化され、選択肢が準備完了");

		// カテゴリを選択（最初の利用可能なカテゴリを選択）
		// selectOption()メソッドを使用してより確実に選択
		await categorySelect.selectOption({ index: 1 });
		console.log("[E2E] カテゴリを選択しました");

		// 登録ボタンをクリック（ダイアログ内の登録ボタンを明確に指定）
		const dialog = page.getByRole("dialog", {
			name: "新規支出・収入登録",
		});
		const registerButton = dialog.getByRole("button", { name: "登録" });
		await expect(registerButton).toBeEnabled();

		console.log("[E2E] 支出・収入登録を実行中...");
		await registerButton.click();

		// ダイアログが閉じることを確認
		console.log("[E2E] ダイアログクローズの確認中...");
		await expect(
			page.getByRole("dialog", { name: "新規支出・収入登録" }),
		).not.toBeVisible({ timeout: 10000 });

		// 一覧に新しく登録した支出・収入が表示されることを確認
		// APIへの登録とページ更新を待つ
		console.log("[E2E] 支出・収入一覧の更新を待機中...");
		await page.waitForTimeout(3000);

		// 登録後のAPIでの確認
		const transactionsResponse = await page.request.get(
			"http://localhost:3003/api/transactions",
		);
		expect(transactionsResponse.status()).toBe(200);
		const transactions = await transactionsResponse.json();
		console.log("[E2E] 登録後の取引数:", transactions.length);

		// 支出・収入一覧テーブルが表示されていることを確認
		const transactionTable = page.getByRole("table");
		await expect(transactionTable).toBeVisible();

		// テーブルヘッダーが正しく表示されていることを確認
		await expect(
			page.getByRole("columnheader", { name: "日付" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "金額" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "カテゴリ" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "説明" }),
		).toBeVisible();

		// 登録したコンビニ弁当（1,000円）が一覧に表示されていることを確認
		const transactionRow = page
			.getByRole("row")
			.filter({ hasText: "コンビニ弁当" })
			.filter({ hasText: "1,000" })
			.first();
		await expect(transactionRow).toBeVisible();

		// 金額が正しく表示されていることを確認
		await expect(transactionRow).toContainText("1,000");
	});

	test("新規収入の登録と一覧表示", async ({ page }) => {
		// E2E環境のAPI準備状態を確認
		console.log("[E2E] API準備状態の確認を開始");
		const apiHealthResponse = await page.request.get(
			"http://localhost:3003/api/health",
		);
		expect(apiHealthResponse.status()).toBe(200);

		// 支出・収入管理画面にアクセス
		await page.goto("/expenses");

		// ページタイトルが正しく設定されているか確認
		await expect(page).toHaveTitle(/Saifuu - 家計管理アプリ/);

		// ページのローディングを待つ
		await page.waitForTimeout(2000);

		// 新規登録ボタンを検索してクリック
		const addButton = page.getByText("新規登録");
		await expect(addButton).toBeVisible();

		// 新規登録ボタンをクリックしてダイアログを開く
		await addButton.click();

		// ダイアログが表示されることを確認
		await expect(
			page.getByRole("dialog", { name: "新規支出・収入登録" }),
		).toBeVisible();

		// フォームに必要な情報を入力
		await page.getByLabel("金額（円）").fill("50000");
		
		// 種別を選択（収入）
		await page.getByLabel("種別").selectOption("income");
		
		// 日付を入力（今日の日付）
		const today = new Date().toISOString().split("T")[0];
		await page.getByLabel("日付").fill(today);
		
		// 説明を入力
		await page.getByLabel("説明").fill("副業収入");

		// カテゴリデータの読み込みを待つ（カテゴリセレクトボックスが有効になるまで）
		const categorySelect = page.getByLabel("カテゴリ");
		console.log("[E2E] カテゴリセレクトボックスの有効化を待機中...");
		await expect(categorySelect).toBeEnabled({ timeout: 15000 });

		// カテゴリを選択（最初の利用可能なカテゴリを選択）
		await categorySelect.selectOption({ index: 1 });
		console.log("[E2E] カテゴリを選択しました");

		// 登録ボタンをクリック
		const dialog = page.getByRole("dialog", {
			name: "新規支出・収入登録",
		});
		const registerButton = dialog.getByRole("button", { name: "登録" });
		await expect(registerButton).toBeEnabled();

		console.log("[E2E] 支出・収入登録を実行中...");
		await registerButton.click();

		// ダイアログが閉じることを確認
		console.log("[E2E] ダイアログクローズの確認中...");
		await expect(
			page.getByRole("dialog", { name: "新規支出・収入登録" }),
		).not.toBeVisible({ timeout: 10000 });

		// 一覧に新しく登録した収入が表示されることを確認
		console.log("[E2E] 支出・収入一覧の更新を待機中...");
		await page.waitForTimeout(3000);

		// 登録した副業収入（50,000円）が一覧に表示されていることを確認
		const transactionRow = page
			.getByRole("row")
			.filter({ hasText: "副業収入" })
			.filter({ hasText: "50,000" })
			.first();
		await expect(transactionRow).toBeVisible();

		// 金額が正しく表示されていることを確認
		await expect(transactionRow).toContainText("50,000");
	});

	test("支出・収入フォームのバリデーション", async ({ page }) => {
		// 支出・収入管理画面にアクセス
		await page.goto("/expenses");

		// ページのローディングを待つ
		await page.waitForTimeout(2000);

		// 新規登録ボタンをクリック
		const addButton = page.getByText("新規登録");
		await addButton.click();

		// ダイアログが表示されることを確認
		await expect(
			page.getByRole("dialog", { name: "新規支出・収入登録" }),
		).toBeVisible();

		// 金額に負の値を入力
		await page.getByLabel("金額（円）").fill("-100");
		
		// 種別を選択（支出）
		await page.getByLabel("種別").selectOption("expense");
		
		// 日付を入力（今日の日付）
		const today = new Date().toISOString().split("T")[0];
		await page.getByLabel("日付").fill(today);

		// 登録ボタンをクリック
		const dialog = page.getByRole("dialog", {
			name: "新規支出・収入登録",
		});
		const registerButton = dialog.getByRole("button", { name: "登録" });
		await registerButton.click();

		// バリデーションエラーが表示されることを確認
		await expect(
			page.getByText("金額は正の数値で入力してください"),
		).toBeVisible();

		// ダイアログが閉じないことを確認
		await expect(
			page.getByRole("dialog", { name: "新規支出・収入登録" }),
		).toBeVisible();
	});
});