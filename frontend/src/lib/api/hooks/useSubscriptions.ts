/**
 * サブスクリプション用Reactフック
 *
 * サブスクリプションデータの取得・操作をReactコンポーネントで
 * 簡単に使用できるカスタムフックを提供
 */

import { useCallback, useState } from "react";
import { handleApiError, subscriptionService } from "../index";
import type {
	CreateSubscriptionRequest,
	GetSubscriptionsQuery,
	Subscription,
	SubscriptionStatsResponse,
	UpdateSubscriptionRequest,
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
	const { data, isLoading, error, refetch } = useApiQuery({
		queryFn: () => subscriptionService.getSubscriptions(query),
		initialData: [] as Subscription[],
		errorContext: "サブスクリプション一覧取得",
		deps: [query],
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
		deps: [id],
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
 * サブスクリプション更新を管理するフック
 */
export function useUpdateSubscription() {
	const [state, setState] = useState<BaseState>({
		isLoading: false,
		error: null,
	});

	const updateSubscription = useCallback(
		async (
			id: string,
			data: UpdateSubscriptionRequest,
		): Promise<Subscription | null> => {
			setState({ isLoading: true, error: null });

			try {
				const subscription = await subscriptionService.updateSubscription(
					id,
					data,
				);
				setState({ isLoading: false, error: null });
				return subscription;
			} catch (error) {
				const apiError = handleApiError(error, "サブスクリプション更新");
				setState({ isLoading: false, error: apiError.message });
				return null;
			}
		},
		[],
	);

	return {
		...state,
		updateSubscription,
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

/**
 * サブスクリプション状態切り替えを管理するフック
 */
export function useToggleSubscriptionStatus() {
	const [state, setState] = useState<BaseState>({
		isLoading: false,
		error: null,
	});

	const toggleStatus = useCallback(
		async (id: string, isActive: boolean): Promise<Subscription | null> => {
			setState({ isLoading: true, error: null });

			try {
				const subscription = await subscriptionService.toggleSubscriptionStatus(
					id,
					isActive,
				);
				setState({ isLoading: false, error: null });
				return subscription;
			} catch (error) {
				const apiError = handleApiError(
					error,
					"サブスクリプション状態切り替え",
				);
				setState({ isLoading: false, error: apiError.message });
				return null;
			}
		},
		[],
	);

	return {
		...state,
		toggleStatus,
	};
}

/**
 * サブスクリプション関連フックの統合オブジェクト
 */
export const subscriptionHooks = {
	useSubscriptions,
	useSubscription,
	useCreateSubscription,
	useUpdateSubscription,
	useDeleteSubscription,
	useSubscriptionStats,
	useActiveSubscriptions,
	useInactiveSubscriptions,
	useToggleSubscriptionStatus,
} as const;
