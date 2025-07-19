/**
 * useExpensesフックのテスト（最適化版）
 *
 * 基本機能とエラーハンドリングに焦点を当てた簡素化版
 */
import { renderHook, waitFor } from "@testing-library/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import type { Category, Transaction } from "../lib/api/types";
import { useExpenses } from "./useExpenses";

// APIクライアントのモック
vi.mock("../lib/api/client", () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
}));

import { apiClient } from "../lib/api/client";

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

	const mockExpenses: Transaction[] = [
		{
			id: "1",
			amount: 1500,
			type: "expense" as const,
			description: "ランチ",
			date: "2025-01-15",
			category: mockCategories[0],
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
			const mockGet = apiClient.get as Mock;
			mockGet.mockResolvedValueOnce(mockExpenses);

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
			expect(mockGet).toHaveBeenCalledWith("/expenses");
		});

		it("APIエラーを適切にハンドリングする", async () => {
			const mockError = new Error("API Error");
			const mockGet = apiClient.get as Mock;
			mockGet.mockRejectedValueOnce(mockError);

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
			const mockGet = apiClient.get as Mock;
			const mockPost = apiClient.post as Mock;
			const mockPut = apiClient.put as Mock;
			const mockDelete = apiClient.delete as Mock;

			// 初期データ取得
			mockGet.mockResolvedValueOnce(mockExpenses);
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
				createdAt: "2025-01-16T00:00:00Z",
				updatedAt: "2025-01-16T00:00:00Z",
			};

			mockPost.mockResolvedValueOnce(createdExpense);
			mockGet.mockResolvedValueOnce([...mockExpenses, createdExpense]);

			await result.current.createExpenseMutation(newExpense);

			await waitFor(() => {
				expect(result.current.expenses).toHaveLength(3);
			});

			// 2. 更新
			const updateData = { amount: 2500, description: "豪華な夕食" };
			const updatedExpense = { ...createdExpense, ...updateData };

			mockPut.mockResolvedValueOnce(updatedExpense);
			mockGet.mockResolvedValueOnce([
				mockExpenses[0],
				mockExpenses[1],
				updatedExpense,
			]);

			await result.current.updateExpenseMutation("3", updateData);

			await waitFor(() => {
				const updated = result.current.expenses.find((e) => e.id === "3");
				expect(updated?.amount).toBe(2500);
				expect(updated?.description).toBe("豪華な夕食");
			});

			// 3. 削除
			mockDelete.mockResolvedValueOnce({});
			mockGet.mockResolvedValueOnce(mockExpenses);

			await result.current.deleteExpenseMutation("3");

			await waitFor(() => {
				expect(result.current.expenses).toHaveLength(2);
				expect(
					result.current.expenses.find((e) => e.id === "3"),
				).toBeUndefined();
			});
		});
	});

	describe("その他の機能", () => {
		it("refetch機能が動作する", async () => {
			const mockGet = apiClient.get as Mock;
			mockGet.mockResolvedValueOnce(mockExpenses).mockResolvedValueOnce([
				...mockExpenses,
				{
					id: "3",
					amount: 3000,
					categoryId: "1",
					category: mockCategories[0],
					type: "expense" as const,
					description: "追加の支出",
					date: "2025-01-16",
					createdAt: "2025-01-16T00:00:00Z",
					updatedAt: "2025-01-16T00:00:00Z",
				},
			]);

			const { result } = renderHook(() => useExpenses());

			await waitFor(() => {
				expect(result.current.expenses).toHaveLength(2);
			});

			// refetch実行
			await result.current.refetch();

			await waitFor(() => {
				expect(result.current.expenses).toHaveLength(3);
			});

			expect(mockGet).toHaveBeenCalledTimes(2);
		});
	});
});
