/**
 * サービス層の結果型定義
 * discriminated unionパターンを使用して型安全性を確保
 */

import type { ValidationError } from '../validation/zod-validators'

/**
 * 成功結果の基本型
 */
export type SuccessResult<T> = {
	success: true
	data: T
}

/**
 * エラー結果の基本型
 */
export type ErrorResult = {
	success: false
	error: ErrorType
	message: string
	details?: unknown
}

/**
 * エラータイプの定義
 */
export type ErrorType =
	| 'VALIDATION_ERROR'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'DATABASE_ERROR'
	| 'UNKNOWN_ERROR'

/**
 * バリデーションエラー結果
 */
export type ValidationErrorResult = {
	success: false
	error: 'VALIDATION_ERROR'
	message: string
	details: ValidationError[]
}

/**
 * Not Foundエラー結果
 */
export type NotFoundErrorResult = {
	success: false
	error: 'NOT_FOUND'
	message: string
	details?: {
		resourceType: string
		resourceId: number | string
	}
}

/**
 * 競合エラー結果
 */
export type ConflictErrorResult = {
	success: false
	error: 'CONFLICT'
	message: string
	details?: {
		conflictField: string
		conflictValue: unknown
	}
}

/**
 * データベースエラー結果
 */
export type DatabaseErrorResult = {
	success: false
	error: 'DATABASE_ERROR'
	message: string
	details?: {
		operation: string
		originalError?: string
	}
}

/**
 * 汎用的なサービス結果型
 */
export type ServiceResult<T> = SuccessResult<T> | ErrorResult

/**
 * 取引サービスの結果型
 */
export type TransactionServiceResult<T> =
	| SuccessResult<T>
	| ValidationErrorResult
	| NotFoundErrorResult
	| DatabaseErrorResult

/**
 * 結果型のヘルパー関数
 */
export const ServiceResults = {
	success<T>(data: T): SuccessResult<T> {
		return { success: true, data }
	},

	validationError(message: string, errors: ValidationError[]): ValidationErrorResult {
		return {
			success: false,
			error: 'VALIDATION_ERROR',
			message,
			details: errors,
		}
	},

	notFound(resourceType: string, resourceId: number | string): NotFoundErrorResult {
		return {
			success: false,
			error: 'NOT_FOUND',
			message: `${resourceType}が見つかりません`,
			details: { resourceType, resourceId },
		}
	},

	conflict(message: string, conflictField: string, conflictValue: unknown): ConflictErrorResult {
		return {
			success: false,
			error: 'CONFLICT',
			message,
			details: { conflictField, conflictValue },
		}
	},

	databaseError(message: string, operation: string, originalError?: unknown): DatabaseErrorResult {
		return {
			success: false,
			error: 'DATABASE_ERROR',
			message,
			details: {
				operation,
				originalError:
					originalError instanceof Error ? originalError.message : String(originalError),
			},
		}
	},
} as const

/**
 * 型ガード関数
 */
export const isSuccessResult = <T>(result: ServiceResult<T>): result is SuccessResult<T> => {
	return result.success === true
}

export const isValidationError = (
	result: ServiceResult<unknown>
): result is ValidationErrorResult => {
	return !result.success && result.error === 'VALIDATION_ERROR'
}

export const isNotFoundError = (result: ServiceResult<unknown>): result is NotFoundErrorResult => {
	return !result.success && result.error === 'NOT_FOUND'
}

export const isDatabaseError = (result: ServiceResult<unknown>): result is DatabaseErrorResult => {
	return !result.success && result.error === 'DATABASE_ERROR'
}
