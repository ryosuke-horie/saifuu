/**
 * 収支サマリー取得フック（React Query版）
 *
 * 月間の収入・支出・残高・貯蓄率・トレンド情報をAPIから取得する
 * エラーハンドリングとローディング状態管理を含む
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { getBalanceSummary } from "../lib/api/services/balance";
import type { BalanceSummary } from "../lib/api/types";

// クエリキーの定義（Matt Pocock方針：as constで厳密な型）
const QUERY_KEYS = {
	balanceSummary: ["balanceSummary"],
} as const;

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
	// React Queryでサマリーデータを取得
	const {
		data: summary = null,
		isLoading,
		isError,
		error,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: QUERY_KEYS.balanceSummary,
		queryFn: getBalanceSummary,
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
	const formattedError = error ? handleBalanceError(error) : null;

	// エラー時はloadingをfalseにする（useExpensesと同じ実装）
	const loading = isLoading && !isError;

	return {
		summary,
		loading,
		error: formattedError,
		refetch,
	};
};

/**
 * バランスAPIのエラーを処理し、適切なメッセージを返す
 *
 * 設計意図: 様々なエラータイプに対応し、ユーザーにわかりやすい
 *          エラーメッセージを提供する
 * 代替案: エラーコードでの分岐も検討したが、
 *         メッセージベースの方が柔軟性が高いと判断
 */
function handleBalanceError(err: unknown): string {
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
		return err.message || "収支サマリーの取得に失敗しました";
	}

	// APIErrorタイプ（types.tsのApiErrorResponseを想定）
	if (typeof err === "object" && err !== null && "error" in err) {
		const apiError = err as { error: string; details?: string };
		return (
			apiError.details || apiError.error || "収支サマリーの取得に失敗しました"
		);
	}

	// 文字列エラー
	if (typeof err === "string") {
		return err;
	}

	// 不明なエラー
	return "予期しないエラーが発生しました。しばらくしてから再度お試しください";
}
