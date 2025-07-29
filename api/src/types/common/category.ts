/**
 * カテゴリ型定義（統一版）
 * アプリケーション全体で使用されるカテゴリの型定義
 */

import type { NumericEntityId, Timestamps } from './index'

// カテゴリタイプ
export type CategoryType = 'income' | 'expense'

// 基本カテゴリ型（設定ファイルベース）
export interface BaseCategory {
	id: NumericEntityId<'Category'>
	name: string
	type: CategoryType
	color: string
}

// APIレスポンス用カテゴリ型
export interface Category extends BaseCategory, Timestamps {}

// カテゴリ付きエンティティ用の型
export interface WithCategory {
	category: Category | null
}

// カテゴリID付きエンティティ用の型
export interface WithCategoryId {
	categoryId: NumericEntityId<'Category'> | null
}

// 型ガード関数
export function isCategoryType(value: unknown): value is CategoryType {
	return value === 'income' || value === 'expense'
}

export function isCategory(value: unknown): value is Category {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		'name' in value &&
		'type' in value &&
		'color' in value &&
		'createdAt' in value &&
		'updatedAt' in value &&
		typeof (value as Category).id === 'number' &&
		typeof (value as Category).name === 'string' &&
		isCategoryType((value as Category).type) &&
		typeof (value as Category).color === 'string'
	)
}

// カテゴリ変換ヘルパー
export function createCategory(baseCategory: BaseCategory, timestamps: Timestamps): Category {
	return {
		...baseCategory,
		...timestamps,
	}
}
