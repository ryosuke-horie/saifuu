/**
 * API Client 取引エラーハンドリングのテスト
 *
 * client.tsのtransactionsサービスのエラーハンドリング改善をテスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import { ApiError } from "../errors";
import { TransactionApiError } from "../transaction-errors";

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ロガーのモック
vi.mock("../../logger/api-integration", () => ({
	withApiLogging: (client: any) => client,
}));

describe("apiClient.transactions エラーハンドリング", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// fetch のデフォルトの戻り値を設定
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers(),
			json: async () => ({}),
			text: async () => "",
		} as Response);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("create operation", () => {
		it("バリデーションエラーをTransactionApiErrorでラップする", async () => {
			// 400エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					error: "Validation failed",
					fields: {
						amount: ["金額は正の数である必要があります"],
					},
				}),
			});

			try {
				await apiClient.transactions.create({
					type: "expense",
					amount: -100,
					date: "2024-01-01",
				});
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(TransactionApiError);
				expect(error).toBeInstanceOf(ApiError);

				const transactionError = error as TransactionApiError;
				expect(transactionError.operation).toBe("create");
				expect(transactionError.type).toBe("validation");
				expect(transactionError.statusCode).toBe(400);
				expect(transactionError.response?.fields).toEqual({
					amount: ["金額は正の数である必要があります"],
				});
			}
		});

		it("ネットワークエラーをTransactionApiErrorでラップする", async () => {
			// ネットワークエラーをモック（リトライ分も含めて設定）
			const networkError = new Error("Network error");
			mockFetch.mockRejectedValue(networkError);

			try {
				await apiClient.transactions.create({
					type: "income",
					amount: 1000,
					date: "2024-01-01",
				});
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(TransactionApiError);

				const transactionError = error as TransactionApiError;
				expect(transactionError.operation).toBe("create");
				expect(transactionError.type).toBe("network");
			}
		});
	});

	describe("update operation", () => {
		it("404エラーをTransactionApiErrorでラップする", async () => {
			// 404エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					error: "Transaction not found",
				}),
			});

			try {
				await apiClient.transactions.update("non-existent-id", {
					amount: 2000,
					date: "2024-01-01",
				});
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(TransactionApiError);

				const transactionError = error as TransactionApiError;
				expect(transactionError.operation).toBe("update");
				expect(transactionError.type).toBe("notFound");
				expect(transactionError.statusCode).toBe(404);
			}
		});

		it("409競合エラーをTransactionApiErrorでラップする", async () => {
			// 409エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 409,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					error: "Conflict: Resource has been modified",
				}),
			});

			try {
				await apiClient.transactions.update("transaction-123", {
					amount: 3000,
					date: "2024-01-01",
				});
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(TransactionApiError);

				const transactionError = error as TransactionApiError;
				expect(transactionError.operation).toBe("update");
				expect(transactionError.type).toBe("conflict");
				expect(transactionError.statusCode).toBe(409);
			}
		});
	});

	describe("delete operation", () => {
		it("403権限エラーをTransactionApiErrorでラップする", async () => {
			// 403エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 403,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					error: "Forbidden: You do not have permission",
				}),
			});

			try {
				await apiClient.transactions.delete("transaction-456");
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(TransactionApiError);

				const transactionError = error as TransactionApiError;
				expect(transactionError.operation).toBe("delete");
				expect(transactionError.type).toBe("forbidden");
				expect(transactionError.statusCode).toBe(403);
			}
		});
	});

	describe("list operation", () => {
		it("タイムアウトエラーをTransactionApiErrorでラップする", async () => {
			// AbortErrorをモック（タイムアウト）
			const abortError = new Error("The operation was aborted");
			abortError.name = "AbortError";
			mockFetch.mockRejectedValue(abortError);

			try {
				await apiClient.transactions.list({
					page: 1,
					limit: 50,
				});
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(TransactionApiError);

				const transactionError = error as TransactionApiError;
				expect(transactionError.operation).toBe("list");
				expect(transactionError.type).toBe("timeout");
			}
		});

		it("500サーバーエラーをTransactionApiErrorでラップする", async () => {
			// 500エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					error: "Internal Server Error",
				}),
			});

			try {
				await apiClient.transactions.list();
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(TransactionApiError);

				const transactionError = error as TransactionApiError;
				expect(transactionError.operation).toBe("list");
				expect(transactionError.type).toBe("server");
				expect(transactionError.statusCode).toBe(500);
			}
		});

		it("成功レスポンスの場合はエラーをスローしない", async () => {
			// 成功レスポンスをモック
			const mockData = {
				data: [
					{ id: "1", type: "income", amount: 1000, date: "2024-01-01" },
					{ id: "2", type: "expense", amount: 500, date: "2024-01-02" },
				],
				pagination: {
					total: 2,
					page: 1,
					limit: 10,
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => mockData,
			});

			const result = await apiClient.transactions.list();
			expect(result).toEqual(mockData);
		});
	});

	describe("エラーメッセージの確認", () => {
		it("各エラータイプに対して適切なメッセージが設定される", async () => {
			const testCases = [
				{
					operation: "create",
					status: 400,
					expectedType: "validation",
					expectedMessageIncludes: "入力内容",
				},
				{
					operation: "update",
					status: 404,
					expectedType: "notFound",
					expectedMessageIncludes: "見つかりません",
				},
				{
					operation: "delete",
					status: 403,
					expectedType: "forbidden",
					expectedMessageIncludes: "権限",
				},
				{
					operation: "list",
					status: 401,
					expectedType: "unauthorized",
					expectedMessageIncludes: "認証",
				},
			];

			for (const testCase of testCases) {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: testCase.status,
					headers: new Headers({ "content-type": "application/json" }),
					json: async () => ({ error: "Test error" }),
				});

				try {
					// 各操作を実行
					if (testCase.operation === "create") {
						await apiClient.transactions.create({
							type: "expense",
							amount: 100,
							date: "2024-01-01",
						});
					} else if (testCase.operation === "update") {
						await apiClient.transactions.update("id", {
							amount: 100,
							date: "2024-01-01",
						});
					} else if (testCase.operation === "delete") {
						await apiClient.transactions.delete("id");
					} else if (testCase.operation === "list") {
						await apiClient.transactions.list();
					}
					expect.fail("エラーがスローされるべき");
				} catch (error) {
					const transactionError = error as TransactionApiError;
					expect(transactionError.type).toBe(testCase.expectedType);
					expect(transactionError.message).toContain(
						testCase.expectedMessageIncludes,
					);
				}
			}
		});
	});
});
