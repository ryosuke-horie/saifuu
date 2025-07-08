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
		// ビジュアルテスト専用の設定
		browser: {
			enabled: true,
			provider: "playwright",
			instances: [
				{
					browser: "chromium",
				},
			],
		},
		// ビジュアルテスト用の長めのタイムアウト
		testTimeout: 30000,
		hookTimeout: 10000,
		// ビジュアルテストファイルのみを対象とする
		include: [
			"src/**/*.visual.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
		],
		exclude: [
			"tests/**", 
			"node_modules/**", 
			".next/**"
		],
	},
});