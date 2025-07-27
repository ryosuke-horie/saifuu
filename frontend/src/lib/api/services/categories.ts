/**
 * カテゴリAPI サービス
 *
 * カテゴリ関連のAPI呼び出しを管理する
 * カテゴリの取得・作成・更新・削除を提供
 */

import {
	fetchCategories as fetchCategoriesFromConfig,
	fetchCategoryById as fetchCategoryByIdFromConfig,
} from "../categories/api";
import { apiClient } from "../client";
import { endpoints } from "../config";
import type {
	Category,
	CreateCategoryRequest,
	DeleteResponse,
	UpdateCategoryRequest,
} from "../types";

/**
 * カテゴリ一覧を取得する
 * 現在は設定ファイルから取得するが、将来的にはAPIから取得可能
 */
export async function getCategories(): Promise<Category[]> {
	// 設定ファイルから取得
	return fetchCategoriesFromConfig();
}

/**
 * カテゴリ詳細を取得する
 * 現在は設定ファイルから取得するが、将来的にはAPIから取得可能
 */
export async function getCategory(id: string): Promise<Category> {
	// 設定ファイルから取得
	return fetchCategoryByIdFromConfig(id);
}

/**
 * 新しいカテゴリを作成する
 * 注意: 現在は設定ファイルベースのため、実際の作成はサポートされていない
 */
export async function createCategory(
	data: CreateCategoryRequest,
): Promise<Category> {
	// 将来的にAPIが実装された場合のコード
	const endpoint = endpoints.categories.create;
	return apiClient.post<Category>(endpoint, data);
}

/**
 * カテゴリを更新する
 * 注意: 現在は設定ファイルベースのため、実際の更新はサポートされていない
 */
export async function updateCategory(
	id: string,
	data: UpdateCategoryRequest,
): Promise<Category> {
	// 将来的にAPIが実装された場合のコード
	const endpoint = endpoints.categories.update(id);
	return apiClient.put<Category>(endpoint, data);
}

/**
 * カテゴリを削除する
 * 注意: 現在は設定ファイルベースのため、実際の削除はサポートされていない
 */
export async function deleteCategory(id: string): Promise<DeleteResponse> {
	// 将来的にAPIが実装された場合のコード
	const endpoint = endpoints.categories.delete(id);
	return apiClient.delete<DeleteResponse>(endpoint);
}

/**
 * キャッシュ無効化
 * React Query等のキャッシュライブラリと連携する際に使用
 */
export function invalidateCategoriesCache(): void {
	// キャッシュ無効化のロジックをここに実装
	// 現在は何もしない（将来的な実装のためのプレースホルダー）
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
	invalidateCategoriesCache,
} as const;
