/**
 * 取引APIレスポンス型定義
 * APIから返却されるレスポンスの型定義
 */

import type { PaginatedResponse } from '../common'
import type { CategorySummary, MonthlySummary, Transaction, TransactionSummary } from './index'

// 取引一覧レスポンス
export interface TransactionListResponse extends PaginatedResponse<Transaction> {}

// 取引詳細レスポンス
export interface TransactionDetailResponse {
	transaction: Transaction
}

// 取引作成・更新レスポンス
export interface TransactionMutationResponse {
	transaction: Transaction
	message?: string
}

// 取引削除レスポンス
export interface TransactionDeleteResponse {
	success: true
	message: string
}

// 取引統計レスポンス
export interface TransactionStatsResponse {
	summary: TransactionSummary
	period?: {
		startDate: string
		endDate: string
	}
}

// 月別統計レスポンス
export interface MonthlyStatsResponse {
	summaries: MonthlySummary[]
	total: TransactionSummary
	period: {
		startDate: string
		endDate: string
	}
}

// カテゴリ別統計レスポンス
export interface CategoryStatsResponse {
	categories: CategorySummary[]
	total: TransactionSummary
	period?: {
		startDate: string
		endDate: string
	}
}
