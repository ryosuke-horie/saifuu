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
		it("サブスクリプションエンドポイントが正しく定義されている", async () => {
			const { endpoints } = await import("../config");

			expect(endpoints.subscriptions).toBeDefined();
			expect(endpoints.subscriptions.list).toBe("/subscriptions");
			expect(endpoints.subscriptions.create).toBe("/subscriptions");
			expect(endpoints.subscriptions.detail("123")).toBe("/subscriptions/123");
			expect(endpoints.subscriptions.update("123")).toBe("/subscriptions/123");
			expect(endpoints.subscriptions.delete("123")).toBe("/subscriptions/123");
			expect(endpoints.subscriptions.stats).toBe("/subscriptions/stats");
		});

		it("カテゴリエンドポイントが正しく定義されている", async () => {
			const { endpoints } = await import("../config");

			expect(endpoints.categories).toBeDefined();
			expect(endpoints.categories.list).toBe("/categories");
			expect(endpoints.categories.create).toBe("/categories");
			expect(endpoints.categories.detail("123")).toBe("/categories/123");
			expect(endpoints.categories.update("123")).toBe("/categories/123");
			expect(endpoints.categories.delete("123")).toBe("/categories/123");
		});

		it("取引エンドポイントが正しく定義されている", async () => {
			const { endpoints } = await import("../config");

			expect(endpoints.transactions).toBeDefined();
			expect(endpoints.transactions.list).toBe("/transactions");
			expect(endpoints.transactions.create).toBe("/transactions");
			expect(endpoints.transactions.detail("123")).toBe("/transactions/123");
			expect(endpoints.transactions.update("123")).toBe("/transactions/123");
			expect(endpoints.transactions.delete("123")).toBe("/transactions/123");
			expect(endpoints.transactions.stats).toBe("/transactions/stats");
		});
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
});
