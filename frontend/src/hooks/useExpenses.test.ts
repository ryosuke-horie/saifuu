import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as transactionsApi from "../lib/api/services/transactions";
import type { Transaction } from "../lib/api/types";
import { useExpenses } from "./useExpenses";

// APIモック
vi.mock("../lib/api/services/transactions");

// モックデータ
const mockExpenses: Transaction[] = [
	{
		id: "1",
		amount: 1000,
		description: "ランチ",
		date: "2024-01-01",
		category: {
			id: "1",
			name: "食費",
			type: "expense",
			color: "#ff0000",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		type: "expense",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		amount: 500,
		description: "コーヒー",
		date: "2024-01-02",
		category: {
			id: "1",
			name: "食費",
			type: "expense",
			color: "#ff0000",
			createdAt: "2024-01-02T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
		},
		type: "expense",
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
];

// 簡素化されたテスト: 重複を削除し、主要機能のみテスト
describe("useExpenses (Simplified)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// デフォルトで成功レスポンスを返す
		vi.mocked(transactionsApi.getExpenseTransactions).mockResolvedValue(
			mockExpenses,
		);
	});

	describe("基本機能", () => {
		it("初期状態が正しく設定される", () => {
			const { result } = renderHook(() => useExpenses());

			// 初期状態の確認
			expect(result.current.expenses).toEqual([]);
			expect(result.current.loading).toBe(true);
			expect(result.current.error).toBeNull();
			expect(result.current.operationLoading).toBe(false);
			expect(result.current.refetch).toBeInstanceOf(Function);
			expect(result.current.createExpenseMutation).toBeInstanceOf(Function);
			expect(result.current.updateExpenseMutation).toBeInstanceOf(Function);
			expect(result.current.deleteExpenseMutation).toBeInstanceOf(Function);
		});

		it("支出データを正常に取得できる", async () => {
			const { result } = renderHook(() => useExpenses());

			// データ取得を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 結果の確認
			expect(result.current.expenses).toEqual(mockExpenses);
			expect(result.current.error).toBeNull();
			expect(transactionsApi.getExpenseTransactions).toHaveBeenCalledTimes(1);
		});
	});

	describe("CRUD操作", () => {
		it("新規支出を作成できる", async () => {
			const newExpense: Transaction = {
				id: "3",
				amount: 2000,
				description: "夕食",
				date: "2024-01-03",
				category: {
					id: "1",
					name: "食費",
					type: "expense",
					color: "#ff0000",
					createdAt: "2024-01-03T00:00:00Z",
					updatedAt: "2024-01-03T00:00:00Z",
				},
				type: "expense",
				createdAt: "2024-01-03T00:00:00Z",
				updatedAt: "2024-01-03T00:00:00Z",
			};

			vi.mocked(transactionsApi.createTransaction).mockResolvedValue(
				newExpense,
			);

			const { result } = renderHook(() => useExpenses());

			// 初期データ取得を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 新規作成を実行
			await act(async () => {
				await result.current.createExpenseMutation({
					amount: 2000,
					description: "夕食",
					date: "2024-01-03",
					categoryId: "1",
				});
			});

			// APIが呼ばれたことを確認
			expect(transactionsApi.createTransaction).toHaveBeenCalledWith({
				amount: 2000,
				description: "夕食",
				date: "2024-01-03",
				categoryId: "1",
				type: "expense",
			});

			// データが再取得されることはない（ローカルステートを更新）
			expect(transactionsApi.getExpenseTransactions).toHaveBeenCalledTimes(1);
		});

		it("既存支出を更新できる", async () => {
			const updatedExpense: Transaction = {
				...mockExpenses[0],
				amount: 1500,
				description: "ランチ（更新）",
			};

			vi.mocked(transactionsApi.updateTransaction).mockResolvedValue(
				updatedExpense,
			);

			const { result } = renderHook(() => useExpenses());

			// 初期データ取得を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 更新を実行
			await act(async () => {
				await result.current.updateExpenseMutation("1", {
					amount: 1500,
					description: "ランチ（更新）",
				});
			});

			// APIが呼ばれたことを確認
			expect(transactionsApi.updateTransaction).toHaveBeenCalledWith("1", {
				amount: 1500,
				description: "ランチ（更新）",
				type: "expense",
			});

			// データが再取得されることはない（ローカルステートを更新）
			expect(transactionsApi.getExpenseTransactions).toHaveBeenCalledTimes(1);
		});

		it("支出を削除できる", async () => {
			vi.mocked(transactionsApi.deleteTransaction).mockResolvedValue({
				message: "Deleted successfully",
				deletedId: "1",
			});

			const { result } = renderHook(() => useExpenses());

			// 初期データ取得を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 削除を実行
			await act(async () => {
				await result.current.deleteExpenseMutation("1");
			});

			// APIが呼ばれたことを確認
			expect(transactionsApi.deleteTransaction).toHaveBeenCalledWith("1");

			// データが再取得されることはない（ローカルステートを更新）
			expect(transactionsApi.getExpenseTransactions).toHaveBeenCalledTimes(1);
		});
	});

	describe("エラーハンドリング", () => {
		it("API エラーを適切にハンドリングする", async () => {
			const errorMessage = "サーバーエラー";
			vi.mocked(transactionsApi.getExpenseTransactions).mockRejectedValue(
				new Error(errorMessage),
			);

			const { result } = renderHook(() => useExpenses());

			// エラーが設定されるまで待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// エラー状態の確認
			expect(result.current.expenses).toEqual([]);
			expect(result.current.error).toBe(errorMessage);
		});
	});

	describe("その他の機能", () => {
		it("refetch でデータを再取得できる", async () => {
			const { result } = renderHook(() => useExpenses());

			// 初回取得を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// API呼び出しをクリア
			vi.clearAllMocks();

			// refetchを実行
			await act(async () => {
				await result.current.refetch();
			});

			// 再度APIが呼ばれる
			expect(transactionsApi.getExpenseTransactions).toHaveBeenCalledTimes(1);
			expect(result.current.expenses).toEqual(mockExpenses);
		});
	});
});
