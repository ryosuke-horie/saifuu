/**
 * カテゴリデータの変換処理
 * フロントエンド型とバックエンドAPI型の間での変換を行う
 */

import type { Category } from "../../../types/category";
import type { ApiCategoryResponse } from "./types";

/**
 * バックエンドAPIレスポンスをフロントエンド型に変換
 * @param apiCategory - API レスポンスのカテゴリ
 * @returns フロントエンド用のカテゴリ型
 */
export function transformApiCategoryToFrontend(
	apiCategory: ApiCategoryResponse,
): Category {
	return {
		id: apiCategory.id.toString(), // number -> string変換
		name: apiCategory.name,
		type: "expense", // デフォルトとして expense を設定
		color: undefined, // 省略可能フィールドとして undefined
		createdAt: apiCategory.createdAt,
		updatedAt: apiCategory.updatedAt,
	};
}

/**
 * バックエンドAPIレスポンス配列をフロントエンド型配列に変換
 * @param apiCategories - API レスポンスのカテゴリ配列
 * @returns フロントエンド用のカテゴリ型配列
 */
export function transformApiCategoriesToFrontend(
	apiCategories: ApiCategoryResponse[],
): Category[] {
	return apiCategories.map(transformApiCategoryToFrontend);
}
