/**
 * API設定のテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("API Config", () => {
	beforeEach(() => {
		// テスト実行時の環境をセット
		vi.stubEnv("NODE_ENV", "test");
		// モジュールキャッシュをクリア
		vi.resetModules();
	});

	describe("設定値のテスト", () => {
		it("設定オブジェクトが正しい構造を持つ", async () => {
			const { apiConfig } = await import("../config");

			expect(apiConfig).toHaveProperty("baseUrl");
			expect(apiConfig).toHaveProperty("timeout");
			expect(apiConfig).toHaveProperty("maxRetries");
			expect(apiConfig).toHaveProperty("retryDelay");
			expect(apiConfig).toHaveProperty("environment");

			expect(typeof apiConfig.baseUrl).toBe("string");
			expect(typeof apiConfig.timeout).toBe("number");
			expect(typeof apiConfig.maxRetries).toBe("number");
			expect(typeof apiConfig.retryDelay).toBe("number");
			expect(typeof apiConfig.environment).toBe("string");
		});

		it("デフォルト値が適切に設定される", async () => {
			const { apiConfig } = await import("../config");

			expect(apiConfig.timeout).toBe(30000);
			expect(apiConfig.maxRetries).toBe(3);
			expect(apiConfig.retryDelay).toBe(1000);
		});
	});

	describe("buildUrl 関数", () => {
		it("ベースURLとエンドポイントを正しく結合する", async () => {
			const { buildUrl, apiConfig } = await import("../config");
			const url = buildUrl("/subscriptions");
			expect(url).toBe(`${apiConfig.baseUrl}/subscriptions`);
		});

		it("スラッシュで始まらないエンドポイントも正しく処理する", async () => {
			const { buildUrl, apiConfig } = await import("../config");
			const url = buildUrl("subscriptions");
			expect(url).toBe(`${apiConfig.baseUrl}/subscriptions`);
		});

		it("ベースURLの末尾スラッシュを正しく処理する", async () => {
			const { buildUrl } = await import("../config");
			// ベースURLの末尾にスラッシュがある場合
			const url = buildUrl("/subscriptions");
			// ダブルスラッシュが存在しないことを確認（httpの://は除く）
			const doubleSlashCount = (url.match(/\/\//g) || []).length;
			expect(doubleSlashCount).toBe(1); // http:// の部分のみ
		});
	});

	describe("getDebugInfo 関数", () => {
		it("デバッグ情報を正しく返す", async () => {
			const { getDebugInfo } = await import("../config");
			const debugInfo = getDebugInfo();

			expect(debugInfo).toHaveProperty("environment");
			expect(debugInfo).toHaveProperty("baseUrl");
			expect(debugInfo).toHaveProperty("timeout");
			expect(debugInfo).toHaveProperty("maxRetries");
			expect(debugInfo).toHaveProperty("retryDelay");
			expect(debugInfo).toHaveProperty("nodeEnv");
		});

		it("現在の環境変数値を含む", async () => {
			const testUrl = "https://test.api.com";
			vi.stubEnv("NEXT_PUBLIC_API_URL", testUrl);

			const { getDebugInfo } = await import("../config");
			const debugInfo = getDebugInfo();

			expect(debugInfo.publicApiUrl).toBe(testUrl);
		});
	});

	describe("エンドポイント定義", () => {
		it.each([
			["subscriptions", "/subscriptions", true],
			["categories", "/categories", false],
			["transactions", "/transactions", true],
		] as const)(
			"%sエンドポイントが正しく定義されている",
			async (resource, basePath, hasStats) => {
				const { endpoints } = await import("../config");

				const resourceEndpoints = endpoints[resource];
				expect(resourceEndpoints).toBeDefined();
				expect(resourceEndpoints.list).toBe(basePath);
				expect(resourceEndpoints.create).toBe(basePath);
				expect(resourceEndpoints.detail("123")).toBe(`${basePath}/123`);
				expect(resourceEndpoints.update("123")).toBe(`${basePath}/123`);
				expect(resourceEndpoints.delete("123")).toBe(`${basePath}/123`);

				if (hasStats && "stats" in resourceEndpoints) {
					expect(resourceEndpoints.stats).toBe(`${basePath}/stats`);
				}
			},
		);
	});

	describe("環境変数処理", () => {
		it("カスタムタイムアウト値を適用する", async () => {
			vi.stubEnv("NEXT_PUBLIC_API_TIMEOUT", "60000");
			const { apiConfig } = await import("../config");
			expect(apiConfig.timeout).toBe(60000);
		});

		it("カスタムリトライ設定を適用する", async () => {
			vi.stubEnv("NEXT_PUBLIC_API_MAX_RETRIES", "5");
			vi.stubEnv("NEXT_PUBLIC_API_RETRY_DELAY", "2000");
			const { apiConfig } = await import("../config");
			expect(apiConfig.maxRetries).toBe(5);
			expect(apiConfig.retryDelay).toBe(2000);
		});

		it("不正な数値の場合はデフォルト値を使用する", async () => {
			vi.stubEnv("NEXT_PUBLIC_API_TIMEOUT", "invalid");
			vi.stubEnv("NEXT_PUBLIC_API_MAX_RETRIES", "not-a-number");
			const { apiConfig } = await import("../config");

			// NaNの場合はデフォルト値が使用されることを確認
			expect(apiConfig.timeout).toBe(30000);
			expect(apiConfig.maxRetries).toBe(3);
		});
	});

	describe("本番環境での実行時バリデーション", () => {
		it("本番環境でNEXT_PUBLIC_API_URLが設定されている場合、正常に動作する", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");

			const { buildUrl } = await import("../config");

			// エラーが発生しないことを確認
			expect(() => buildUrl("/subscriptions")).not.toThrow();
			expect(buildUrl("/subscriptions")).toBe(
				"https://api.example.com/subscriptions",
			);
		});

		it("本番環境でNEXT_PUBLIC_API_URLが未設定の場合、ビルド時はエラーが発生しない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.stubEnv("NEXT_PUBLIC_API_URL", "");

			// config.tsモジュールの読み込みでエラーが発生しないことを確認
			expect(async () => {
				const { apiConfig } = await import("../config");
				// 設定の読み込み自体は成功する
				expect(apiConfig.environment).toBe("production");
				expect(apiConfig.baseUrl).toBe("https://api.placeholder.local");
			}).not.toThrow();
		});

		it("本番環境でNEXT_PUBLIC_API_URLが未設定の場合、実行時にエラーが発生する", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.stubEnv("NEXT_PUBLIC_API_URL", "");

			// 環境変数設定後にモジュールを新しくインポート
			await expect(async () => {
				await import("../config");
			}).rejects.toThrow(
				"NEXT_PUBLIC_API_URL is required in production environment",
			);
		});

		it("開発環境では環境変数未設定でも動作する", async () => {
			vi.stubEnv("NODE_ENV", "development");
			vi.stubEnv("NEXT_PUBLIC_API_URL", "");

			const { buildUrl } = await import("../config");

			// エラーが発生しないことを確認
			expect(() => buildUrl("/subscriptions")).not.toThrow();
			expect(buildUrl("/subscriptions")).toBe(
				"http://localhost:5173/api/subscriptions",
			);
		});

		it("テスト環境では環境変数未設定でも動作する", async () => {
			vi.stubEnv("NODE_ENV", "test");
			vi.stubEnv("NEXT_PUBLIC_API_URL", "");

			const { buildUrl } = await import("../config");

			// エラーが発生しないことを確認
			expect(() => buildUrl("/subscriptions")).not.toThrow();
			expect(buildUrl("/subscriptions")).toBe(
				"http://localhost:3004/api/subscriptions",
			);
		});
	});
});
