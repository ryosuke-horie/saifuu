/**
 * フロントエンド用Zodバリデーション
 * React Hook Formとの統合とフォーム専用バリデーション機能を提供
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  type TransactionCreateData,
  type TransactionUpdateData,
  type SubscriptionCreateData,
  type SubscriptionUpdateData,
} from '../../../../shared/src/validation/zod-schemas'

// ===== React Hook Form用のリゾルバー =====

/**
 * 取引作成フォーム用のZodリゾルバー
 * React Hook Formで使用: const { control, handleSubmit } = useForm({ resolver: transactionCreateResolver })
 */
export const transactionCreateResolver = zodResolver(transactionCreateSchema)

/**
 * 取引更新フォーム用のZodリゾルバー
 * React Hook Formで使用: const { control, handleSubmit } = useForm({ resolver: transactionUpdateResolver })
 */
export const transactionUpdateResolver = zodResolver(transactionUpdateSchema)

/**
 * サブスクリプション作成フォーム用のZodリゾルバー
 * React Hook Formで使用: const { control, handleSubmit } = useForm({ resolver: subscriptionCreateResolver })
 */
export const subscriptionCreateResolver = zodResolver(subscriptionCreateSchema)

/**
 * サブスクリプション更新フォーム用のZodリゾルバー
 * React Hook Formで使用: const { control, handleSubmit } = useForm({ resolver: subscriptionUpdateResolver })
 */
export const subscriptionUpdateResolver = zodResolver(subscriptionUpdateSchema)

// ===== フロントエンド固有のバリデーションスキーマ =====

// フォーム送信前の基本チェック用スキーマ（より緩やか）
export const formInputAmountSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === 'string') {
      const numericValue = parseFloat(value)
      if (isNaN(numericValue)) {
        throw new Error('数値を入力してください')
      }
      return numericValue
    }
    return value
  })
  .refine((value) => value > 0, '金額は1円以上で入力してください')
  .refine((value) => value <= 10_000_000, '金額は1,000万円以下で入力してください')

// リアルタイムバリデーション用（入力中の検証）
export const realTimeValidationSchema = {
  amount: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || value.trim() === '') return true // 空文字は許可（入力中）
      const numericValue = parseFloat(value)
      return !isNaN(numericValue) && numericValue > 0
    }, '正の数値を入力してください'),
  
  name: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true
      return value.length <= 100
    }, '名前は100文字以下で入力してください'),
  
  description: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true
      return value.length <= 500
    }, '説明は500文字以下で入力してください'),
}

// ===== 既存フォームバリデーションとの互換性関数 =====

/**
 * Zodバリデーション結果を既存のフォームバリデーション形式に変換
 * 段階的移行時に既存コードとの互換性を保つため
 */
export function convertZodErrorToFormError(error: z.ZodError): Record<string, string> {
  const formErrors: Record<string, string> = {}
  
  for (const issue of error.errors) {
    const fieldPath = issue.path.join('.')
    formErrors[fieldPath] = issue.message
  }
  
  return formErrors
}

/**
 * 個別フィールドのZodバリデーション
 * 既存のvalidateAmount, validateRequiredString等との段階的置き換え用
 */

// 金額フィールドのZodバリデーション（既存validateAmountの代替）
export function validateAmountWithZod(value: number | string): string | undefined {
  try {
    formInputAmountSchema.parse(value)
    return undefined
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || '金額が無効です'
    }
    return '金額が無効です'
  }
}

// 必須文字列フィールドのZodバリデーション（既存validateRequiredStringの代替）
export function validateRequiredStringWithZod(
  value: string | null | undefined,
  fieldName: string,
  maxLength?: number
): string | undefined {
  const schema = z
    .string()
    .min(1, `${fieldName}は必須です`)
    .max(maxLength || 500, `${fieldName}は${maxLength || 500}文字以下で入力してください`)
  
  try {
    schema.parse(value || '')
    return undefined
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || `${fieldName}が無効です`
    }
    return `${fieldName}が無効です`
  }
}

// 日付フィールドのZodバリデーション（既存validateDateの代替）
export function validateDateWithZod(value: string): string | undefined {
  const schema = z
    .string()
    .min(1, '日付は必須です')
    .refine((value) => {
      const date = new Date(value)
      return !isNaN(date.getTime())
    }, '有効な日付を入力してください')
    .refine((value) => {
      const date = new Date(value)
      const minDate = new Date('2000-01-01')
      return date >= minDate
    }, '2000年1月1日以降の日付を入力してください')
  
  try {
    schema.parse(value)
    return undefined
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || '日付が無効です'
    }
    return '日付が無効です'
  }
}

// ===== リアルタイムバリデーション用フック（将来の拡張用） =====

/**
 * リアルタイムバリデーション結果の型
 */
export interface RealTimeValidationResult {
  isValid: boolean
  errorMessage?: string
}

/**
 * リアルタイム金額バリデーション
 * 入力中にリアルタイムでバリデーションを実行
 */
export function useRealTimeAmountValidation(value: string): RealTimeValidationResult {
  try {
    realTimeValidationSchema.amount.parse(value)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errorMessage: error.errors[0]?.message || '金額が無効です'
      }
    }
    return { isValid: false, errorMessage: '金額が無効です' }
  }
}

// ===== 型エクスポート（TypeScript用） =====

export type {
  TransactionCreateData,
  TransactionUpdateData,
  SubscriptionCreateData,
  SubscriptionUpdateData,
}

// ===== フォームデータ型の定義 =====

// React Hook Formで使用するフォームデータ型
export type TransactionFormData = TransactionCreateData
export type SubscriptionFormData = SubscriptionCreateData

// 部分更新用フォームデータ型
export type TransactionUpdateFormData = TransactionUpdateData
export type SubscriptionUpdateFormData = SubscriptionUpdateData

// ===== 便利なバリデーション関数 =====

/**
 * フォーム送信前の完全バリデーション
 * 複数のフィールドを一括でバリデーション
 */
export function validateTransactionForm(data: Partial<TransactionFormData>): {
  isValid: boolean
  errors: Record<string, string>
} {
  try {
    transactionCreateSchema.parse(data)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: convertZodErrorToFormError(error)
      }
    }
    return { isValid: false, errors: { general: 'バリデーションエラーが発生しました' } }
  }
}

/**
 * サブスクリプションフォーム送信前の完全バリデーション
 */
export function validateSubscriptionForm(data: Partial<SubscriptionFormData>): {
  isValid: boolean
  errors: Record<string, string>
} {
  try {
    subscriptionCreateSchema.parse(data)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: convertZodErrorToFormError(error)
      }
    }
    return { isValid: false, errors: { general: 'バリデーションエラーが発生しました' } }
  }
}