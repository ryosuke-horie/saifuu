/**
 * API共通型定義
 *
 * フロントエンドとバックエンド間でやり取りされる
 * データ型の定義を行う
 * 共有型定義を使用して一貫性を保つ
 */

import type {
	BillingCycle,
	CategoryType,
	CreateCategoryRequest,
	CreateSubscriptionRequest,
	// リクエスト型
	CreateTransactionRequest,
	// レスポンス型
	DeleteResponse,
	GetCategoriesQuery,
	GetSubscriptionsQuery,
	// クエリ型
	GetTransactionsQuery,
	BaseSubscription as Subscription,
	// エンティティ型
	BaseTransaction as Transaction,
	// 基本型
	TransactionType,
	UpdateCategoryRequest,
	UpdateSubscriptionRequest,
	UpdateTransactionRequest,
} from "@shared/types";

// 共有型定義から必要な型を再エクスポート
export type {
	TransactionType,
	CategoryType,
	BillingCycle,
	Transaction,
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
};

// 型ガード関数も再エクスポート
export {
	isCategory,
	isSubscription,
	isTransaction,
} from "@shared/types";

// フロントエンド固有の拡張型
// Category型を先にインポート（他の型定義で使用するため）
import type { Category } from "./types/extended";

export type {
	Category,
	SubscriptionWithCategory,
	TransactionWithCategory,
} from "./types/extended";

// =============================================================================
// フロントエンド固有の型定義
// =============================================================================

/**
 * APIリクエストのHTTPメソッド
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * APIレスポンスの基本構造
 */
export interface ApiResponse<T = unknown> {
	data?: T;
	error?: string;
	message?: string;
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

/**
 * ページネーションレスポンス（簡易版）
 * APIテストで使用する型定義
 */
export interface PaginationResponse {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
	data: T[];
	pagination: PaginationInfo;
}

/**
 * ページネーションクエリパラメーター
 */
export interface PaginationQuery {
	page?: number;
	limit?: number;
}

/**
 * ページネーションパラメータ（完全版）
 * API呼び出し時に使用する型定義
 */
export interface PaginationParams {
	page: number;
	limit: number;
	sort?: "date" | "amount";
	order?: "asc" | "desc";
}

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

/**
 * 取引統計
 */
export interface TransactionStats {
	totalExpense: number;
	totalIncome: number;
	balance: number;
	transactionCount: number;
	expenseCount: number;
	incomeCount: number;
	avgTransaction?: number;
	categoryBreakdown?: Array<{
		categoryId: string;
		categoryName: string;
		type: TransactionType;
		count: number;
		totalAmount: number;
	}>;
}

/**
 * 収支サマリー
 */
export interface BalanceSummary {
	income: number;
	expense: number;
	balance: number;
	savingsRate: number;
	trend: "positive" | "negative" | "neutral";
}

/**
 * 月別統計
 */
export interface MonthlyStats {
	year: number;
	month: number;
	expense: number;
	subscriptionCost: number;
}

/**
 * 日付範囲指定
 */
export interface DateRange {
	from: string; // YYYY-MM-DD format
	to: string; // YYYY-MM-DD format
}

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

/**
 * バリデーションエラーの詳細
 */
export interface ValidationError {
	field: string;
	message: string;
	code?: string;
}

/**
 * API エラーレスポンス
 */
export interface ApiErrorResponse {
	error: string;
	details?: string;
	code?: string;
	fields?: Record<string, string[]>;
}

// =============================================================================
// フィルター・ソート関連型
// =============================================================================

/**
 * ソート順序
 */
export type SortOrder = "asc" | "desc";

/**
 * ソート設定
 */
export interface SortConfig<T = string> {
	field: T;
	order: SortOrder;
}

/**
 * フィルター設定
 */
export interface FilterConfig {
	[key: string]: unknown;
}

/**
 * 検索・フィルター・ソート付きクエリ
 */
export interface SearchQuery extends PaginationQuery {
	search?: string;
	filters?: FilterConfig;
	sort?: SortConfig;
}

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

/**
 * BalanceSummaryの型ガード
 *
 * 設計意図: Matt Pocockのパターンに従い、ランタイムでの型安全性を保証
 * APIレスポンスの検証に使用し、不正なデータを早期に検出
 */
export function isBalanceSummary(value: unknown): value is BalanceSummary {
	return (
		typeof value === "object" &&
		value !== null &&
		"income" in value &&
		"expense" in value &&
		"balance" in value &&
		"savingsRate" in value &&
		"trend" in value &&
		typeof (value as BalanceSummary).income === "number" &&
		typeof (value as BalanceSummary).expense === "number" &&
		typeof (value as BalanceSummary).balance === "number" &&
		typeof (value as BalanceSummary).savingsRate === "number" &&
		isBalanceTrend((value as BalanceSummary).trend)
	);
}

/**
 * BalanceSummaryのtrendフィールドの型ガード
 */
function isBalanceTrend(value: unknown): value is BalanceSummary["trend"] {
	return value === "positive" || value === "negative" || value === "neutral";
}

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
		const details = analyzeBalanceSummaryError(value);
		throw new Error(`Value is not a valid BalanceSummary: ${details}`);
	}
}

/**
 * BalanceSummary検証エラーの詳細分析
 *
 * 設計意図: どのフィールドが不正かを特定し、デバッグを容易にする
 */
function analyzeBalanceSummaryError(value: unknown): string {
	if (typeof value !== "object" || value === null) {
		return `expected object, got ${typeof value}`;
	}

	const obj = value as Record<string, unknown>;
	const errors: string[] = [];

	// 必須フィールドのチェック
	const requiredFields = [
		"income",
		"expense",
		"balance",
		"savingsRate",
		"trend",
	] as const;
	for (const field of requiredFields) {
		if (!(field in obj)) {
			errors.push(`missing field: ${field}`);
			continue;
		}

		// 数値フィールドの検証
		if (field !== "trend" && typeof obj[field] !== "number") {
			errors.push(`${field} must be number, got ${typeof obj[field]}`);
		}
	}

	// trendフィールドの検証
	if ("trend" in obj && !isBalanceTrend(obj.trend)) {
		errors.push(
			`trend must be 'positive', 'negative', or 'neutral', got ${obj.trend}`,
		);
	}

	return errors.length > 0 ? errors.join(", ") : "unknown validation error";
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
