import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright設定ファイル
 * - ローカル環境でのみE2Eテストを実行（CI環境では実行しない）
 * - Chrome専用: PC ChromeとスマホChromeのみサポート
 * - 正常系テストのみ実装（エラーハンドリング・パフォーマンステストは対象外）
 */
export default defineConfig({
	// テストディレクトリの設定
	testDir: ".",

	// 並列実行設定
	fullyParallel: true,

	// test.only()の使用を禁止（ローカル開発では許可）
	forbidOnly: false,

	// 再試行回数（ローカル環境では再試行なし）
	retries: 0,

	// 並列ワーカー数（ローカル専用のため、CIでの実行は想定しない）
	workers: undefined,

	// レポーター設定
	reporter: "html",

	// 共通設定
	use: {
		// ベースURL（開発サーバー）
		baseURL: "http://localhost:3005",

		// 失敗時のスクリーンショット
		screenshot: "only-on-failure",

		// 失敗時のビデオ録画
		video: "retain-on-failure",

		// トレース設定
		trace: "on-first-retry",
	},

	// テスト対象のプロジェクト設定
	// Chrome専用: 開発者のみが利用するため、PC ChromeとスマホChromeのみサポート
	projects: [
		{
			name: "Desktop Chrome",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"] },
		},
	],

	// 開発サーバーは手動で起動することを想定（自動起動は無効）
	// webServer設定をコメントアウト
	// webServer: [
	// 	{
	// 		command: "cd ../frontend && pnpm run dev",
	// 		url: "http://localhost:3000",
	// 		reuseExistingServer: true,
	// 		timeout: 120 * 1000,
	// 	},
	// 	{
	// 		command: "cd ../api && pnpm run dev",
	// 		url: "http://localhost:5173/api/health",
	// 		reuseExistingServer: true,
	// 		timeout: 120 * 1000,
	// 	},
	// ],
});
