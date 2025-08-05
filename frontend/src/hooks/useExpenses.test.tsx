/**
 * useExpensesフックのテスト（React Query版）
 *
 * React Queryを使用した実装のテスト
 * 基本機能とエラーハンドリング、mutation操作に焦点を当てる
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
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
	getTransaction,
	updateTransaction,
} from "../lib/api/services/transactions";

// テスト用のラッパーコンポーネント
const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
				// React Query v5ではエラー時のundefinedを許可しないため、throwOnErrorを認識させる
				throwOnError: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("useExpenses (React Query版)", () => {
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

			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

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
				limit: 100,
			});
		});

		it("APIエラーを適切にハンドリングする", async () => {
			const mockError = new Error("API Error");
			const mockGetExpenses = getExpenseTransactions as Mock;
			// 再試行を含めてすべてエラーを返す
			mockGetExpenses.mockRejectedValue(mockError);

			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

			// エラーが発生するまで待つ
			await waitFor(
				() => {
					expect(result.current.error).not.toBeNull();
				},
				{ timeout: 3000 },
			);

			// エラー時の状態を確認
			expect(result.current.error).toBe("API Error");
			expect(result.current.loading).toBe(false);
			expect(result.current.expenses).toEqual([]);
		});

		it("refetchが正しく動作する", async () => {
			const mockGetExpenses = getExpenseTransactions as Mock;
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);

			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 新しいデータを設定
			const newExpenses = [...mockExpenses];
			mockGetExpenses.mockResolvedValueOnce(newExpenses);

			// refetchを実行
			await act(async () => {
				await result.current.refetch();
			});

			expect(mockGetExpenses).toHaveBeenCalledTimes(2);
		});
	});

	describe("CRUD操作 (mutations)", () => {
		it("支出の作成が正しく動作する（楽観的更新）", async () => {
			const mockGetExpenses = getExpenseTransactions as Mock;
			const mockCreate = createTransaction as Mock;

			// 初期データ取得
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);
			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 作成データ
			const newExpense = {
				amount: 2000,
				description: "夕食",
				date: "2025-01-16",
				categoryId: "1",
			};
			const createdExpense = {
				...newExpense,
				id: "3",
				type: "expense" as const,
				category: mockCategories[0],
				createdAt: "2025-01-16T00:00:00Z",
				updatedAt: "2025-01-16T00:00:00Z",
			};

			mockCreate.mockResolvedValueOnce(createdExpense);
			mockGetExpenses.mockResolvedValueOnce([...mockExpenses, createdExpense]);

			// mutation実行
			await act(async () => {
				await result.current.createExpenseMutation(newExpense);
			});

			// 完了後の状態確認
			await waitFor(() => {
				expect(result.current.expenses).toHaveLength(3);
				const created = result.current.expenses.find((e) => e.id === "3");
				expect(created).toBeDefined();
			});

			expect(mockCreate).toHaveBeenCalledWith({
				...newExpense,
				type: "expense",
			});
		});

		it("支出の更新が正しく動作する（楽観的更新）", async () => {
			const mockGetExpenses = getExpenseTransactions as Mock;
			const mockUpdate = updateTransaction as Mock;

			// 初期データ取得
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);
			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 更新データ
			const updateData = { amount: 2500, description: "高級ランチ" };
			const updatedExpense = { ...mockExpenses[0], ...updateData };

			mockUpdate.mockResolvedValueOnce(updatedExpense);
			mockGetExpenses.mockResolvedValueOnce([updatedExpense, mockExpenses[1]]);

			// mutation実行
			await act(async () => {
				await result.current.updateExpenseMutation("1", updateData);
			});

			// キャッシュ無効化の完了を待つ
			await waitFor(
				() => {
					expect(mockGetExpenses).toHaveBeenCalledTimes(2);
				},
				{ timeout: 2000 },
			);

			expect(mockUpdate).toHaveBeenCalledWith("1", updateData);
		});

		it("支出の削除が正しく動作する（楽観的更新）", async () => {
			const mockGetExpenses = getExpenseTransactions as Mock;
			const mockDelete = deleteTransaction as Mock;

			// 初期データ取得
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);
			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			mockDelete.mockResolvedValueOnce({});
			mockGetExpenses.mockResolvedValueOnce([mockExpenses[1]]);

			// mutation実行
			await act(async () => {
				await result.current.deleteExpenseMutation("1");
			});

			// キャッシュ無効化の完了を待つ
			await waitFor(
				() => {
					expect(mockGetExpenses).toHaveBeenCalledTimes(2);
				},
				{ timeout: 2000 },
			);

			expect(mockDelete).toHaveBeenCalledWith("1");
		});

		it("mutationエラーを適切にハンドリングする", async () => {
			const mockGetExpenses = getExpenseTransactions as Mock;
			const mockCreate = createTransaction as Mock;

			// 初期データ取得
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);
			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// エラーを設定
			const error = new Error("作成に失敗しました");
			mockCreate.mockRejectedValueOnce(error);

			const newExpense = {
				amount: 2000,
				description: "夕食",
				date: "2025-01-16",
				categoryId: "1",
			};

			// mutationでエラーが発生することを確認
			await expect(
				result.current.createExpenseMutation(newExpense),
			).rejects.toThrow("作成に失敗しました");

			// エラー後もキャッシュが無効化されて再取得されることを確認
			await waitFor(
				() => {
					expect(mockGetExpenses).toHaveBeenCalledTimes(2);
				},
				{ timeout: 2000 },
			);
		});
	});

	describe("getExpenseById", () => {
		it("IDで支出を取得できる", async () => {
			const mockGetTransaction = getTransaction as Mock;
			const mockExpense = mockExpenses[0];
			mockGetTransaction.mockResolvedValueOnce(mockExpense);

			const mockGetExpenses = getExpenseTransactions as Mock;
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);

			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const expense = await result.current.getExpenseById("1");
			expect(expense).toEqual(mockExpense);
			expect(mockGetTransaction).toHaveBeenCalledWith("1");
		});

		it("取得エラーを適切にハンドリングする", async () => {
			const mockGetTransaction = getTransaction as Mock;
			const error = new Error("取得に失敗しました");
			mockGetTransaction.mockRejectedValueOnce(error);

			const mockGetExpenses = getExpenseTransactions as Mock;
			mockGetExpenses.mockResolvedValueOnce(mockExpenses);

			const { result } = renderHook(() => useExpenses(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			await expect(result.current.getExpenseById("999")).rejects.toThrow(
				"取得に失敗しました",
			);
		});
	});
});
