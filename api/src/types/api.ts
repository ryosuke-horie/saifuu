/**
 * API共通の型定義
 * 共有型定義を再エクスポート
 */

// 共有型定義から必要な型をインポート
import type {
	// Category型
	Category,
	CreateTransactionRequest,
	DeleteResponse,
	GetTransactionsQuery,
	// Transaction型
	Transaction,
	UpdateTransactionRequest,
} from '@shared/types'

// 型ガード関数もインポート
import { isCategory, isTransaction } from '@shared/types'

// 再エクスポート
export type {
	Transaction,
	CreateTransactionRequest,
	UpdateTransactionRequest,
	GetTransactionsQuery,
	Category,
	DeleteResponse,
}

export { isTransaction, isCategory }

// APIレスポンス用の型エイリアス（互換性のため）
export type TransactionResponse = Transaction & {
	id: number
	categoryName?: string
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

// 収支サマリーレスポンスの型定義
export interface BalanceSummaryResponse {
	income: number
	expense: number
	balance: number
	savingsRate: number
	trend: 'positive' | 'negative' | 'neutral'
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
	if (!isTransaction(value)) return false
	const transaction = value as unknown as Record<string, unknown>
	return typeof transaction.id === 'number'
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

export function isBalanceSummaryResponse(value: unknown): value is BalanceSummaryResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'income' in value &&
		'expense' in value &&
		'balance' in value &&
		'savingsRate' in value &&
		'trend' in value &&
		typeof (value as BalanceSummaryResponse).income === 'number' &&
		typeof (value as BalanceSummaryResponse).expense === 'number' &&
		typeof (value as BalanceSummaryResponse).balance === 'number' &&
		typeof (value as BalanceSummaryResponse).savingsRate === 'number' &&
		['positive', 'negative', 'neutral'].includes((value as BalanceSummaryResponse).trend)
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
