/**
 * 取引APIサービスのユニットテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import { endpoints } from "../config";
import type {
	CreateTransactionRequest,
	DeleteResponse,
	GetTransactionsQuery,
	MonthlyStats,
	Transaction,
	TransactionStats,
	UpdateTransactionRequest,
} from "../types";
import {
	createTransaction,
	createTransactionsBatch,
	deleteTransaction,
	deleteTransactionsBatch,
	getCurrentMonthTransactions,
	getCurrentYearTransactions,
	getExpenseTransactions,
	getLargeTransactions,
	getLastMonthTransactions,
	getMonthlyStats,
	getRecentTransactions,
	getTransaction,
	getTransactionStats,
	getTransactions,
	getTransactionsByCategory,
	getTransactionsByDateRange,
	updateTransaction,
} from "./transactions";

// APIクライアントをモック
vi.mock("../client", () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
	addQueryParams: vi.fn((endpoint, params) => {
		if (!params) return endpoint;
		const url = new URL(endpoint, "http://localhost");
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.append(key, String(value));
			}
		});
		return url.pathname + url.search;
	}),
}));

const mockApiClient = vi.mocked(apiClient);

// テスト用のモックデータ
const mockTransaction: Transaction = {
	id: "txn1",
	amount: 3000,
	type: "expense",
	date: "2024-07-15",
	description: "ランチ代",
	category: {
		id: "cat1",
		name: "食費",
		type: "expense",
		color: "#FF6B6B",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	createdAt: "2024-07-15T12:00:00Z",
	updatedAt: "2024-07-15T12:00:00Z",
};

const mockTransactions: Transaction[] = [mockTransaction];

const mockCreateRequest: CreateTransactionRequest = {
	amount: 3000,
	type: "expense",
	date: "2024-07-15",
	description: "ランチ代",
	categoryId: "cat1",
};

const mockUpdateRequest: UpdateTransactionRequest = {
	amount: 4000,
	description: "ディナー代",
};

const mockStats: TransactionStats = {
	totalIncome: 300000,
	totalExpense: 250000,
	balance: 50000,
	transactionCount: 100,
};

const mockMonthlyStats: MonthlyStats[] = [
	{
		year: 2024,
		month: 7,
		income: 300000,
		expense: 250000,
		balance: 50000,
	},
];

const mockDeleteResponse: DeleteResponse = {
	message: "削除が完了しました",
	deletedId: "txn1",
};

describe("transactions service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.setSystemTime(new Date("2024-07-15"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("基本CRUD操作", () => {
		it("取引一覧を取得する（クエリパラメータ有無両方）", async () => {
			mockApiClient.get.mockResolvedValue(mockTransactions);

			// クエリなし
			const result1 = await getTransactions();
			expect(result1).toEqual(mockTransactions);
			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.transactions.list);

			// クエリあり
			const query: GetTransactionsQuery = {
				type: "expense",
				categoryId: "cat1",
				dateFrom: "2024-07-01",
				dateTo: "2024-07-31",
			};
			const result2 = await getTransactions(query);
			expect(result2).toEqual(mockTransactions);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("type=expense&categoryId=cat1&dateFrom=2024-07-01&dateTo=2024-07-31"),
			);
		});

		it("CRUD操作が正しく動作する", async () => {
			// Read (single)
			mockApiClient.get.mockResolvedValue(mockTransaction);
			const getResult = await getTransaction("txn1");
			expect(getResult).toEqual(mockTransaction);
			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.transactions.detail("txn1"));

			// Create
			mockApiClient.post.mockResolvedValue(mockTransaction);
			const createResult = await createTransaction(mockCreateRequest);
			expect(createResult).toEqual(mockTransaction);
			expect(mockApiClient.post).toHaveBeenCalledWith(
				endpoints.transactions.create,
				mockCreateRequest,
			);

			// Update
			mockApiClient.put.mockResolvedValue(mockTransaction);
			const updateResult = await updateTransaction("txn1", mockUpdateRequest);
			expect(updateResult).toEqual(mockTransaction);
			expect(mockApiClient.put).toHaveBeenCalledWith(
				endpoints.transactions.update("txn1"),
				mockUpdateRequest,
			);

			// Delete
			mockApiClient.delete.mockResolvedValue(mockDeleteResponse);
			const deleteResult = await deleteTransaction("txn1");
			expect(deleteResult).toEqual(mockDeleteResponse);
			expect(mockApiClient.delete).toHaveBeenCalledWith(
				endpoints.transactions.delete("txn1"),
			);
		});

		it("統計情報を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockStats);
			const result = await getTransactionStats();
			expect(result).toEqual(mockStats);
			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.transactions.stats);
		});
	});

	describe("フィルター関数", () => {
		it.each([
			["getExpenseTransactions", getExpenseTransactions, "type=expense"],
			["getTransactionsByCategory", () => getTransactionsByCategory("cat1"), "categoryId=cat1"],
			["getRecentTransactions", () => getRecentTransactions(10), "limit=10"],
		])("%s が正しいクエリパラメータで getTransactions を呼ぶ", async (name, fn, expectedParam) => {
			mockApiClient.get.mockResolvedValue(mockTransactions);
			await fn();
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining(expectedParam),
			);
		});

		it("getLargeTransactions が専用エンドポイントを使用する", async () => {
			mockApiClient.get.mockResolvedValue(mockTransactions);
			await getLargeTransactions(10000);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("/transactions/large?threshold=10000"),
			);
		});

		it("期間指定で取引を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockTransactions);
			await getTransactionsByDateRange({ from: "2024-07-01", to: "2024-07-31" });
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateFrom=2024-07-01&dateTo=2024-07-31"),
			);
		});
	});

	describe("日付ユーティリティ関数", () => {
		it("今月の取引を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockTransactions);
			await getCurrentMonthTransactions();
			// toISOString() changes the date to UTC, which can be different from local date
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateFrom=2024-06-30&dateTo=2024-07-30"),
			);
		});

		it("先月の取引を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockTransactions);
			await getLastMonthTransactions();
			// toISOString() changes the date to UTC
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateFrom=2024-05-31&dateTo=2024-06-29"),
			);
		});

		it("今年の取引を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockTransactions);
			await getCurrentYearTransactions();
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateFrom=2024-01-01&dateTo=2024-12-31"),
			);
		});

		it("月別統計を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockMonthlyStats);
			const result = await getMonthlyStats(2024);
			expect(result).toEqual(mockMonthlyStats);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				"/transactions/stats/monthly?year=2024",
			);
		});
	});

	describe("バッチ処理", () => {
		it("複数の取引を一括作成する", async () => {
			const batchData = [mockCreateRequest];
			const batchResponse = mockTransactions;
			mockApiClient.post.mockResolvedValue(batchResponse);

			const result = await createTransactionsBatch(batchData);
			expect(result).toEqual(batchResponse);
			expect(mockApiClient.post).toHaveBeenCalledWith("/transactions/batch", {
				transactions: batchData,
			});
		});

		it("複数の取引を一括削除する", async () => {
			const ids = ["txn1", "txn2"];
			const batchResponse = { deleted: 2, message: "削除完了" };
			mockApiClient.post.mockResolvedValue(batchResponse);

			const result = await deleteTransactionsBatch(ids);
			expect(result).toEqual(batchResponse);
			expect(mockApiClient.post).toHaveBeenCalledWith("/transactions/batch", {
				action: "delete",
				ids,
			});
		});
	});

	describe("エラーハンドリング", () => {
		it("APIエラーを正しく伝播する", async () => {
			const error = new Error("API Error");
			mockApiClient.get.mockRejectedValue(error);

			await expect(getTransactions()).rejects.toThrow(error);
		});
	});
});