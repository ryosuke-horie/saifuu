// Zodスキーマを使用したバリデーション関数

// ValidationResultとValidationErrorの型定義
export interface ValidationError {
	field: string
	message: string
	code?: string
}

export type ValidationResult<T> =
	| { success: true; data: T }
	| { success: false; errors: ValidationError[] }

import {
	idSchema,
	subscriptionCreateSchema,
	subscriptionUpdateSchema,
	transactionCreateSchema,
	transactionUpdateSchema,
	zodToValidationResult,
} from '../../../shared/src/validation/zod-schemas'
import type { NewSubscription, NewTransaction } from '../db/schema'

// 取引作成データのバリデーション（Zodバージョン）
export function validateTransactionCreateWithZod(
	data: Partial<NewTransaction>
): ValidationResult<NewTransaction> {
	const result = transactionCreateSchema.safeParse(data)
	return zodToValidationResult(result, data) as ValidationResult<NewTransaction>
}

// 取引更新データのバリデーション（Zodバージョン）
export function validateTransactionUpdateWithZod(
	data: Partial<NewTransaction>
): ValidationResult<Partial<NewTransaction>> {
	const result = transactionUpdateSchema.safeParse(data)
	return zodToValidationResult(result, data)
}

// サブスクリプション作成データのバリデーション（Zodバージョン）
export function validateSubscriptionCreateWithZod(
	data: unknown
): ValidationResult<NewSubscription> {
	const result = subscriptionCreateSchema.safeParse(data)
	return zodToValidationResult(result, data) as ValidationResult<NewSubscription>
}

// サブスクリプション更新データのバリデーション（Zodバージョン）
export function validateSubscriptionUpdateWithZod(
	data: unknown
): ValidationResult<Partial<NewSubscription>> {
	const result = subscriptionUpdateSchema.safeParse(data)
	return zodToValidationResult(result, data)
}

// ID検証ヘルパー関数（Zodバージョン）
export function validateIdWithZod(id: unknown): ValidationResult<number> {
	// 文字列の場合は数値に変換を試みる
	const numericId = typeof id === 'string' ? Number.parseInt(id, 10) : id

	const result = idSchema.safeParse(numericId)
	return zodToValidationResult(result, numericId)
}
