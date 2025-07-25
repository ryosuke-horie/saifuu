import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

describe("Knip設定", () => {
	const frontendRoot = resolve(process.cwd());

	it("knip.jsonファイルが存在すること", () => {
		const knipConfigPath = resolve(frontendRoot, "knip.json");
		expect(existsSync(knipConfigPath)).toBe(true);
	});

	it("package.jsonにknipスクリプトが定義されていること", () => {
		const packageJson = require(resolve(frontendRoot, "package.json"));
		expect(packageJson.scripts).toHaveProperty("knip");
		expect(packageJson.scripts).toHaveProperty("knip:production");
		expect(packageJson.scripts).toHaveProperty("knip:fix");
	});

	it("knipがdevDependenciesにインストールされていること", () => {
		const packageJson = require(resolve(frontendRoot, "package.json"));
		expect(packageJson.devDependencies).toHaveProperty("knip");
	});

	it("knipコマンドが実行可能であること", () => {
		// knipがインストールされていればコマンドが見つかる
		expect(() => {
			execSync("pnpm exec knip --version", {
				cwd: frontendRoot,
				stdio: "pipe",
			});
		}).not.toThrow();
	});

	it("knip設定が有効なJSONであること", () => {
		const knipConfigPath = resolve(frontendRoot, "knip.json");
		expect(() => {
			const config = require(knipConfigPath);
			expect(config).toBeDefined();
			expect(config.$schema).toBeDefined();
		}).not.toThrow();
	});
});
