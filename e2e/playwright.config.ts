import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright設定ファイル
 * - ローカル環境およびCI環境でE2Eテストを実行
 * - Chrome専用: PC ChromeとスマホChromeのみサポート
 * - 正常系テストのみ実装（エラーハンドリング・パフォーマンステストは対象外）
 */
export default defineConfig({
	// テストディレクトリの設定
	testDir: ".",

	// 並列実行設定
	fullyParallel: true,

	// 最初の失敗で即座にテストを停止（CI・ローカル共通）
	maxFailures: 1,

	// test.only()の使用を禁止（CI環境では禁止、ローカルでは許可）
	forbidOnly: !!process.env.CI,

	// 再試行回数（失敗時は即座に終了）
	retries: 0,

	// 並列ワーカー数（CI環境では2ワーカーに制限）
	workers: process.env.CI ? 2 : undefined,

	// レポーター設定
	reporter: "html",

	// 共通設定
	use: {
		// ベースURL（開発サーバー）
		baseURL: "http://localhost:3000",

		// ヘッドレスモード（CI環境では必須、ローカルでも推奨）
		headless: true,

		// 失敗時のスクリーンショット
		screenshot: "only-on-failure",

		// 失敗時のビデオ録画
		video: "retain-on-failure",

		// トレース設定（再試行なしのため無効）
		trace: "off",
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
