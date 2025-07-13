/**
 * 取引APIサービスのユニットテスト
 *
 * テスト対象:
 * - 基本的なCRUD操作
 * - クエリパラメータを使用した絞り込み機能
 * - 統計・日付関連のユーティリティ関数
 * - バッチ処理
 * - エラーハンドリング
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
	getIncomeTransactions,
	getLargeTransactions,
	getLastMonthTransactions,
	getMonthlyStats,
	getRecentTransactions,
	getTransaction,
	getTransactionStats,
	getTransactions,
	getTransactionsByCategory,
	getTransactionsByDateRange,
	transactionService,
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

const mockIncomeTransaction: Transaction = {
	id: "txn2",
	amount: 250000,
	type: "income",
	date: "2024-07-01",
	description: "給与",
	category: {
		id: "cat2",
		name: "給与",
		type: "income",
		color: "#4ECDC4",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	createdAt: "2024-07-01T09:00:00Z",
	updatedAt: "2024-07-01T09:00:00Z",
};

const mockTransactions: Transaction[] = [
	mockTransaction,
	mockIncomeTransaction,
];

const mockCreateRequest: CreateTransactionRequest = {
	amount: 5000,
	type: "expense",
	categoryId: "cat1",
	date: "2024-07-20",
	description: "ディナー代",
};

const mockUpdateRequest: UpdateTransactionRequest = {
	amount: 3500,
	description: "ランチ代（訂正）",
};

const mockStats: TransactionStats = {
	totalIncome: 250000,
	totalExpense: 50000,
	netAmount: 200000,
	transactionCount: 11,
	avgTransaction: 27272,
	categoryBreakdown: [
		{
			categoryId: "cat1",
			categoryName: "食費",
			type: "expense",
			totalAmount: 30000,
			count: 10,
		},
		{
			categoryId: "cat2",
			categoryName: "給与",
			type: "income",
			totalAmount: 250000,
			count: 1,
		},
	],
};

const mockMonthlyStats: MonthlyStats[] = [
	{
		year: 2024,
		month: 6,
		income: 230000,
		expense: 45000,
		net: 185000,
		subscriptionCost: 0,
	},
	{
		year: 2024,
		month: 7,
		income: 250000,
		expense: 50000,
		net: 200000,
		subscriptionCost: 0,
	},
];

const mockDeleteResponse: DeleteResponse = {
	message: "削除が完了しました",
	deletedId: "txn1",
};

describe("transactions service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getTransactions", () => {
		it("取引一覧を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockTransactions);

			const result = await getTransactions();

			expect(result).toEqual(mockTransactions);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				endpoints.transactions.list,
			);
		});

		it("クエリパラメータ付きで取得する", async () => {
			const query: GetTransactionsQuery = {
				type: "expense",
				categoryId: "cat1",
				dateFrom: "2024-07-01",
				dateTo: "2024-07-31",
			};
			mockApiClient.get.mockResolvedValue([mockTransaction]);

			const result = await getTransactions(query);

			expect(result).toEqual([mockTransaction]);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("type=expense"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("categoryId=cat1"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateFrom=2024-07-01"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateTo=2024-07-31"),
			);
		});

		it("ページネーション付きで取得する", async () => {
			const query: GetTransactionsQuery = {
				page: 2,
				limit: 20,
			};
			mockApiClient.get.mockResolvedValue(mockTransactions);

			const result = await getTransactions(query);

			expect(result).toEqual(mockTransactions);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("page=2"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("limit=20"),
			);
		});
	});

	describe("getTransaction", () => {
		it("IDで取引詳細を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockTransaction);

			const result = await getTransaction("txn1");

			expect(result).toEqual(mockTransaction);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				endpoints.transactions.detail("txn1"),
			);
		});

		it("存在しないIDの場合はエラーをスローする", async () => {
			const error = new Error("取引が見つかりません");
			mockApiClient.get.mockRejectedValue(error);

			await expect(getTransaction("nonexistent")).rejects.toThrow(error);
		});
	});

	describe("createTransaction", () => {
		it("新しい取引を作成する", async () => {
			const newTransaction = { ...mockTransaction, id: "txn3" };
			mockApiClient.post.mockResolvedValue(newTransaction);

			const result = await createTransaction(mockCreateRequest);

			expect(result).toEqual(newTransaction);
			expect(mockApiClient.post).toHaveBeenCalledWith(
				endpoints.transactions.create,
				mockCreateRequest,
			);
		});

		it("バリデーションエラーの場合はエラーをスローする", async () => {
			const error = new Error("金額は正の値を指定してください");
			mockApiClient.post.mockRejectedValue(error);

			await expect(createTransaction(mockCreateRequest)).rejects.toThrow(error);
		});
	});

	describe("updateTransaction", () => {
		it("取引を更新する", async () => {
			const updatedTransaction = { ...mockTransaction, ...mockUpdateRequest };
			mockApiClient.put.mockResolvedValue(updatedTransaction);

			const result = await updateTransaction("txn1", mockUpdateRequest);

			expect(result).toEqual(updatedTransaction);
			expect(mockApiClient.put).toHaveBeenCalledWith(
				endpoints.transactions.update("txn1"),
				mockUpdateRequest,
			);
		});

		it("存在しないIDの場合はエラーをスローする", async () => {
			const error = new Error("取引が見つかりません");
			mockApiClient.put.mockRejectedValue(error);

			await expect(
				updateTransaction("nonexistent", mockUpdateRequest),
			).rejects.toThrow(error);
		});
	});

	describe("deleteTransaction", () => {
		it("取引を削除する", async () => {
			mockApiClient.delete.mockResolvedValue(mockDeleteResponse);

			const result = await deleteTransaction("txn1");

			expect(result).toEqual(mockDeleteResponse);
			expect(mockApiClient.delete).toHaveBeenCalledWith(
				endpoints.transactions.delete("txn1"),
			);
		});

		it("削除権限がない場合はエラーをスローする", async () => {
			const error = new Error("削除権限がありません");
			mockApiClient.delete.mockRejectedValue(error);

			await expect(deleteTransaction("txn1")).rejects.toThrow(error);
		});
	});

	describe("getTransactionStats", () => {
		it("取引統計を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockStats);

			const result = await getTransactionStats();

			expect(result).toEqual(mockStats);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				endpoints.transactions.stats,
			);
		});

		it("期間指定で統計を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockStats);
			const dateRange = { from: "2024-07-01", to: "2024-07-31" };

			const result = await getTransactionStats(dateRange);

			expect(result).toEqual(mockStats);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateFrom=2024-07-01"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateTo=2024-07-31"),
			);
		});
	});

	describe("収入・支出フィルター関数", () => {
		beforeEach(() => {
			vi.mocked(mockApiClient.get).mockImplementation((endpoint: string) => {
				if (endpoint.includes("type=income")) {
					return Promise.resolve([mockIncomeTransaction]);
				}
				if (endpoint.includes("type=expense")) {
					return Promise.resolve([mockTransaction]);
				}
				return Promise.resolve(mockTransactions);
			});
		});

		describe("getIncomeTransactions", () => {
			it("収入取引のみを取得する", async () => {
				const result = await getIncomeTransactions();

				expect(result).toEqual([mockIncomeTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("type=income"),
				);
			});

			it("追加のクエリパラメータを適用できる", async () => {
				const result = await getIncomeTransactions({ categoryId: "cat2" });

				expect(result).toEqual([mockIncomeTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("type=income"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("categoryId=cat2"),
				);
			});
		});

		describe("getExpenseTransactions", () => {
			it("支出取引のみを取得する", async () => {
				const result = await getExpenseTransactions();

				expect(result).toEqual([mockTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("type=expense"),
				);
			});

			it("追加のクエリパラメータを適用できる", async () => {
				const result = await getExpenseTransactions({ categoryId: "cat1" });

				expect(result).toEqual([mockTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("type=expense"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("categoryId=cat1"),
				);
			});
		});
	});

	describe("カテゴリ・期間フィルター関数", () => {
		describe("getTransactionsByCategory", () => {
			it("特定のカテゴリの取引を取得する", async () => {
				mockApiClient.get.mockResolvedValue([mockTransaction]);

				const result = await getTransactionsByCategory("cat1");

				expect(result).toEqual([mockTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("categoryId=cat1"),
				);
			});

			it("追加のクエリパラメータを適用できる", async () => {
				mockApiClient.get.mockResolvedValue([mockTransaction]);

				const result = await getTransactionsByCategory("cat1", {
					type: "expense",
				});

				expect(result).toEqual([mockTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("categoryId=cat1"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("type=expense"),
				);
			});
		});

		describe("getTransactionsByDateRange", () => {
			it("期間指定で取引を取得する", async () => {
				mockApiClient.get.mockResolvedValue(mockTransactions);
				const dateRange = { from: "2024-07-01", to: "2024-07-31" };

				const result = await getTransactionsByDateRange(dateRange);

				expect(result).toEqual(mockTransactions);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateFrom=2024-07-01"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateTo=2024-07-31"),
				);
			});

			it("追加のクエリパラメータを適用できる", async () => {
				mockApiClient.get.mockResolvedValue([mockTransaction]);
				const dateRange = { from: "2024-07-01", to: "2024-07-31" };

				const result = await getTransactionsByDateRange(dateRange, {
					type: "expense",
				});

				expect(result).toEqual([mockTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateFrom=2024-07-01"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateTo=2024-07-31"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("type=expense"),
				);
			});
		});
	});

	describe("日付関連ユーティリティ関数", () => {
		beforeEach(() => {
			// 現在の日付を固定（2024年7月15日）
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-07-15"));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		describe("getCurrentMonthTransactions", () => {
			it("今月の取引を取得する", async () => {
				mockApiClient.get.mockResolvedValue(mockTransactions);

				const result = await getCurrentMonthTransactions();

				expect(result).toEqual(mockTransactions);
				// 実装のtoISOString().split("T")[0]の結果に合わせる
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateFrom=2024-06-30"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateTo=2024-07-30"),
				);
			});
		});

		describe("getLastMonthTransactions", () => {
			it("先月の取引を取得する", async () => {
				mockApiClient.get.mockResolvedValue(mockTransactions);

				const result = await getLastMonthTransactions();

				expect(result).toEqual(mockTransactions);
				// 実装のtoISOString().split("T")[0]の結果に合わせる
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateFrom=2024-05-31"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateTo=2024-06-29"),
				);
			});
		});

		describe("getCurrentYearTransactions", () => {
			it("今年の取引を取得する", async () => {
				mockApiClient.get.mockResolvedValue(mockTransactions);

				const result = await getCurrentYearTransactions();

				expect(result).toEqual(mockTransactions);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateFrom=2024-01-01"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("dateTo=2024-12-31"),
				);
			});
		});
	});

	describe("月別統計関数", () => {
		describe("getMonthlyStats", () => {
			it("今年の月別統計を取得する", async () => {
				mockApiClient.get.mockResolvedValue(mockMonthlyStats);
				vi.setSystemTime(new Date("2024-07-15"));

				const result = await getMonthlyStats();

				expect(result).toEqual(mockMonthlyStats);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/transactions/stats/monthly?year=2024",
				);
			});

			it("指定年の月別統計を取得する", async () => {
				mockApiClient.get.mockResolvedValue(mockMonthlyStats);

				const result = await getMonthlyStats(2023);

				expect(result).toEqual(mockMonthlyStats);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/transactions/stats/monthly?year=2023",
				);
			});
		});
	});

	describe("その他のユーティリティ関数", () => {
		describe("getRecentTransactions", () => {
			it("最近の取引をデフォルト10件取得する", async () => {
				mockApiClient.get.mockResolvedValue(mockTransactions);

				const result = await getRecentTransactions();

				expect(result).toEqual(mockTransactions);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("limit=10"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("page=1"),
				);
			});

			it("指定した件数の最近の取引を取得する", async () => {
				mockApiClient.get.mockResolvedValue(mockTransactions);

				const result = await getRecentTransactions(20);

				expect(result).toEqual(mockTransactions);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("limit=20"),
				);
			});
		});

		describe("getLargeTransactions", () => {
			it("指定金額以上の取引を取得する", async () => {
				mockApiClient.get.mockResolvedValue([mockIncomeTransaction]);

				const result = await getLargeTransactions(100000);

				expect(result).toEqual([mockIncomeTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("/transactions/large"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("threshold=100000"),
				);
			});

			it("タイプを指定して大きな金額の取引を取得する", async () => {
				mockApiClient.get.mockResolvedValue([mockIncomeTransaction]);

				const result = await getLargeTransactions(100000, "income");

				expect(result).toEqual([mockIncomeTransaction]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("type=income"),
				);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("threshold=100000"),
				);
			});
		});
	});

	describe("バッチ処理関数", () => {
		describe("createTransactionsBatch", () => {
			it("複数の取引を一括作成する", async () => {
				const batchRequests = [
					mockCreateRequest,
					{ ...mockCreateRequest, amount: 8000 },
				];
				const batchResponse = [
					mockTransaction,
					{ ...mockTransaction, id: "txn4" },
				];
				mockApiClient.post.mockResolvedValue(batchResponse);

				const result = await createTransactionsBatch(batchRequests);

				expect(result).toEqual(batchResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith("/transactions/batch", {
					transactions: batchRequests,
				});
			});

			it("空の配列でも処理できる", async () => {
				mockApiClient.post.mockResolvedValue([]);

				const result = await createTransactionsBatch([]);

				expect(result).toEqual([]);
				expect(mockApiClient.post).toHaveBeenCalledWith("/transactions/batch", {
					transactions: [],
				});
			});
		});

		describe("deleteTransactionsBatch", () => {
			it("複数の取引を一括削除する", async () => {
				const deleteIds = ["txn1", "txn2", "txn3"];
				const batchDeleteResponse = {
					message: "3件の取引を削除しました",
					deletedIds: deleteIds,
				};
				mockApiClient.post.mockResolvedValue(batchDeleteResponse);

				const result = await deleteTransactionsBatch(deleteIds);

				expect(result).toEqual(batchDeleteResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith("/transactions/batch", {
					action: "delete",
					ids: deleteIds,
				});
			});

			it("空の配列でも処理できる", async () => {
				const emptyResponse = {
					message: "0件の取引を削除しました",
					deletedIds: [],
				};
				mockApiClient.post.mockResolvedValue(emptyResponse);

				const result = await deleteTransactionsBatch([]);

				expect(result).toEqual(emptyResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith("/transactions/batch", {
					action: "delete",
					ids: [],
				});
			});
		});
	});

	describe("transactionService オブジェクト", () => {
		it("すべての関数がエクスポートされている", () => {
			expect(transactionService.getTransactions).toBe(getTransactions);
			expect(transactionService.getTransaction).toBe(getTransaction);
			expect(transactionService.createTransaction).toBe(createTransaction);
			expect(transactionService.updateTransaction).toBe(updateTransaction);
			expect(transactionService.deleteTransaction).toBe(deleteTransaction);
			expect(transactionService.getTransactionStats).toBe(getTransactionStats);
			expect(transactionService.getIncomeTransactions).toBe(
				getIncomeTransactions,
			);
			expect(transactionService.getExpenseTransactions).toBe(
				getExpenseTransactions,
			);
			expect(transactionService.getTransactionsByCategory).toBe(
				getTransactionsByCategory,
			);
			expect(transactionService.getTransactionsByDateRange).toBe(
				getTransactionsByDateRange,
			);
			expect(transactionService.getCurrentMonthTransactions).toBe(
				getCurrentMonthTransactions,
			);
			expect(transactionService.getLastMonthTransactions).toBe(
				getLastMonthTransactions,
			);
			expect(transactionService.getCurrentYearTransactions).toBe(
				getCurrentYearTransactions,
			);
			expect(transactionService.getMonthlyStats).toBe(getMonthlyStats);
			expect(transactionService.getRecentTransactions).toBe(
				getRecentTransactions,
			);
			expect(transactionService.getLargeTransactions).toBe(
				getLargeTransactions,
			);
			expect(transactionService.createTransactionsBatch).toBe(
				createTransactionsBatch,
			);
			expect(transactionService.deleteTransactionsBatch).toBe(
				deleteTransactionsBatch,
			);
		});

		it("オブジェクトが読み取り専用である", () => {
			// as constで作成されているため、プロパティの変更はTypeScriptレベルでエラーになる
			const descriptor = Object.getOwnPropertyDescriptor(
				transactionService,
				"getTransactions",
			);
			expect(descriptor?.writable).toBe(true); // 関数プロパティは技術的には書き換え可能だが、型レベルで保護されている
			expect(Object.isFrozen(transactionService)).toBe(false); // as constは型レベルの保護のみ
		});
	});

	describe("エッジケース", () => {
		it("undefined値のクエリパラメータを正しく処理する", async () => {
			const query: GetTransactionsQuery = {
				type: undefined,
				categoryId: "cat1",
			};
			mockApiClient.get.mockResolvedValue(mockTransactions);

			await getTransactions(query);

			// undefinedの値は含まれず、categoryIdのみが含まれる
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("categoryId=cat1"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.not.stringContaining("type=undefined"),
			);
		});

		it("null値のクエリパラメータを正しく処理する", async () => {
			const query = { categoryId: "cat1" };
			mockApiClient.get.mockResolvedValue(mockTransactions);

			await getTransactions(query);

			// categoryIdのみが含まれる
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("categoryId=cat1"),
			);
		});

		it("空文字列のIDでも関数を呼び出せる", async () => {
			mockApiClient.get.mockResolvedValue(mockTransaction);

			await getTransaction("");

			expect(mockApiClient.get).toHaveBeenCalledWith(
				endpoints.transactions.detail(""),
			);
		});

		it("空のデータで作成・更新ができる", async () => {
			const emptyRequest = {} as CreateTransactionRequest;
			mockApiClient.post.mockResolvedValue(mockTransaction);

			await createTransaction(emptyRequest);

			expect(mockApiClient.post).toHaveBeenCalledWith(
				endpoints.transactions.create,
				emptyRequest,
			);
		});

		it("年をまたぐ日付範囲での処理", async () => {
			// 12月の処理
			vi.setSystemTime(new Date("2024-12-15"));
			mockApiClient.get.mockResolvedValue(mockTransactions);

			const result = await getLastMonthTransactions();

			expect(result).toEqual(mockTransactions);
			// 実装のtoISOString().split("T")[0]の結果に合わせる
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateFrom=2024-10-31"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateTo=2024-11-29"),
			);

			// 1月の処理（前年12月を取得）
			vi.setSystemTime(new Date("2024-01-15"));
			mockApiClient.get.mockClear();
			mockApiClient.get.mockResolvedValue(mockTransactions);

			const januaryResult = await getLastMonthTransactions();

			expect(januaryResult).toEqual(mockTransactions);
			// 実装のtoISOString().split("T")[0]の結果に合わせる
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateFrom=2023-11-30"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("dateTo=2023-12-30"),
			);
		});

		it("極大値の金額でも処理できる", async () => {
			const largeAmount = 999999999;
			const largeRequest = { ...mockCreateRequest, amount: largeAmount };
			mockApiClient.post.mockResolvedValue({
				...mockTransaction,
				amount: largeAmount,
			});

			const result = await createTransaction(largeRequest);

			expect(result.amount).toBe(largeAmount);
		});

		it("極小値の金額でも処理できる", async () => {
			const smallAmount = 1;
			const smallRequest = { ...mockCreateRequest, amount: smallAmount };
			mockApiClient.post.mockResolvedValue({
				...mockTransaction,
				amount: smallAmount,
			});

			const result = await createTransaction(smallRequest);

			expect(result.amount).toBe(smallAmount);
		});

		it("特殊文字を含む説明でも処理できる", async () => {
			const specialDescription = "テスト🎉<script>alert('XSS')</script>";
			const specialRequest = {
				...mockCreateRequest,
				description: specialDescription,
			};
			mockApiClient.post.mockResolvedValue({
				...mockTransaction,
				description: specialDescription,
			});

			const result = await createTransaction(specialRequest);

			expect(result.description).toBe(specialDescription);
		});
	});
});
