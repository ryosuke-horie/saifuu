/**
 * 支出管理のカスタムフック
 * 支出・収入のCRUD操作とローディング状態を管理
 *
 * 関連Issue: #93 支出管理メインページ実装
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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

interface UseExpensesState {
	expenses: Transaction[];
	loading: boolean;
	error: string | null;
	operationLoading: boolean; // CRUD操作のローディング状態
}

interface UseExpensesReturn extends UseExpensesState {
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
 * @returns {UseExpensesReturn} 支出管理に必要な状態と操作関数
 * @returns {Transaction[]} UseExpensesReturn.expenses - 支出一覧
 * @returns {boolean} UseExpensesReturn.loading - 初期読み込み中フラグ
 * @returns {string|null} UseExpensesReturn.error - エラーメッセージ
 * @returns {boolean} UseExpensesReturn.operationLoading - CRUD操作中フラグ
 * @returns {function} UseExpensesReturn.refetch - データ再取得関数
 * @returns {function} UseExpensesReturn.createExpenseMutation - 支出作成関数
 * @returns {function} UseExpensesReturn.updateExpenseMutation - 支出更新関数
 * @returns {function} UseExpensesReturn.deleteExpenseMutation - 支出削除関数
 * @returns {function} UseExpensesReturn.getExpenseById - ID指定での支出取得関数
 * @example
 * const { expenses, loading, createExpenseMutation } = useExpenses();
 */
export function useExpenses(): UseExpensesReturn {
	const [state, setState] = useState<UseExpensesState>({
		expenses: [],
		loading: true,
		error: null,
		operationLoading: false,
	});

	// グローバル設定のカテゴリを取得してCategory型に変換
	const _categories = useMemo((): Category[] => {
		return convertGlobalCategoriesToCategory("expense");
	}, []);

	const loadExpenses = useCallback(async () => {
		try {
			setState((prev) => ({ ...prev, loading: true, error: null }));
			// ページネーションなしで全件取得（当面の実装として）
			// TODO: 将来的にページネーション対応を検討
			const expenses = await getExpenseTransactions({
				limit: API_CONFIG.DEFAULT_TRANSACTION_LIMIT,
			});
			setState((prev) => ({ ...prev, expenses, loading: false }));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "支出データの取得に失敗しました";
			setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
		}
	}, []);

	const refetch = async () => {
		await loadExpenses();
	};

	const createExpenseMutation = async (formData: {
		amount: number;
		description?: string | null;
		date: string;
		categoryId?: string | null;
	}): Promise<Transaction> => {
		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			const newExpense = await createTransaction({
				...formData,
				type: "expense",
			});

			// APIレスポンスの検証：IDが存在することを確認
			if (!newExpense || !newExpense.id) {
				// IDが存在しない場合はエラーとして処理
				const errorMsg = "APIレスポンスが不正です：取引IDが含まれていません";
				console.error(errorMsg, newExpense);
				throw new Error(errorMsg);
			}

			// 楽観的UI更新：検証済みのデータのみ追加
			setState((prev) => ({
				...prev,
				expenses: [...prev.expenses, newExpense],
				operationLoading: false,
			}));

			return newExpense;
		} catch (error) {
			// エラー時は楽観的更新をロールバックするために再取得
			// これによりUIとサーバーの状態を同期
			await loadExpenses().catch((loadError) => {
				console.error("エラー後のデータ再取得に失敗:", loadError);
			});

			const errorMessage =
				error instanceof Error ? error.message : "支出の作成に失敗しました";
			setState((prev) => ({
				...prev,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const updateExpenseMutation = async (
		id: string,
		formData: {
			amount?: number;
			description?: string | null;
			date?: string;
			categoryId?: string | null;
		},
	): Promise<Transaction> => {
		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			const updatedExpense = await updateTransaction(id, formData);

			// APIレスポンスの検証：IDが存在することを確認
			if (!updatedExpense || !updatedExpense.id) {
				const errorMsg =
					"APIレスポンスが不正です：更新された取引IDが含まれていません";
				console.error(errorMsg, updatedExpense);
				throw new Error(errorMsg);
			}

			setState((prev) => ({
				...prev,
				expenses: prev.expenses.map((expense) =>
					expense.id === id ? updatedExpense : expense,
				),
				operationLoading: false,
			}));

			return updatedExpense;
		} catch (error) {
			// エラー時は楽観的更新をロールバックするために再取得
			await loadExpenses().catch((loadError) => {
				console.error("エラー後のデータ再取得に失敗:", loadError);
			});

			const errorMessage =
				error instanceof Error ? error.message : "支出の更新に失敗しました";
			setState((prev) => ({
				...prev,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const deleteExpenseMutation = async (id: string): Promise<void> => {
		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			await deleteTransaction(id);

			setState((prev) => ({
				...prev,
				expenses: prev.expenses.filter((expense) => expense.id !== id),
				operationLoading: false,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "支出の削除に失敗しました";
			setState((prev) => ({
				...prev,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const getExpenseById = async (id: string): Promise<Transaction> => {
		try {
			return await getTransaction(id);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "支出詳細の取得に失敗しました";
			setState((prev) => ({ ...prev, error: errorMessage }));
			throw error;
		}
	};

	useEffect(() => {
		loadExpenses();
	}, [loadExpenses]);

	return {
		...state,
		refetch,
		createExpenseMutation,
		updateExpenseMutation,
		deleteExpenseMutation,
		getExpenseById,
	};
}
