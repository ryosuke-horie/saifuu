import { z } from 'zod'

// バリデーション定数（既存の共通定数を維持）
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

// 日本語エラーメッセージのカスタム関数
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'number') {
        return { message: '数値である必要があります' }
      }
      if (issue.expected === 'string') {
        return { message: '文字列である必要があります' }
      }
      if (issue.expected === 'boolean') {
        return { message: '真偽値である必要があります' }
      }
      return { message: '不正な形式です' }
    
    case z.ZodIssueCode.too_small:
      if (issue.type === 'number') {
        return { message: `${issue.minimum}以上である必要があります` }
      }
      if (issue.type === 'string') {
        return { message: `${issue.minimum}文字以上である必要があります` }
      }
      if (issue.type === 'date') {
        return { message: `${new Date(issue.minimum as number).toISOString().split('T')[0]}以降である必要があります` }
      }
      return { message: '値が小さすぎます' }
    
    case z.ZodIssueCode.too_big:
      if (issue.type === 'number') {
        return { message: `${issue.maximum}以下である必要があります` }
      }
      if (issue.type === 'string') {
        return { message: `${issue.maximum}文字以下である必要があります` }
      }
      return { message: '値が大きすぎます' }
    
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: '有効なメールアドレスを入力してください' }
      }
      if (issue.validation === 'url') {
        return { message: '有効なURLを入力してください' }
      }
      return { message: '不正な文字列形式です' }
    
    case z.ZodIssueCode.invalid_date:
      return { message: '有効な日付である必要があります' }
    
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `許可された値: ${issue.options.join(', ')}` }
    
    default:
      return { message: ctx.defaultError }
  }
}

// エラーマップを設定
z.setErrorMap(customErrorMap)

// ===== 基本的なスキーマ =====

// ID用スキーマ（正の整数）
export const idSchema = z.number().int().positive('IDは正の整数である必要があります')

// 金額用スキーマ
export const amountSchema = z
  .number()
  .min(VALIDATION_LIMITS.MIN_AMOUNT, `金額は${VALIDATION_LIMITS.MIN_AMOUNT}円以上である必要があります`)
  .max(VALIDATION_LIMITS.MAX_AMOUNT, `金額は${VALIDATION_LIMITS.MAX_AMOUNT}円以下である必要があります`)

// 名前用スキーマ（必須文字列 + 長さ制限）
export const nameSchema = z
  .string()
  .min(1, '名前は必須です')
  .max(VALIDATION_LIMITS.MAX_NAME_LENGTH, `名前は${VALIDATION_LIMITS.MAX_NAME_LENGTH}文字以下である必要があります`)

// 説明用スキーマ（オプショナル文字列 + 長さ制限）
export const descriptionSchema = z
  .string()
  .max(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH, `説明は${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH}文字以下である必要があります`)
  .optional()
  .nullable()

// 日付文字列用スキーマ（ISO 8601形式）
export const dateStringSchema = z
  .string()
  .min(1, '日付は必須です')
  .refine((value) => {
    // ISO 8601形式の検証
    const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/
    return datePattern.test(value)
  }, '日付はISO 8601形式（YYYY-MM-DD または YYYY-MM-DDTHH:mm:ss.sssZ）である必要があります')
  .refine((value) => {
    // 日付の妥当性と最小日付の検証
    const date = new Date(value)
    return !isNaN(date.getTime()) && date >= VALIDATION_LIMITS.MIN_DATE
  }, `日付は${VALIDATION_LIMITS.MIN_DATE.toISOString().split('T')[0]}以降である必要があります`)

// カテゴリID用スキーマ（文字列→数値変換対応）
export const categoryIdSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .optional()
  .nullable()
  .transform((value) => {
    // null/undefinedはそのまま返す
    if (value === null || value === undefined) {
      return null
    }
    // 文字列の場合は数値に変換
    if (typeof value === 'string') {
      const numericValue = Number(value)
      if (isNaN(numericValue)) {
        throw new Error('カテゴリIDは数値である必要があります')
      }
      return numericValue
    }
    // 数値の場合はそのまま返す
    return value
  })
  .refine((value) => {
    // null の場合は OK
    if (value === null) return true
    // 正の整数である必要がある
    return Number.isInteger(value) && value > 0
  }, 'カテゴリIDは正の整数である必要があります')

// 取引種別用スキーマ
export const transactionTypeSchema = z.literal('expense')

// 請求サイクル用スキーマ
export const billingCycleSchema = z.enum(['monthly', 'yearly', 'weekly'], {
  errorMap: () => ({ message: '請求サイクルはmonthly、yearly、weeklyのいずれかである必要があります' })
})

// アクティブ状態用スキーマ
export const isActiveSchema = z.boolean().optional().default(true)

// ===== トランザクション用スキーマ =====

// 取引作成用スキーマ
export const transactionCreateSchema = z.object({
  amount: amountSchema,
  type: transactionTypeSchema,
  categoryId: categoryIdSchema,
  description: descriptionSchema,
  date: dateStringSchema,
})

// 取引更新用スキーマ（全フィールドオプショナル）
export const transactionUpdateSchema = z.object({
  amount: amountSchema.optional(),
  type: transactionTypeSchema.optional(),
  categoryId: categoryIdSchema,
  description: descriptionSchema,
  date: dateStringSchema.optional(),
})

// ===== サブスクリプション用スキーマ =====

// サブスクリプション作成用スキーマ
export const subscriptionCreateSchema = z.object({
  name: nameSchema,
  amount: amountSchema,
  billingCycle: billingCycleSchema,
  nextBillingDate: dateStringSchema,
  categoryId: categoryIdSchema,
  description: descriptionSchema,
  isActive: isActiveSchema,
})

// サブスクリプション更新用スキーマ（全フィールドオプショナル）
export const subscriptionUpdateSchema = z.object({
  name: nameSchema.optional(),
  amount: amountSchema.optional(),
  billingCycle: billingCycleSchema.optional(),
  nextBillingDate: dateStringSchema.optional(),
  categoryId: categoryIdSchema,
  description: descriptionSchema,
  isActive: isActiveSchema,
})

// ===== ID検証用スキーマ =====

// パラメータID検証用（文字列→数値変換対応）
export const paramIdSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === 'string') {
      const numericValue = parseInt(value, 10)
      if (isNaN(numericValue)) {
        throw new Error('IDは数値である必要があります')
      }
      return numericValue
    }
    return value
  })
  .pipe(idSchema)

// ===== 型推論のためのエクスポート =====

export type TransactionCreateData = z.infer<typeof transactionCreateSchema>
export type TransactionUpdateData = z.infer<typeof transactionUpdateSchema>
export type SubscriptionCreateData = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdateData = z.infer<typeof subscriptionUpdateSchema>

// ===== バリデーション実行ヘルパー関数 =====

// バリデーション結果の型定義（既存フレームワークとの互換性）
export type ZodValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: Array<{ field: string; message: string; code?: string }> }

// Zodエラーを既存エラー形式に変換する関数
export function zodErrorToValidationErrors(error: z.ZodError): Array<{ field: string; message: string; code?: string }> {
  return error.errors.map((err) => ({
    field: err.path.join('.') || 'unknown',
    message: err.message,
    code: err.code,
  }))
}

// 汎用バリデーション実行関数
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ZodValidationResult<T> {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: zodErrorToValidationErrors(error) }
    }
    // 予期しないエラーの場合
    return { 
      success: false, 
      errors: [{ field: 'unknown', message: 'バリデーションエラーが発生しました' }] 
    }
  }
}

// ===== 便利なバリデーション関数 =====

// 取引作成データのバリデーション
export function validateTransactionCreate(data: unknown): ZodValidationResult<TransactionCreateData> {
  return validateWithZod(transactionCreateSchema, data)
}

// 取引更新データのバリデーション
export function validateTransactionUpdate(data: unknown): ZodValidationResult<TransactionUpdateData> {
  return validateWithZod(transactionUpdateSchema, data)
}

// サブスクリプション作成データのバリデーション
export function validateSubscriptionCreate(data: unknown): ZodValidationResult<SubscriptionCreateData> {
  return validateWithZod(subscriptionCreateSchema, data)
}

// サブスクリプション更新データのバリデーション
export function validateSubscriptionUpdate(data: unknown): ZodValidationResult<SubscriptionUpdateData> {
  return validateWithZod(subscriptionUpdateSchema, data)
}

// ID検証
export function validateId(data: unknown): ZodValidationResult<number> {
  return validateWithZod(paramIdSchema, data)
}