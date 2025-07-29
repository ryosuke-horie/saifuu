/**
 * エラーレスポンス型定義
 * API全体で統一されたエラー形式を定義
 */

// エラーコード定義
export const ErrorCodes = {
	// 4xx クライアントエラー
	BAD_REQUEST: 'BAD_REQUEST',
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	NOT_FOUND: 'NOT_FOUND',
	VALIDATION_ERROR: 'VALIDATION_ERROR',

	// 5xx サーバーエラー
	INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
	SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
	DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// バリデーションエラーの詳細
export interface ValidationErrorDetail {
	field: string
	message: string
	code?: string
}

// 基本エラーレスポンス
export interface ErrorResponse {
	error: string
	code?: ErrorCode
	details?: unknown
}

// バリデーションエラーレスポンス
export interface ValidationErrorResponse extends ErrorResponse {
	code: typeof ErrorCodes.VALIDATION_ERROR
	details: ValidationErrorDetail[]
}

// 型ガード関数
export function isErrorResponse(value: unknown): value is ErrorResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'error' in value &&
		typeof (value as ErrorResponse).error === 'string'
	)
}

export function isValidationErrorResponse(value: unknown): value is ValidationErrorResponse {
	return (
		isErrorResponse(value) &&
		value.code === ErrorCodes.VALIDATION_ERROR &&
		Array.isArray(value.details) &&
		value.details.every(
			(detail) =>
				typeof detail === 'object' &&
				detail !== null &&
				'field' in detail &&
				'message' in detail &&
				typeof detail.field === 'string' &&
				typeof detail.message === 'string'
		)
	)
}

// エラーレスポンス作成ヘルパー
export function createErrorResponse(
	message: string,
	code?: ErrorCode,
	details?: unknown
): ErrorResponse {
	const response: ErrorResponse = { error: message }
	if (code) response.code = code
	if (details !== undefined) response.details = details
	return response
}

export function createValidationErrorResponse(
	message: string,
	details: ValidationErrorDetail[]
): ValidationErrorResponse {
	return {
		error: message,
		code: ErrorCodes.VALIDATION_ERROR,
		details,
	}
}
