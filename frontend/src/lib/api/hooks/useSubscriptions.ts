/**
 * サブスクリプション用Reactフック
 *
 * サブスクリプションデータの取得・操作をReactコンポーネントで
 * 簡単に使用できるカスタムフックを提供
 */

import { useCallback, useEffect, useState } from "react";
import { ApiError, handleApiError, subscriptionService } from "../index";
import type {
	CreateSubscriptionRequest,
	GetSubscriptionsQuery,
	Subscription,
	SubscriptionStatsResponse,
	UpdateSubscriptionRequest,
} from "../types";

/**
 * ローディング状態とエラー状態を管理する基本型
 */
interface BaseState {
	isLoading: boolean;
	error: string | null;
}

/**
 * サブスクリプション一覧用の状態型
 */
interface SubscriptionsState extends BaseState {
	subscriptions: Subscription[];
}

/**
 * サブスクリプション詳細用の状態型
 */
interface SubscriptionState extends BaseState {
	subscription: Subscription | null;
}

/**
 * サブスクリプション統計用の状態型
 */
interface SubscriptionStatsState extends BaseState {
	stats: SubscriptionStatsResponse | null;
}

/**
 * サブスクリプション一覧を管理するフック
 */
export function useSubscriptions(query?: GetSubscriptionsQuery) {
	const [state, setState] = useState<SubscriptionsState>({
		subscriptions: [],
		isLoading: true,
		error: null,
	});

	const fetchSubscriptions = useCallback(async () => {
		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const subscriptions = await subscriptionService.getSubscriptions(query);
			setState({
				subscriptions,
				isLoading: false,
				error: null,
			});
		} catch (error) {
			const apiError = handleApiError(error, "サブスクリプション一覧取得");
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: apiError.message,
			}));
		}
	}, [query]);

	useEffect(() => {
		fetchSubscriptions();
	}, [fetchSubscriptions]);

	return {
		...state,
		refetch: fetchSubscriptions,
	};
}

/**
 * サブスクリプション詳細を管理するフック
 */
export function useSubscription(id: string | null) {
	const [state, setState] = useState<SubscriptionState>({
		subscription: null,
		isLoading: !!id,
		error: null,
	});

	const fetchSubscription = useCallback(async (subscriptionId: string) => {
		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const subscription =
				await subscriptionService.getSubscription(subscriptionId);
			setState({
				subscription,
				isLoading: false,
				error: null,
			});
		} catch (error) {
			const apiError = handleApiError(error, "サブスクリプション詳細取得");
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: apiError.message,
			}));
		}
	}, []);

	useEffect(() => {
		if (id) {
			fetchSubscription(id);
		} else {
			setState({
				subscription: null,
				isLoading: false,
				error: null,
			});
		}
	}, [id, fetchSubscription]);

	return {
		...state,
		refetch: id ? () => fetchSubscription(id) : undefined,
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
 */
export function useSubscriptionStats() {
	const [state, setState] = useState<SubscriptionStatsState>({
		stats: null,
		isLoading: true,
		error: null,
	});

	const fetchStats = useCallback(async () => {
		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const stats = await subscriptionService.getSubscriptionStats();
			setState({
				stats,
				isLoading: false,
				error: null,
			});
		} catch (error) {
			const apiError = handleApiError(error, "サブスクリプション統計取得");
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: apiError.message,
			}));
		}
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	return {
		...state,
		refetch: fetchStats,
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
