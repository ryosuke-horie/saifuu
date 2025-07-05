import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		globals: true,
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
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
