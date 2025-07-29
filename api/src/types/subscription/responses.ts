/**
 * サブスクリプションAPIレスポンス型定義
 * APIから返却されるレスポンスの型定義
 */

import type { PaginatedResponse } from '../common'
import type { Subscription, SubscriptionStats, UpcomingBilling } from './index'

// サブスクリプション一覧レスポンス
export interface SubscriptionListResponse extends PaginatedResponse<Subscription> {}

// サブスクリプション詳細レスポンス
export interface SubscriptionDetailResponse {
	subscription: Subscription
}

// サブスクリプション作成・更新レスポンス
export interface SubscriptionMutationResponse {
	subscription: Subscription
	message?: string
}

// サブスクリプション削除レスポンス
export interface SubscriptionDeleteResponse {
	success: true
	message: string
}

// サブスクリプション統計レスポンス
export interface SubscriptionStatsResponse {
	stats: SubscriptionStats
	upcomingBillings?: UpcomingBilling[]
}

// 請求予定レスポンス
export interface UpcomingBillingsResponse {
	billings: UpcomingBilling[]
	totalAmount: number
	period: {
		startDate: string
		endDate: string
	}
}
