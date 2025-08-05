/**
 * 取引統計取得フック（React Query版）
 *
 * 収入・支出・バランスの統計情報をAPIから取得する
 * エラーハンドリングとローディング状態管理を含む
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { getTransactionStats } from "../lib/api/services/transactions";
import type { TransactionStats } from "../lib/api/types";

// クエリキーの定義（Matt Pocock方針：as constで厳密な型）
const QUERY_KEYS = {
	transactionStats: ["transactionStats"],
} as const;

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
	// React Queryで統計データを取得
	const {
		data: stats = null,
		isLoading,
		isError,
		error,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: QUERY_KEYS.transactionStats,
		queryFn: () => getTransactionStats(),
		// キャッシュ戦略
		staleTime: 0, // 常に新鮮なデータを取得
		gcTime: 5 * 60 * 1000, // 5分間キャッシュを保持
		// 再試行戦略
		retry: 1,
		retryDelay: 1000,
	});

	// refetch関数をPromise<void>型に適合させる
	const refetch = useCallback(async () => {
		await queryRefetch();
	}, [queryRefetch]);

	// エラーメッセージの整形（詳細なエラーハンドリングは維持）
	const formattedError = error ? handleTransactionError(error) : null;

	// エラー時はloadingをfalseにする（useBalanceSummaryと同じ実装）
	const loading = isLoading && !isError;

	return {
		stats,
		loading,
		error: formattedError,
		refetch,
	};
};

/**
 * 取引統計APIのエラーを処理し、適切なメッセージを返す
 *
 * 設計意図: 様々なエラータイプに対応し、ユーザーにわかりやすい
 *          エラーメッセージを提供する
 * 代替案: エラーコードでの分岐も検討したが、
 *         メッセージベースの方が柔軟性が高いと判断
 */
function handleTransactionError(err: unknown): string {
	// Errorインスタンスの場合
	if (err instanceof Error) {
		// ネットワークエラーの判定
		if (
			err.message.toLowerCase().includes("network") ||
			err.message.toLowerCase().includes("fetch")
		) {
			return "ネットワークエラーが発生しました。接続を確認してください";
		}

		// タイムアウトエラー
		if (err.message.toLowerCase().includes("timeout")) {
			return "リクエストがタイムアウトしました。しばらくしてから再度お試しください";
		}

		// APIエラー（ステータスコード含む）
		if (err.message.includes("404")) {
			return "データが見つかりませんでした";
		}
		if (
			err.message.includes("500") ||
			err.message.includes("502") ||
			err.message.includes("503")
		) {
			return "サーバーエラーが発生しました。しばらくしてから再度お試しください";
		}

		// その他のErrorオブジェクト
		return err.message || "統計情報の取得に失敗しました";
	}

	// APIErrorタイプ（types.tsのApiErrorResponseを想定）
	if (typeof err === "object" && err !== null && "error" in err) {
		const apiError = err as { error: string; details?: string };
		return apiError.details || apiError.error || "統計情報の取得に失敗しました";
	}

	// 文字列エラー
	if (typeof err === "string") {
		return err;
	}

	// 不明なエラー
	return "予期しないエラーが発生しました。しばらくしてから再度お試しください";
}
