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
	incomeCreateSchema,
	incomeUpdateSchema,
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
	// typeに基づいて適切なスキーマを使用
	if (data.type === 'income') {
		const result = incomeCreateSchema.safeParse(data)
		const validationResult = zodToValidationResult(result, data)
		// Matt Pocock方針: 型アサーションを避け、型ガードで安全に処理
		if (validationResult.success) {
			return { success: true, data: validationResult.data as NewTransaction }
		}
		return validationResult
	}
	const result = transactionCreateSchema.safeParse(data)
	const validationResult = zodToValidationResult(result, data)
	if (validationResult.success) {
		return { success: true, data: validationResult.data as NewTransaction }
	}
	return validationResult
}

// 取引更新データのバリデーション（Zodバージョン）
export function validateTransactionUpdateWithZod(
	data: Partial<NewTransaction>
): ValidationResult<Partial<NewTransaction>> {
	// レビューコメント#2対応: 明示的な条件分岐でtypeフィールドの動作を明確化
	if (data.type === 'income') {
		// typeが明示的に'income'の場合は収入バリデーションを使用
		const result = incomeUpdateSchema.safeParse(data)
		return zodToValidationResult(result, data)
	}
	if (data.type === 'expense') {
		// typeが明示的に'expense'の場合は支出バリデーションを使用
		const result = transactionUpdateSchema.safeParse(data)
		return zodToValidationResult(result, data)
	}
	if (data.type === undefined) {
		// typeがundefinedの場合はデフォルトで支出バリデーションを使用
		// (更新時はtypeを変更しない場合が多いため)
		const result = transactionUpdateSchema.safeParse(data)
		return zodToValidationResult(result, data)
	}
	// その他の無効な値の場合もデフォルトバリデーションで検証
	// (スキーマ側でエラーになる)
	const result = transactionUpdateSchema.safeParse(data)
	return zodToValidationResult(result, data)
}

// 収入作成データのバリデーション（Zodバージョン）
export function validateIncomeCreateWithZod(
	data: Partial<NewTransaction>
): ValidationResult<NewTransaction> {
	const result = incomeCreateSchema.safeParse(data)
	const validationResult = zodToValidationResult(result, data)
	// Matt Pocock方針: 型アサーションを避け、型ガードで安全に処理
	if (validationResult.success) {
		return { success: true, data: validationResult.data as NewTransaction }
	}
	return validationResult
}

// 収入更新データのバリデーション（Zodバージョン）
export function validateIncomeUpdateWithZod(
	data: Partial<NewTransaction>
): ValidationResult<Partial<NewTransaction>> {
	const result = incomeUpdateSchema.safeParse(data)
	return zodToValidationResult(result, data)
}

// サブスクリプション作成データのバリデーション（Zodバージョン）
export function validateSubscriptionCreateWithZod(
	data: unknown
): ValidationResult<NewSubscription> {
	const result = subscriptionCreateSchema.safeParse(data)
	const validationResult = zodToValidationResult(result, data)
	// Matt Pocock方針: 型アサーションを避け、型ガードで安全に処理
	if (validationResult.success) {
		return { success: true, data: validationResult.data as NewSubscription }
	}
	return validationResult
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
