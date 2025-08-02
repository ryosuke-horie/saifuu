/**
 * 収入管理のカスタムフック
 * 収入のCRUD操作とローディング状態を管理
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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

interface UseIncomesState {
	incomes: Transaction[];
	loading: boolean;
	error: string | null;
	operationLoading: boolean; // CRUD操作のローディング状態
}

interface UseIncomesReturn extends UseIncomesState {
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
	const [state, setState] = useState<UseIncomesState>({
		incomes: [],
		loading: true,
		error: null,
		operationLoading: false,
	});

	// グローバル設定のカテゴリを取得してCategory型に変換
	const _categories = useMemo((): Category[] => {
		return convertGlobalCategoriesToCategory("income");
	}, []);

	const loadIncomes = useCallback(async () => {
		try {
			setState((prev) => ({ ...prev, loading: true, error: null }));
			// ページネーションなしで全件取得（当面の実装として）
			// TODO: 将来的にページネーション対応を検討
			const incomes = await getTransactions({
				type: "income",
				limit: API_CONFIG.DEFAULT_TRANSACTION_LIMIT,
			});
			setState((prev) => ({ ...prev, incomes, loading: false }));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "収入データの取得に失敗しました";
			setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
		}
	}, []);

	const refetch = async () => {
		await loadIncomes();
	};

	const createIncomeMutation = async (formData: {
		amount: number;
		description?: string | null;
		date: string;
		categoryId?: string | null;
	}): Promise<Transaction> => {
		// 楽観的更新のための現在の状態を保存
		const previousIncomes = state.incomes;

		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			const newIncome = await createTransaction({
				...formData,
				type: "income",
			});

			setState((prev) => ({
				...prev,
				incomes: [...prev.incomes, newIncome],
				operationLoading: false,
			}));

			return newIncome;
		} catch (error) {
			// エラー時は元の状態にロールバック
			const errorMessage =
				error instanceof Error ? error.message : "収入の作成に失敗しました";
			setState((prev) => ({
				...prev,
				incomes: previousIncomes,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const updateIncomeMutation = async (
		id: string,
		formData: {
			amount?: number;
			description?: string | null;
			date?: string;
			categoryId?: string | null;
		},
	): Promise<Transaction> => {
		// 楽観的更新のための現在の状態を保存
		const previousIncomes = state.incomes;

		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			const updatedIncome = await updateTransaction(id, formData);

			setState((prev) => ({
				...prev,
				incomes: prev.incomes.map((income) =>
					income.id === id ? updatedIncome : income,
				),
				operationLoading: false,
			}));

			return updatedIncome;
		} catch (error) {
			// エラー時は元の状態にロールバック
			const errorMessage =
				error instanceof Error ? error.message : "収入の更新に失敗しました";
			setState((prev) => ({
				...prev,
				incomes: previousIncomes,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const deleteIncomeMutation = async (id: string): Promise<void> => {
		// 楽観的更新のための現在の状態を保存
		const previousIncomes = state.incomes;

		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));

			// 楽観的更新：先にUIから削除
			setState((prev) => ({
				...prev,
				incomes: prev.incomes.filter((income) => income.id !== id),
			}));

			await deleteTransaction(id);

			setState((prev) => ({
				...prev,
				operationLoading: false,
			}));
		} catch (error) {
			// エラー時は元の状態にロールバック
			const errorMessage =
				error instanceof Error ? error.message : "収入の削除に失敗しました";
			setState((prev) => ({
				...prev,
				incomes: previousIncomes,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const getIncomeById = async (id: string): Promise<Transaction> => {
		try {
			return await getTransaction(id);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "収入詳細の取得に失敗しました";
			setState((prev) => ({ ...prev, error: errorMessage }));
			throw error;
		}
	};

	useEffect(() => {
		loadIncomes();
	}, [loadIncomes]);

	return {
		...state,
		refetch,
		createIncomeMutation,
		updateIncomeMutation,
		deleteIncomeMutation,
		getIncomeById,
	};
}
