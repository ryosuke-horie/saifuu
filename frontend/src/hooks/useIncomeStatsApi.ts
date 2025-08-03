/**
 * 収入統計APIフック
 *
 * 収入統計データをAPIから取得する
 * Issue #408: Phase 2-6の統合要件に対応
 */

import { useCallback, useEffect, useState } from "react";

export interface IncomeCategoryBreakdown {
	categoryId: string;
	name: string;
	amount: number;
	percentage: number;
}

export interface IncomeStats {
	currentMonth: number;
	lastMonth: number;
	currentYear: number;
	monthOverMonth: number;
	categoryBreakdown: IncomeCategoryBreakdown[];
}

export interface UseIncomeStatsReturn {
	stats: IncomeStats | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * 収入統計データを取得するカスタムフック
 */
export const useIncomeStats = (): UseIncomeStatsReturn => {
	const [stats, setStats] = useState<IncomeStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// 統計データの取得
	const fetchStats = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// APIから統計データを取得
			const response = await fetch("/api/transactions/stats?type=income");

			if (!response.ok) {
				throw new Error("統計データの取得に失敗しました");
			}

			const data = (await response.json()) as IncomeStats;
			setStats(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "データの取得に失敗しました";
			setError(message);
			setStats(null);
		} finally {
			setLoading(false);
		}
	}, []);

	// データの再取得
	const refetch = useCallback(async () => {
		await fetchStats();
	}, [fetchStats]);

	// 初回データ取得
	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	return {
		stats,
		loading,
		error,
		refetch,
	};
};
