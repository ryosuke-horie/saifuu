/**
 * サブスクリプション関連のAPI呼び出し
 * バックエンドのサブスクリプションAPIとの通信を担当
 */

import { apiClient } from "../client";
import type { Category, Subscription, SubscriptionFormData } from "../types";
import {
	transformApiSubscriptionToFrontend,
	transformFormDataToCreateRequest,
	transformFormDataToUpdateRequest,
} from "./transformers";
import type { ApiSubscriptionResponse } from "./types";

/**
 * サブスクリプション一覧を取得
 * @param categories - カテゴリ一覧（変換に使用）
 * @returns サブスクリプション一覧
 */
export async function fetchSubscriptions(
	categories: Category[],
): Promise<Subscription[]> {
	try {
		const response =
			await apiClient.get<ApiSubscriptionResponse[]>("/subscriptions");

		return response.map((apiSubscription) =>
			transformApiSubscriptionToFrontend(apiSubscription, categories),
		);
	} catch (error) {
		console.error("Failed to fetch subscriptions:", error);
		throw new Error("サブスクリプション一覧の取得に失敗しました");
	}
}

/**
 * サブスクリプションを詳細取得
 * @param id - サブスクリプションID
 * @param categories - カテゴリ一覧（変換に使用）
 * @returns サブスクリプション詳細
 */
export async function fetchSubscriptionById(
	id: string,
	categories: Category[],
): Promise<Subscription> {
	try {
		const response = await apiClient.get<ApiSubscriptionResponse>(
			`/subscriptions/${id}`,
		);

		return transformApiSubscriptionToFrontend(response, categories);
	} catch (error) {
		console.error(`Failed to fetch subscription ${id}:`, error);
		throw new Error("サブスクリプション詳細の取得に失敗しました");
	}
}

/**
 * サブスクリプションを作成
 * @param formData - フォームデータ
 * @param categories - カテゴリ一覧（変換に使用）
 * @returns 作成されたサブスクリプション
 */
export async function createSubscription(
	formData: SubscriptionFormData,
	categories: Category[],
): Promise<Subscription> {
	try {
		const requestData = transformFormDataToCreateRequest(formData);
		const response = await apiClient.post<ApiSubscriptionResponse>(
			"/subscriptions",
			requestData,
		);

		return transformApiSubscriptionToFrontend(response, categories);
	} catch (error) {
		console.error("Failed to create subscription:", error);
		throw new Error("サブスクリプションの作成に失敗しました");
	}
}

/**
 * サブスクリプションを更新
 * @param id - サブスクリプションID
 * @param formData - 更新用フォームデータ
 * @param categories - カテゴリ一覧（変換に使用）
 * @returns 更新されたサブスクリプション
 */
export async function updateSubscription(
	id: string,
	formData: Partial<SubscriptionFormData>,
	categories: Category[],
): Promise<Subscription> {
	try {
		const requestData = transformFormDataToUpdateRequest(formData);
		const response = await apiClient.put<ApiSubscriptionResponse>(
			`/subscriptions/${id}`,
			requestData,
		);

		return transformApiSubscriptionToFrontend(response, categories);
	} catch (error) {
		console.error(`Failed to update subscription ${id}:`, error);
		throw new Error("サブスクリプションの更新に失敗しました");
	}
}

/**
 * サブスクリプションを削除
 * @param id - サブスクリプションID
 */
export async function deleteSubscription(id: string): Promise<void> {
	try {
		await apiClient.delete(`/subscriptions/${id}`);
	} catch (error) {
		console.error(`Failed to delete subscription ${id}:`, error);
		throw new Error("サブスクリプションの削除に失敗しました");
	}
}

/**
 * サブスクリプションのアクティブ状態を更新
 * @param id - サブスクリプションID
 * @param isActive - 新しいアクティブ状態
 * @param categories - カテゴリ一覧（変換に使用）
 * @returns 更新されたサブスクリプション
 */
export async function updateSubscriptionStatus(
	id: string,
	isActive: boolean,
	categories: Category[],
): Promise<Subscription> {
	return updateSubscription(id, { isActive }, categories);
}
