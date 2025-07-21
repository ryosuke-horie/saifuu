import {
	compose,
	date,
	enumValidator,
	numeric,
	positiveNumber,
	required,
	string,
	VALIDATION_LIMITS,
	type ValidationError,
	type ValidationResult,
	type Validator,
} from '../../../shared/src/validation/index'
import type { NewSubscription, NewTransaction } from '../db/schema'

// 共通バリデーター
// IDバリデーター（数値型のID）
export const idValidator: Validator<number> = compose(
	required<number>(),
	positiveNumber('IDは正の整数である必要があります')
)

// カテゴリIDバリデーター（オプショナル）
export const categoryIdValidator: Validator<number | string | null | undefined> = (value, fieldName) => {
	// null/undefinedは許可
	if (value === null || value === undefined) {
		return null
	}
	// 文字列の場合は数値に変換
	const numericValue = typeof value === 'string' ? Number(value) : value
	// 数値変換できない場合はエラー
	if (isNaN(numericValue)) {
		return {
			field: fieldName,
			message: 'カテゴリIDは数値である必要があります',
			code: 'INVALID_TYPE',
		}
	}
	return positiveNumber('カテゴリIDは正の整数である必要があります')(numericValue, fieldName)
}

// 金額バリデーター（必須）
export const amountValidator: Validator<number> = compose(
	required<number>('金額は必須です'),
	positiveNumber('金額は正の数値である必要があります'),
	numeric(
		VALIDATION_LIMITS.MIN_AMOUNT,
		VALIDATION_LIMITS.MAX_AMOUNT,
		`金額は${VALIDATION_LIMITS.MIN_AMOUNT}円以上${VALIDATION_LIMITS.MAX_AMOUNT}円以下である必要があります`
	)
)

// 説明バリデーター（オプショナル）
export const descriptionValidator: Validator<string | null | undefined> = (value, fieldName) => {
	if (value === null || value === undefined) return null
	return string(
		VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH,
		`説明は${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH}文字以下である必要があります`
	)(value, fieldName)
}

// 日付文字列バリデーター
export const dateStringValidator: Validator<string> = compose(
	required<string>('日付は必須です'),
	(value: string, fieldName: string) => {
		// ISO 8601形式の検証
		const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/
		if (!datePattern.test(value)) {
			return {
				field: fieldName,
				message:
					'日付はISO 8601形式（YYYY-MM-DD または YYYY-MM-DDTHH:mm:ss.sssZ）である必要があります',
				code: 'INVALID_DATE_FORMAT',
			}
		}
		// 日付の妥当性検証
		return date(VALIDATION_LIMITS.MIN_DATE)(value, fieldName)
	}
)

// 取引（Transaction）関連のバリデーションスキーマ
// 取引作成時のバリデーションスキーマ
export const transactionCreateSchema = {
	amount: amountValidator,
	type: compose(
		required<string>('取引種別は必須です'),
		enumValidator(['expense'] as const, '取引種別は支出（expense）のみ許可されています')
	),
	categoryId: categoryIdValidator,
	description: descriptionValidator,
	date: dateStringValidator,
}

// 取引更新時のバリデーションスキーマ（全フィールドオプショナル）
export const transactionUpdateSchema = {
	amount: (value: number | undefined, fieldName: string) => {
		if (value === undefined) return null
		return amountValidator(value, fieldName)
	},
	type: (value: string | undefined, fieldName: string) => {
		if (value === undefined) return null
		return enumValidator(['expense'] as const, '取引種別は支出（expense）のみ許可されています')(
			value as 'expense',
			fieldName
		)
	},
	categoryId: categoryIdValidator,
	description: descriptionValidator,
	date: (value: string | undefined, fieldName: string) => {
		if (value === undefined) return null
		return dateStringValidator(value, fieldName)
	},
}

// サブスクリプション（Subscription）関連のバリデーションスキーマ
// サブスクリプション作成時のバリデーションスキーマ
export const subscriptionCreateSchema = {
	name: compose(
		required<string>('サービス名は必須です'),
		string(
			VALIDATION_LIMITS.MAX_NAME_LENGTH,
			`サービス名は${VALIDATION_LIMITS.MAX_NAME_LENGTH}文字以下である必要があります`
		)
	),
	amount: amountValidator,
	billingCycle: compose(
		required<string>('請求サイクルは必須です'),
		enumValidator(
			['monthly', 'yearly', 'weekly'] as const,
			'請求サイクルはmonthly、yearly、weeklyのいずれかである必要があります'
		)
	),
	nextBillingDate: dateStringValidator,
	categoryId: categoryIdValidator,
	description: descriptionValidator,
	isActive: (value: boolean | undefined, fieldName: string) => {
		// isActiveはオプショナル（デフォルトtrue）
		if (value === undefined) return null
		if (typeof value !== 'boolean') {
			return {
				field: fieldName,
				message: '有効状態は真偽値である必要があります',
				code: 'INVALID_BOOLEAN',
			}
		}
		return null
	},
}

// サブスクリプション更新時のバリデーションスキーマ（全フィールドオプショナル）
export const subscriptionUpdateSchema = {
	name: (value: string | undefined, fieldName: string) => {
		if (value === undefined) return null
		return string(
			VALIDATION_LIMITS.MAX_NAME_LENGTH,
			`サービス名は${VALIDATION_LIMITS.MAX_NAME_LENGTH}文字以下である必要があります`
		)(value, fieldName)
	},
	amount: (value: number | undefined, fieldName: string) => {
		if (value === undefined) return null
		return amountValidator(value, fieldName)
	},
	billingCycle: (value: string | undefined, fieldName: string) => {
		if (value === undefined) return null
		return enumValidator(
			['monthly', 'yearly', 'weekly'] as const,
			'請求サイクルはmonthly、yearly、weeklyのいずれかである必要があります'
		)(value as 'monthly' | 'yearly' | 'weekly', fieldName)
	},
	nextBillingDate: (value: string | undefined, fieldName: string) => {
		if (value === undefined) return null
		return dateStringValidator(value, fieldName)
	},
	categoryId: categoryIdValidator,
	description: descriptionValidator,
	isActive: (value: boolean | undefined, fieldName: string) => {
		if (value === undefined) return null
		if (typeof value !== 'boolean') {
			return {
				field: fieldName,
				message: '有効状態は真偽値である必要があります',
				code: 'INVALID_BOOLEAN',
			}
		}
		return null
	},
}

// バリデーション実行関数
// 取引作成データのバリデーション
export function validateTransactionCreate(
	data: Partial<NewTransaction>
): ValidationResult<NewTransaction> {
	const errors: ValidationError[] = []

	// 必須フィールドのチェック
	const requiredFields = ['amount', 'type', 'date'] as const
	for (const field of requiredFields) {
		if (data[field] === undefined || data[field] === null) {
			errors.push({
				field,
				message: `${field}は必須です`,
				code: 'REQUIRED',
			})
		}
	}

	// 各フィールドのバリデーション
	if (data.amount !== undefined) {
		const error = amountValidator(data.amount, 'amount')
		if (error) errors.push(error)
	}

	if (data.type !== undefined) {
		const error = enumValidator(
			['expense'] as const,
			'取引種別は支出（expense）のみ許可されています'
		)(data.type as 'expense', 'type')
		if (error) errors.push(error)
	}

	if (data.categoryId !== undefined) {
		const error = categoryIdValidator(data.categoryId, 'categoryId')
		if (error) errors.push(error)
	}

	if (data.description !== undefined) {
		const error = descriptionValidator(data.description, 'description')
		if (error) errors.push(error)
	}

	if (data.date !== undefined) {
		const error = dateStringValidator(data.date, 'date')
		if (error) errors.push(error)
	}

	if (errors.length > 0) {
		return { success: false, errors }
	}

	return { success: true, data: data as NewTransaction }
}

// 取引更新データのバリデーション
export function validateTransactionUpdate(
	data: Partial<NewTransaction>
): ValidationResult<Partial<NewTransaction>> {
	const errors: ValidationError[] = []

	// 各フィールドのバリデーション（すべてオプショナル）
	if (data.amount !== undefined) {
		const error = amountValidator(data.amount, 'amount')
		if (error) errors.push(error)
	}

	if (data.type !== undefined) {
		const error = enumValidator(
			['expense'] as const,
			'取引種別は支出（expense）のみ許可されています'
		)(data.type as 'expense', 'type')
		if (error) errors.push(error)
	}

	if (data.categoryId !== undefined) {
		const error = categoryIdValidator(data.categoryId, 'categoryId')
		if (error) errors.push(error)
	}

	if (data.description !== undefined) {
		const error = descriptionValidator(data.description, 'description')
		if (error) errors.push(error)
	}

	if (data.date !== undefined) {
		const error = dateStringValidator(data.date, 'date')
		if (error) errors.push(error)
	}

	if (errors.length > 0) {
		return { success: false, errors }
	}

	return { success: true, data }
}

// サブスクリプション作成データのバリデーション
export function validateSubscriptionCreate(
	data: Partial<NewSubscription>
): ValidationResult<NewSubscription> {
	const errors: ValidationError[] = []

	// 必須フィールドのチェック
	const requiredFields = ['name', 'amount', 'billingCycle', 'nextBillingDate'] as const
	for (const field of requiredFields) {
		if (data[field] === undefined || data[field] === null) {
			errors.push({
				field,
				message: `${field}は必須です`,
				code: 'REQUIRED',
			})
		}
	}

	// 各フィールドのバリデーション
	if (data.name !== undefined) {
		const error = compose(
			required<string>('サービス名は必須です'),
			string(
				VALIDATION_LIMITS.MAX_NAME_LENGTH,
				`サービス名は${VALIDATION_LIMITS.MAX_NAME_LENGTH}文字以下である必要があります`
			)
		)(data.name, 'name')
		if (error) errors.push(error)
	}

	if (data.amount !== undefined) {
		const error = amountValidator(data.amount, 'amount')
		if (error) errors.push(error)
	}

	if (data.billingCycle !== undefined) {
		const error = enumValidator(
			['monthly', 'yearly', 'weekly'] as const,
			'請求サイクルはmonthly、yearly、weeklyのいずれかである必要があります'
		)(data.billingCycle as 'monthly' | 'yearly' | 'weekly', 'billingCycle')
		if (error) errors.push(error)
	}

	if (data.nextBillingDate !== undefined) {
		const error = dateStringValidator(data.nextBillingDate, 'nextBillingDate')
		if (error) errors.push(error)
	}

	if (data.categoryId !== undefined) {
		const error = categoryIdValidator(data.categoryId, 'categoryId')
		if (error) errors.push(error)
	}

	if (data.description !== undefined) {
		const error = descriptionValidator(data.description, 'description')
		if (error) errors.push(error)
	}

	if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
		errors.push({
			field: 'isActive',
			message: '有効状態は真偽値である必要があります',
			code: 'INVALID_BOOLEAN',
		})
	}

	if (errors.length > 0) {
		return { success: false, errors }
	}

	return { success: true, data: data as NewSubscription }
}

// サブスクリプション更新データのバリデーション
export function validateSubscriptionUpdate(
	data: Partial<NewSubscription>
): ValidationResult<Partial<NewSubscription>> {
	const errors: ValidationError[] = []

	// 各フィールドのバリデーション（すべてオプショナル）
	if (data.name !== undefined) {
		const error = string(
			VALIDATION_LIMITS.MAX_NAME_LENGTH,
			`サービス名は${VALIDATION_LIMITS.MAX_NAME_LENGTH}文字以下である必要があります`
		)(data.name, 'name')
		if (error) errors.push(error)
	}

	if (data.amount !== undefined) {
		const error = amountValidator(data.amount, 'amount')
		if (error) errors.push(error)
	}

	if (data.billingCycle !== undefined) {
		const error = enumValidator(
			['monthly', 'yearly', 'weekly'] as const,
			'請求サイクルはmonthly、yearly、weeklyのいずれかである必要があります'
		)(data.billingCycle as 'monthly' | 'yearly' | 'weekly', 'billingCycle')
		if (error) errors.push(error)
	}

	if (data.nextBillingDate !== undefined) {
		const error = dateStringValidator(data.nextBillingDate, 'nextBillingDate')
		if (error) errors.push(error)
	}

	if (data.categoryId !== undefined) {
		const error = categoryIdValidator(data.categoryId, 'categoryId')
		if (error) errors.push(error)
	}

	if (data.description !== undefined) {
		const error = descriptionValidator(data.description, 'description')
		if (error) errors.push(error)
	}

	if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
		errors.push({
			field: 'isActive',
			message: '有効状態は真偽値である必要があります',
			code: 'INVALID_BOOLEAN',
		})
	}

	if (errors.length > 0) {
		return { success: false, errors }
	}

	return { success: true, data }
}

// ID検証ヘルパー関数
export function validateId(id: unknown): ValidationResult<number> {
	// 文字列の場合は数値に変換を試みる
	const numericId = typeof id === 'string' ? Number.parseInt(id, 10) : id

	if (typeof numericId !== 'number' || Number.isNaN(numericId)) {
		return {
			success: false,
			errors: [
				{
					field: 'id',
					message: 'IDは数値である必要があります',
					code: 'INVALID_ID',
				},
			],
		}
	}

	const error = idValidator(numericId, 'id')
	if (error) {
		return { success: false, errors: [error] }
	}

	return { success: true, data: numericId }
}
