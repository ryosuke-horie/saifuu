/**
 * useExpensesフックのテスト
 * 支出・収入のCRUD操作とローディング状態の管理をテスト
 *
 * 関連Issue: #93 支出管理メインページ実装
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useExpenses } from "./useExpenses";
import type { Transaction } from "../lib/api/types";

// モックデータ
const mockExpenses: Transaction[] = [
	{
		id: "1",
		amount: 1000,
		description: "コーヒー",
		date: "2024-01-01",
		type: "expense",
		category: {
			id: "category-1",
			name: "食費",
			type: "expense",
			color: "#FF0000",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: "2",
		amount: 5000,
		description: "ランチ",
		date: "2024-01-02",
		type: "expense",
		category: {
			id: "category-2",
			name: "交通費",
			type: "expense",
			color: "#00FF00",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		createdAt: "2024-01-02T00:00:00.000Z",
		updatedAt: "2024-01-02T00:00:00.000Z",
	},
];

const newExpense: Transaction = {
	id: "3",
	amount: 3000,
	description: "夕食",
	date: "2024-01-03",
	type: "expense",
	category: {
		id: "category-1",
		name: "食費",
		type: "expense",
		color: "#FF0000",
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	createdAt: "2024-01-03T00:00:00.000Z",
	updatedAt: "2024-01-03T00:00:00.000Z",
};

// APIサービスのモック
vi.mock("../lib/api/services/transactions", () => ({
	getExpenseTransactions: vi.fn(),
	createTransaction: vi.fn(),
	updateTransaction: vi.fn(),
	deleteTransaction: vi.fn(),
	getTransaction: vi.fn(),
}));

// カテゴリ変換ユーティリティのモック
vi.mock("../utils/categories", () => ({
	convertGlobalCategoriesToCategory: vi.fn(() => [
		{
			id: "category-1",
			name: "食費",
			type: "expense",
			color: "#FF0000",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "category-2",
			name: "交通費",
			type: "expense",
			color: "#00FF00",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
	]),
}));

// モックされたAPIサービスをインポート
import {
	getExpenseTransactions,
	createTransaction,
	updateTransaction,
	deleteTransaction,
	getTransaction,
} from "../lib/api/services/transactions";

// モック化された関数を取得
const mockGetExpenseTransactions = vi.mocked(getExpenseTransactions);
const mockCreateTransaction = vi.mocked(createTransaction);
const mockUpdateTransaction = vi.mocked(updateTransaction);
const mockDeleteTransaction = vi.mocked(deleteTransaction);
const mockGetTransaction = vi.mocked(getTransaction);

describe("useExpenses", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("初期状態が正しく設定される", () => {
			mockGetExpenseTransactions.mockResolvedValueOnce([]);
			const { result } = renderHook(() => useExpenses());

			expect(result.current.expenses).toEqual([]);
			expect(result.current.loading).toBe(true);
			expect(result.current.error).toBeNull();
			expect(result.current.operationLoading).toBe(false);
		});
	});

	describe("支出データの取得", () => {
		it("支出データを正常に取得できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.expenses).toEqual(mockExpenses);
			expect(result.current.error).toBeNull();
			expect(mockGetExpenseTransactions).toHaveBeenCalledWith({ limit: 100 });
		});

		it("支出データ取得時のエラーを処理できる", async () => {
			const errorMessage = "Network error";
			mockGetExpenseTransactions.mockRejectedValueOnce(new Error(errorMessage));
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.expenses).toEqual([]);
			expect(result.current.error).toBe(errorMessage);
		});
	});

	describe("支出の作成", () => {
		it("新しい支出を作成できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			mockCreateTransaction.mockResolvedValueOnce(newExpense);
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const formData = {
				amount: 3000,
				description: "夕食",
				date: "2024-01-03",
				categoryId: "category-1",
			};

			let createdExpense: Transaction | undefined;
			await act(async () => {
				createdExpense = await result.current.createExpenseMutation(formData);
			});

			expect(createdExpense).toEqual(newExpense);
			expect(result.current.expenses).toHaveLength(3);
			expect(result.current.expenses).toContainEqual(newExpense);
			expect(result.current.operationLoading).toBe(false);
			expect(mockCreateTransaction).toHaveBeenCalledWith({
				...formData,
				type: "expense",
			});
		});

		it("支出作成時のエラーを処理できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			const errorMessage = "作成エラー";
			mockCreateTransaction.mockRejectedValueOnce(new Error(errorMessage));
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const formData = {
				amount: 3000,
				description: "夕食",
				date: "2024-01-03",
				categoryId: "category-1",
			};

			// エラーがthrowされることを確認
			await expect(
				act(async () => {
					await result.current.createExpenseMutation(formData);
				})
			).rejects.toThrow(errorMessage);

			// エラー後もexpensesの状態は変わらない
			expect(result.current.expenses).toEqual(mockExpenses);
		});
	});

	describe("支出の更新", () => {
		it("既存の支出を更新できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			const updatedExpense = { ...mockExpenses[0], amount: 2000 };
			mockUpdateTransaction.mockResolvedValueOnce(updatedExpense);
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const updateData = { amount: 2000 };
			let updated: Transaction | undefined;
			await act(async () => {
				updated = await result.current.updateExpenseMutation("1", updateData);
			});

			expect(updated).toEqual(updatedExpense);
			expect(result.current.expenses[0]).toEqual(updatedExpense);
			expect(result.current.operationLoading).toBe(false);
			expect(mockUpdateTransaction).toHaveBeenCalledWith("1", {
				...updateData,
				type: "expense",
			});
		});

		it("支出更新時のエラーを処理できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			const errorMessage = "更新エラー";
			mockUpdateTransaction.mockRejectedValueOnce(new Error(errorMessage));
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// エラーがthrowされることを確認
			await expect(
				act(async () => {
					await result.current.updateExpenseMutation("1", { amount: 2000 });
				})
			).rejects.toThrow(errorMessage);

			// エラー後も元のexpensesの状態が保持される
			expect(result.current.expenses).toEqual(mockExpenses);
		});
	});

	describe("支出の削除", () => {
		it("支出を削除できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			mockDeleteTransaction.mockResolvedValueOnce({
				message: "削除しました",
				deletedId: "1",
			});
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			await act(async () => {
				await result.current.deleteExpenseMutation("1");
			});

			expect(result.current.expenses).toHaveLength(1);
			expect(result.current.expenses.find(e => e.id === "1")).toBeUndefined();
			expect(result.current.operationLoading).toBe(false);
			expect(mockDeleteTransaction).toHaveBeenCalledWith("1");
		});

		it("支出削除時のエラーを処理できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			const errorMessage = "削除エラー";
			mockDeleteTransaction.mockRejectedValueOnce(new Error(errorMessage));
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// エラーがthrowされることを確認
			await expect(
				act(async () => {
					await result.current.deleteExpenseMutation("1");
				})
			).rejects.toThrow(errorMessage);

			// エラー後もexpensesは削除されていない
			expect(result.current.expenses).toHaveLength(2);
			expect(result.current.expenses.find(e => e.id === "1")).toBeDefined();
		});
	});

	describe("個別の支出データ取得", () => {
		it("IDで特定の支出を取得できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			mockGetTransaction.mockResolvedValueOnce(mockExpenses[0]);
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			let expense: Transaction | undefined;
			await act(async () => {
				expense = await result.current.getExpenseById("1");
			});

			expect(expense).toEqual(mockExpenses[0]);
			expect(mockGetTransaction).toHaveBeenCalledWith("1");
		});

		it("個別データ取得時のエラーを処理できる", async () => {
			mockGetExpenseTransactions.mockResolvedValueOnce(mockExpenses);
			const errorMessage = "取得エラー";
			mockGetTransaction.mockRejectedValueOnce(new Error(errorMessage));
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// エラーがthrowされることを確認
			await expect(
				act(async () => {
					await result.current.getExpenseById("999");
				})
			).rejects.toThrow(errorMessage);

			// 個別データ取得エラーは状態に影響しない
			expect(result.current.expenses).toEqual(mockExpenses);
		});
	});

	describe("refetch機能", () => {
		it("データを再取得できる", async () => {
			mockGetExpenseTransactions
				.mockResolvedValueOnce(mockExpenses)
				.mockResolvedValueOnce([...mockExpenses, newExpense]);
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.expenses).toHaveLength(2);

			await act(async () => {
				await result.current.refetch();
			});

			expect(result.current.expenses).toHaveLength(3);
			expect(mockGetExpenseTransactions).toHaveBeenCalledTimes(2);
		});
	});
});