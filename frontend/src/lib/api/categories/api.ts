/**
 * カテゴリ関連のAPI呼び出し
 * バックエンドのカテゴリAPIとの通信を担当
 */

import type { Category } from "../../../types/category";
import { apiClient } from "../client";
import { transformApiCategoriesToFrontend } from "./transformers";
import type { ApiCategoryListResponse, ApiCategoryResponse } from "./types";

/**
 * カテゴリ一覧を取得
 * @returns カテゴリ一覧
 */
export async function fetchCategories(): Promise<Category[]> {
	try {
		const response =
			await apiClient.get<ApiCategoryListResponse>("/categories");

		return transformApiCategoriesToFrontend(response.categories);
	} catch (error) {
		console.error("Failed to fetch categories:", error);
		throw new Error("カテゴリ一覧の取得に失敗しました");
	}
}

/**
 * カテゴリを詳細取得
 * @param id - カテゴリID
 * @returns カテゴリ詳細
 */
export async function fetchCategoryById(id: string): Promise<Category> {
	try {
		const response = await apiClient.get<ApiCategoryResponse>(
			`/categories/${id}`,
		);

		return {
			id: response.id.toString(),
			name: response.name,
			type: "expense", // デフォルトとして expense を設定
			color: null, // デフォルトでは null
			createdAt: response.createdAt,
			updatedAt: response.updatedAt,
		};
	} catch (error) {
		console.error(`Failed to fetch category ${id}:`, error);
		throw new Error("カテゴリ詳細の取得に失敗しました");
	}
}
