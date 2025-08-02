// API リクエスト・レスポンス型定義

import type { BaseCategory, BaseSubscription, BaseTransaction } from './base'

// リクエスト型
export interface CreateTransactionRequest {
	amount: number
	type: 'income' | 'expense'
	description?: string | null
	date: string
	categoryId?: string | null
}

export interface UpdateTransactionRequest {
	amount?: number
	description?: string | null
	date?: string
	categoryId?: string | null
}

export interface CreateCategoryRequest {
	name: string
	type: 'expense' | 'income'
	description?: string | null
}

export interface UpdateCategoryRequest {
	name?: string
	description?: string | null
}

export interface CreateSubscriptionRequest {
	name: string
	amount: number
	billingCycle: 'monthly' | 'yearly' | 'weekly'
	startDate: string
	endDate?: string | null
	nextBillingDate?: string
	categoryId?: string | null
	description?: string | null
	isActive?: boolean
}

export interface UpdateSubscriptionRequest {
	name?: string
	amount?: number
	billingCycle?: 'monthly' | 'yearly' | 'weekly'
	startDate?: string
	endDate?: string | null
	nextBillingDate?: string
	categoryId?: string | null
	description?: string | null
	isActive?: boolean
}

// レスポンス型
export type Transaction = BaseTransaction
export type Category = BaseCategory
export type Subscription = BaseSubscription

// 削除レスポンス
export interface DeleteResponse {
	success: boolean
	message?: string
}

// クエリパラメータ型
export interface GetTransactionsQuery {
	type?: 'income' | 'expense'
	categoryId?: string
	startDate?: string
	endDate?: string
	limit?: number
	offset?: number
}

export interface GetCategoriesQuery {
	type?: 'expense' | 'income'
}

export interface GetSubscriptionsQuery {
	isActive?: boolean
	categoryId?: string
	billingCycle?: 'monthly' | 'yearly' | 'weekly'
}
