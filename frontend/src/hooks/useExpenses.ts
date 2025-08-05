/**
 * 支出管理のカスタムフック（React Query版）
 * 支出・収入のCRUD操作とローディング状態を管理
 *
 * 関連Issue: #93 支出管理メインページ実装
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { API_CONFIG } from "../config/constants";
import {
	createTransaction,
	deleteTransaction,
	getExpenseTransactions,
	getTransaction,
	updateTransaction,
} from "../lib/api/services/transactions";
import type { Transaction } from "../lib/api/types";
import type { Category } from "../types/category";
import { convertGlobalCategoriesToCategory } from "../utils/categories";

// クエリキーの定義（Matt Pocock方針：as constで厳密な型）
const QUERY_KEYS = {
	expenses: ["expenses"],
	expense: (id: string) => ["expense", id],
} as const;

interface UseExpensesReturn {
	expenses: Transaction[];
	loading: boolean;
	error: string | null;
	operationLoading: boolean; // CRUD操作のローディング状態
	refetch: () => Promise<void>;
	createExpenseMutation: (formData: {
		amount: number;
		description?: string | null;
		date: string;
		categoryId?: string | null;
	}) => Promise<Transaction>;
	updateExpenseMutation: (
		id: string,
		formData: {
			amount?: number;
			description?: string | null;
			date?: string;
			categoryId?: string | null;
		},
	) => Promise<Transaction>;
	deleteExpenseMutation: (id: string) => Promise<void>;
	getExpenseById: (id: string) => Promise<Transaction>;
}

/**
 * 支出データを管理するカスタムフック
 * グローバル設定のカテゴリを自動的に使用します
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 * @returns {UseExpensesReturn} 支出管理に必要な状態と操作関数
 * @example
 * const { expenses, loading, createExpenseMutation } = useExpenses();
 */
export function useExpenses(): UseExpensesReturn {
	const queryClient = useQueryClient();

	// グローバル設定のカテゴリを取得してCategory型に変換
	const _categories = useMemo((): Category[] => {
		return convertGlobalCategoriesToCategory("expense");
	}, []);

	// 支出データの取得
	const {
		data: expenses = [],
		isLoading,
		isError,
		error,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: QUERY_KEYS.expenses,
		queryFn: () =>
			getExpenseTransactions({
				limit: API_CONFIG.DEFAULT_TRANSACTION_LIMIT,
			}),
		// キャッシュ戦略
		staleTime: 0, // 常に新鮮なデータを取得
		gcTime: 5 * 60 * 1000, // 5分間キャッシュを保持
		// 再試行戦略
		retry: 1,
		retryDelay: 1000,
	});

	// 支出作成のmutation
	const createMutation = useMutation({
		mutationFn: (formData: {
			amount: number;
			description?: string | null;
			date: string;
			categoryId?: string | null;
		}) =>
			createTransaction({
				...formData,
				type: "expense",
			}),
		onSuccess: (newExpense) => {
			// 楽観的更新: キャッシュに新しい支出を追加
			queryClient.setQueryData<Transaction[]>(QUERY_KEYS.expenses, (old) => {
				if (!old) return [newExpense];
				return [...old, newExpense];
			});
		},
		onError: () => {
			// エラー時はキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
		},
	});

	// 支出更新のmutation
	const updateMutation = useMutation({
		mutationFn: ({
			id,
			formData,
		}: {
			id: string;
			formData: {
				amount?: number;
				description?: string | null;
				date?: string;
				categoryId?: string | null;
			};
		}) => updateTransaction(id, formData),
		onMutate: async ({ id, formData }) => {
			// 楽観的更新のためのキャンセル
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.expenses });

			// 現在のデータを保存
			const previousExpenses = queryClient.getQueryData<Transaction[]>(
				QUERY_KEYS.expenses,
			);

			// 楽観的更新
			if (previousExpenses) {
				queryClient.setQueryData<Transaction[]>(QUERY_KEYS.expenses, (old) => {
					if (!old) return [];
					return old.map((expense) =>
						expense.id === id ? { ...expense, ...formData } : expense,
					);
				});
			}

			return { previousExpenses };
		},
		onError: (_err, _variables, context) => {
			// エラー時は元のデータに戻す
			if (context?.previousExpenses) {
				queryClient.setQueryData(QUERY_KEYS.expenses, context.previousExpenses);
			}
		},
		onSettled: () => {
			// 最終的にキャッシュを無効化して最新データを取得
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
		},
	});

	// 支出削除のmutation
	const deleteMutation = useMutation({
		mutationFn: deleteTransaction,
		onMutate: async (id: string) => {
			// 楽観的更新のためのキャンセル
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.expenses });

			// 現在のデータを保存
			const previousExpenses = queryClient.getQueryData<Transaction[]>(
				QUERY_KEYS.expenses,
			);

			// 楽観的更新
			if (previousExpenses) {
				queryClient.setQueryData<Transaction[]>(QUERY_KEYS.expenses, (old) => {
					if (!old) return [];
					return old.filter((expense) => expense.id !== id);
				});
			}

			return { previousExpenses };
		},
		onError: (_err, _variables, context) => {
			// エラー時は元のデータに戻す
			if (context?.previousExpenses) {
				queryClient.setQueryData(QUERY_KEYS.expenses, context.previousExpenses);
			}
		},
		onSettled: () => {
			// 最終的にキャッシュを無効化して最新データを取得
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
		},
	});

	// 操作中かどうかの判定
	const operationLoading =
		createMutation.isPending ||
		updateMutation.isPending ||
		deleteMutation.isPending;

	// refetch関数をPromise<void>型に適合させる
	const refetch = useCallback(async () => {
		await queryRefetch();
	}, [queryRefetch]);

	// 各mutation関数のラッパー
	const createExpenseMutation = useCallback(
		async (formData: {
			amount: number;
			description?: string | null;
			date: string;
			categoryId?: string | null;
		}): Promise<Transaction> => {
			const result = await createMutation.mutateAsync(formData);
			return result;
		},
		[createMutation],
	);

	const updateExpenseMutation = useCallback(
		async (
			id: string,
			formData: {
				amount?: number;
				description?: string | null;
				date?: string;
				categoryId?: string | null;
			},
		): Promise<Transaction> => {
			const result = await updateMutation.mutateAsync({ id, formData });
			return result;
		},
		[updateMutation],
	);

	const deleteExpenseMutation = useCallback(
		async (id: string): Promise<void> => {
			await deleteMutation.mutateAsync(id);
		},
		[deleteMutation],
	);

	// ID指定での支出取得
	const getExpenseById = useCallback(
		async (id: string): Promise<Transaction> => {
			try {
				return await getTransaction(id);
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "支出詳細の取得に失敗しました";
				throw new Error(errorMessage);
			}
		},
		[],
	);

	// エラーメッセージの整形
	const formattedError = error
		? error instanceof Error
			? error.message
			: "支出データの取得に失敗しました"
		: null;

	return {
		expenses,
		loading: isLoading && !isError, // エラー時はloadingをfalseに
		error: formattedError,
		operationLoading,
		refetch,
		createExpenseMutation,
		updateExpenseMutation,
		deleteExpenseMutation,
		getExpenseById,
	};
}
