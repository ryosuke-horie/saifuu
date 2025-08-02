import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		react(),
		// ビジュアルテスト用プラグイン
		{
			name: "storybook-addon-vis",
		},
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@shared": path.resolve(__dirname, "../shared/src"),
		},
	},
	// Node.jsグローバルをブラウザ環境で利用可能にする
	define: {
		"process.env": "import.meta.env",
		global: "globalThis",
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		globals: true,
		// ビジュアルテスト実行時のみブラウザモードを有効化
		// 通常のユニットテストはjsdom環境で高速実行
		browser: {
			enabled: process.env.ENABLE_VISUAL_TESTS === "true",
			provider: "playwright",
			instances: [
				{
					browser: "chromium",
				},
			],
		},
		// ビジュアルテスト時は長め、通常テスト時は短めのタイムアウト
		testTimeout: process.env.ENABLE_VISUAL_TESTS === "true" ? 30000 : 10000,
		hookTimeout: process.env.ENABLE_VISUAL_TESTS === "true" ? 10000 : 5000,
		include: [
			"src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
			"src/**/*.visual.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
		],
		exclude: ["tests/**", "node_modules/**", ".next/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "json-summary", "html"],
			exclude: [
				"node_modules/**",
				"tests/**",
				"**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
				"**/*.spec.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
				"**/*.stories.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
				"**/*.config.{js,mjs,cjs,ts,mts,cts}",
				"**/types/**",
				"**/*.d.ts",
				".next/**",
				"storybook-static/**",
			],
			include: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
	},
});
