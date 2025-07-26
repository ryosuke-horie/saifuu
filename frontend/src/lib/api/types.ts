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
export type CategoryType = "expense" | "income";

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
export type TransactionType = "expense" | "income";

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
	totalExpense: number;
	transactionCount: number;
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

/**
 * 削除レスポンス
 */
export interface DeleteResponse {
	message: string;
	deletedId: string;
}

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
