/**
 * カテゴリ管理のカスタムフック
 * カテゴリの取得とローディング状態を管理
 *
 * useApiQueryを使用してコードの重複を解消し、
 * 統一されたAPIクエリパターンを適用
 */

import { fetchCategories } from "../lib/api/categories";
import { useApiQuery } from "../lib/api/hooks/useApiQuery";
import type { Category } from "../types/category";

interface UseCategoriesReturn {
	categories: Category[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * カテゴリデータを管理するカスタムフック
 *
 * useApiQueryを使用してコードの重複を解消し、
 * 統一されたAPIクエリパターンを適用
 *
 * @returns カテゴリ一覧とローディング状態、エラー状態、再取得関数
 */
export function useCategories(): UseCategoriesReturn {
        const { data, isLoading, error, refetch } = useApiQuery<Category[]>({
                queryFn: fetchCategories,
                initialData: [],
                errorContext: "カテゴリ一覧取得",
                deps: [],
        });

	return {
		categories: data,
		loading: isLoading,
		error,
		refetch,
	};
}
