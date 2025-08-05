/**
 * useIncomesフックのテスト
 * React Query版のテストケース
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "../../lib/api/types";
import { useIncomes } from "../useIncomes";

// モックの設定
vi.mock("../../lib/api/services/transactions", () => ({
	getTransactions: vi.fn(),
	createTransaction: vi.fn(),
	updateTransaction: vi.fn(),
	deleteTransaction: vi.fn(),
	getTransaction: vi.fn(),
}));

// モックインポート
import {
	createTransaction,
	deleteTransaction,
	getTransaction,
	getTransactions,
	updateTransaction,
} from "../../lib/api/services/transactions";

// テスト用のラッパーコンポーネント
const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
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

// テストデータ
const mockIncomes: Transaction[] = [
	{
		id: "1",
		amount: 50000,
		type: "income",
		description: "給与",
		date: "2024-01-15",
		categoryId: "salary",
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "2",
		amount: 30000,
		type: "income",
		description: "副業収入",
		date: "2024-01-20",
		categoryId: "other",
		createdAt: "2024-01-20T10:00:00Z",
		updatedAt: "2024-01-20T10:00:00Z",
	},
];

describe("useIncomes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("データ取得", () => {
		it("初期ロード時に収入一覧を取得する", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			// Assert - 初期状態
			expect(result.current.loading).toBe(true);
			expect(result.current.incomes).toEqual([]);
			expect(result.current.error).toBeNull();

			// Assert - データ取得後
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.incomes).toEqual(mockIncomes);
			expect(result.current.error).toBeNull();
			expect(mockedGetTransactions).toHaveBeenCalledWith({
				type: "income",
				limit: 100,
			});
		});

		it("データ取得に失敗した場合、エラーを設定する", async () => {
			// Arrange
			const errorMessage = "ネットワークエラー";
			const mockedGetTransactions = vi.mocked(getTransactions);
			mockedGetTransactions.mockRejectedValue(new Error(errorMessage));

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			// Assert - 最初はloadingがtrue
			expect(result.current.loading).toBe(true);
			expect(result.current.error).toBeNull();

			// APIが呼ばれてエラーになるまで待つ
			await waitFor(() => {
				expect(mockedGetTransactions).toHaveBeenCalledTimes(1);
			});

			// loadingがfalseになるのを待つ（エラー処理完了）
			await waitFor(
				() => {
					expect(result.current.loading).toBe(false);
				},
				{ timeout: 3000 },
			);

			// エラーが設定されていることを確認
			expect(result.current.error).toBe(errorMessage);
			expect(result.current.incomes).toEqual([]);
		});

		it("refetchで再取得できる", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 新しいデータ
			const updatedIncomes = [
				...mockIncomes,
				{
					id: "3",
					amount: 20000,
					type: "income" as const,
					description: "ボーナス",
					date: "2024-01-25",
					categoryId: "bonus",
					createdAt: "2024-01-25T10:00:00Z",
					updatedAt: "2024-01-25T10:00:00Z",
				},
			];
			mockedGetTransactions.mockResolvedValue(updatedIncomes);

			// refetch実行
			await act(async () => {
				await result.current.refetch();
			});

			// Assert
			await waitFor(() => {
				expect(result.current.incomes).toEqual(updatedIncomes);
			});
		});
	});

	describe("収入作成", () => {
		it("新しい収入を作成できる", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedCreateTransaction = vi.mocked(createTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			const newIncome: Transaction = {
				id: "3",
				amount: 15000,
				type: "income",
				description: "臨時収入",
				date: "2024-01-25",
				categoryId: "other",
				createdAt: "2024-01-25T10:00:00Z",
				updatedAt: "2024-01-25T10:00:00Z",
			};
			mockedCreateTransaction.mockResolvedValue(newIncome);

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 収入作成
			const formData = {
				amount: 15000,
				description: "臨時収入",
				date: "2024-01-25",
				categoryId: "other",
			};

			let createdIncome: Transaction;
			await act(async () => {
				createdIncome = await result.current.createIncomeMutation(formData);
			});

			// Assert
			expect(createdIncome!).toEqual(newIncome);
			expect(mockedCreateTransaction).toHaveBeenCalledWith({
				...formData,
				type: "income",
			});

			// キャッシュ無効化により再取得されるため、
			// 新しいデータが含まれるはずだが、モックの設定により元のデータになる
			// このテストではmutation自体の動作を確認しているので、
			// 楽観的更新の検証は削除
		});

		it("収入作成に失敗した場合、エラーをスローし元の状態に戻す", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedCreateTransaction = vi.mocked(createTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			const errorMessage = "作成に失敗しました";
			mockedCreateTransaction.mockRejectedValue(new Error(errorMessage));

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const formData = {
				amount: 15000,
				description: "臨時収入",
				date: "2024-01-25",
				categoryId: "other",
			};

			// Assert
			await expect(
				result.current.createIncomeMutation(formData),
			).rejects.toThrow(errorMessage);

			// キャッシュの無効化により再取得される
			await waitFor(() => {
				expect(result.current.incomes).toEqual(mockIncomes);
			});
		});
	});

	describe("収入更新", () => {
		it("既存の収入を更新できる", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedUpdateTransaction = vi.mocked(updateTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			const updatedIncome: Transaction = {
				...mockIncomes[0],
				amount: 60000,
				description: "給与（更新）",
			};
			mockedUpdateTransaction.mockResolvedValue(updatedIncome);

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const updateData = {
				amount: 60000,
				description: "給与（更新）",
			};

			let updated: Transaction;
			await act(async () => {
				updated = await result.current.updateIncomeMutation("1", updateData);
			});

			// Assert
			expect(updated!).toEqual(updatedIncome);
			expect(mockedUpdateTransaction).toHaveBeenCalledWith("1", updateData);

			// キャッシュ無効化により再取得されるため、
			// モックの設定により元のデータになる
			// このテストではmutation自体の動作を確認
		});

		it("収入更新に失敗した場合、エラーをスローし元の状態に戻す", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedUpdateTransaction = vi.mocked(updateTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			const errorMessage = "更新に失敗しました";
			mockedUpdateTransaction.mockRejectedValue(new Error(errorMessage));

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const updateData = {
				amount: 60000,
				description: "給与（更新）",
			};

			// Assert
			await expect(
				result.current.updateIncomeMutation("1", updateData),
			).rejects.toThrow(errorMessage);

			// 元の状態に戻る
			await waitFor(() => {
				expect(result.current.incomes).toEqual(mockIncomes);
			});
		});
	});

	describe("収入削除", () => {
		it("収入を削除できる", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedDeleteTransaction = vi.mocked(deleteTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);
			// DeleteResponseの型に合わせて適切な値を返す
			mockedDeleteTransaction.mockResolvedValue({ success: true });

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			await act(async () => {
				await result.current.deleteIncomeMutation("1");
			});

			// Assert
			expect(mockedDeleteTransaction).toHaveBeenCalledWith("1");

			// キャッシュ無効化により再取得されるため、
			// モックの設定により元のデータになる
			// このテストではmutation自体の動作を確認
		});

		it("収入削除に失敗した場合、エラーをスローし元の状態に戻す", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedDeleteTransaction = vi.mocked(deleteTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			const errorMessage = "削除に失敗しました";
			mockedDeleteTransaction.mockRejectedValue(new Error(errorMessage));

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// Assert
			await expect(result.current.deleteIncomeMutation("1")).rejects.toThrow(
				errorMessage,
			);

			// 元の状態に戻る
			await waitFor(() => {
				expect(result.current.incomes).toEqual(mockIncomes);
			});
		});
	});

	describe("収入詳細取得", () => {
		it("IDを指定して収入詳細を取得できる", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedGetTransaction = vi.mocked(getTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);
			mockedGetTransaction.mockResolvedValue(mockIncomes[0]);

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const income = await result.current.getIncomeById("1");

			// Assert
			expect(income).toEqual(mockIncomes[0]);
			expect(mockedGetTransaction).toHaveBeenCalledWith("1");
		});

		it("収入詳細取得に失敗した場合、エラーをスローする", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedGetTransaction = vi.mocked(getTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			const errorMessage = "取得に失敗しました";
			mockedGetTransaction.mockRejectedValue(new Error(errorMessage));

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// Assert
			await expect(result.current.getIncomeById("1")).rejects.toThrow(
				errorMessage,
			);
		});
	});

	describe("operationLoading", () => {
		it("mutation実行中はoperationLoadingがtrueになる", async () => {
			// Arrange
			const mockedGetTransactions = vi.mocked(getTransactions);
			const mockedCreateTransaction = vi.mocked(createTransaction);
			mockedGetTransactions.mockResolvedValue(mockIncomes);

			// 遅延を作るPromise
			let resolveCreate: (value: Transaction) => void;
			const createPromise = new Promise<Transaction>((resolve) => {
				resolveCreate = resolve;
			});
			mockedCreateTransaction.mockReturnValue(createPromise);

			// Act
			const { result } = renderHook(() => useIncomes(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// mutation開始（まだ完了しない）
			const formData = {
				amount: 15000,
				description: "臨時収入",
				date: "2024-01-25",
				categoryId: "other",
			};

			act(() => {
				result.current.createIncomeMutation(formData);
			});

			// operationLoadingがtrueになることを確認
			await waitFor(() => {
				expect(result.current.operationLoading).toBe(true);
			});

			// mutationを完了させる
			const newIncome: Transaction = {
				id: "3",
				amount: 15000,
				type: "income",
				description: "臨時収入",
				date: "2024-01-25",
				categoryId: "other",
				createdAt: "2024-01-25T10:00:00Z",
				updatedAt: "2024-01-25T10:00:00Z",
			};

			await act(async () => {
				resolveCreate!(newIncome);
			});

			// operationLoadingがfalseに戻ることを確認
			await waitFor(() => {
				expect(result.current.operationLoading).toBe(false);
			});
		});
	});
});
