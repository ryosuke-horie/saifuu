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
 *
 * 移行期の実装:
 * - 現在: 設定ファイルから静的データを取得
 * - 将来: APIエンドポイントから動的に取得
 *
 * この実装により、APIが準備できるまでアプリケーションの開発を継続可能
 */
export async function getCategories(): Promise<Category[]> {
	// 移行期: 設定ファイルから取得
	// TODO: API実装後は apiClient.get(endpoints.categories.list) に変更
	return fetchCategoriesFromConfig();
}

/**
 * カテゴリ詳細を取得する
 *
 * 移行期の実装:
 * - 現在: 設定ファイルから静的データを取得
 * - 将来: APIエンドポイントから動的に取得
 */
export async function getCategory(id: string): Promise<Category> {
	// 移行期: 設定ファイルから取得
	// TODO: API実装後は apiClient.get(endpoints.categories.detail(id)) に変更
	return fetchCategoryByIdFromConfig(id);
}

/**
 * 新しいカテゴリを作成する
 *
 * 現在の実装:
 * - APIエンドポイントにPOSTリクエストを送信
 * - 注意: バックエンドAPIが未実装のため、実際には動作しない
 * - フロントエンドの型安全性とインターフェースは完成済み
 */
export async function createCategory(
	data: CreateCategoryRequest,
): Promise<Category> {
	// API実装待ち: エンドポイントは定義済みだがバックエンドが未実装
	const endpoint = endpoints.categories.create;
	return apiClient.post<Category>(endpoint, data);
}

/**
 * カテゴリを更新する
 *
 * 現在の実装:
 * - APIエンドポイントにPUTリクエストを送信
 * - 注意: バックエンドAPIが未実装のため、実際には動作しない
 */
export async function updateCategory(
	id: string,
	data: UpdateCategoryRequest,
): Promise<Category> {
	// API実装待ち: エンドポイントは定義済みだがバックエンドが未実装
	const endpoint = endpoints.categories.update(id);
	return apiClient.put<Category>(endpoint, data);
}

/**
 * カテゴリを削除する
 *
 * 現在の実装:
 * - APIエンドポイントにDELETEリクエストを送信
 * - 注意: バックエンドAPIが未実装のため、実際には動作しない
 */
export async function deleteCategory(id: string): Promise<DeleteResponse> {
	// API実装待ち: エンドポイントは定義済みだがバックエンドが未実装
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
