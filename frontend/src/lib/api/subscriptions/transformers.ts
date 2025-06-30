/**
 * サブスクリプションデータの変換処理
 * フロントエンド型とバックエンドAPI型の間での変換を行う
 */

import type { Category } from "../../../types/category";
import type {
	Subscription,
	SubscriptionFormData,
} from "../../../types/subscription";
import type {
	ApiCreateSubscriptionRequest,
	ApiSubscriptionResponse,
	ApiUpdateSubscriptionRequest,
} from "./types";

/**
 * バックエンドAPIレスポンスをフロントエンド型に変換
 * @param apiSubscription - API レスポンスのサブスクリプション
 * @param categories - カテゴリ一覧（カテゴリIDからカテゴリオブジェクトへの変換に使用）
 * @returns フロントエンド用のサブスクリプション型
 */
export function transformApiSubscriptionToFrontend(
	apiSubscription: ApiSubscriptionResponse,
	categories: Category[],
): Subscription {
	// カテゴリIDからカテゴリオブジェクトを検索
	const category = categories.find(
		(cat) => Number(cat.id) === apiSubscription.categoryId,
	);

	if (!category) {
		throw new Error(`Category with ID ${apiSubscription.categoryId} not found`);
	}

	return {
		id: apiSubscription.id.toString(), // number -> string変換
		name: apiSubscription.name,
		amount: apiSubscription.amount,
		category: category, // categoryId -> categoryオブジェクト変換
		billingCycle: apiSubscription.billingCycle,
		nextBillingDate: formatDateToYYYYMMDD(apiSubscription.nextBillingDate), // ISO -> YYYY-MM-DD変換
		isActive: apiSubscription.isActive,
		description: apiSubscription.description || undefined,
	};
}

/**
 * フロントエンドのフォームデータをAPI作成リクエストに変換
 * @param formData - フロントエンドのフォームデータ
 * @returns API作成リクエスト
 */
export function transformFormDataToCreateRequest(
	formData: SubscriptionFormData,
): ApiCreateSubscriptionRequest {
	return {
		name: formData.name,
		amount: formData.amount,
		categoryId: Number(formData.categoryId), // string -> number変換
		billingCycle: formData.billingCycle,
		nextBillingDate: formatDateToISO(formData.nextBillingDate), // YYYY-MM-DD -> ISO変換
		isActive: formData.isActive ?? true, // デフォルトでアクティブ
		description: formData.description,
	};
}

/**
 * フロントエンドのフォームデータをAPI更新リクエストに変換
 * @param formData - フロントエンドのフォームデータ
 * @returns API更新リクエスト
 */
export function transformFormDataToUpdateRequest(
	formData: Partial<SubscriptionFormData>,
): ApiUpdateSubscriptionRequest {
	const request: ApiUpdateSubscriptionRequest = {};

	if (formData.name !== undefined) request.name = formData.name;
	if (formData.amount !== undefined) request.amount = formData.amount;
	if (formData.categoryId !== undefined)
		request.categoryId = Number(formData.categoryId);
	if (formData.billingCycle !== undefined)
		request.billingCycle = formData.billingCycle;
	if (formData.nextBillingDate !== undefined) {
		request.nextBillingDate = formatDateToISO(formData.nextBillingDate);
	}
	if (formData.isActive !== undefined) request.isActive = formData.isActive;
	if (formData.description !== undefined)
		request.description = formData.description;

	return request;
}

/**
 * ISO 8601日付文字列をYYYY-MM-DD形式に変換
 * @param isoDate - ISO 8601形式の日付文字列
 * @returns YYYY-MM-DD形式の日付文字列
 */
function formatDateToYYYYMMDD(isoDate: string): string {
	const date = new Date(isoDate);

	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date format: ${isoDate}`);
	}

	return date.toISOString().split("T")[0];
}

/**
 * YYYY-MM-DD形式の日付文字列をISO 8601形式に変換
 * @param dateString - YYYY-MM-DD形式の日付文字列
 * @returns ISO 8601形式の日付文字列
 */
function formatDateToISO(dateString: string): string {
	const date = new Date(dateString);

	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date format: ${dateString}`);
	}

	return date.toISOString();
}
