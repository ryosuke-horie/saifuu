import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	resolve: {
		alias: {
			"@shared": path.resolve(__dirname, "../shared/src"),
		},
	},
	test: {
		// Node.js環境でのテスト実行
		environment: "node",
		
		// テスト対象ファイルパターン
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
		exclude: [
			"node_modules/**",
			"dist/**",
			"public/**",
			"**/*.integration.{test,spec}.{js,mjs,cjs,ts,mts,cts}",
			"**/__tests__/helpers/**",
		],
		
		// グローバル設定
		globals: true,
		
		// カバレッジ設定
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "json-summary", "html"],
			exclude: [
				"node_modules/**",
				"dist/**",
				"public/**",
				"**/*.test.{js,mjs,cjs,ts,mts,cts}",
				"**/*.spec.{js,mjs,cjs,ts,mts,cts}",
				"**/*.config.{js,mjs,cjs,ts,mts,cts}",
				"**/types/**",
				"**/*.d.ts",
				"drizzle/**",
				"src/index.tsx", // エントリーポイント
				"src/renderer.tsx", // レンダラー
				"**/__tests__/helpers/**", // テストヘルパーファイル
			],
			include: ["src/**/*.{js,mjs,cjs,ts,mts,cts}"],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
		
		// テストタイムアウト設定
		testTimeout: 10000,
	},
});