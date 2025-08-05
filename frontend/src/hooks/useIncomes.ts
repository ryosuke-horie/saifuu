/**
 * 収入管理のカスタムフック（React Query版）
 * 収入のCRUD操作とローディング状態を管理
 *
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { API_CONFIG } from "../config/constants";
import {
	createTransaction,
	deleteTransaction,
	getTransaction,
	getTransactions,
	updateTransaction,
} from "../lib/api/services/transactions";
import type { Transaction } from "../lib/api/types";
import type { Category } from "../types/category";
import { convertGlobalCategoriesToCategory } from "../utils/categories";

// クエリキーの定義（Matt Pocock方針：as constで厳密な型）
const QUERY_KEYS = {
	incomes: ["incomes"],
	income: (id: string) => ["income", id],
} as const;

interface UseIncomesReturn {
	incomes: Transaction[];
	loading: boolean;
	error: string | null;
	operationLoading: boolean; // CRUD操作のローディング状態
	refetch: () => Promise<void>;
	createIncomeMutation: (formData: {
		amount: number;
		description?: string | null;
		date: string;
		categoryId?: string | null;
	}) => Promise<Transaction>;
	updateIncomeMutation: (
		id: string,
		formData: {
			amount?: number;
			description?: string | null;
			date?: string;
			categoryId?: string | null;
		},
	) => Promise<Transaction>;
	deleteIncomeMutation: (id: string) => Promise<void>;
	getIncomeById: (id: string) => Promise<Transaction>;
}

/**
 * 収入データを管理するカスタムフック
 * グローバル設定のカテゴリを自動的に使用します
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 * @returns {UseIncomesReturn} 収入管理に必要な状態と操作関数
 * @returns {Transaction[]} UseIncomesReturn.incomes - 収入一覧
 * @returns {boolean} UseIncomesReturn.loading - 初期読み込み中フラグ
 * @returns {string|null} UseIncomesReturn.error - エラーメッセージ
 * @returns {boolean} UseIncomesReturn.operationLoading - CRUD操作中フラグ
 * @returns {function} UseIncomesReturn.refetch - データ再取得関数
 * @returns {function} UseIncomesReturn.createIncomeMutation - 収入作成関数
 * @returns {function} UseIncomesReturn.updateIncomeMutation - 収入更新関数
 * @returns {function} UseIncomesReturn.deleteIncomeMutation - 収入削除関数
 * @returns {function} UseIncomesReturn.getIncomeById - ID指定での収入取得関数
 * @example
 * const { incomes, loading, createIncomeMutation } = useIncomes();
 */
export function useIncomes(): UseIncomesReturn {
	const queryClient = useQueryClient();

	// グローバル設定のカテゴリを取得してCategory型に変換
	const _categories = useMemo((): Category[] => {
		return convertGlobalCategoriesToCategory("income");
	}, []);

	// 収入データの取得
	const {
		data: incomes = [],
		isLoading,
		isError,
		error,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: QUERY_KEYS.incomes,
		queryFn: () =>
			getTransactions({
				type: "income",
				limit: API_CONFIG.DEFAULT_TRANSACTION_LIMIT,
			}),
		// キャッシュ戦略
		staleTime: 0, // 常に新鮮なデータを取得
		gcTime: 5 * 60 * 1000, // 5分間キャッシュを保持
		// 再試行戦略
		retry: 1,
		retryDelay: 1000,
		// エラーハンドリング強化
		throwOnError: false,
	});

	// 収入作成のmutation
	const createMutation = useMutation({
		mutationFn: (formData: {
			amount: number;
			description?: string | null;
			date: string;
			categoryId?: string | null;
		}) =>
			createTransaction({
				...formData,
				type: "income",
			}),
		onMutate: async (formData) => {
			// 楽観的更新のためのキャンセル
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.incomes });

			// 現在のデータを保存
			const previousIncomes = queryClient.getQueryData<Transaction[]>(
				QUERY_KEYS.incomes,
			);

			// 楽観的更新（一時的なIDを使用）
			const tempId = `temp-${Date.now()}`;
			const optimisticIncome: Transaction = {
				id: tempId,
				...formData,
				type: "income",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			queryClient.setQueryData<Transaction[]>(QUERY_KEYS.incomes, (old) => {
				if (!old) return [optimisticIncome];
				return [...old, optimisticIncome];
			});

			return { previousIncomes, tempId };
		},
		onSuccess: (newIncome, _variables, context) => {
			// 成功時: 一時的な収入を実際の収入に置き換える
			queryClient.setQueryData<Transaction[]>(QUERY_KEYS.incomes, (old) => {
				if (!old) return [newIncome];
				return old.map((income) =>
					income.id === context?.tempId ? newIncome : income,
				);
			});
		},
		onError: (_err, _variables, context) => {
			// エラー時は元のデータに戻す
			if (context?.previousIncomes) {
				queryClient.setQueryData(QUERY_KEYS.incomes, context.previousIncomes);
			}
		},
		onSettled: () => {
			// 最終的にキャッシュを無効化して最新データを取得
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incomes });
		},
	});

	// 収入更新のmutation
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
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.incomes });

			// 現在のデータを保存
			const previousIncomes = queryClient.getQueryData<Transaction[]>(
				QUERY_KEYS.incomes,
			);

			// 楽観的更新
			if (previousIncomes) {
				queryClient.setQueryData<Transaction[]>(QUERY_KEYS.incomes, (old) => {
					if (!old) return [];
					return old.map((income) =>
						income.id === id ? { ...income, ...formData } : income,
					);
				});
			}

			return { previousIncomes };
		},
		onError: (_err, _variables, context) => {
			// エラー時は元のデータに戻す
			if (context?.previousIncomes) {
				queryClient.setQueryData(QUERY_KEYS.incomes, context.previousIncomes);
			}
		},
		onSettled: () => {
			// 最終的にキャッシュを無効化して最新データを取得
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incomes });
		},
	});

	// 収入削除のmutation
	const deleteMutation = useMutation({
		mutationFn: deleteTransaction,
		onMutate: async (id: string) => {
			// 楽観的更新のためのキャンセル
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.incomes });

			// 現在のデータを保存
			const previousIncomes = queryClient.getQueryData<Transaction[]>(
				QUERY_KEYS.incomes,
			);

			// 楽観的更新
			if (previousIncomes) {
				queryClient.setQueryData<Transaction[]>(QUERY_KEYS.incomes, (old) => {
					if (!old) return [];
					return old.filter((income) => income.id !== id);
				});
			}

			return { previousIncomes };
		},
		onError: (_err, _variables, context) => {
			// エラー時は元のデータに戻す
			if (context?.previousIncomes) {
				queryClient.setQueryData(QUERY_KEYS.incomes, context.previousIncomes);
			}
		},
		onSettled: () => {
			// 最終的にキャッシュを無効化して最新データを取得
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incomes });
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
	const createIncomeMutation = useCallback(
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

	const updateIncomeMutation = useCallback(
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

	const deleteIncomeMutation = useCallback(
		async (id: string): Promise<void> => {
			await deleteMutation.mutateAsync(id);
		},
		[deleteMutation],
	);

	// ID指定での収入取得
	const getIncomeById = useCallback(
		async (id: string): Promise<Transaction> => {
			try {
				return await getTransaction(id);
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "収入詳細の取得に失敗しました";
				throw new Error(errorMessage);
			}
		},
		[],
	);

	// エラーメッセージの整形
	const formattedError =
		isError && error
			? error instanceof Error
				? error.message
				: "収入データの取得に失敗しました"
			: null;

	return {
		incomes,
		loading: isLoading, // React Queryは自動的にエラー時はisLoadingをfalseにする
		error: formattedError,
		operationLoading,
		refetch,
		createIncomeMutation,
		updateIncomeMutation,
		deleteIncomeMutation,
		getIncomeById,
	};
}
