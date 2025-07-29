/**
 * サブスクリプション基本型定義
 * 定期購読・サービスに関する型定義
 */

import type { ISODateString, NumericEntityId, Timestamps } from '../common'
import type { WithCategory, WithCategoryId } from '../common/category'

// 請求サイクル
export type BillingCycle = 'monthly' | 'yearly' | 'weekly'

// サブスクリプションステータス
export type SubscriptionStatus = 'active' | 'inactive'

// データベース型（Drizzleスキーマと整合）
export interface DbSubscription extends Timestamps, WithCategoryId {
	id: NumericEntityId<'Subscription'>
	name: string
	amount: number
	billingCycle: BillingCycle
	nextBillingDate: ISODateString
	description: string | null
	isActive: boolean
}

// API用のサブスクリプション型（カテゴリ情報付き）
export interface Subscription extends Omit<DbSubscription, 'id' | 'categoryId'>, WithCategory {
	id: string // APIレスポンスではstring型
	status: SubscriptionStatus
}

// サブスクリプション統計
export interface SubscriptionStats {
	totalActive: number
	totalInactive: number
	monthlyTotal: number
	yearlyTotal: number
	avgMonthlyAmount: number
	categoryBreakdown: CategoryBreakdown[]
}

// カテゴリ別内訳
export interface CategoryBreakdown {
	categoryId: NumericEntityId<'Category'>
	categoryName: string
	count: number
	totalAmount: number
	percentage: number
}

// 次回請求予定
export interface UpcomingBilling {
	subscriptionId: NumericEntityId<'Subscription'>
	subscriptionName: string
	amount: number
	billingDate: ISODateString
	daysUntilBilling: number
}

// 型ガード関数
export function isBillingCycle(value: unknown): value is BillingCycle {
	return value === 'monthly' || value === 'yearly' || value === 'weekly'
}

export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
	return value === 'active' || value === 'inactive'
}

export function isDbSubscription(value: unknown): value is DbSubscription {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		'name' in value &&
		'amount' in value &&
		'billingCycle' in value &&
		'nextBillingDate' in value &&
		'isActive' in value &&
		typeof (value as DbSubscription).id === 'number' &&
		typeof (value as DbSubscription).name === 'string' &&
		typeof (value as DbSubscription).amount === 'number' &&
		isBillingCycle((value as DbSubscription).billingCycle) &&
		typeof (value as DbSubscription).isActive === 'boolean'
	)
}

// ステータス導出ヘルパー
export function deriveSubscriptionStatus(isActive: boolean): SubscriptionStatus {
	return isActive ? 'active' : 'inactive'
}
