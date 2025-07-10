import { expect, test } from "@playwright/test";

/**
 * サブスクリプション管理のE2Eテスト
 * - 正常系のサブスクリプション登録フローのみテスト
 * - GitHub Actions無料枠節約のため最小限のテストケース
 * - 基本的な表示確認と統合フロー確認を含む
 */
test.describe("サブスクリプション管理", () => {
	test("新規サブスクリプション登録と一覧表示", async ({ page }) => {
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

		// サブスクリプション管理画面にアクセス
		await page.goto("/subscriptions");

		// ページタイトルが正しく設定されているか確認
		await expect(page).toHaveTitle(/Saifuu - 家計管理アプリ/);

		// メインヘッダーが表示されているか確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション管理" }),
		).toBeVisible();

		// 説明文が表示されているか確認
		await expect(
			page.getByText("定期購読サービスの管理と費用の把握"),
		).toBeVisible();

		// 統計情報の基本表示確認
		await expect(page.getByText("登録サービス数")).toBeVisible();
		await expect(page.getByText("月間合計")).toBeVisible();

		// サブスクリプション一覧の基本表示確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション一覧" }),
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

		// ブラウザコンソールでのカテゴリ読み込みエラーを確認
		const consoleMessages = [];
		page.on('console', msg => {
			if (msg.type() === 'error' || msg.text().includes('categor')) {
				consoleMessages.push(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
				console.log(`[E2E CONSOLE] ${msg.type()}: ${msg.text()}`);
			}
		});

		// ネットワークリクエストを監視
		const networkRequests = [];
		page.on('request', request => {
			if (request.url().includes('categories')) {
				networkRequests.push({
					url: request.url(),
					method: request.method(),
					timestamp: Date.now()
				});
				console.log(`[E2E NETWORK] REQUEST: ${request.method()} ${request.url()}`);
			}
		});

		page.on('response', response => {
			if (response.url().includes('categories')) {
				console.log(`[E2E NETWORK] RESPONSE: ${response.status()} ${response.url()}`);
			}
		});

		// カテゴリデータの読み込みを待つ（カテゴリセレクトボックスが有効になるまで）
		const categorySelect = page.getByLabel("カテゴリ");
		console.log("[E2E] カテゴリセレクトボックスの有効化を待機中...");
		
		// カテゴリセレクトボックスの状態をデバッグ
		await page.waitForTimeout(2000); // 少し待ってから状態チェック
		const selectInfo = await page.evaluate(() => {
			const select = document.querySelector("#subscription-category");
			if (!select) return { found: false };
			return {
				found: true,
				disabled: select.disabled,
				optionsCount: select.options ? select.options.length : 0,
				optionsText: select.options ? Array.from(select.options).map(opt => opt.text) : [],
				innerHTML: select.innerHTML.substring(0, 200)
			};
		});
		console.log("[E2E] セレクトボックス状態:", JSON.stringify(selectInfo, null, 2));

		// カテゴリ読み込み状態の詳細確認
		const categoryState = await page.evaluate(() => {
			// Reactコンポーネントの状態を確認（window.React開発ツール等があれば）
			return {
				location: window.location.href,
				userAgent: navigator.userAgent,
				timestamp: new Date().toISOString()
			};
		});
		console.log("[E2E] ブラウザ状態:", JSON.stringify(categoryState, null, 2));
		
		await expect(categorySelect).toBeEnabled({ timeout: 30000 });

		// カテゴリが実際に読み込まれていることを確認（プレースホルダーではないことを確認）
		await page.waitForFunction(
			() => {
				const select = document.querySelector("#subscription-category");
				return (
					select &&
					select instanceof HTMLSelectElement &&
					select.options.length > 1
				); // デフォルトオプション以外にも選択肢があることを確認
			},
			{ timeout: 20000 },
		);

		console.log("[E2E] カテゴリセレクトボックスが有効化され、選択肢が準備完了");

		// カテゴリを選択（最初の利用可能なカテゴリを選択）
		// selectOption()メソッドを使用してより確実に選択
		await categorySelect.selectOption({ index: 1 });
		console.log("[E2E] カテゴリを選択しました");

		// 登録ボタンをクリック（ダイアログ内の登録ボタンを明確に指定）
		const dialog = page.getByRole("dialog", {
			name: "新規サブスクリプション登録",
		});
		const registerButton = dialog.getByRole("button", { name: "登録" });
		await expect(registerButton).toBeEnabled();

		console.log("[E2E] サブスクリプション登録を実行中...");
		await registerButton.click();

		// ダイアログが閉じることを確認
		console.log("[E2E] ダイアログクローズの確認中...");
		await expect(
			page.getByRole("dialog", { name: "新規サブスクリプション登録" }),
		).not.toBeVisible({ timeout: 10000 });

		// 一覧に新しく登録したサブスクリプションが表示されることを確認
		// APIへの登録とページ更新を待つ
		console.log("[E2E] サブスクリプション一覧の更新を待機中...");
		await page.waitForTimeout(3000);

		// 登録後のAPIでの確認
		const subscriptionsResponse = await page.request.get(
			"http://localhost:3003/api/subscriptions",
		);
		expect(subscriptionsResponse.status()).toBe(200);
		const subscriptions = await subscriptionsResponse.json();
		console.log("[E2E] 登録後のサブスクリプション数:", subscriptions.length);

		// サブスクリプション一覧テーブルが表示されていることを確認
		const subscriptionTable = page.getByRole("table");
		await expect(subscriptionTable).toBeVisible();

		// テーブルヘッダーが正しく表示されていることを確認
		await expect(
			page.getByRole("columnheader", { name: "サービス名" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "料金" }),
		).toBeVisible();

		// 登録したNetflix（1,980円）が一覧に表示されていることを確認
		const netflixRow = page
			.getByRole("row")
			.filter({ hasText: "Netflix" })
			.filter({ hasText: "1,980" })
			.first();
		await expect(netflixRow).toBeVisible();

		// 料金が正しく表示されていることを確認
		await expect(netflixRow).toContainText("1,980");
	});
});
