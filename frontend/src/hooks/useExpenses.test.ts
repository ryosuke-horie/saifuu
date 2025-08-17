/**
 * useExpensesフックのテスト（最適化版）
 *
 * 基本機能とエラーハンドリングに焦点を当てた簡素化版
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import type { Category, TransactionWithCategory } from "../lib/api/types";
import { useExpenses } from "./useExpenses";

// API サービスのモック
vi.mock("../lib/api/services/transactions", () => ({
	getExpenseTransactions: vi.fn(),
	createTransaction: vi.fn(),
	updateTransaction: vi.fn(),
	deleteTransaction: vi.fn(),
	getTransaction: vi.fn(),
}));

import {
	createTransaction,
	deleteTransaction,
	getExpenseTransactions,
	updateTransaction,
} from "../lib/api/services/transactions";

describe("useExpenses", () => {
	const mockCategories: Category[] = [
		{
			id: "1",
			name: "食費",
			type: "expense" as const,
			color: "#ff0000",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		},
		{
			id: "2",
			name: "交通費",
			type: "expense" as const,
			color: "#00ff00",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		},
	];

	const mockExpenses: TransactionWithCategory[] = [
		{
			id: "1",
			amount: 1500,
			type: "expense" as const,
			description: "ランチ",
			date: "2025-01-15",
			category: mockCategories[0],
			categoryId: mockCategories[0].id,
			createdAt: "2025-01-15T00:00:00Z",
			updatedAt: "2025-01-15T00:00:00Z",
		},
		{
			id: "2",
			amount: 1000,
			type: "expense" as const,
			description: "電車",
			date: "2025-01-15",
			category: mockCategories[1],
			categoryId: mockCategories[1].id,
			createdAt: "2025-01-15T00:00:00Z",
			updatedAt: "2025-01-15T00:00:00Z",
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("基本動作", () => {
		it("初期状態とデータ取得が正しく動作する", async () => {
			const mockGetExpenses = getExpenseTransactions as Mock;
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);

			const { result } = renderHook(() => useExpenses());

			// 初期状態
			expect(result.current.expenses).toEqual([]);
			expect(result.current.loading).toBe(true);
			expect(result.current.error).toBeNull();

			// データ取得後
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.expenses).toEqual(mockExpenses);
			expect(result.current.error).toBeNull();
			expect(mockGetExpenses).toHaveBeenCalledWith({
				limit: 1000,
			});
		});

		it("APIエラーを適切にハンドリングする", async () => {
			const mockError = new Error("API Error");
			const mockGetExpenses = getExpenseTransactions as Mock;
			mockGetExpenses.mockRejectedValueOnce(mockError);

			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.error).toBe("API Error");
			expect(result.current.expenses).toEqual([]);
		});
	});

	describe("CRUD操作", () => {
		it("支出の作成・更新・削除が正しく動作する", async () => {
			const mockGetExpenses = getExpenseTransactions as Mock;
			const mockCreate = createTransaction as Mock;
			const mockUpdate = updateTransaction as Mock;
			const mockDelete = deleteTransaction as Mock;

			// 初期データ取得
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);
			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 1. 作成
			const newExpense = {
				amount: 2000,
				type: "expense" as const,
				categoryId: "1",
				description: "夕食",
				date: "2025-01-16",
			};
			const createdExpense = {
				...newExpense,
				id: "3",
				category: mockCategories[0],
				categoryId: mockCategories[0].id,
				createdAt: "2025-01-16T00:00:00Z",
				updatedAt: "2025-01-16T00:00:00Z",
			};

			mockCreate.mockResolvedValueOnce(createdExpense);
			mockGetExpenses.mockResolvedValueOnce([...mockExpenses, createdExpense]);

			await act(async () => {
				await result.current.createExpenseMutation(newExpense);
			});

			await waitFor(() => {
				expect(result.current.expenses).toHaveLength(3);
			});

			// 2. 更新
			const updateData = { amount: 2500, description: "豪華な夕食" };
			const updatedExpense = { ...createdExpense, ...updateData };

			mockUpdate.mockResolvedValueOnce(updatedExpense);
			mockGetExpenses.mockResolvedValueOnce([
				mockExpenses[0],
				mockExpenses[1],
				updatedExpense,
			]);

			await act(async () => {
				await result.current.updateExpenseMutation("3", updateData);
			});

			await waitFor(() => {
				const updated = result.current.expenses.find((e) => e.id === "3");
				expect(updated?.amount).toBe(2500);
				expect(updated?.description).toBe("豪華な夕食");
			});

			// 3. 削除
			mockDelete.mockResolvedValueOnce({});
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);

			await act(async () => {
				await result.current.deleteExpenseMutation("3");
			});

			await waitFor(() => {
				expect(result.current.expenses).toHaveLength(2);
				expect(
					result.current.expenses.find((e) => e.id === "3"),
				).toBeUndefined();
			});
		});
	});
});
