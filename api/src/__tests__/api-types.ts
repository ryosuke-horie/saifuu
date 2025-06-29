/**
 * API レスポンス型定義
 * テストで使用するAPIレスポンスの型を定義し、'as any'の使用を回避
 */

/**
 * ヘルスチェックAPIのレスポンス型
 */
export interface HealthCheckResponse {
	status: 'ok' | 'error'
	database: 'connected' | 'disconnected'
	timestamp: string
}

/**
 * カテゴリAPIのレスポンス型
 * データベースから取得されるカテゴリデータの型
 */
export interface CategoryResponse {
	id: number
	name: string
	type: 'income' | 'expense'
	color: string | null
	createdAt: number // timestamp
	updatedAt: number // timestamp
}

/**
 * カテゴリ一覧APIのレスポンス型
 */
export type CategoriesListResponse = CategoryResponse[]

/**
 * エラーレスポンスの共通型
 */
export interface ErrorResponse {
	error: string
	message?: string
}

/**
 * 成功メッセージレスポンスの型
 */
export interface SuccessMessageResponse {
	message: string
}

/**
 * D1データベースクエリ結果の型
 */
export interface D1QueryResult<T = unknown> {
	success: boolean
	results: T[]
	meta?: {
		duration: number
		rows_read: number
		rows_written: number
	}
}

/**
 * SQLiteマスターテーブルの型
 */
export interface SqliteMaster {
	type: 'table' | 'index' | 'view' | 'trigger'
	name: string
	tbl_name: string
	rootpage: number
	sql: string
}

/**
 * テスト環境で使用するレスポンス型のユニオン
 */
export type ApiResponse =
	| HealthCheckResponse
	| CategoryResponse
	| CategoriesListResponse
	| ErrorResponse
	| SuccessMessageResponse

/**
 * JSONレスポンスの型ガード関数
 */
export function isHealthCheckResponse(data: unknown): data is HealthCheckResponse {
	return (
		typeof data === 'object' &&
		data !== null &&
		'status' in data &&
		'database' in data &&
		'timestamp' in data
	)
}

export function isCategoryResponse(data: unknown): data is CategoryResponse {
	return (
		typeof data === 'object' &&
		data !== null &&
		'id' in data &&
		'name' in data &&
		'type' in data &&
		'createdAt' in data &&
		'updatedAt' in data
	)
}

export function isCategoriesListResponse(data: unknown): data is CategoriesListResponse {
	return Array.isArray(data) && (data.length === 0 || isCategoryResponse(data[0]))
}

export function isErrorResponse(data: unknown): data is ErrorResponse {
	return typeof data === 'object' && data !== null && 'error' in data
}

export function isSuccessMessageResponse(data: unknown): data is SuccessMessageResponse {
	return typeof data === 'object' && data !== null && 'message' in data
}
