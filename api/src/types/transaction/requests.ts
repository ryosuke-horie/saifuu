/**
 * 取引APIリクエスト型定義
 * クライアントから送信されるリクエストの型定義
 */

import { z } from 'zod'
import type { TransactionType } from './index'

// 取引作成リクエスト（支出）
export const createExpenseRequestSchema = z.object({
	amount: z.number().positive('金額は正の数である必要があります'),
	type: z.literal('expense'),
	categoryId: z.string().regex(/^\d+$/, 'カテゴリIDは数値文字列である必要があります'),
	description: z.string().optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります'),
})

// 取引作成リクエスト（収入）
export const createIncomeRequestSchema = z.object({
	amount: z.number().positive('金額は正の数である必要があります'),
	type: z.literal('income'),
	categoryId: z.string().regex(/^\d+$/, 'カテゴリIDは数値文字列である必要があります').optional(),
	description: z.string().optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります'),
})

// 取引作成リクエスト（統合）
export const createTransactionRequestSchema = z.discriminatedUnion('type', [
	createExpenseRequestSchema,
	createIncomeRequestSchema,
])

// 取引更新リクエスト（支出）
export const updateExpenseRequestSchema = z.object({
	amount: z.number().positive('金額は正の数である必要があります').optional(),
	categoryId: z.string().regex(/^\d+$/, 'カテゴリIDは数値文字列である必要があります').optional(),
	description: z.string().optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります')
		.optional(),
})

// 取引更新リクエスト（収入）
export const updateIncomeRequestSchema = z.object({
	amount: z.number().positive('金額は正の数である必要があります').optional(),
	categoryId: z
		.string()
		.regex(/^\d+$/, 'カテゴリIDは数値文字列である必要があります')
		.nullable()
		.optional(),
	description: z.string().optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります')
		.optional(),
})

// 型定義（Zodスキーマから推論）
export type CreateExpenseRequest = z.infer<typeof createExpenseRequestSchema>
export type CreateIncomeRequest = z.infer<typeof createIncomeRequestSchema>
export type CreateTransactionRequest = z.infer<typeof createTransactionRequestSchema>
export type UpdateExpenseRequest = z.infer<typeof updateExpenseRequestSchema>
export type UpdateIncomeRequest = z.infer<typeof updateIncomeRequestSchema>
export type UpdateTransactionRequest = UpdateExpenseRequest | UpdateIncomeRequest

// 一覧取得クエリパラメータ
export interface GetTransactionsQuery {
	page?: string
	limit?: string
	type?: TransactionType
	categoryId?: string
	startDate?: string
	endDate?: string
	sortBy?: 'date' | 'amount'
	sortOrder?: 'asc' | 'desc'
}

// 統計取得クエリパラメータ
export interface GetTransactionStatsQuery {
	startDate?: string
	endDate?: string
	groupBy?: 'month' | 'category'
}
