/**
 * サブスクリプション管理のカスタムフック
 * サブスクリプションのCRUD操作とローディング状態を管理
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCategoriesByType } from "../../../shared/config/categories";
import {
	createSubscription,
	deleteSubscription,
	fetchSubscriptionById,
	fetchSubscriptions,
	updateSubscription,
	updateSubscriptionStatus,
} from "../lib/api/subscriptions";
import type { Category } from "../types/category";
import type { Subscription, SubscriptionFormData } from "../types/subscription";

interface UseSubscriptionsState {
	subscriptions: Subscription[];
	loading: boolean;
	error: string | null;
	operationLoading: boolean; // CRUD操作のローディング状態
}

interface UseSubscriptionsReturn extends UseSubscriptionsState {
	refetch: () => Promise<void>;
	createSubscriptionMutation: (
		formData: SubscriptionFormData,
	) => Promise<Subscription>;
	updateSubscriptionMutation: (
		id: string,
		formData: Partial<SubscriptionFormData>,
	) => Promise<Subscription>;
	deleteSubscriptionMutation: (id: string) => Promise<void>;
	updateStatusMutation: (
		id: string,
		isActive: boolean,
	) => Promise<Subscription>;
	getSubscriptionById: (id: string) => Promise<Subscription>;
}

/**
 * サブスクリプションデータを管理するカスタムフック
 * グローバル設定のカテゴリを自動的に使用します
 * @returns サブスクリプション一覧とCRUD操作関数、ローディング状態、エラー状態
 */
export function useSubscriptions(): UseSubscriptionsReturn {
	const [state, setState] = useState<UseSubscriptionsState>({
		subscriptions: [],
		loading: true,
		error: null,
		operationLoading: false,
	});

	// グローバル設定のカテゴリを取得してCategory型に変換
	const categories = useMemo((): Category[] => {
		const globalExpenseCategories = getCategoriesByType("expense");
		const now = new Date().toISOString();
		return globalExpenseCategories.map((config) => ({
			id: config.id,
			name: config.name,
			type: config.type,
			color: config.color,
			createdAt: now,
			updatedAt: now,
		}));
	}, []);

	const loadSubscriptions = useCallback(async () => {
		try {
			setState((prev) => ({ ...prev, loading: true, error: null }));
			const subscriptions = await fetchSubscriptions(categories);
			setState((prev) => ({ ...prev, subscriptions, loading: false }));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "サブスクリプションの取得に失敗しました";
			setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
		}
	}, [categories]);

	const refetch = async () => {
		await loadSubscriptions();
	};

	const createSubscriptionMutation = async (
		formData: SubscriptionFormData,
	): Promise<Subscription> => {
		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			const newSubscription = await createSubscription(formData, categories);

			setState((prev) => ({
				...prev,
				subscriptions: [...prev.subscriptions, newSubscription],
				operationLoading: false,
			}));

			return newSubscription;
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "サブスクリプションの作成に失敗しました";
			setState((prev) => ({
				...prev,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const updateSubscriptionMutation = async (
		id: string,
		formData: Partial<SubscriptionFormData>,
	): Promise<Subscription> => {
		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			const updatedSubscription = await updateSubscription(
				id,
				formData,
				categories,
			);

			setState((prev) => ({
				...prev,
				subscriptions: prev.subscriptions.map((sub) =>
					sub.id === id ? updatedSubscription : sub,
				),
				operationLoading: false,
			}));

			return updatedSubscription;
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "サブスクリプションの更新に失敗しました";
			setState((prev) => ({
				...prev,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const deleteSubscriptionMutation = async (id: string): Promise<void> => {
		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			await deleteSubscription(id);

			setState((prev) => ({
				...prev,
				subscriptions: prev.subscriptions.filter((sub) => sub.id !== id),
				operationLoading: false,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "サブスクリプションの削除に失敗しました";
			setState((prev) => ({
				...prev,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const updateStatusMutation = async (
		id: string,
		isActive: boolean,
	): Promise<Subscription> => {
		try {
			setState((prev) => ({ ...prev, operationLoading: true, error: null }));
			const updatedSubscription = await updateSubscriptionStatus(
				id,
				isActive,
				categories,
			);

			setState((prev) => ({
				...prev,
				subscriptions: prev.subscriptions.map((sub) =>
					sub.id === id ? updatedSubscription : sub,
				),
				operationLoading: false,
			}));

			return updatedSubscription;
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "ステータスの更新に失敗しました";
			setState((prev) => ({
				...prev,
				error: errorMessage,
				operationLoading: false,
			}));
			throw error;
		}
	};

	const getSubscriptionById = async (id: string): Promise<Subscription> => {
		try {
			return await fetchSubscriptionById(id, categories);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "サブスクリプション詳細の取得に失敗しました";
			setState((prev) => ({ ...prev, error: errorMessage }));
			throw error;
		}
	};

	useEffect(() => {
		loadSubscriptions();
	}, [loadSubscriptions]);

	return {
		...state,
		refetch,
		createSubscriptionMutation,
		updateSubscriptionMutation,
		deleteSubscriptionMutation,
		updateStatusMutation,
		getSubscriptionById,
	};
}
