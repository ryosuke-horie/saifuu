/**
 * API型定義のメインエクスポート
 *
 * 各機能の型定義を統合してエクスポート
 */

// サブスクリプション関連の型定義
export type {
	// API型
	ApiCategory,
	// エラー型
	ApiErrorResponse,
	ApiSubscription,
	ApiSubscriptionDetailResponse,
	ApiSubscriptionListResponse,
	ApiSubscriptionStatsResponse,
	ApiToDbTransformer,
	// 基本型
	BillingCycle,
	// 変換用型
	CreateSubscriptionDbInput,
	// リクエスト型
	CreateSubscriptionRequest,
	DbNewSubscription,
	// データベース型
	DbSubscription,
	DbSubscriptionWithCategory,
	// 変換関数型
	DbToApiTransformer,
	GetSubscriptionsQuery,
	SubscriptionApiToDbTransformer,
	SubscriptionDbToApiTransformer,
	// ビジネスロジック型
	SubscriptionStats,
	SubscriptionStatus,
	UpcomingBilling,
	UpdateSubscriptionDbInput,
	UpdateSubscriptionRequest,
	ValidationErrorResponse,
} from './subscription'

// サブスクリプションユーティリティ関数
export {
	parseBooleanQueryParam,
	// パーサー関数
	parseIdParam,
	parseNumberQueryParam,
	parseQueryParam,
	// 変換関数
	transformCategoryDbToApi,
	transformCreateSubscriptionApiToDb,
	transformSubscriptionDbToApi,
	transformUpdateSubscriptionApiToDb,
	// バリデーション関数
	validateCreateSubscriptionRequest,
	validateUpdateSubscriptionRequest,
} from './subscription-utils'

// 将来の拡張のためのコメント
// TODO: 取引（transactions）関連の型定義を追加
// TODO: カテゴリ関連の型定義を整理・統合
// TODO: 共通エラーハンドリング型の追加
