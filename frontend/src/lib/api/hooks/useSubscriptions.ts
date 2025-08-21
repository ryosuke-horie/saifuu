/**
 * サブスクリプション用Reactフック
 *
 * サブスクリプションデータの取得・操作をReactコンポーネントで
 * 簡単に使用できるカスタムフックを提供
 */

import { useCallback, useMemo, useState } from "react";
import { handleApiError, subscriptionService } from "../index";
import type {
	CreateSubscriptionRequest,
	GetSubscriptionsQuery,
	Subscription,
	SubscriptionStatsResponse,
} from "../types";
import { useApiQuery } from "./useApiQuery";

/**
 * ローディング状態とエラー状態を管理する基本型
 *
 * 作成・更新・削除操作などのミューテーション系フックで使用される
 */
interface BaseState {
	isLoading: boolean;
	error: string | null;
}

/**
 * サブスクリプション一覧を管理するフック
 *
 * useApiQueryを使用してコードの重複を解消し、
 * 統一されたAPIクエリパターンを適用
 */
export function useSubscriptions(query?: GetSubscriptionsQuery) {
	// queryの値を安定させるため、JSONで文字列化して比較
	const stableQuery = useMemo(() => JSON.stringify(query || {}), [query]);

	const { data, isLoading, error, refetch } = useApiQuery({
		queryFn: () => subscriptionService.getSubscriptions(query),
		initialData: [] as Subscription[],
		errorContext: "サブスクリプション一覧取得",
		deps: [stableQuery],
	});

	return {
		subscriptions: data,
		isLoading,
		error,
		refetch,
	};
}

/**
 * サブスクリプション詳細を管理するフック
 *
 * useApiQueryを使用してコードの重複を解消し、
 * 統一されたAPIクエリパターンを適用
 */
export function useSubscription(id: string | null) {
	const { data, isLoading, error, refetch } = useApiQuery({
		queryFn: () => subscriptionService.getSubscription(id!),
		initialData: null as Subscription | null,
		errorContext: "サブスクリプション詳細取得",
		shouldFetch: !!id,
		deps: [id || ""], // 安定した値にする
	});

	return {
		subscription: data,
		isLoading,
		error,
		refetch: id ? refetch : undefined,
	};
}

/**
 * サブスクリプション作成を管理するフック
 */
export function useCreateSubscription() {
	const [state, setState] = useState<BaseState>({
		isLoading: false,
		error: null,
	});

	const createSubscription = useCallback(
		async (data: CreateSubscriptionRequest): Promise<Subscription | null> => {
			setState({ isLoading: true, error: null });

			try {
				const subscription = await subscriptionService.createSubscription(data);
				setState({ isLoading: false, error: null });
				return subscription;
			} catch (error) {
				const apiError = handleApiError(error, "サブスクリプション作成");
				setState({ isLoading: false, error: apiError.message });
				return null;
			}
		},
		[],
	);

	return {
		...state,
		createSubscription,
	};
}

/**
 * サブスクリプション削除を管理するフック
 */
export function useDeleteSubscription() {
	const [state, setState] = useState<BaseState>({
		isLoading: false,
		error: null,
	});

	const deleteSubscription = useCallback(
		async (id: string): Promise<boolean> => {
			setState({ isLoading: true, error: null });

			try {
				await subscriptionService.deleteSubscription(id);
				setState({ isLoading: false, error: null });
				return true;
			} catch (error) {
				const apiError = handleApiError(error, "サブスクリプション削除");
				setState({ isLoading: false, error: apiError.message });
				return false;
			}
		},
		[],
	);

	return {
		...state,
		deleteSubscription,
	};
}

/**
 * サブスクリプション統計を管理するフック
 *
 * useApiQueryを使用してコードの重複を解消し、
 * 統一されたAPIクエリパターンを適用
 */
export function useSubscriptionStats() {
	const { data, isLoading, error, refetch } = useApiQuery({
		queryFn: () => subscriptionService.getSubscriptionStats(),
		initialData: null as SubscriptionStatsResponse | null,
		errorContext: "サブスクリプション統計取得",
		deps: [],
	});

	return {
		stats: data,
		isLoading,
		error,
		refetch,
	};
}

/**
 * アクティブなサブスクリプションのみを取得するフック
 */
export function useActiveSubscriptions() {
	return useSubscriptions({ isActive: true });
}

/**
 * 非アクティブなサブスクリプションのみを取得するフック
 */
export function useInactiveSubscriptions() {
	return useSubscriptions({ isActive: false });
}
