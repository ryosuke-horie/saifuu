/**
 * 収支サマリー取得フック
 *
 * 月間の収入・支出・残高・貯蓄率・トレンド情報をAPIから取得する
 * エラーハンドリングとローディング状態管理を含む
 */

import { useCallback, useEffect, useState } from "react";
import { getBalanceSummary } from "../lib/api/services/balance";
import type { BalanceSummary } from "../lib/api/types";

export interface UseBalanceSummaryResult {
	summary: BalanceSummary | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * 収支サマリーを取得するカスタムフック
 * @returns サマリー情報、ローディング状態、エラー、再取得関数
 */
export const useBalanceSummary = (): UseBalanceSummaryResult => {
	const [summary, setSummary] = useState<BalanceSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * サマリー情報を取得する関数
	 */
	const fetchSummary = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const data = await getBalanceSummary();
			setSummary(data);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "収支サマリーの取得に失敗しました";
			setError(errorMessage);
			console.error("収支サマリー取得エラー:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	// 初回マウント時にサマリー情報を取得
	useEffect(() => {
		fetchSummary();
	}, [fetchSummary]);

	return {
		summary,
		loading,
		error,
		refetch: fetchSummary,
	};
};
