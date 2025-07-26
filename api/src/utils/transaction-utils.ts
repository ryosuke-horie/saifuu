import { ALL_CATEGORIES } from '../../../shared/config/categories'

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
 * カテゴリ情報を取引データに追加する変換関数
 * CRUDファクトリのtransformDataオプションで使用
 */
export function addCategoryInfo<T extends { categoryId?: number | null }>(
	transactionList: T[]
): TransactionWithCategory<T>[] {
	return transactionList.map((tx) => {
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
	})
}
