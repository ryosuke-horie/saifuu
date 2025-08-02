/**
 * サブスクリプションAPI サービス
 *
 * サブスクリプション関連のAPI呼び出しを管理する
 * データの取得・作成・更新・削除の統一インターフェースを提供
 */

import { addQueryParams, apiClient } from "../client";
import { endpoints } from "../config";
import type {
	CreateSubscriptionRequest,
	DeleteResponse,
	GetSubscriptionsQuery,
	Subscription,
	SubscriptionStatsResponse,
	UpdateSubscriptionRequest,
} from "../types";

/**
 * サブスクリプション一覧を取得する
 */
export async function getSubscriptions(
	query?: GetSubscriptionsQuery,
): Promise<Subscription[]> {
	const endpoint = addQueryParams(
		endpoints.subscriptions.list,
		query as Record<string, unknown>,
	);
	return apiClient.get<Subscription[]>(endpoint);
}

/**
 * サブスクリプション詳細を取得する
 */
export async function getSubscription(id: string): Promise<Subscription> {
	const endpoint = endpoints.subscriptions.detail(id);
	return apiClient.get<Subscription>(endpoint);
}

/**
 * 新しいサブスクリプションを作成する
 */
export async function createSubscription(
	data: CreateSubscriptionRequest,
): Promise<Subscription> {
	const endpoint = endpoints.subscriptions.create;
	return apiClient.post<Subscription>(endpoint, data);
}

/**
 * サブスクリプションを更新する
 */
export async function updateSubscription(
	id: string,
	data: UpdateSubscriptionRequest,
): Promise<Subscription> {
	const endpoint = endpoints.subscriptions.update(id);
	return apiClient.put<Subscription>(endpoint, data);
}

/**
 * サブスクリプションを削除する
 */
export async function deleteSubscription(id: string): Promise<DeleteResponse> {
	const endpoint = endpoints.subscriptions.delete(id);
	return apiClient.delete<DeleteResponse>(endpoint);
}

/**
 * サブスクリプション統計を取得する
 */
export async function getSubscriptionStats(): Promise<SubscriptionStatsResponse> {
	const endpoint = endpoints.subscriptions.stats;
	return apiClient.get<SubscriptionStatsResponse>(endpoint);
}

/**
 * アクティブなサブスクリプションのみを取得する
 */
export async function getActiveSubscriptions(): Promise<Subscription[]> {
	return getSubscriptions({ isActive: true });
}

/**
 * 非アクティブなサブスクリプションのみを取得する
 */
export async function getInactiveSubscriptions(): Promise<Subscription[]> {
	return getSubscriptions({ isActive: false });
}

/**
 * 特定のカテゴリのサブスクリプションを取得する
 */
export async function getSubscriptionsByCategory(
	categoryId: string,
): Promise<Subscription[]> {
	return getSubscriptions({ categoryId });
}

/**
 * 特定の請求サイクルのサブスクリプションを取得する
 */
export async function getSubscriptionsByBillingCycle(
	billingCycle: "monthly" | "yearly" | "weekly",
): Promise<Subscription[]> {
	return getSubscriptions({ billingCycle });
}

/**
 * サブスクリプションの状態を切り替える（アクティブ/非アクティブ）
 */
export async function toggleSubscriptionStatus(
	id: string,
	isActive: boolean,
): Promise<Subscription> {
	return updateSubscription(id, { isActive });
}

/**
 * サブスクリプションサービスのデフォルトエクスポート
 */
export const subscriptionService = {
	getSubscriptions,
	getSubscription,
	createSubscription,
	updateSubscription,
	deleteSubscription,
	getSubscriptionStats,
	getActiveSubscriptions,
	getInactiveSubscriptions,
	getSubscriptionsByCategory,
	getSubscriptionsByBillingCycle,
	toggleSubscriptionStatus,
} as const;
