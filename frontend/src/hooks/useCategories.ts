/**
 * カテゴリ管理のカスタムフック（React Query版）
 * カテゴリの取得とローディング状態を管理
 *
 * React Queryを使用して実装し、既存のインターフェースを維持
 */

import { useQuery } from "@tanstack/react-query";
import { handleApiError } from "../lib/api/errors";
import { categoryService } from "../lib/api/services/categories";
import type { Category } from "../types/category";

// クエリキーの定義（Matt Pocock方針：as constで厳密な型）
const QUERY_KEYS = {
	categories: ["categories"],
} as const;

interface UseCategoriesReturn {
	categories: Category[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * カテゴリデータを管理するカスタムフック
 *
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 * 既存のインターフェースを維持し、段階的移行を可能にする
 *
 * @returns カテゴリ一覧とローディング状態、エラー状態、再取得関数
 */
export function useCategories(): UseCategoriesReturn {
	const {
		data = [],
		isLoading,
		isRefetching,
		error,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: QUERY_KEYS.categories,
		queryFn: categoryService.getCategories,
		// キャッシュ戦略
		staleTime: 5 * 60 * 1000, // 5分間はキャッシュを新鮮とみなす
		gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
		// 再試行戦略
		retry: 1,
		retryDelay: 1000,
	});

	// エラー処理（既存の形式に合わせる）
	const formattedError = error
		? handleApiError(error, "カテゴリ一覧取得").message
		: null;

	// refetch関数をPromise<void>型に適合させる
	const refetch = async () => {
		await queryRefetch();
	};

	// 既存のインターフェースに適合させる
	// isLoadingは初回ロード時のみtrue
	// isFetching/isRefetchingはバックグラウンドフェッチ時もtrue
	return {
		categories: data,
		loading: isLoading || isRefetching,
		error: formattedError,
		refetch,
	};
}
