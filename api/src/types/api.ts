/**
 * API共通の型定義
 * Matt Pocockの型定義方針に従い、型安全性を確保
 */

// 取引レスポンスの型定義
export interface TransactionResponse {
	id: number
	amount: number
	type: 'income' | 'expense'
	categoryId?: number
	categoryName?: string
	description?: string
	date: string
	createdAt: string
	updatedAt: string
}

// 統計情報レスポンスの型定義
export interface StatsResponse {
	totalExpense: number
	totalIncome: number
	balance: number
	transactionCount: number
	expenseCount: number
	incomeCount: number
}

// エラーレスポンスの型定義
export interface ErrorResponse {
	error: string
	details?: Array<{
		field: string
		message: string
		code?: string
	}>
}

// Type Guards
export function isTransactionResponse(value: unknown): value is TransactionResponse {
	return (
		(typeof value === 'object' &&
			value !== null &&
			'id' in value &&
			'amount' in value &&
			'type' in value &&
			'date' in value &&
			'createdAt' in value &&
			'updatedAt' in value &&
			(value as TransactionResponse).type === 'income') ||
		(value as TransactionResponse).type === 'expense'
	)
}

export function isStatsResponse(value: unknown): value is StatsResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'totalExpense' in value &&
		'totalIncome' in value &&
		'balance' in value &&
		'transactionCount' in value &&
		'expenseCount' in value &&
		'incomeCount' in value
	)
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'error' in value &&
		typeof (value as ErrorResponse).error === 'string'
	)
}
