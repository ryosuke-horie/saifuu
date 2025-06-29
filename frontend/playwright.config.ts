import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright設定ファイル
 * - 開発環境でのみE2Eテストを実行
 * - ChromeデスクトップとAndroid Chromeのみでテスト
 * - その他のブラウザやデバイスは不要
 */
export default defineConfig({
	// テストディレクトリの設定
	testDir: "./tests/e2e",

	// 並列実行設定
	fullyParallel: true,

	// CIでのテスト失敗時の動作
	forbidOnly: !!process.env.CI,

	// 再試行回数（CIでは2回、ローカルでは0回）
	retries: process.env.CI ? 2 : 0,

	// 並列ワーカー数（CIでは1、ローカルでは半分のCPU数）
	workers: process.env.CI ? 1 : undefined,

	// レポーター設定
	reporter: "html",

	// 共通設定
	use: {
		// ベースURL（開発サーバー）
		baseURL: "http://localhost:3000",

		// 失敗時のスクリーンショット
		screenshot: "only-on-failure",

		// 失敗時のビデオ録画
		video: "retain-on-failure",

		// トレース設定
		trace: "on-first-retry",
	},

	// テスト対象のプロジェクト設定
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

	// 開発サーバーの起動設定（テスト実行前に自動起動）
	webServer: {
		command: "npm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
