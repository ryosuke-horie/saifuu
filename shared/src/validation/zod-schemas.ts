// Zodを使用した共通バリデーションスキーマ
import { z } from 'zod'

// 共通バリデーション定数（既存のものを再利用）
export const VALIDATION_LIMITS = {
	// 金額の上限（API/Frontend統一）
	MAX_AMOUNT: 10_000_000, // ¥10,000,000
	MIN_AMOUNT: 1,

	// 文字列長の上限
	MAX_NAME_LENGTH: 100,
	MAX_DESCRIPTION_LENGTH: 500,

	// その他の制約
	MIN_DATE: new Date('2000-01-01'),
} as const

// エラーメッセージの日本語化設定
const zodErrorMap: z.ZodErrorMap = (
	issue: z.ZodIssueOptionalMessage,
	ctx: z.ErrorMapCtx,
) => {
	const fieldName =
		issue.path && issue.path.length > 0 ? issue.path.join('.') : 'フィールド'

	// 必須フィールドのエラー
	if (issue.code === z.ZodIssueCode.invalid_type) {
		if (issue.expected === 'string' && issue.received === 'undefined') {
			return { message: `${fieldName}は必須です` }
		}
		if (issue.expected === 'number' && issue.received === 'undefined') {
			return { message: `${fieldName}は必須です` }
		}
		if (issue.expected === 'string') {
			return { message: `${fieldName}は文字列である必要があります` }
		}
		if (issue.expected === 'number') {
			return { message: `${fieldName}は数値である必要があります` }
		}
		if (issue.expected === 'boolean') {
			return { message: `${fieldName}は真偽値である必要があります` }
		}
	}

	// 最小値・最大値のエラー
	if (issue.code === z.ZodIssueCode.too_small) {
		if (issue.type === 'string') {
			return {
				message: `${fieldName}は${issue.minimum}文字以上である必要があります`,
			}
		}
		if (issue.type === 'number') {
			return {
				message: `${fieldName}は${issue.minimum}以上である必要があります`,
			}
		}
	}

	if (issue.code === z.ZodIssueCode.too_big) {
		if (issue.type === 'string') {
			return {
				message: `${fieldName}は${issue.maximum}文字以下である必要があります`,
			}
		}
		if (issue.type === 'number') {
			return {
				message: `${fieldName}は${issue.maximum}以下である必要があります`,
			}
		}
	}

	// enum型のエラー
	if (issue.code === z.ZodIssueCode.invalid_enum_value) {
		return {
			message: `${fieldName}は${issue.options.join(', ')}のいずれかである必要があります`,
		}
	}

	// カスタムエラー
	if (issue.code === z.ZodIssueCode.custom) {
		return {
			message: issue.message || ctx?.defaultError || 'バリデーションエラー',
		}
	}

	// その他のエラー
	return { message: ctx?.defaultError || 'バリデーションエラー' }
}

// グローバルにエラーマップを設定
z.setErrorMap(zodErrorMap)

// 基本的なスキーマ定義
// ID（正の整数）
export const idSchema = z
	.number()
	.int('IDは整数である必要があります')
	.positive('IDは正の整数である必要があります')

// 金額（正の数、範囲制限あり）
export const amountSchema = z
	.number()
	.positive('金額は正の数値である必要があります')
	.min(
		VALIDATION_LIMITS.MIN_AMOUNT,
		`金額は${VALIDATION_LIMITS.MIN_AMOUNT}円以上である必要があります`,
	)
	.max(
		VALIDATION_LIMITS.MAX_AMOUNT,
		`金額は${VALIDATION_LIMITS.MAX_AMOUNT}円以下である必要があります`,
	)

// 名前（必須、文字列長制限）
export const nameSchema = z
	.string()
	.min(1, '名前は必須です')
	.max(
		VALIDATION_LIMITS.MAX_NAME_LENGTH,
		`名前は${VALIDATION_LIMITS.MAX_NAME_LENGTH}文字以下である必要があります`,
	)

// 説明（オプショナル、文字列長制限）
export const descriptionSchema = z
	.string()
	.max(
		VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH,
		`説明は${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH}文字以下である必要があります`,
	)
	.nullable()
	.optional()

// 日付文字列（ISO 8601形式）
export const dateStringSchema = z
	.string()
	.regex(
		/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
		'日付はISO 8601形式（YYYY-MM-DD または YYYY-MM-DDTHH:mm:ss.sssZ）である必要があります',
	)
	.refine(
		(date: string) => {
			const d = new Date(date)
			return d >= VALIDATION_LIMITS.MIN_DATE
		},
		`日付は${VALIDATION_LIMITS.MIN_DATE.toISOString().split('T')[0]}以降である必要があります`,
	)

// レビューコメント#3対応: カテゴリIDバリデーションのファクトリー関数
// DRY原則に従い、共通ロジックを抽出
function createCategoryIdSchema(options?: {
	min?: number
	max?: number
	minMessage?: string
	maxMessage?: string
	nullable?: boolean
}) {
	// 数値スキーマの定義
	const numberSchema =
		options?.min !== undefined && options?.max !== undefined
			? z
					.number()
					.int()
					.min(
						options.min,
						options.minMessage ||
							`カテゴリIDは${options.min}以上である必要があります`,
					)
					.max(
						options.max,
						options.maxMessage ||
							`カテゴリIDは${options.max}以下である必要があります`,
					)
			: z.number().positive('カテゴリIDは正の整数である必要があります')

	// 文字列から数値への変換スキーマ
	const stringSchema = z
		.string()
		.transform((val: string, ctx: z.RefinementCtx) => {
			const num = Number(val)
			if (Number.isNaN(num)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'カテゴリIDは数値である必要があります',
				})
				return z.NEVER
			}

			// 範囲チェック
			if (options?.min !== undefined && options?.max !== undefined) {
				if (num < options.min || num > options.max) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message:
							options.minMessage ||
							`カテゴリIDは${options.min}から${options.max}の範囲である必要があります`,
					})
					return z.NEVER
				}
			} else if (num <= 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'カテゴリIDは正の整数である必要があります',
				})
				return z.NEVER
			}

			return num
		})

	// nullableオプションに基づいて適切なスキーマを返す
	if (options?.nullable !== false) {
		return z
			.union([numberSchema, stringSchema, z.null(), z.undefined()])
			.nullable()
			.optional()
	}
	return z.union([numberSchema, stringSchema])
}

// カテゴリID（数値または文字列、自動変換）
export const categoryIdSchema = createCategoryIdSchema({ nullable: true })

// 取引種別
export const transactionTypeSchema = z.enum(['expense', 'income'], {
	errorMap: () => ({
		message: '取引種別はexpenseまたはincomeである必要があります',
	}),
})

// 収入カテゴリID（101-105の範囲チェック）
export const incomeCategoryIdSchema = createCategoryIdSchema({
	min: 101,
	max: 105,
	minMessage: '収入カテゴリIDは101から105の範囲である必要があります',
	maxMessage: '収入カテゴリIDは101から105の範囲である必要があります',
	nullable: false,
})

// 収入金額（正の数のみ）
// レビューコメント#5対応: positive()とmin()の重複を解消してパフォーマンス改善
export const incomeAmountSchema = z
	.number()
	.min(
		VALIDATION_LIMITS.MIN_AMOUNT,
		// MIN_AMOUNTが1以上の場合、positive()チェックは不要
		VALIDATION_LIMITS.MIN_AMOUNT > 0
			? `収入金額は${VALIDATION_LIMITS.MIN_AMOUNT}円以上である必要があります`
			: '収入金額は0より大きい必要があります',
	)
	.max(
		VALIDATION_LIMITS.MAX_AMOUNT,
		`収入金額は${VALIDATION_LIMITS.MAX_AMOUNT}円以下である必要があります`,
	)

// 請求サイクル
export const billingCycleSchema = z.enum(['monthly', 'yearly', 'weekly'], {
	errorMap: () => ({
		message:
			'請求サイクルはmonthly、yearly、weeklyのいずれかである必要があります',
	}),
})

// トランザクション作成スキーマ
export const transactionCreateSchema = z.object({
	amount: amountSchema,
	type: transactionTypeSchema,
	categoryId: categoryIdSchema,
	description: descriptionSchema,
	date: dateStringSchema,
})

// トランザクション更新スキーマ（全フィールドオプショナル）
export const transactionUpdateSchema = z.object({
	amount: amountSchema.optional(),
	type: transactionTypeSchema.optional(),
	categoryId: categoryIdSchema,
	description: descriptionSchema,
	date: dateStringSchema.optional(),
})

// 収入作成スキーマ
export const incomeCreateSchema = z.object({
	amount: incomeAmountSchema,
	type: z.literal('income', {
		errorMap: () => ({
			message: '収入の取引種別はincomeである必要があります',
		}),
	}),
	categoryId: incomeCategoryIdSchema,
	description: descriptionSchema,
	date: dateStringSchema,
})

// 収入更新スキーマ（全フィールドオプショナル）
export const incomeUpdateSchema = z.object({
	amount: incomeAmountSchema.optional(),
	type: z
		.literal('income', {
			errorMap: () => ({
				message: '収入の取引種別はincomeである必要があります',
			}),
		})
		.optional(),
	categoryId: incomeCategoryIdSchema.optional(),
	// レビューコメント#4対応: 明示的な.optional()を付けて一貫性を改善
	description: descriptionSchema.optional(),
	date: dateStringSchema.optional(),
})

// サブスクリプション作成スキーマ
export const subscriptionCreateSchema = z.object({
	name: nameSchema,
	amount: amountSchema,
	billingCycle: billingCycleSchema,
	nextBillingDate: dateStringSchema,
	categoryId: categoryIdSchema,
	description: descriptionSchema,
	isActive: z.boolean().optional().default(true),
})

// サブスクリプション更新スキーマ（全フィールドオプショナル）
export const subscriptionUpdateSchema = z.object({
	name: nameSchema.optional(),
	amount: amountSchema.optional(),
	billingCycle: billingCycleSchema.optional(),
	nextBillingDate: dateStringSchema.optional(),
	categoryId: categoryIdSchema,
	description: descriptionSchema,
	isActive: z.boolean().optional(),
})

// 既存のバリデーションフレームワークとの互換性を保つためのヘルパー関数
// ZodスキーマをValidationResult形式に変換
export function zodToValidationResult<T>(
	result: z.SafeParseReturnType<unknown, T>,
	_data: unknown,
):
	| { success: true; data: T }
	| {
			success: false
			errors: Array<{ field: string; message: string; code?: string }>
	  } {
	if (result.success) {
		return { success: true, data: result.data }
	}

	const errors =
		result.error?.errors?.map((error: z.ZodIssue) => ({
			field: error.path.length > 0 ? error.path.join('.') : 'unknown',
			message: error.message,
			code: error.code,
		})) || []

	return { success: false, errors }
}

// バリデーションエラーの型定義
export interface ValidationError {
	field: string
	message: string
	code?: string
}

// 型エクスポート（既存コードとの互換性のため）
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>
export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>
export type IncomeUpdateInput = z.infer<typeof incomeUpdateSchema>
export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>
