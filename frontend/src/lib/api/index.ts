/**
 * API ライブラリ メインエクスポート
 *
 * APIクライアント、設定、サービス、型定義を統一的にエクスポート
 * アプリケーション全体でのAPI利用の統一エントリーポイント
 *
 * 注意: 現在このファイルは使用されていません。
 * 実際のAPIモジュールは個別にインポートして使用してください。
 *
 * 使用例:
 * import { apiConfig } from "@/lib/api/config";
 * import { fetchCategories } from "@/lib/api/categories";
 * import type { Category } from "@/lib/api/types";
 */

// =============================================================================
// コア機能のエクスポート
// =============================================================================

// APIクライアント
export {
	addQueryParams,
	createCancelToken,
	default as apiClient,
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

export type { GetCategoriesQuery } from "./services/categories";
// カテゴリサービス
export {
	categoryService,
	checkCategoryUsage,
	createCategory,
	createDefaultCategories,
	deleteCategory,
	getCategories,
	getCategory,
	getExpenseCategories,
	getIncomeCategories,
	updateCategory,
} from "./services/categories";
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
	getIncomeTransactions,
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

// =============================================================================
// 統合API オブジェクト
// =============================================================================

import { addQueryParams, apiClient, createCancelToken } from "./client";
import { apiConfig, buildUrl, endpoints, getDebugInfo } from "./config";
import {
	ApiError,
	createApiErrorFromResponse,
	createNetworkError,
	getValidationErrors,
	handleApiError,
	isRetryableError,
	logApiError,
} from "./errors";
import { categoryService } from "./services/categories";
import { subscriptionService } from "./services/subscriptions";
import { transactionService } from "./services/transactions";

/**
 * 全てのAPIサービスを含む統合オブジェクト
 * 構造化されたAPIアクセスを提供
 */
export const api = {
	client: apiClient,
	config: apiConfig,
	endpoints,
	services: {
		subscriptions: subscriptionService,
		categories: categoryService,
		transactions: transactionService,
	},
	utils: {
		buildUrl,
		addQueryParams,
		createCancelToken,
		getDebugInfo,
	},
	errors: {
		ApiError,
		createApiErrorFromResponse,
		createNetworkError,
		handleApiError,
		isRetryableError,
		getValidationErrors,
		logApiError,
	},
} as const;

// =============================================================================
// デフォルトエクスポート
// =============================================================================

/**
 * デフォルトエクスポート
 * 統合APIオブジェクトを提供
 */
export default api;

// =============================================================================
// ヘルパー関数のエクスポート
// =============================================================================

/**
 * API初期化ヘルパー
 * アプリケーション起動時に呼び出すことで、API設定を検証
 */
export async function initializeApi(): Promise<{
	isHealthy: boolean;
	config: typeof apiConfig;
	error?: string;
}> {
	try {
		const isHealthy = await apiClient.healthCheck();
		return {
			isHealthy,
			config: apiConfig,
		};
	} catch (error) {
		const apiError = handleApiError(error, "API初期化");
		return {
			isHealthy: false,
			config: apiConfig,
			error: apiError.message,
		};
	}
}

/**
 * APIデバッグ情報を取得
 * 開発時のトラブルシューティング用
 */
export function getApiDebugInfo() {
	return {
		config: getDebugInfo(),
		endpoints: Object.entries(endpoints).map(([name, endpoint]) => ({
			name,
			endpoint:
				typeof endpoint === "object" && endpoint !== null
					? Object.entries(endpoint).map(([method, path]) => ({
							method,
							path: typeof path === "function" ? path(":id") : path,
						}))
					: endpoint,
		})),
		timestamp: new Date().toISOString(),
	};
}
