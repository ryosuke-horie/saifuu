/**
 * API共通型定義
 *
 * フロントエンドとバックエンド間でやり取りされる
 * データ型の定義を行う
 */

// =============================================================================
// 基本型定義
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

// =============================================================================
// カテゴリ関連型
// =============================================================================

/**
 * カテゴリタイプ
 */
export type CategoryType = "income" | "expense";

/**
 * カテゴリ
 */
export interface Category {
	id: string;
	name: string;
	type: CategoryType;
	color: string | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * カテゴリ作成リクエスト
 */
export interface CreateCategoryRequest {
	name: string;
	type: CategoryType;
	color?: string | null;
}

/**
 * カテゴリ更新リクエスト
 */
export interface UpdateCategoryRequest {
	name?: string;
	type?: CategoryType;
	color?: string | null;
}

// =============================================================================
// サブスクリプション関連型
// =============================================================================

/**
 * 請求サイクル
 */
export type BillingCycle = "monthly" | "yearly" | "weekly";

/**
 * サブスクリプション
 */
export interface Subscription {
	id: string;
	name: string;
	amount: number;
	billingCycle: BillingCycle;
	nextBillingDate: string;
	description: string | null;
	isActive: boolean;
	category: Category | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * サブスクリプション作成リクエスト
 */
export interface CreateSubscriptionRequest {
	name: string;
	amount: number;
	billingCycle: BillingCycle;
	nextBillingDate: string;
	categoryId?: string | null;
	description?: string | null;
	isActive?: boolean;
}

/**
 * サブスクリプション更新リクエスト
 */
export interface UpdateSubscriptionRequest {
	name?: string;
	amount?: number;
	billingCycle?: BillingCycle;
	nextBillingDate?: string;
	categoryId?: string | null;
	description?: string | null;
	isActive?: boolean;
}

/**
 * サブスクリプション一覧取得クエリ
 */
export interface GetSubscriptionsQuery extends PaginationQuery {
	isActive?: boolean;
	categoryId?: string;
	billingCycle?: BillingCycle;
}

// =============================================================================
// 取引関連型
// =============================================================================

/**
 * 取引タイプ
 */
export type TransactionType = "income" | "expense";

/**
 * 取引
 */
export interface Transaction {
	id: string;
	amount: number;
	type: TransactionType;
	description: string | null;
	date: string;
	category: Category | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * 取引作成リクエスト
 */
export interface CreateTransactionRequest {
	amount: number;
	type: TransactionType;
	description?: string | null;
	date: string;
	categoryId?: string | null;
}

/**
 * 取引更新リクエスト
 */
export interface UpdateTransactionRequest {
	amount?: number;
	type?: TransactionType;
	description?: string | null;
	date?: string;
	categoryId?: string | null;
}

/**
 * 取引一覧取得クエリ
 */
export interface GetTransactionsQuery extends PaginationQuery {
	type?: TransactionType;
	categoryId?: string;
	dateFrom?: string;
	dateTo?: string;
}

// =============================================================================
// 統計・集計関連型
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
	totalIncome: number;
	totalExpense: number;
	netAmount: number;
	transactionCount: number;
	avgTransaction: number;
	categoryBreakdown: Array<{
		categoryId: string;
		categoryName: string;
		type: TransactionType;
		count: number;
		totalAmount: number;
	}>;
}

/**
 * 月別統計
 */
export interface MonthlyStats {
	year: number;
	month: number;
	income: number;
	expense: number;
	net: number;
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

/**
 * 削除レスポンス
 */
export interface DeleteResponse {
	message: string;
	deletedId: string;
}
