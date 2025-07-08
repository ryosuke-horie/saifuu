import { defineConfig, devices } from "@playwright/test";
import { sharedConfig } from "./shared.config";

/**
 * 開発環境向けE2Eテスト設定
 * - AI開発支援とフル統合テスト用
 * - 詳細なログ・トレース・デバッグ情報を含む包括的な設定
 * - データベース初期化時間を考慮したタイムアウト設定
 */
export default defineConfig({
	...sharedConfig,

	// テストディレクトリ
	testDir: "../e2e/development",

	// 並列実行設定（デバッグしやすさを重視）
	fullyParallel: false,

	// 再試行回数（開発環境のため再試行なし）
	retries: 0,

	// ワーカー数（デバッグのため少なめ）
	workers: 1,

	// レポーター設定（詳細なレポート）
	reporter: [
		["list"],
		["html", { outputFolder: "e2e-results-development" }],
		["json", { outputFile: "e2e-results-development.json" }],
	],

	// タイムアウト設定（余裕をもった設定）
	timeout: 120 * 1000, // 2分
	expect: {
		timeout: 30 * 1000, // 30秒
	},

	use: {
		...sharedConfig.use,

		// トレース設定（詳細）
		trace: "on",

		// アクション間の待機時間（余裕をもった設定）
		actionTimeout: 30 * 1000,
		navigationTimeout: 60 * 1000,
	},

	// プロジェクト設定: デスクトップ・モバイルテスト
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

	// Webサーバー設定: E2E専用環境
	webServer: [
		{
			// フロントエンド
			command: "NEXT_PUBLIC_API_URL=http://localhost:3003/api npm run dev:e2e",
			url: "http://localhost:3002",
			reuseExistingServer: true,
			timeout: 120 * 1000,
			stdout: "pipe", // 詳細ログ
			stderr: "pipe",
		},
		{
			// API（E2E専用データベース）
			command: "cd ../api && npm run dev:e2e",
			url: "http://localhost:3003/api/health",
			reuseExistingServer: true,
			timeout: 150 * 1000, // データベース初期化時間を考慮
			stdout: "pipe", // 詳細ログ
			stderr: "pipe",
		},
	],
});
