import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("デッドコード検知", () => {
	const frontendRoot = resolve(process.cwd());

	it("knipが正常に実行され、JSON形式で結果を出力できること", () => {
		expect(() => {
			const result = execSync("pnpm exec knip --reporter json", {
				cwd: frontendRoot,
				stdio: "pipe",
				encoding: "utf-8",
			});

			// 結果がJSON形式でパース可能であること
			const parsed = JSON.parse(result || "{}");
			expect(parsed).toBeDefined();
		}).not.toThrow();
	});

	it("knipの設定で必要なエントリーポイントが除外されていること", () => {
		const knipConfig = require(resolve(frontendRoot, "knip.json"));

		// Next.jsの重要なファイルがエントリーポイントに含まれていること
		expect(knipConfig.entry).toContain("src/app/**/*.{ts,tsx}");
		expect(knipConfig.entry).toContain("src/middleware.ts");

		// テストファイルが除外されていること
		expect(knipConfig.ignore).toContain("**/*.test.{ts,tsx}");
		expect(knipConfig.ignore).toContain("**/*.stories.{ts,tsx}");
	});

	it("knipの警告レベルが保守的に設定されていること", () => {
		const knipConfig = require(resolve(frontendRoot, "knip.json"));

		// すべてのルールが警告レベルに設定されていること
		expect(knipConfig.rules.files).toBe("warn");
		expect(knipConfig.rules.dependencies).toBe("warn");
		expect(knipConfig.rules.devDependencies).toBe("warn");
		expect(knipConfig.rules.exports).toBe("warn");
		expect(knipConfig.rules.types).toBe("warn");
	});
});
