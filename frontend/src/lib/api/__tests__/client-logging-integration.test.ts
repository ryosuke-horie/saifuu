/**
 * APIクライアントとエラーロギングの統合テスト
 *
 * client.tsでのlogTransactionError使用をテスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import * as transactionErrors from "../transaction-errors";

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ロガーのモック
vi.mock("../../logger/api-integration", () => ({
	withApiLogging: (client: any) => client,
}));

// logTransactionErrorのスパイ
const logTransactionErrorSpy = vi.spyOn(
	transactionErrors,
	"logTransactionError",
);

describe("APIクライアント ロギング統合テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// fetch のデフォルトの戻り値を設定
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({}),
			text: async () => "",
		} as Response);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("トランザクション操作でのエラーロギング", () => {
		it("create操作でエラーが発生した場合、logTransactionErrorが呼び出される", async () => {
			// 400エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					error: "Validation failed",
					fields: { amount: ["必須"] },
				}),
			});

			try {
				await apiClient.transactions.create({
					type: "expense",
					amount: -100,
					date: "2024-01-01",
				});
			} catch (error) {
				// エラーは期待通り
			}

			// logTransactionErrorが呼び出されたことを確認
			expect(logTransactionErrorSpy).toHaveBeenCalledTimes(1);
			expect(logTransactionErrorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					operation: "create",
					type: "validation",
				}),
				"transactions.create",
			);
		});

		it("update操作でエラーが発生した場合、適切なコンテキストでログが記録される", async () => {
			// 404エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({ error: "Not found" }),
			});

			const transactionId = "txn_123";

			try {
				await apiClient.transactions.update(transactionId, {
					amount: 2000,
					date: "2024-01-01",
				});
			} catch (error) {
				// エラーは期待通り
			}

			expect(logTransactionErrorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					operation: "update",
					type: "notFound",
				}),
				`transactions.update:${transactionId}`,
			);
		});

		it("delete操作でエラーが発生した場合、IDを含むコンテキストでログが記録される", async () => {
			// 403エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 403,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({ error: "Forbidden" }),
			});

			const transactionId = "txn_456";

			try {
				await apiClient.transactions.delete(transactionId);
			} catch (error) {
				// エラーは期待通り
			}

			expect(logTransactionErrorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					operation: "delete",
					type: "forbidden",
				}),
				`transactions.delete:${transactionId}`,
			);
		});

		it("list操作でエラーが発生した場合、クエリパラメータを含むコンテキストでログが記録される", async () => {
			// 500エラーレスポンスをモック
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({ error: "Internal Server Error" }),
			});

			try {
				await apiClient.transactions.list({
					page: 2,
					limit: 50,
					sort: "date",
					order: "desc",
				});
			} catch (error) {
				// エラーは期待通り
			}

			expect(logTransactionErrorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					operation: "list",
					type: "server",
				}),
				"transactions.list:page=2,limit=50",
			);
		});

		it("ネットワークエラーの場合も適切にログが記録される", async () => {
			// ネットワークエラーをモック
			mockFetch.mockRejectedValue(new Error("Network failure"));

			try {
				await apiClient.transactions.create({
					type: "income",
					amount: 1000,
					date: "2024-01-01",
				});
			} catch (error) {
				// エラーは期待通り
			}

			expect(logTransactionErrorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					operation: "create",
					type: "network",
				}),
				"transactions.create",
			);
		});
	});

	describe("成功時の動作", () => {
		it("成功した場合はlogTransactionErrorが呼び出されない", async () => {
			// 成功レスポンスをモック
			const mockTransaction = {
				id: "123",
				type: "expense",
				amount: 1000,
				date: "2024-01-01",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => mockTransaction,
			});

			await apiClient.transactions.create({
				type: "expense",
				amount: 1000,
				date: "2024-01-01",
			});

			// logTransactionErrorが呼び出されていないことを確認
			expect(logTransactionErrorSpy).not.toHaveBeenCalled();
		});
	});
});
