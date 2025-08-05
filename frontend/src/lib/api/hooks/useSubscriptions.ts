/**
 * サブスクリプション用Reactフック（React Query版）
 *
 * サブスクリプションデータの取得・操作をReactコンポーネントで
 * 簡単に使用できるカスタムフックを提供
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { subscriptionService } from "../index";
import type {
	CreateSubscriptionRequest,
	GetSubscriptionsQuery,
	Subscription,
} from "../types";

// クエリキーの定義（Matt Pocock方針：as constで厳密な型）
const QUERY_KEYS = {
	subscriptions: (query?: GetSubscriptionsQuery) => ["subscriptions", query],
	subscription: (id: string) => ["subscription", id],
	subscriptionStats: ["subscriptionStats"],
} as const;

// キャッシュ設定の共通化
const CACHE_CONFIG = {
	staleTime: 0, // 常に新鮮なデータを取得
	gcTime: 5 * 60 * 1000, // 5分間キャッシュを保持
	retry: 1,
	retryDelay: 1000,
} as const satisfies {
	staleTime: number;
	gcTime: number;
	retry: number;
	retryDelay: number;
};

/**
 * サブスクリプション一覧を管理するフック
 *
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 */
export function useSubscriptions(query?: GetSubscriptionsQuery) {
	const {
		data: subscriptions = [],
		isLoading,
		isError,
		error,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: QUERY_KEYS.subscriptions(query),
		queryFn: () => subscriptionService.getSubscriptions(query),
		...CACHE_CONFIG,
	});

	// refetch関数をPromise<void>型に適合させる
	const refetch = useCallback(async () => {
		await queryRefetch();
	}, [queryRefetch]);

	// エラーメッセージの整形
	const formattedError = error
		? error instanceof Error
			? error.message
			: "サブスクリプションデータの取得に失敗しました"
		: null;

	return {
		subscriptions,
		isLoading: isLoading && !isError, // エラー時はisLoadingをfalseに
		error: formattedError,
		refetch,
	};
}

/**
 * サブスクリプション詳細を管理するフック
 *
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 */
export function useSubscription(id: string | null) {
	const {
		data: subscription = null,
		isLoading,
		isError,
		error,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: QUERY_KEYS.subscription(id || ""),
		queryFn: () => subscriptionService.getSubscription(id!),
		enabled: !!id,
		...CACHE_CONFIG,
	});

	// refetch関数をPromise<void>型に適合させる
	const refetch = useCallback(async () => {
		if (id) {
			await queryRefetch();
		}
	}, [id, queryRefetch]);

	// エラーメッセージの整形
	const formattedError = error
		? error instanceof Error
			? error.message
			: "サブスクリプション詳細の取得に失敗しました"
		: null;

	return {
		subscription,
		isLoading: isLoading && !isError,
		error: formattedError,
		refetch: id ? refetch : undefined,
	};
}

/**
 * サブスクリプション作成を管理するフック
 */
export function useCreateSubscription() {
	const queryClient = useQueryClient();

	// サブスクリプション作成のmutation
	const createMutation = useMutation({
		mutationFn: (data: CreateSubscriptionRequest) =>
			subscriptionService.createSubscription(data),
		onSuccess: () => {
			// キャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
			queryClient.invalidateQueries({ queryKey: ["subscriptionStats"] });
		},
	});

	// ラッパー関数
	const createSubscription = useCallback(
		async (data: CreateSubscriptionRequest): Promise<Subscription> => {
			return await createMutation.mutateAsync(data);
		},
		[createMutation],
	);

	// エラーメッセージの整形
	const error = createMutation.error
		? createMutation.error instanceof Error
			? createMutation.error.message
			: "サブスクリプション作成に失敗しました"
		: null;

	return {
		isLoading: createMutation.isPending,
		error,
		createSubscription,
	} satisfies {
		isLoading: boolean;
		error: string | null;
		createSubscription: (
			data: CreateSubscriptionRequest,
		) => Promise<Subscription>;
	};
}

/**
 * サブスクリプション統計を管理するフック
 *
 * React Queryを使用してキャッシュ管理とデータフェッチングを最適化
 */
export function useSubscriptionStats() {
	const {
		data: stats = null,
		isLoading,
		isError,
		error,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: QUERY_KEYS.subscriptionStats,
		queryFn: () => subscriptionService.getSubscriptionStats(),
		...CACHE_CONFIG,
	});

	// refetch関数をPromise<void>型に適合させる
	const refetch = useCallback(async () => {
		await queryRefetch();
	}, [queryRefetch]);

	// エラーメッセージの整形
	const formattedError = error
		? error instanceof Error
			? error.message
			: "サブスクリプション統計の取得に失敗しました"
		: null;

	return {
		stats,
		isLoading: isLoading && !isError,
		error: formattedError,
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
