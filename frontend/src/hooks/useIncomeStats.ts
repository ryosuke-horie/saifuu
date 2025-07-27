/**
 * 収入統計計算フック
 *
 * 収入データから統計情報を計算する責任を分離
 * 複数のコンポーネントで再利用可能
 */

import { useMemo } from "react";
import type { Transaction } from "../lib/api/types";

export interface IncomeStatsResult {
	totalIncome: number;
	transactionCount: number;
}

/**
 * 収入統計を計算するカスタムフック
 * @param incomes 収入データの配列
 * @param loading ローディング状態
 * @returns 計算された統計情報
 */
export const useIncomeStats = (
	incomes: Transaction[] | null,
	loading: boolean,
): IncomeStatsResult => {
	return useMemo(() => {
		if (loading || !incomes) {
			return {
				totalIncome: 0,
				transactionCount: incomes?.length ?? 0,
			};
		}

		// 収入のみをフィルタリングして合計を計算
		const totalIncome = incomes
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);

		return {
			totalIncome,
			transactionCount: incomes.length,
		};
	}, [incomes, loading]);
};
