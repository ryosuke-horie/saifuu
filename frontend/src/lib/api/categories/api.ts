/**
 * カテゴリ関連のAPI呼び出し
 * バックエンドのカテゴリAPIとの通信を担当
 *
 * 設定ファイルから直接カテゴリを取得するように変更
 */

import { ALL_CATEGORIES, type CategoryConfig } from "@shared/config";
// 共有型定義のCategoryを使用
import type { Category } from "../types";

/**
 * カテゴリ一覧を取得（設定ファイルから）
 * @returns カテゴリ一覧
 */
export async function fetchCategories(): Promise<Category[]> {
	// 設定ファイルから直接カテゴリを取得
	// 非同期処理との互換性のためPromiseを返す
	return Promise.resolve(
		ALL_CATEGORIES.map((category: CategoryConfig) => ({
			id: category.numericId.toString(), // フロントエンドではstring型を使用
			name: category.name,
			type: category.type,
			color: category.color || null, // 共有型定義に合わせてnullを使用
			description: undefined, // 共有型定義に必須フィールドとして含まれる可能性があるため
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		})),
	);
}

/**
 * カテゴリを詳細取得（設定ファイルから）
 * @param id - カテゴリID
 * @returns カテゴリ詳細
 */
export async function fetchCategoryById(id: string): Promise<Category> {
	const numericId = Number.parseInt(id);
	const category = ALL_CATEGORIES.find(
		(c: CategoryConfig) => c.numericId === numericId,
	);

	if (!category) {
		throw new Error(`カテゴリID ${id} が見つかりません`);
	}

	return Promise.resolve({
		id: category.numericId.toString(),
		name: category.name,
		type: category.type,
		color: category.color || null,
		description: undefined,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});
}
