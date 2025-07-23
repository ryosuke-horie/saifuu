import {
  transactionCreateSchema,
  transactionUpdateSchema,
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  validateTransactionCreate as zodValidateTransactionCreate,
  validateTransactionUpdate as zodValidateTransactionUpdate,
  validateSubscriptionCreate as zodValidateSubscriptionCreate,
  validateSubscriptionUpdate as zodValidateSubscriptionUpdate,
  validateId as zodValidateId,
  type ZodValidationResult,
  type TransactionCreateData,
  type TransactionUpdateData,
  type SubscriptionCreateData,
  type SubscriptionUpdateData,
} from '../../../shared/src/validation/zod-schemas'

// 再エクスポート（APIルートで使いやすくするため）
export {
  transactionCreateSchema,
  transactionUpdateSchema,
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  type ZodValidationResult,
  type TransactionCreateData,
  type TransactionUpdateData,
  type SubscriptionCreateData,
  type SubscriptionUpdateData,
}

// API固有のバリデーション関数（既存フレームワークとの互換性を保つ）

/**
 * 取引作成データのZodバリデーション
 * 既存のvalidateTransactionCreateと同じインターフェースを提供
 */
export function validateTransactionCreateWithZod(data: unknown): ZodValidationResult<TransactionCreateData> {
  return zodValidateTransactionCreate(data)
}

/**
 * 取引更新データのZodバリデーション
 * 既存のvalidateTransactionUpdateと同じインターフェースを提供
 */
export function validateTransactionUpdateWithZod(data: unknown): ZodValidationResult<TransactionUpdateData> {
  return zodValidateTransactionUpdate(data)
}

/**
 * サブスクリプション作成データのZodバリデーション
 * 既存のvalidateSubscriptionCreateと同じインターフェースを提供
 */
export function validateSubscriptionCreateWithZod(data: unknown): ZodValidationResult<SubscriptionCreateData> {
  return zodValidateSubscriptionCreate(data)
}

/**
 * サブスクリプション更新データのZodバリデーション
 * 既存のvalidateSubscriptionUpdateと同じインターフェースを提供
 */
export function validateSubscriptionUpdateWithZod(data: unknown): ZodValidationResult<SubscriptionUpdateData> {
  return zodValidateSubscriptionUpdate(data)
}

/**
 * ID検証のZodバリデーション
 * 既存のvalidateIdと同じインターフェースを提供
 */
export function validateIdWithZod(data: unknown): ZodValidationResult<number> {
  return zodValidateId(data)
}

// 既存のValidationError型との互換性を保つ型変換関数
export interface LegacyValidationError {
  field: string
  message: string
  code?: string
}

export interface LegacyValidationResult<T> {
  success: boolean
  data?: T
  errors?: LegacyValidationError[]
}

/**
 * ZodValidationResultを既存のValidationResult形式に変換
 * 段階的移行をサポートするための関数
 */
export function convertZodResultToLegacy<T>(zodResult: ZodValidationResult<T>): LegacyValidationResult<T> {
  if (zodResult.success) {
    return {
      success: true,
      data: zodResult.data,
    }
  } else {
    return {
      success: false,
      errors: zodResult.errors,
    }
  }
}

/**
 * 既存のformatValidationErrors関数と互換性のあるエラーフォーマット関数
 */
export function formatZodValidationErrors(errors: Array<{ field: string; message: string; code?: string }>): {
  error: string
  details?: Array<{ field: string; message: string; code?: string }>
} {
  // 最初のエラーメッセージを主エラーとして使用
  const mainError = errors[0]?.message || 'Validation failed'
  return {
    error: mainError,
    details: errors,
  }
}

// 段階的移行のためのラッパー関数群
// これらの関数は既存のAPIルートから呼び出すことで、既存コードを最小限の変更でZodに移行できる

/**
 * 取引作成バリデーション（Legacy互換）
 * 既存のvalidateTransactionCreateの代替として使用可能
 */
export function validateTransactionCreateLegacy(data: unknown): LegacyValidationResult<TransactionCreateData> {
  const zodResult = validateTransactionCreateWithZod(data)
  return convertZodResultToLegacy(zodResult)
}

/**
 * 取引更新バリデーション（Legacy互換）
 * 既存のvalidateTransactionUpdateの代替として使用可能
 */
export function validateTransactionUpdateLegacy(data: unknown): LegacyValidationResult<TransactionUpdateData> {
  const zodResult = validateTransactionUpdateWithZod(data)
  return convertZodResultToLegacy(zodResult)
}

/**
 * サブスクリプション作成バリデーション（Legacy互換）
 * 既存のvalidateSubscriptionCreateの代替として使用可能
 */
export function validateSubscriptionCreateLegacy(data: unknown): LegacyValidationResult<SubscriptionCreateData> {
  const zodResult = validateSubscriptionCreateWithZod(data)
  return convertZodResultToLegacy(zodResult)
}

/**
 * サブスクリプション更新バリデーション（Legacy互換）
 * 既存のvalidateSubscriptionUpdateの代替として使用可能
 */
export function validateSubscriptionUpdateLegacy(data: unknown): LegacyValidationResult<SubscriptionUpdateData> {
  const zodResult = validateSubscriptionUpdateWithZod(data)
  return convertZodResultToLegacy(zodResult)
}

/**
 * ID検証（Legacy互換）
 * 既存のvalidateIdの代替として使用可能
 */
export function validateIdLegacy(data: unknown): LegacyValidationResult<number> {
  const zodResult = validateIdWithZod(data)
  return convertZodResultToLegacy(zodResult)
}