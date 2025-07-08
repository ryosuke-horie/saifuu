import type { PlaywrightTestConfig } from "@playwright/test";

/**
 * E2Eテスト共通設定
 * - 本番環境・開発環境で共通する基本設定
 * - 環境固有の設定は各環境のconfigファイルで上書き
 */
export const sharedConfig: Partial<PlaywrightTestConfig> = {
	// 共通設定
	use: {
		// ベースURL（環境別で上書き）
		baseURL: "http://localhost:3002",

		// 失敗時のスクリーンショット
		screenshot: "only-on-failure",

		// 失敗時のビデオ録画
		video: "retain-on-failure",
	},

	// 共通プロジェクト設定: Chrome専用
	// devices は実行時に各環境のconfigで設定
};
