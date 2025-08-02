/**
 * API共通型定義
 *
 * フロントエンドとバックエンド間でやり取りされる
 * データ型の定義を行う
 * 共有型定義を使用して一貫性を保つ
 */

import type {
	// 基本型
	BillingCycle,
	BaseCategory as Category,
	CategoryType,
	TransactionType,
	// エンティティ型
	BaseTransaction as Transaction,
	BaseSubscription as Subscription,
	// リクエスト型
	CreateCategoryRequest,
	CreateSubscriptionRequest,
	CreateTransactionRequest,
	UpdateCategoryRequest,
	UpdateSubscriptionRequest,
	UpdateTransactionRequest,
	// レスポンス型
	DeleteResponse,
	BalanceSummaryResponse as BalanceSummary,
	StatsResponse as TransactionStats,
	ErrorResponse as ApiErrorResponse,
	ValidationError,
	// クエリ型
	GetCategoriesQuery,
	GetSubscriptionsQuery,
	GetTransactionsQuery,
	// ユーティリティ型
	HttpMethod,
	SortOrder,
	DateRange,
	PaginationInfo,
	PaginatedResponse,
	PaginationQuery,
	SortConfig,
	FilterConfig,
	SearchQuery,
	ApiResponse,
} from "@shared/types";

// 共有型定義から必要な型を再エクスポート
export type {
	TransactionType,
	CategoryType,
	BillingCycle,
	Transaction,
	Category,
	Subscription,
	CreateTransactionRequest,
	UpdateTransactionRequest,
	CreateCategoryRequest,
	UpdateCategoryRequest,
	CreateSubscriptionRequest,
	UpdateSubscriptionRequest,
	GetTransactionsQuery,
	GetCategoriesQuery,
	GetSubscriptionsQuery,
	DeleteResponse,
	BalanceSummary,
	TransactionStats,
	ApiErrorResponse,
	ValidationError,
	HttpMethod,
	SortOrder,
	DateRange,
	PaginationInfo,
	PaginatedResponse,
	PaginationQuery,
	SortConfig,
	FilterConfig,
	SearchQuery,
	ApiResponse,
};

// 型ガード関数も再エクスポート
export {
	isCategory,
	isSubscription,
	isTransaction,
	isBalanceSummaryResponse as isBalanceSummary,
	isErrorResponse,
} from "@shared/types";

// フロントエンド固有の拡張型
export type {
	SubscriptionWithCategory,
	TransactionWithCategory,
} from "./types/extended";

// =============================================================================
// フロントエンド固有の型定義
// =============================================================================

// 注意: 以下の型は共有型定義に移動済み
// - HttpMethod
// - ApiResponse
// - PaginationInfo
// - PaginatedResponse
// - PaginationQuery
// これらはshared/src/types/utility.tsから再エクスポートされています

// =============================================================================
// サブスクリプション統計
// =============================================================================

/**
 * サブスクリプション統計
 */
export interface SubscriptionStats {
	totalActive: number;
	totalInactive: number;
	monthlyTotal: number;
	yearlyTotal: number;
	avgMonthlyAmount: number;
	categoryBreakdown: Array<{
		categoryId: string;
		categoryName: string;
		count: number;
		totalAmount: number;
	}>;
}

/**
 * 次回請求予定
 */
export interface UpcomingBilling {
	subscriptionId: string;
	subscriptionName: string;
	amount: number;
	billingDate: string;
	daysUntilBilling: number;
}

/**
 * サブスクリプション統計レスポンス
 */
export interface SubscriptionStatsResponse {
	stats: SubscriptionStats;
	upcomingBillings: UpcomingBilling[];
}

// 注意: TransactionStatsとBalanceSummaryは共有型定義から使用
// これらの型はshared/src/types/api.tsに移動済み
// StatsResponse -> TransactionStats
// BalanceSummaryResponse -> BalanceSummary として再エクスポート

/**
 * 月別統計
 */
export interface MonthlyStats {
	year: number;
	month: number;
	expense: number;
	subscriptionCost: number;
}

// 注意: DateRangeは共有型定義から使用
// この型はshared/src/types/utility.tsに移動済み

// =============================================================================
// API設定関連型
// =============================================================================

/**
 * APIクライアントのオプション
 */
export interface ApiClientOptions {
	baseUrl?: string;
	timeout?: number;
	maxRetries?: number;
	retryDelay?: number;
}

/**
 * リクエストオプション
 */
export interface RequestOptions {
	method?: HttpMethod;
	headers?: Record<string, string>;
	body?: unknown;
	timeout?: number;
	signal?: AbortSignal;
}

/**
 * リトライ設定
 */
export interface RetryConfig {
	maxRetries: number;
	retryDelay: number;
	retryCondition?: (error: unknown) => boolean;
}

// =============================================================================
// エラー関連型（errors.tsと連携）
// =============================================================================

// 注意: ValidationErrorとApiErrorResponseは共有型定義から使用
// ValidationErrorはshared/src/types/api.tsに移動済み
// ErrorResponse -> ApiErrorResponse として再エクスポート

// =============================================================================
// フィルター・ソート関連型
// =============================================================================

// 注意: ソート・フィルター関連の型は共有型定義から使用
// これらの型はshared/src/types/utility.tsに移動済み

// =============================================================================
// ユーティリティ型
// =============================================================================

/**
 * 部分的な更新を表す型
 */
export type PartialUpdate<T> = Partial<
	Omit<T, "id" | "createdAt" | "updatedAt">
>;

/**
 * 作成用データ（IDと日付フィールドを除外）
 */
export type CreateData<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

/**
 * リストレスポンス
 */
export type ListResponse<T> = T[];

/**
 * 詳細レスポンス
 */
export type DetailResponse<T> = T;

// =============================================================================
// UIコンポーネント関連型（旧 types/subscription.ts から移動）
// =============================================================================

/**
 * サブスクリプションフォームデータ
 * フォーム入力時に使用する型（カテゴリはIDで管理）
 */
export interface SubscriptionFormData {
	/**
	 * サービス名
	 */
	name: string;

	/**
	 * 月額料金（円）
	 */
	amount: number;

	/**
	 * 請求サイクル
	 */
	billingCycle: BillingCycle;

	/**
	 * 次回請求日（YYYY-MM-DD形式）
	 */
	nextBillingDate: string;

	/**
	 * カテゴリID（旧フィールドとの互換性のため、APIでは categoryId を使用）
	 */
	categoryId: string;

	/**
	 * アクティブ状態
	 */
	isActive?: boolean;

	/**
	 * 説明（オプション）
	 */
	description?: string;
}

/**
 * サブスクリプション一覧表示用のプロパティ
 */
export interface SubscriptionListProps {
	/**
	 * サブスクリプションデータの配列
	 */
	subscriptions: Subscription[];

	/**
	 * ローディング状態
	 */
	isLoading?: boolean;

	/**
	 * エラー状態
	 */
	error?: string | null;

	/**
	 * データ再取得用のコールバック
	 */
	onRefresh?: () => void;

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}

/**
 * 新規登録ボタンのプロパティ
 */
export interface NewSubscriptionButtonProps {
	/**
	 * クリック時のハンドラー（現在はUIのみなので空実装）
	 */
	onClick?: () => void;

	/**
	 * ボタンの無効状態
	 */
	disabled?: boolean;

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}

/**
 * サブスクリプションフォームのプロパティ
 */
export interface SubscriptionFormProps {
	/**
	 * フォーム送信時のコールバック
	 */
	onSubmit: (data: SubscriptionFormData) => void;

	/**
	 * キャンセル時のコールバック
	 */
	onCancel: () => void;

	/**
	 * Escapeキー押下時のコールバック（オプション）
	 */
	onEscape?: () => void;

	/**
	 * 送信中の状態
	 */
	isSubmitting?: boolean;

	/**
	 * 編集用の初期データ（オプション）
	 */
	initialData?: SubscriptionFormData;

	/**
	 * カテゴリ一覧（フォームで選択肢として表示）
	 */
	categories: Category[];

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}

/**
 * 新規サブスクリプション登録ダイアログのプロパティ
 */
export interface NewSubscriptionDialogProps {
	/**
	 * ダイアログの表示状態
	 */
	isOpen: boolean;

	/**
	 * ダイアログを閉じる際のコールバック関数
	 */
	onClose: () => void;

	/**
	 * フォーム送信時のコールバック
	 * 新規サブスクリプションデータを受け取る
	 */
	onSubmit: (data: SubscriptionFormData) => void;

	/**
	 * 送信中の状態
	 */
	isSubmitting?: boolean;

	/**
	 * カテゴリ一覧（フォームで選択肢として表示）
	 * 省略時はグローバル設定のカテゴリを使用
	 */
	categories?: Category[];
}

// =============================================================================
// 型ガード・アサーション関数（Matt Pocockパターン）
// =============================================================================

/**
 * APIレスポンスの型ガード
 *
 * 設計意図: APIからのレスポンスが正しい形式かを検証
 */
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
	return (
		typeof value === "object" &&
		value !== null &&
		("data" in value || "error" in value || "message" in value)
	);
}

/**
 * ページネーション情報の型ガード
 */
export function isPaginationInfo(value: unknown): value is PaginationInfo {
	if (typeof value !== "object" || value === null) return false;

	const obj = value as Record<string, unknown>;
	return (
		typeof obj.page === "number" &&
		typeof obj.limit === "number" &&
		typeof obj.total === "number" &&
		typeof obj.totalPages === "number" &&
		typeof obj.hasNext === "boolean" &&
		typeof obj.hasPrev === "boolean"
	);
}

// 注意: BalanceSummaryの型ガードは共有型定義から使用
// isBalanceSummaryResponse -> isBalanceSummary として再エクスポート済み

/**
 * BalanceSummaryのアサーション関数
 *
 * 設計意図: 型ガードでの検証が失敗した場合に明確なエラーをスロー
 * デバッグ時にエラーの原因を特定しやすくする
 */
export function assertBalanceSummary(
	value: unknown,
): asserts value is BalanceSummary {
	if (!isBalanceSummary(value)) {
		throw new Error(`Value is not a valid BalanceSummary`);
	}
}

/**
 * 汎用的なアサーション関数ファクトリ
 *
 * 設計意図: 各型に対して統一的なアサーション関数を生成
 * @param guard 型ガード関数
 * @param typeName 型名（エラーメッセージ用）
 */
function createAssertFunction<T>(
	guard: (value: unknown) => value is T,
	typeName: string,
): (value: unknown) => asserts value is T {
	return (value: unknown): asserts value is T => {
		if (!guard(value)) {
			throw new Error(`Value is not a valid ${typeName}`);
		}
	};
}

export const assertPaginationInfo = createAssertFunction(
	isPaginationInfo,
	"PaginationInfo",
);

// =============================================================================
// レポート関連型の再エクスポート
// =============================================================================

export type {
	CategoryBreakdown,
	CategoryDetail,
	CategorySummary,
	ExportFormat,
	ExportParams,
	MonthlyReport,
	ReportParams,
	ReportPeriod,
} from "./types/reports";
