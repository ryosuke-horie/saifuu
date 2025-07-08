import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright設定ファイル
 * - ローカル環境でのみE2Eテストを実行（CI環境では実行しない）
 * - Chrome専用: PC ChromeとスマホChromeのみサポート
 * - 正常系テストのみ実装（エラーハンドリング・パフォーマンステストは対象外）
 */
export default defineConfig({
	// テストディレクトリの設定
	testDir: "./tests/e2e",

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
		// ベースURL（E2E用開発サーバー）
		baseURL: "http://localhost:3002",

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

	// 開発サーバーの起動設定（テスト実行前に自動起動）
	// ローカル環境専用: 既存サーバーを再利用して効率化
	webServer: [
		{
			command: "npm run dev:e2e",
			url: "http://localhost:3002",
			reuseExistingServer: true,
			timeout: 120 * 1000,
			env: {
				NEXT_PUBLIC_API_URL: "http://localhost:3003/api", // E2E環境のAPIサーバーを指定
			},
		},
		{
			command: "cd ../api && npm run dev:e2e",
			url: "http://localhost:3003/api/health",
			reuseExistingServer: true,
			timeout: 150 * 1000, // E2Eサーバーはデータベース初期化時間を考慮して延長
			// カテゴリデータが確実に準備されるまで待機
			stdout: "pipe", // サーバーログを確認可能にする
			stderr: "pipe",
		},
	],
});
