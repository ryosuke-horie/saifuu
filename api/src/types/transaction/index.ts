/**
 * 取引（Transaction）基本型定義
 * 収入・支出の取引に関する型定義
 */

import type { ISODateString, NumericEntityId, Timestamps } from '../common'
import type { CategoryType, WithCategory } from '../common/category'

// 取引タイプ（カテゴリタイプと同じだが、明示的に定義）
export type TransactionType = CategoryType

// データベース型（Drizzleスキーマと整合）
export interface DbTransaction extends Timestamps {
	id: NumericEntityId<'Transaction'>
	amount: number
	type: TransactionType
	categoryId: NumericEntityId<'Category'> | null
	description: string | null
	date: ISODateString
}

// API用の取引型（カテゴリ情報付き）
export interface Transaction extends Omit<DbTransaction, 'id' | 'categoryId'>, WithCategory {
	id: string // APIレスポンスではstring型
}

// 取引サマリー
export interface TransactionSummary {
	totalExpense: number
	totalIncome: number
	balance: number
	transactionCount: number
	expenseCount: number
	incomeCount: number
}

// 月別サマリー
export interface MonthlySummary extends TransactionSummary {
	year: number
	month: number
}

// カテゴリ別サマリー
export interface CategorySummary {
	categoryId: NumericEntityId<'Category'>
	categoryName: string
	type: TransactionType
	totalAmount: number
	transactionCount: number
	percentage: number
}

// 型ガード関数
export function isTransactionType(value: unknown): value is TransactionType {
	return value === 'income' || value === 'expense'
}

export function isDbTransaction(value: unknown): value is DbTransaction {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		'amount' in value &&
		'type' in value &&
		'date' in value &&
		'createdAt' in value &&
		'updatedAt' in value &&
		typeof (value as DbTransaction).id === 'number' &&
		typeof (value as DbTransaction).amount === 'number' &&
		isTransactionType((value as DbTransaction).type)
	)
}

export function isTransaction(value: unknown): value is Transaction {
	return (
		isDbTransaction(value) &&
		'category' in value &&
		(value.category === null || typeof value.category === 'object')
	)
}
