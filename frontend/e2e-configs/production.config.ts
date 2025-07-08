import { defineConfig, devices } from "@playwright/test";
import { sharedConfig } from "./shared.config";

/**
 * 本番環境向けE2Eテスト設定
 * - 高速実行を重視したスモークテスト・基本フロー確認用
 * - 最小限のブラウザ設定とタイムアウト
 * - APIサーバーは既存のものを利用（起動しない）
 */
export default defineConfig({
	...sharedConfig,

	// テストディレクトリ
	testDir: "../e2e/production",

	// 並列実行設定（高速実行のため有効）
	fullyParallel: true,

	// 再試行回数（本番確認のため1回まで許可）
	retries: 1,

	// ワーカー数（高速実行のため多め）
	workers: 4,

	// レポーター設定（簡潔なレポート）
	reporter: [["list"], ["html", { outputFolder: "e2e-results-production" }]],

	// タイムアウト設定（短縮）
	timeout: 30 * 1000, // 30秒
	expect: {
		timeout: 10 * 1000, // 10秒
	},

	use: {
		...sharedConfig.use,

		// トレース設定（軽量化）
		trace: "retain-on-failure",

		// アクション間の待機時間を短縮
		actionTimeout: 10 * 1000,
		navigationTimeout: 20 * 1000,
	},

	// プロジェクト設定
	projects: [
		{
			name: "Desktop Chrome",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	// Webサーバー設定: 既存サーバーを利用
	webServer: [
		{
			// フロントエンド（既存サーバーを再利用）
			command: "NEXT_PUBLIC_API_URL=http://localhost:3003/api npm run dev:e2e",
			url: "http://localhost:3002",
			reuseExistingServer: true,
			timeout: 60 * 1000, // 短縮
		},
		{
			// API（既存サーバーを再利用）
			command: "cd ../api && npm run dev",
			url: "http://localhost:3003/api/health",
			reuseExistingServer: true,
			timeout: 60 * 1000, // 短縮
		},
	],
});
