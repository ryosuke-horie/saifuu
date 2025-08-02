// ユーティリティ型定義
// フロントエンドとAPI間で共通して使用される汎用的な型

// HTTPメソッド
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// ソート順序
export type SortOrder = 'asc' | 'desc'

// 日付範囲指定
export interface DateRange {
	from: string // YYYY-MM-DD format
	to: string // YYYY-MM-DD format
}

// ページネーション情報
export interface PaginationInfo {
	page: number
	limit: number
	total: number
	totalPages: number
	hasNext: boolean
	hasPrev: boolean
}

// ページネーション付きレスポンス
export interface PaginatedResponse<T> {
	data: T[]
	pagination: PaginationInfo
}

// ページネーションクエリパラメーター
export interface PaginationQuery {
	page?: number
	limit?: number
}

// ソート設定
export interface SortConfig<T = string> {
	field: T
	order: SortOrder
}

// フィルター設定
export interface FilterConfig {
	[key: string]: unknown
}

// 検索・フィルター・ソート付きクエリ
export interface SearchQuery extends PaginationQuery {
	search?: string
	filters?: FilterConfig
	sort?: SortConfig
}

// APIレスポンスの基本構造
export interface ApiResponse<T = unknown> {
	data?: T
	error?: string
	message?: string
}