/**
 * APIクライアントのテスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addQueryParams, createCancelToken } from "../client";

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// AbortControllerのモック
global.AbortController = class {
	signal = { addEventListener: vi.fn() };
	abort = vi.fn();
} as any;

describe("ApiClient ユーティリティ関数", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	describe("addQueryParams", () => {
		it("クエリパラメーターを正しく追加する", () => {
			const result = addQueryParams("/api/test", {
				page: 1,
				limit: 10,
				search: "テスト",
			});

			expect(result).toContain("/api/test?");
			expect(result).toContain("page=1");
			expect(result).toContain("limit=10");
			expect(result).toContain("search=%E3%83%86%E3%82%B9%E3%83%88"); // URLエンコードされた"テスト"
		});

		it("undefinedとnullの値を無視する", () => {
			const result = addQueryParams("/api/test", {
				page: 1,
				search: undefined,
				filter: null,
			});

			expect(result).toBe("/api/test?page=1");
		});

		it("パラメーターがない場合は元のエンドポイントを返す", () => {
			const result = addQueryParams("/api/test");
			expect(result).toBe("/api/test");
		});

		it("空のパラメーターオブジェクトの場合は元のエンドポイントを返す", () => {
			const result = addQueryParams("/api/test", {});
			expect(result).toBe("/api/test");
		});
	});

	describe("createCancelToken", () => {
		it("AbortSignalとキャンセル関数を正しく作成する", () => {
			const { signal, cancel } = createCancelToken();

			expect(signal).toBeDefined();
			expect(cancel).toBeTypeOf("function");
		});

		it("キャンセル関数でAbortControllerを中断する", () => {
			const { cancel } = createCancelToken();

			// キャンセル関数が正常に呼び出せることを確認
			expect(() => cancel()).not.toThrow();
		});
	});
});

describe("ApiClient 基本機能テスト", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	it("GET リクエストの基本的な動作", async () => {
		const mockData = { id: "1", name: "テスト" };
		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue(mockData),
			headers: {
				get: vi.fn().mockReturnValue("application/json"),
			},
		});

		// 動的インポートでAPIクライアントを取得
		const { apiClient } = await import("../client");
		const result = await apiClient.get("/test");

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/test"),
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({
					Accept: "application/json",
				}),
			}),
		);
		expect(result).toEqual(mockData);
	});

	it("POST リクエストの基本的な動作", async () => {
		const requestData = { name: "テスト", amount: 1000 };
		const responseData = { id: "1", ...requestData };

		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue(responseData),
			headers: {
				get: vi.fn().mockReturnValue("application/json"),
			},
		});

		const { apiClient } = await import("../client");
		const result = await apiClient.post("/test", requestData);

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/test"),
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					Accept: "application/json",
				}),
				body: JSON.stringify(requestData),
			}),
		);
		expect(result).toEqual(responseData);
	});

	it("FormDataを正しく処理する", async () => {
		const formData = new FormData();
		formData.append("file", "test");

		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ success: true }),
			headers: {
				get: vi.fn().mockReturnValue("application/json"),
			},
		});

		const { apiClient } = await import("../client");
		await apiClient.post("/upload", formData);

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/upload"),
			expect.objectContaining({
				method: "POST",
				body: formData,
				headers: expect.objectContaining({
					Accept: "application/json",
				}),
			}),
		);
		// FormDataの場合、Content-Typeヘッダーは設定されないことを確認
		expect(mockFetch.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();
	});

	it("HTTPエラーレスポンスを適切に処理する", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 404,
			headers: {
				get: vi.fn().mockReturnValue("application/json"),
			},
			json: vi.fn().mockResolvedValue({
				error: "Not Found",
			}),
		});

		const { apiClient } = await import("../client");
		const { ApiError } = await import("../errors");

		await expect(apiClient.get("/test")).rejects.toThrow(ApiError);
	});

	it("JSON解析エラーを適切に処理する", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			headers: {
				get: vi.fn().mockReturnValue("application/json"),
			},
			json: vi.fn().mockRejectedValue(new Error("JSON parse error")),
		});

		const { apiClient } = await import("../client");
		const { ApiError } = await import("../errors");

		await expect(apiClient.get("/test")).rejects.toThrow(ApiError);
	});

	it("ヘルスチェックが正常なレスポンスでtrueを返す", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ status: "ok" }),
			headers: {
				get: vi.fn().mockReturnValue("application/json"),
			},
		});

		const { apiClient } = await import("../client");
		const result = await apiClient.healthCheck();
		expect(result).toBe(true);
	});
});
