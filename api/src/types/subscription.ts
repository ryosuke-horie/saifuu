/**
 * サブスクリプションAPI関連の型定義
 *
 * データベーススキーマとフロントエンド要件の橋渡しを行う
 * - データベース: integer ID, categoryId参照, timestamp
 * - フロントエンド: string ID, ネストされたcategoryオブジェクト, 日付文字列
 */

import type { Category, NewSubscription, Subscription } from '../db/schema'

// =============================================================================
// 基本型定義
// =============================================================================

/**
 * 請求サイクル
 * データベーススキーマと一致
 */
export type BillingCycle = 'monthly' | 'yearly' | 'weekly'

/**
 * サブスクリプションステータス
 * isActiveフィールドから導出
 */
export type SubscriptionStatus = 'active' | 'inactive'

// =============================================================================
// データベース型（内部処理用）
// =============================================================================

/**
 * データベースから取得されるサブスクリプション
 * schema.tsのSubscription型をそのまま使用
 */
export type DbSubscription = Subscription

/**
 * データベースに挿入するサブスクリプション
 * schema.tsのNewSubscription型をそのまま使用
 */
export type DbNewSubscription = NewSubscription

/**
 * サブスクリプションとカテゴリのJOIN結果
 * データベースクエリでJOINした結果の型
 */
export type DbSubscriptionWithCategory = Subscription & {
	category: Category | null
}

// =============================================================================
// API レスポンス型（フロントエンド向け）
// =============================================================================

/**
 * APIレスポンス用のカテゴリ情報
 * フロントエンドの期待形式に合わせてstring IDに変換
 */
export interface ApiCategory {
	id: string
	name: string
	type: 'income' | 'expense'
	color: string | null
	createdAt: string
	updatedAt: string
}

/**
 * APIレスポンス用のサブスクリプション
 * フロントエンドの期待形式に合わせて変換
 * - ID: number → string
 * - 日付: Date → string (ISO形式)
 * - カテゴリ: categoryId参照 → ネストされたオブジェクト
 */
export interface ApiSubscription {
	id: string
	name: string
	amount: number
	billingCycle: BillingCycle
	nextBillingDate: string // ISO date string
	description: string | null
	isActive: boolean
	category: ApiCategory | null
	createdAt: string // ISO date string
	updatedAt: string // ISO date string
}

/**
 * サブスクリプション一覧レスポンス
 */
export interface ApiSubscriptionListResponse {
	subscriptions: ApiSubscription[]
	total: number
	page?: number
	limit?: number
}

/**
 * サブスクリプション詳細レスポンス
 */
export interface ApiSubscriptionDetailResponse {
	subscription: ApiSubscription
}

// =============================================================================
// API リクエスト型
// =============================================================================

/**
 * サブスクリプション作成リクエスト
 * フロントエンドから送信される形式
 */
export interface CreateSubscriptionRequest {
	name: string
	amount: number
	billingCycle: BillingCycle
	nextBillingDate: string // ISO date string
	categoryId?: string | null // フロントエンドからはstring IDで送信
	description?: string | null
	isActive?: boolean
}

/**
 * サブスクリプション更新リクエスト
 * 部分更新を想定
 */
export interface UpdateSubscriptionRequest {
	name?: string
	amount?: number
	billingCycle?: BillingCycle
	nextBillingDate?: string // ISO date string
	categoryId?: string | null
	description?: string | null
	isActive?: boolean
}

/**
 * サブスクリプション一覧取得リクエストパラメーター
 */
export interface GetSubscriptionsQuery {
	page?: string
	limit?: string
	isActive?: string // 'true' | 'false'
	categoryId?: string
	billingCycle?: BillingCycle
}

// =============================================================================
// データ変換用ヘルパー型
// =============================================================================

/**
 * フロントエンド→データベース変換用の型
 * CreateSubscriptionRequestをDbNewSubscriptionに変換する際の中間型
 */
export interface CreateSubscriptionDbInput {
	name: string
	amount: number
	billingCycle: BillingCycle
	nextBillingDate: Date
	categoryId: number | null
	description: string | null
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

/**
 * フロントエンド→データベース変換用の型
 * UpdateSubscriptionRequestをDB更新用に変換する際の中間型
 */
export interface UpdateSubscriptionDbInput {
	name?: string
	amount?: number
	billingCycle?: BillingCycle
	nextBillingDate?: Date
	categoryId?: number | null
	description?: string | null
	isActive?: boolean
	updatedAt: Date
}

// =============================================================================
// エラーレスポンス型
// =============================================================================

/**
 * APIエラーレスポンス
 */
export interface ApiErrorResponse {
	error: string
	details?: string
	code?: string
}

/**
 * バリデーションエラーレスポンス
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
	error: 'Validation failed'
	details: string
	fields?: Record<string, string[]>
}

// =============================================================================
// データ変換ヘルパー関数の型定義
// =============================================================================

/**
 * データベース型からAPI型への変換関数の型
 */
export type DbToApiTransformer<T, U> = (dbData: T) => U

/**
 * API型からデータベース型への変換関数の型
 */
export type ApiToDbTransformer<T, U> = (apiData: T) => U

/**
 * サブスクリプション変換関数の型
 */
export type SubscriptionDbToApiTransformer = DbToApiTransformer<
	DbSubscriptionWithCategory,
	ApiSubscription
>

export type SubscriptionApiToDbTransformer = ApiToDbTransformer<
	CreateSubscriptionRequest,
	CreateSubscriptionDbInput
>

// =============================================================================
// ビジネスロジック用型
// =============================================================================

/**
 * サブスクリプション統計情報
 * ダッシュボード等で使用
 */
export interface SubscriptionStats {
	totalActive: number
	totalInactive: number
	monthlyTotal: number
	yearlyTotal: number
	avgMonthlyAmount: number
	categoryBreakdown: Array<{
		categoryId: string
		categoryName: string
		count: number
		totalAmount: number
	}>
}

/**
 * 次回請求予定
 * 通知機能等で使用
 */
export interface UpcomingBilling {
	subscriptionId: string
	subscriptionName: string
	amount: number
	billingDate: string
	daysUntilBilling: number
}

/**
 * サブスクリプション統計レスポンス
 */
export interface ApiSubscriptionStatsResponse {
	stats: SubscriptionStats
	upcomingBillings: UpcomingBilling[]
}
