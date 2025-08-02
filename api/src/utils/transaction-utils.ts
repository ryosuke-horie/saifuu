import { ALL_CATEGORIES } from '../../../shared/src/config/categories'

/**
 * 取引データの型定義
 */
export type TransactionWithCategory<T extends { categoryId?: number | null }> = T & {
	category: {
		id: number
		name: string
		type: string
		color: string
		createdAt: string
		updatedAt: string
	} | null
}

/**
 * カテゴリ情報を単一の取引データに追加する関数
 */
function addCategoryInfoToItem<T extends { categoryId?: number | null }>(
	tx: T
): TransactionWithCategory<T> {
	const category = ALL_CATEGORIES.find((cat) => cat.numericId === tx.categoryId)
	return {
		...tx,
		category: category
			? {
					id: category.numericId,
					name: category.name,
					type: category.type,
					color: category.color,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}
			: null,
	}
}

/**
 * カテゴリ情報を取引データに追加する変換関数
 * CRUDファクトリのtransformDataオプションで使用
 * 単一アイテムと配列の両方に対応
 */
// オーバーロードシグネチャ
export function addCategoryInfo<T extends { categoryId?: number | null }>(
	data: T[]
): TransactionWithCategory<T>[]
export function addCategoryInfo<T extends { categoryId?: number | null }>(
	data: T
): TransactionWithCategory<T>
// 実装
export function addCategoryInfo<T extends { categoryId?: number | null }>(
	data: T | T[]
): TransactionWithCategory<T> | TransactionWithCategory<T>[] {
	if (Array.isArray(data)) {
		return data.map(addCategoryInfoToItem)
	}
	// 単一アイテムの場合
	return addCategoryInfoToItem(data)
}
