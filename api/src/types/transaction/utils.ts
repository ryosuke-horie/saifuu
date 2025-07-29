/**
 * 取引データ変換・ユーティリティ関数
 * データベース型とAPI型の変換、バリデーション等
 */

import { ALL_CATEGORIES } from '../../../../shared/config/categories'
import type { ISODateString, NumericEntityId } from '../common'
import type { Category } from '../common/category'
import type { DbTransaction, Transaction } from './index'
import type { CreateTransactionRequest, UpdateTransactionRequest } from './requests'

// データベース型からAPI型への変換
export function transformDbTransactionToApi(
	dbTransaction: DbTransaction,
	category: Category | null = null
): Transaction {
	return {
		...dbTransaction,
		id: String(dbTransaction.id),
		category,
	}
}

// 複数の取引にカテゴリ情報を付加（DB結果用のオーバーロード）
export function addCategoryInfoToTransactions(
	transactions: (Omit<DbTransaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt' | 'date'> & {
		id: number
		categoryId: number | null
		createdAt: string
		updatedAt: string
		date: string
	})[]
): Transaction[]
// 複数の取引にカテゴリ情報を付加（型安全版）
export function addCategoryInfoToTransactions(transactions: DbTransaction[]): Transaction[]
// 実装
export function addCategoryInfoToTransactions(transactions: any[]): Transaction[] {
	const currentTimestamp = new Date().toISOString() as ISODateString

	// カテゴリマップを作成（検索効率化）
	const categoryMap = new Map(
		ALL_CATEGORIES.map((cat) => [
			cat.numericId,
			{
				id: cat.numericId as NumericEntityId<'Category'>,
				name: cat.name,
				type: cat.type,
				color: cat.color,
				createdAt: currentTimestamp,
				updatedAt: currentTimestamp,
			} as Category,
		])
	)

	return transactions.map((transaction) => ({
		...transaction,
		id: String(transaction.id),
		categoryId: transaction.categoryId as NumericEntityId<'Category'> | null,
		createdAt: transaction.createdAt as ISODateString,
		updatedAt: transaction.updatedAt as ISODateString,
		date: transaction.date as ISODateString,
		category: transaction.categoryId ? categoryMap.get(transaction.categoryId) || null : null,
	}))
}

// 単一の取引にカテゴリ情報を付加
export function addCategoryInfoToTransaction(transaction: DbTransaction): Transaction {
	return addCategoryInfoToTransactions([transaction])[0]
}

// 作成リクエストからデータベース用データへの変換
export function transformCreateRequestToDb(
	request: CreateTransactionRequest
): Omit<DbTransaction, 'id' | 'createdAt' | 'updatedAt'> {
	const _now = new Date().toISOString() as ISODateString

	return {
		amount: request.amount,
		type: request.type,
		categoryId: request.categoryId
			? (Number.parseInt(request.categoryId) as NumericEntityId<'Category'>)
			: null,
		description: request.description || null,
		date: request.date as ISODateString,
	}
}

// 更新リクエストからデータベース用データへの変換
export function transformUpdateRequestToDb(
	request: UpdateTransactionRequest
): Partial<Omit<DbTransaction, 'id' | 'createdAt'>> {
	const updates: Partial<Omit<DbTransaction, 'id' | 'createdAt'>> = {
		updatedAt: new Date().toISOString() as ISODateString,
	}

	if (request.amount !== undefined) {
		updates.amount = request.amount
	}

	if ('categoryId' in request && request.categoryId !== undefined) {
		updates.categoryId = request.categoryId
			? (Number.parseInt(request.categoryId) as NumericEntityId<'Category'>)
			: null
	}

	if (request.description !== undefined) {
		updates.description = request.description || null
	}

	if (request.date !== undefined) {
		updates.date = request.date as ISODateString
	}

	return updates
}

// クエリパラメータのパース
export function parseTransactionQueryParams(query: Record<string, string | undefined>) {
	return {
		page: query.page ? Number.parseInt(query.page) : 1,
		limit: query.limit ? Number.parseInt(query.limit) : 20,
		type: query.type as 'income' | 'expense' | undefined,
		categoryId: query.categoryId
			? (Number.parseInt(query.categoryId) as NumericEntityId<'Category'>)
			: undefined,
		startDate: query.startDate,
		endDate: query.endDate,
		sortBy: (query.sortBy || 'date') as 'date' | 'amount',
		sortOrder: (query.sortOrder || 'desc') as 'asc' | 'desc',
	}
}
