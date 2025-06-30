/**
 * グローバルAPI型定義
 *
 * アプリケーション全体で使用されるAPI関連の型定義を提供
 * lib/api/types.ts から必要な型をre-exportし、
 * プロジェクト固有の追加型定義も含む
 */

// APIクライアントをre-export
export {
	addQueryParams,
	apiClient as default,
	createCancelToken,
} from "../lib/api/client";
export type { ApiConfig, Environment } from "../lib/api/config";
// 設定関連をre-export
export {
	apiConfig,
	buildUrl,
	endpoints,
	getDebugInfo,
} from "../lib/api/config";
export type { ApiErrorType } from "../lib/api/errors";
// APIエラー関連をre-export
export { ApiError } from "../lib/api/errors";
// 基本的なAPI型をre-export
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
} from "../lib/api/types";

// =============================================================================
// プロジェクト固有の追加型定義
// =============================================================================

import type { ApiError as BaseApiError } from "../lib/api/errors";
// 基本的な型をインポート
import type {
	Category as BaseCategory,
	MonthlyStats as BaseMonthlyStats,
	Subscription as BaseSubscription,
	SubscriptionStats as BaseSubscriptionStats,
	Transaction as BaseTransaction,
	TransactionStats as BaseTransactionStats,
	TransactionType as BaseTransactionType,
	UpcomingBilling as BaseUpcomingBilling,
	DateRange,
} from "../lib/api/types";

/**
 * アプリケーション状態管理用のローディング状態
 */
export interface LoadingState {
	isLoading: boolean;
	error: string | null;
}

/**
 * リスト表示用の共通プロパティ
 */
export interface ListViewProps<T> extends LoadingState {
	items: T[];
	onRefresh?: () => void;
	onLoadMore?: () => void;
	hasMore?: boolean;
}

/**
 * フォーム送信用の共通プロパティ
 */
export interface FormSubmissionState {
	isSubmitting: boolean;
	error: string | null;
	success: boolean;
}

/**
 * 検索・フィルター機能用の状態
 */
export interface SearchState {
	query: string;
	filters: Record<string, unknown>;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

/**
 * ダッシュボード用の統合データ型
 */
export interface DashboardData {
	subscriptions: {
		list: BaseSubscription[];
		stats: BaseSubscriptionStats;
		upcomingBillings: BaseUpcomingBilling[];
	};
	transactions: {
		recent: BaseTransaction[];
		stats: BaseTransactionStats;
		monthlyStats: BaseMonthlyStats[];
	};
	categories: BaseCategory[];
}

/**
 * サブスクリプション管理用の拡張プロパティ
 */
export interface SubscriptionWithActions extends BaseSubscription {
	/** 次回請求までの日数 */
	daysUntilBilling: number;
	/** 月額換算金額 */
	monthlyEquivalent: number;
	/** 年額換算金額 */
	yearlyEquivalent: number;
	/** カテゴリが設定されているかどうか */
	hasCategory: boolean;
}

/**
 * 取引管理用の拡張プロパティ
 */
export interface TransactionWithActions extends BaseTransaction {
	/** 相対日付表示（例: "3日前", "今日"） */
	relativeDate: string;
	/** 金額の表示形式（プラス・マイナス付き） */
	displayAmount: string;
	/** カテゴリが設定されているかどうか */
	hasCategory: boolean;
}

/**
 * カテゴリ統計情報
 */
export interface CategoryWithStats extends BaseCategory {
	/** このカテゴリに属する取引数 */
	transactionCount: number;
	/** このカテゴリの取引合計金額 */
	totalAmount: number;
	/** このカテゴリに属するサブスクリプション数 */
	subscriptionCount: number;
	/** 最後に使用された日時 */
	lastUsed: string | null;
}

// DateRangeは既にapi/typesからインポートしているため、重複定義を削除

/**
 * 期間別統計のフィルター
 */
export interface PeriodFilter {
	period: "day" | "week" | "month" | "year";
	range?: DateRange;
	categoryId?: string;
	type?: BaseTransactionType;
}

/**
 * 通知設定
 */
export interface NotificationSettings {
	/** サブスクリプション請求日の通知 */
	upcomingBillings: {
		enabled: boolean;
		daysAhead: number; // 何日前に通知するか
	};
	/** 予算超過の通知 */
	budgetExceeded: {
		enabled: boolean;
		threshold: number; // 閾値（円）
	};
	/** 大きな取引の通知 */
	largeTransactions: {
		enabled: boolean;
		threshold: number; // 閾値（円）
	};
}

/**
 * ユーザー設定
 */
export interface UserSettings {
	/** 表示設定 */
	display: {
		currency: string; // 通貨記号
		dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
		theme: "light" | "dark" | "auto";
	};
	/** 通知設定 */
	notifications: NotificationSettings;
	/** デフォルト値 */
	defaults: {
		transactionCategory?: string;
		subscriptionCategory?: string;
	};
}

/**
 * データエクスポート設定
 */
export interface ExportOptions {
	format: "csv" | "json" | "xlsx";
	dateRange?: DateRange;
	categories?: string[];
	includeSubscriptions?: boolean;
	includeTransactions?: boolean;
}

/**
 * インポート設定
 */
export interface ImportOptions {
	format: "csv" | "json";
	mapping: Record<string, string>; // CSVカラム名とフィールド名のマッピング
	skipFirstRow: boolean; // ヘッダー行をスキップするか
	categoryMapping?: Record<string, string>; // カテゴリ名のマッピング
}

/**
 * API呼び出し時の共通オプション
 */
export interface ApiCallOptions {
	showLoading?: boolean;
	showSuccess?: boolean;
	showError?: boolean;
	successMessage?: string;
	errorMessage?: string;
	onSuccess?: () => void;
	onError?: (error: BaseApiError) => void;
}
