/**
 * 共通基本型定義
 * Matt Pocockの型定義方針に従い、型安全性を確保
 */

// ブランド型の定義用ユーティリティ
declare const brand: unique symbol
type Brand<T, B> = T & { [brand]: B }

// 基本型定義
export type ISODateString = Brand<string, 'ISODateString'>
export type EntityId<T extends string> = Brand<string, T>
export type NumericEntityId<T extends string> = Brand<number, T>

// ページネーション関連
export interface PaginationParams {
	page?: number
	limit?: number
}

export interface PaginatedResponse<T> {
	data: T[]
	total: number
	page: number
	limit: number
	totalPages: number
}

// タイムスタンプ
export interface Timestamps {
	createdAt: ISODateString
	updatedAt: ISODateString
}

// 基本的なエンティティ型
export interface BaseEntity extends Timestamps {
	id: EntityId<'BaseEntity'>
}

// 型ガード関数
export function isISODateString(value: unknown): value is ISODateString {
	if (typeof value !== 'string') return false
	const date = new Date(value)
	return !Number.isNaN(date.getTime()) && date.toISOString() === value
}

export function isEntityId<T extends string>(value: unknown): value is EntityId<T> {
	return typeof value === 'string' && value.length > 0
}

export function isNumericEntityId<T extends string>(value: unknown): value is NumericEntityId<T> {
	return typeof value === 'number' && value > 0 && Number.isInteger(value)
}

// ユーティリティ型
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type NullableOptional<T> = T | null | undefined

// APIレスポンスの基本構造
export interface ApiSuccessResponse<T> {
	success: true
	data: T
}

export interface ApiErrorResponse {
	success: false
	error: ApiError
}

export interface ApiError {
	message: string
	code?: string
	details?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// 型変換ヘルパー
export function toISODateString(date: Date): ISODateString {
	return date.toISOString() as ISODateString
}

export function fromISODateString(dateString: ISODateString): Date {
	return new Date(dateString)
}
