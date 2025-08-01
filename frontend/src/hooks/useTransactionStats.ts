/**
 * 取引統計取得フック
 *
 * 収入・支出・バランスの統計情報をAPIから取得する
 * エラーハンドリングとローディング状態管理を含む
 */

import { useCallback, useEffect, useState } from "react";
import { getTransactionStats } from "../lib/api/services/transactions";
import type { TransactionStats } from "../lib/api/types";

export interface UseTransactionStatsResult {
	stats: TransactionStats | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * 取引統計を取得するカスタムフック
 * @returns 統計情報、ローディング状態、エラー、再取得関数
 */
export const useTransactionStats = (): UseTransactionStatsResult => {
	const [stats, setStats] = useState<TransactionStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * 統計情報を取得する関数
	 */
	const fetchStats = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const data = await getTransactionStats();
			setStats(data);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "統計情報の取得に失敗しました";
			setError(errorMessage);
			console.error("取引統計取得エラー:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	// 初回マウント時に統計情報を取得
	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	return {
		stats,
		loading,
		error,
		refetch: fetchStats,
	};
};
