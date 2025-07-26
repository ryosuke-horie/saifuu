/**
 * API ライブラリ メインエクスポート
 *
 * APIクライアント、設定、サービス、型定義を統一的にエクスポート
 * アプリケーション全体でのAPI利用の統一エントリーポイント
 */

// =============================================================================
// コア機能のエクスポート
// =============================================================================

// APIクライアント
export {
	addQueryParams,
	apiClient,
	createCancelToken,
} from "./client";
export type { ApiConfig, Environment } from "./config";
// 設定とエンドポイント
export { apiConfig, buildUrl, endpoints, getDebugInfo } from "./config";
export type { ApiErrorType } from "./errors";
// エラーハンドリング
export {
	ApiError,
	createApiErrorFromResponse,
	createNetworkError,
	getValidationErrors,
	handleApiError,
	isRetryableError,
	logApiError,
} from "./errors";

// =============================================================================
// 型定義のエクスポート
// =============================================================================

export type {
	ApiErrorResponse,
	ApiResponse,
	BillingCycle,
	// エンティティ型
	Category,
	CategoryType,
	// リクエスト型
	CreateCategoryRequest,
	CreateData,
	CreateSubscriptionRequest,
	CreateTransactionRequest,
	DateRange,
	DeleteResponse,
	DetailResponse,
	FilterConfig,
	// クエリ型
	GetSubscriptionsQuery,
	GetTransactionsQuery,
	// HTTP関連
	HttpMethod,
	ListResponse,
	MonthlyStats,
	PaginatedResponse,
	// ページネーション
	PaginationInfo,
	PaginationQuery,
	PartialUpdate,
	RequestOptions,
	RetryConfig,
	SearchQuery,
	SortConfig,
	// ユーティリティ型
	SortOrder,
	Subscription,
	// 統計・集計型
	SubscriptionStats,
	SubscriptionStatsResponse,
	Transaction,
	TransactionStats,
	TransactionType,
	UpcomingBilling,
	UpdateCategoryRequest,
	UpdateSubscriptionRequest,
	UpdateTransactionRequest,
	// エラー型
	ValidationError,
} from "./types";

// =============================================================================
// サービス層のエクスポート
// =============================================================================

// サブスクリプションサービス
export {
	createSubscription,
	deleteSubscription,
	getActiveSubscriptions,
	getInactiveSubscriptions,
	getSubscription,
	getSubscriptionStats,
	getSubscriptions,
	getSubscriptionsByBillingCycle,
	getSubscriptionsByCategory,
	subscriptionService,
	toggleSubscriptionStatus,
	updateSubscription,
} from "./services/subscriptions";
// 取引サービス
export {
	createTransaction,
	createTransactionsBatch,
	deleteTransaction,
	deleteTransactionsBatch,
	getCurrentMonthTransactions,
	getCurrentYearTransactions,
	getExpenseTransactions,
	// getIncomeTransactions は廃止されました
	getLargeTransactions,
	getLastMonthTransactions,
	getMonthlyStats,
	getRecentTransactions,
	getTransaction,
	getTransactionStats,
	getTransactions,
	getTransactionsByCategory,
	getTransactionsByDateRange,
	transactionService,
	updateTransaction,
} from "./services/transactions";
