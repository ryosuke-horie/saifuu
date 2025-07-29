/**
 * サブスクリプションAPIリクエスト型定義
 * クライアントから送信されるリクエストの型定義
 */

import { z } from 'zod'
import type { BillingCycle } from './index'

// 請求サイクルのZodスキーマ
const billingCycleSchema = z.enum(['monthly', 'yearly', 'weekly'])

// サブスクリプション作成リクエスト
export const createSubscriptionRequestSchema = z.object({
	name: z.string().min(1, '名前は必須です'),
	amount: z.number().positive('金額は正の数である必要があります'),
	billingCycle: billingCycleSchema,
	nextBillingDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります'),
	categoryId: z
		.string()
		.regex(/^\d+$/, 'カテゴリIDは数値文字列である必要があります')
		.nullable()
		.optional(),
	description: z.string().nullable().optional(),
	isActive: z.boolean().optional().default(true),
})

// サブスクリプション更新リクエスト
export const updateSubscriptionRequestSchema = z.object({
	name: z.string().min(1, '名前は必須です').optional(),
	amount: z.number().positive('金額は正の数である必要があります').optional(),
	billingCycle: billingCycleSchema.optional(),
	nextBillingDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります')
		.optional(),
	categoryId: z
		.string()
		.regex(/^\d+$/, 'カテゴリIDは数値文字列である必要があります')
		.nullable()
		.optional(),
	description: z.string().nullable().optional(),
	isActive: z.boolean().optional(),
})

// 型定義（Zodスキーマから推論）
export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionRequestSchema>
export type UpdateSubscriptionRequest = z.infer<typeof updateSubscriptionRequestSchema>

// 一覧取得クエリパラメータ
export interface GetSubscriptionsQuery {
	page?: string
	limit?: string
	isActive?: string // 'true' | 'false'
	categoryId?: string
	billingCycle?: BillingCycle
	sortBy?: 'name' | 'amount' | 'nextBillingDate'
	sortOrder?: 'asc' | 'desc'
}

// 統計取得クエリパラメータ
export interface GetSubscriptionStatsQuery {
	includeInactive?: string // 'true' | 'false'
	upcomingDays?: string // 次回請求予定の日数
}
