/**
 * カテゴリAPI サービス
 *
 * カテゴリ関連のAPI呼び出しを管理する
 * 収入・支出カテゴリの取得・作成・更新・削除を提供
 */

import { addQueryParams, apiClient } from "../client";
import { endpoints } from "../config";
import type {
	Category,
	CategoryType,
	CreateCategoryRequest,
	DeleteResponse,
	UpdateCategoryRequest,
} from "../types";

/**
 * カテゴリ一覧取得のクエリパラメーター
 */
export interface GetCategoriesQuery {
	type?: CategoryType;
	page?: number;
	limit?: number;
}

/**
 * カテゴリ一覧を取得する
 */
export async function getCategories(
	query?: GetCategoriesQuery,
): Promise<Category[]> {
	const endpoint = addQueryParams(
		endpoints.categories.list,
		query as Record<string, unknown>,
	);
	return apiClient.get<Category[]>(endpoint);
}

/**
 * カテゴリ詳細を取得する
 */
export async function getCategory(id: string): Promise<Category> {
	const endpoint = endpoints.categories.detail(id);
	return apiClient.get<Category>(endpoint);
}

/**
 * 新しいカテゴリを作成する
 */
export async function createCategory(
	data: CreateCategoryRequest,
): Promise<Category> {
	const endpoint = endpoints.categories.create;
	return apiClient.post<Category>(endpoint, data);
}

/**
 * カテゴリを更新する
 */
export async function updateCategory(
	id: string,
	data: UpdateCategoryRequest,
): Promise<Category> {
	const endpoint = endpoints.categories.update(id);
	return apiClient.put<Category>(endpoint, data);
}

/**
 * カテゴリを削除する
 */
export async function deleteCategory(id: string): Promise<DeleteResponse> {
	const endpoint = endpoints.categories.delete(id);
	return apiClient.delete<DeleteResponse>(endpoint);
}

// 収入カテゴリは廃止されました。支出カテゴリのみを使用してください。

/**
 * 支出カテゴリのみを取得する
 */
export async function getExpenseCategories(): Promise<Category[]> {
	return getCategories({ type: "expense" });
}

/**
 * デフォルトカテゴリセットを作成する
 * 初回セットアップ時に基本的なカテゴリを一括作成
 */
export async function createDefaultCategories(): Promise<Category[]> {
	// デフォルトの支出カテゴリ
	const defaultExpenseCategories: CreateCategoryRequest[] = [
		{ name: "食費", type: "expense", color: "#FF6B6B" },
		{ name: "交通費", type: "expense", color: "#4ECDC4" },
		{ name: "娯楽", type: "expense", color: "#45B7D1" },
		{ name: "光熱費", type: "expense", color: "#96CEB4" },
		{ name: "家賃", type: "expense", color: "#FECA57" },
		{ name: "サブスクリプション", type: "expense", color: "#FF9FF3" },
		{ name: "その他", type: "expense", color: "#A8E6CF" },
	];

	const allCategories = defaultExpenseCategories;

	// 並列で作成
	const createdCategories = await Promise.all(
		allCategories.map((category) => createCategory(category)),
	);

	return createdCategories;
}

/**
 * カテゴリの使用状況を確認する
 * 削除前に参照されているかチェックするために使用
 */
export async function checkCategoryUsage(id: string): Promise<{
	isUsed: boolean;
	transactionCount: number;
	subscriptionCount: number;
}> {
	// 実際のAPIではサーバーサイドで実装される機能
	// ここでは型定義のみ提供
	const endpoint = `/categories/${id}/usage`;
	return apiClient.get(endpoint);
}

/**
 * カテゴリサービスのデフォルトエクスポート
 */
export const categoryService = {
	getCategories,
	getCategory,
	createCategory,
	updateCategory,
	deleteCategory,
	// getIncomeCategories は廃止されました
	getExpenseCategories,
	createDefaultCategories,
	checkCategoryUsage,
} as const;
