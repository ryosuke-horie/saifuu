/**
 * API共通の型定義
 * 共有型定義を再エクスポート
 */

// 共有型定義から必要な型をインポート
import type {
	BalanceSummaryResponse,
	// Entity型
	Category,
	// Request型
	CreateTransactionRequest,
	// Response型
	DeleteResponse,
	ErrorResponse,
	// Query型
	GetTransactionsQuery,
	StatsResponse,
	Transaction,
	TransactionResponse,
	UpdateTransactionRequest,
} from '@shared/types'

// 型ガード関数もインポート
import {
	isBalanceSummaryResponse,
	isCategory,
	isErrorResponse,
	isStatsResponse,
	isTransaction,
	isTransactionResponse,
} from '@shared/types'

// 再エクスポート
export type {
	Transaction,
	CreateTransactionRequest,
	UpdateTransactionRequest,
	GetTransactionsQuery,
	Category,
	DeleteResponse,
	TransactionResponse,
	StatsResponse,
	BalanceSummaryResponse,
	ErrorResponse,
}

export {
	isTransaction,
	isCategory,
	isTransactionResponse,
	isStatsResponse,
	isBalanceSummaryResponse,
	isErrorResponse,
}

// 注意: レスポンス型と型ガードは共有型定義から使用
// これらの型はshared/src/types/api.tsとshared/src/types/guards.tsに移動済み
