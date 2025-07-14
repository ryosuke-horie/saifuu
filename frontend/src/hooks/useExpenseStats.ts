/**
 * 支出統計計算フック
 *
 * 支出データから統計情報を計算する責任を分離
 * 複数のコンポーネントで再利用可能
 */

import { useMemo } from "react";
import type { Transaction } from "../lib/api/types";

export interface ExpenseStatsResult {
	totalExpense: number;
	transactionCount: number;
}

/**
 * 支出統計を計算するカスタムフック
 * @param expenses 支出データの配列
 * @param loading ローディング状態
 * @returns 計算された統計情報
 */
export const useExpenseStats = (
	expenses: Transaction[] | null,
	loading: boolean,
): ExpenseStatsResult => {
	return useMemo(() => {
		if (loading || !expenses) {
			return {
				totalExpense: 0,
				transactionCount: expenses?.length ?? 0,
			};
		}

		// 支出のみをフィルタリングして合計を計算
		const totalExpense = expenses
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);

		return {
			totalExpense,
			transactionCount: expenses.length,
		};
	}, [expenses, loading]);
};
