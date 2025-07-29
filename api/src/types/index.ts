/**
 * API型定義統合エクスポート
 * すべての型定義を階層的に整理してエクスポート
 */

// 共通型定義
export * from './common'
export * from './common/category'
export type { ErrorResponse, ValidationErrorResponse } from './common/errors'
export * from './common/errors'
export type { Subscription as ApiSubscription } from './subscription'
// サブスクリプション関連
export * from './subscription'
export * from './subscription/requests'
export type {
	SubscriptionDetailResponse as ApiSubscriptionDetailResponse,
	SubscriptionListResponse as ApiSubscriptionListResponse,
	SubscriptionStatsResponse as ApiSubscriptionStatsResponse,
} from './subscription/responses'
export * from './subscription/responses'
export {
	addCategoryInfoToSubscription,
	addCategoryInfoToSubscriptions,
	calculateNextBillingDate,
	parseSubscriptionQueryParams,
	transformCreateRequestToDb as transformCreateSubscriptionRequestToDb,
	transformDbSubscriptionToApi,
	transformUpdateRequestToDb as transformUpdateSubscriptionRequestToDb,
} from './subscription/utils'
// 便利なエイリアス（後方互換性のため）
export type { Transaction as TransactionResponse } from './transaction'
// 取引関連
export * from './transaction'
export * from './transaction/requests'
export type {
	TransactionListResponse as TransactionsResponse,
	TransactionStatsResponse as StatsResponse,
} from './transaction/responses'
export * from './transaction/responses'
export {
	addCategoryInfoToTransaction,
	addCategoryInfoToTransactions,
	parseTransactionQueryParams,
	transformCreateRequestToDb as transformCreateTransactionRequestToDb,
	transformDbTransactionToApi,
	transformUpdateRequestToDb as transformUpdateTransactionRequestToDb,
} from './transaction/utils'
