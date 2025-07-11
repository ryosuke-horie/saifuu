/**
 * API統合とrequestId相関機能のテスト
 *
 * このテストは現在実装されていない機能をテストするため、
 * 最初は失敗します（Redフェーズ）
 */

import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../api/client";
import {
	createApiClientWithLogging,
	createPerformanceMarker,
	enhanceRequestWithLogging,
	getErrorPerformance,
	getResponsePerformance,
	useApiLogger,
	withApiLogging,
} from "../api-integration";
import { LoggerProvider } from "../context";

// テスト用の設定
const testConfig = {
	environment: "development" as const,
	level: "debug" as const,
	bufferSize: 5,
	flushInterval: 100,
	enableConsole: true,
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
	createElement(LoggerProvider, { config: testConfig, children });

describe("API統合とrequestId相関", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("requestId自動生成・ヘッダー追加", () => {
		it("APIリクエスト時にrequestIdが自動生成されてヘッダーに追加される", async () => {
			const mockFetch = vi.spyOn(global, "fetch").mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ data: "test" }),
				text: vi.fn().mockResolvedValue("test response"),
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				status: 200,
			} as unknown as Response);

			try {
				await apiClient.get("/test");

				// requestIdがX-Request-IDヘッダーに追加されているかテスト
				expect(mockFetch).toHaveBeenCalledWith(
					expect.any(String),
					expect.objectContaining({
						headers: expect.objectContaining({
							"X-Request-ID": expect.stringMatching(/^[0-9a-f-]{36}$/), // UUID形式
						}),
					}),
				);
			} finally {
				mockFetch.mockRestore();
			}
		});

		it("同じリクエストでrequestIdが一貫している", async () => {
			const mockFetch = vi.spyOn(global, "fetch").mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ data: "test" }),
				text: vi.fn().mockResolvedValue("test response"),
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				status: 200,
			} as unknown as Response);

			try {
				await apiClient.get("/test");

				const firstCallHeaders = mockFetch.mock.calls[0][1]?.headers as Record<
					string,
					string
				>;
				const requestId = firstCallHeaders["X-Request-ID"];

				expect(requestId).toBeDefined();
				expect(typeof requestId).toBe("string");
				expect(requestId.length).toBeGreaterThan(0);
			} finally {
				mockFetch.mockRestore();
			}
		});
	});

	describe("API応答時間計測", () => {
		it("APIコール開始・終了時刻が記録される", async () => {
			const mockFetch = vi.spyOn(global, "fetch").mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									ok: true,
									json: vi.fn().mockResolvedValue({ data: "test" }),
									text: vi.fn().mockResolvedValue("test response"),
									headers: {
										get: vi.fn().mockReturnValue("application/json"),
									},
									status: 200,
								} as unknown as Response),
							100,
						),
					),
			);

			try {
				await apiClient.get("/test");

				// パフォーマンス計測のログが出力されているかテスト
				expect(console.log).toHaveBeenCalledWith(
					expect.stringContaining("[FRONTEND]"),
					expect.stringContaining("API call"),
					expect.objectContaining({
						endpoint: "/test",
						method: "GET",
						duration: expect.any(Number),
						apiCall: true,
					}),
				);
			} finally {
				mockFetch.mockRestore();
			}
		});
	});

	describe("useApiLogger フック", () => {
		it("APIログ機能が正常に動作する", () => {
			const { result } = renderHook(() => useApiLogger(), { wrapper });

			expect(result.current.logApiCall).toBeDefined();
			expect(result.current.logApiSuccess).toBeDefined();
			expect(result.current.logApiError).toBeDefined();
			expect(typeof result.current.logApiCall).toBe("function");
			expect(typeof result.current.logApiSuccess).toBe("function");
			expect(typeof result.current.logApiError).toBe("function");
		});

		it("API成功時のログが正しく記録される", () => {
			const { result } = renderHook(() => useApiLogger(), { wrapper });
			const consoleInfoSpy = vi.spyOn(console, "info");

			// API成功のログを記録
			result.current.logApiSuccess("/test", 200, { requestId: "test-123" });

			// ログが出力されたことを確認
			expect(consoleInfoSpy).toHaveBeenCalledWith(
				expect.stringMatching(/\[INFO\] API Success: \/test$/),
				expect.objectContaining({
					status: 200,
					apiSuccess: true,
					requestId: "test-123",
				}),
			);
		});

		it("APIエラー時のログが正しく記録される", () => {
			const { result } = renderHook(() => useApiLogger(), { wrapper });
			const consoleErrorSpy = vi.spyOn(console, "error");
			const testError = new Error("API failed");

			// APIエラーのログを記録
			result.current.logApiError("/test", testError, { requestId: "test-123" });

			// エラーログが出力されたことを確認
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringMatching(/\[ERROR\] API Error: \/test$/),
				expect.objectContaining({
					error: "API failed",
					stack: expect.any(String),
					apiError: true,
					requestId: "test-123",
				}),
			);
		});

		it("API呼び出しのログが正しく記録される", () => {
			const { result } = renderHook(() => useApiLogger(), { wrapper });
			const consoleInfoSpy = vi.spyOn(console, "info");

			// API呼び出しのログを記録
			result.current.logApiCall("/test", "GET", { requestId: "test-123" });

			// ログが出力されたことを確認
			expect(consoleInfoSpy).toHaveBeenCalledWith(
				expect.stringMatching(/\[INFO\] API call: GET \/test$/),
				expect.objectContaining({
					action: "api_call",
					data: {
						endpoint: "/test",
						method: "GET",
					},
					requestId: "test-123",
				}),
			);
		});
	});

	describe("フロントエンド・バックエンド相関", () => {
		it("requestIdがフロントエンドとバックエンドで一致する", async () => {
			let capturedRequestId: string | undefined;

			const mockFetch = vi
				.spyOn(global, "fetch")
				.mockImplementation(async (_url, options) => {
					// リクエストヘッダーからrequestIdを取得
					const headers = options?.headers as Record<string, string>;
					capturedRequestId = headers["X-Request-ID"];

					return {
						ok: true,
						json: vi.fn().mockResolvedValue({ data: "test" }),
						text: vi.fn().mockResolvedValue("test response"),
						headers: {
							get: vi.fn().mockImplementation((key: string) => {
								if (key === "X-Request-ID") return capturedRequestId;
								if (key === "Content-Type") return "application/json";
								return null;
							}),
						},
						status: 200,
					} as unknown as Response;
				});

			try {
				await apiClient.get("/test");

				// リクエストヘッダーとレスポンスヘッダーのrequestIdが一致することをテスト
				const requestHeaders = mockFetch.mock.calls[0][1]?.headers as Record<
					string,
					string
				>;
				const sentRequestId = requestHeaders["X-Request-ID"];

				expect(sentRequestId).toBeDefined();
				expect(sentRequestId).toBe(capturedRequestId);
				expect(sentRequestId).toMatch(/^[0-9a-f-]{36}$/); // UUID形式の確認
			} finally {
				mockFetch.mockRestore();
			}
		});
	});

	describe("createPerformanceMarker", () => {
		it("パフォーマンス計測が正しく動作する", async () => {
			const marker = createPerformanceMarker();

			// 少し時間を経過させる
			await new Promise((resolve) => setTimeout(resolve, 50));

			const duration = marker.duration();
			expect(duration).toBeGreaterThan(40); // 50ms待機したので40ms以上のはず
			expect(duration).toBeLessThan(100); // 100ms未満のはず

			// endメソッドも同じような値を返すことを確認（誤差を許容）
			const endValue = marker.end();
			expect(Math.abs(endValue - duration)).toBeLessThan(1); // 1ms以内の誤差は許容
		});
	});

	describe("enhanceRequestWithLogging", () => {
		it("fetchにrequestIdとパフォーマンス情報を追加する", async () => {
			const mockResponse = new Response("test", { status: 200 });
			const mockFetch = vi.fn().mockResolvedValue(mockResponse);

			const enhancedFetch = enhanceRequestWithLogging(mockFetch);

			const response = await enhancedFetch("/test");

			// fetchが正しく呼ばれたことを確認
			expect(mockFetch).toHaveBeenCalledWith(
				"/test",
				expect.objectContaining({
					headers: expect.objectContaining({
						"X-Request-ID": expect.stringMatching(/^[0-9a-f-]{36}$/),
					}),
				}),
			);

			// レスポンスが返されることを確認
			expect(response).toBe(mockResponse);
		});

		it("エラー時にもパフォーマンス情報を追加する", async () => {
			const testError = new Error("Fetch failed");
			const mockFetch = vi.fn().mockRejectedValue(testError);

			const enhancedFetch = enhanceRequestWithLogging(mockFetch);

			await expect(enhancedFetch("/test")).rejects.toThrow("Fetch failed");

			// エラーにパフォーマンス情報が追加されていることを確認
			const performance = getErrorPerformance(testError);
			expect(performance).toBeTruthy();
			expect(performance?.requestId).toMatch(/^[0-9a-f-]{36}$/);
			expect(performance?.endpoint).toBe("/test");
			expect(performance?.duration).toBeGreaterThan(0);
		});
	});

	describe("createApiClientWithLogging", () => {
		it("グローバルfetchを拡張し、復元できる", () => {
			const originalFetch = globalThis.fetch;

			// fetchを拡張
			const { restore } = createApiClientWithLogging();

			// fetchが変更されたことを確認
			expect(globalThis.fetch).not.toBe(originalFetch);

			// 復元
			restore();

			// 元のfetchに戻ったことを確認
			expect(globalThis.fetch).toBe(originalFetch);
		});
	});

	describe("getResponsePerformance/getErrorPerformance", () => {
		it("レスポンスからパフォーマンス情報を取得できる", () => {
			const mockResponse = new Response("test");
			const performanceData = {
				duration: 100,
				requestId: "test-id",
				endpoint: "/test",
			};

			// パフォーマンス情報を追加
			Object.defineProperty(mockResponse, "__performance", {
				value: performanceData,
				writable: false,
				enumerable: false,
			});

			const result = getResponsePerformance(mockResponse);
			expect(result).toEqual(performanceData);
		});

		it("パフォーマンス情報がない場合はnullを返す", () => {
			const mockResponse = new Response("test");
			const result = getResponsePerformance(mockResponse);
			expect(result).toBeNull();
		});
	});

	describe("withApiLogging", () => {
		it("APIクライアントのメソッドをラップする", async () => {
			const mockClient = {
				get: vi.fn().mockResolvedValue({ data: "test" }),
				post: vi.fn().mockResolvedValue({ data: "created" }),
				put: vi.fn().mockResolvedValue({ data: "updated" }),
				delete: vi.fn().mockResolvedValue({ data: "deleted" }),
			};

			const wrappedClient = withApiLogging(mockClient);

			// GETメソッドのテスト
			await wrappedClient.get("/test");
			expect(mockClient.get).toHaveBeenCalledWith(
				"/test",
				expect.objectContaining({
					headers: expect.objectContaining({
						"X-Request-ID": expect.stringMatching(/^[0-9a-f-]{36}$/),
					}),
				}),
			);

			// ログが出力されたことを確認
			expect(console.log).toHaveBeenCalledWith(
				"[FRONTEND]",
				"API call: GET /test",
				expect.objectContaining({
					method: "GET",
					endpoint: "/test",
					apiCall: true,
				}),
			);
		});

		it("メソッドが存在しないクライアントも処理できる", () => {
			const mockClient = {
				customMethod: vi.fn(),
			};

			const wrappedClient = withApiLogging(mockClient);

			// カスタムメソッドは変更されない
			expect(wrappedClient.customMethod).toBe(mockClient.customMethod);

			// HTTPメソッドは存在しない
			expect((wrappedClient as any).get).toBeUndefined();
			expect((wrappedClient as any).post).toBeUndefined();
		});
	});
});
