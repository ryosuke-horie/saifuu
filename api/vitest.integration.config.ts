import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Node.js環境でのテスト実行
		environment: "node",
		
		// 統合テスト対象ファイルパターン
		include: ["src/**/*.integration.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
		exclude: [
			"node_modules/**",
			"dist/**",
			"public/**",
		],
		
		// グローバル設定
		globals: true,
		
		// 統合テスト用のタイムアウト（DBアクセスなどのため長めに設定）
		testTimeout: 30000,
		
		// 統合テストは順次実行（DBの競合状態を避けるため）
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
	},
});