import { describe, expect, it } from 'vitest'
import {
	amountSchema,
	billingCycleSchema,
	categoryIdSchema,
	dateStringSchema,
	descriptionSchema,
	idSchema,
	nameSchema,
	subscriptionCreateSchema,
	transactionCreateSchema,
	transactionTypeSchema,
	zodToValidationResult,
} from '../../../../shared/src/validation/zod-schemas'

describe('Zodスキーマのテスト', () => {
	describe('idSchema', () => {
		it('正の整数を受け入れる', () => {
			const result = idSchema.safeParse(1)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(1)
			}
		})

		it('ゼロや負の数を拒否する', () => {
			expect(idSchema.safeParse(0).success).toBe(false)
			expect(idSchema.safeParse(-1).success).toBe(false)
		})

		it('小数を拒否する', () => {
			const result = idSchema.safeParse(1.5)
			expect(result.success).toBe(false)
		})
	})

	describe('amountSchema', () => {
		it('有効な金額を受け入れる', () => {
			expect(amountSchema.safeParse(100).success).toBe(true)
			expect(amountSchema.safeParse(1).success).toBe(true)
			expect(amountSchema.safeParse(10_000_000).success).toBe(true)
		})

		it('無効な金額を拒否する', () => {
			expect(amountSchema.safeParse(0).success).toBe(false)
			expect(amountSchema.safeParse(-100).success).toBe(false)
			expect(amountSchema.safeParse(10_000_001).success).toBe(false)
		})
	})

	describe('nameSchema', () => {
		it('有効な名前を受け入れる', () => {
			expect(nameSchema.safeParse('テスト').success).toBe(true)
			expect(nameSchema.safeParse('a'.repeat(100)).success).toBe(true)
		})

		it('無効な名前を拒否する', () => {
			expect(nameSchema.safeParse('').success).toBe(false)
			expect(nameSchema.safeParse('a'.repeat(101)).success).toBe(false)
		})
	})

	describe('descriptionSchema', () => {
		it('有効な説明を受け入れる', () => {
			expect(descriptionSchema.safeParse('説明文').success).toBe(true)
			expect(descriptionSchema.safeParse(null).success).toBe(true)
			expect(descriptionSchema.safeParse(undefined).success).toBe(true)
			expect(descriptionSchema.safeParse('').success).toBe(true)
		})

		it('長すぎる説明を拒否する', () => {
			expect(descriptionSchema.safeParse('a'.repeat(501)).success).toBe(false)
		})
	})

	describe('dateStringSchema', () => {
		it('有効な日付文字列を受け入れる', () => {
			expect(dateStringSchema.safeParse('2024-01-01').success).toBe(true)
			expect(dateStringSchema.safeParse('2024-01-01T00:00:00.000Z').success).toBe(true)
		})

		it('無効な日付文字列を拒否する', () => {
			expect(dateStringSchema.safeParse('2024/01/01').success).toBe(false)
			expect(dateStringSchema.safeParse('1999-12-31').success).toBe(false)
		})
	})

	describe('categoryIdSchema', () => {
		it('数値のカテゴリIDを受け入れる', () => {
			const result = categoryIdSchema.safeParse(1)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(1)
			}
		})

		it('文字列のカテゴリIDを数値に変換する', () => {
			const result = categoryIdSchema.safeParse('5')
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(5)
			}
		})

		it('nullとundefinedを受け入れる', () => {
			expect(categoryIdSchema.safeParse(null).success).toBe(true)
			expect(categoryIdSchema.safeParse(undefined).success).toBe(true)
		})

		it('無効な文字列を拒否する', () => {
			expect(categoryIdSchema.safeParse('abc').success).toBe(false)
		})

		it('負の数を拒否する', () => {
			expect(categoryIdSchema.safeParse(-1).success).toBe(false)
			expect(categoryIdSchema.safeParse('-1').success).toBe(false)
		})
	})

	describe('transactionTypeSchema', () => {
		it('expenseを受け入れる', () => {
			expect(transactionTypeSchema.safeParse('expense').success).toBe(true)
		})

		it('expense以外を拒否する', () => {
			expect(transactionTypeSchema.safeParse('income').success).toBe(false)
		})
	})

	describe('billingCycleSchema', () => {
		it('有効な請求サイクルを受け入れる', () => {
			expect(billingCycleSchema.safeParse('monthly').success).toBe(true)
			expect(billingCycleSchema.safeParse('yearly').success).toBe(true)
			expect(billingCycleSchema.safeParse('weekly').success).toBe(true)
		})

		it('無効な請求サイクルを拒否する', () => {
			expect(billingCycleSchema.safeParse('daily').success).toBe(false)
		})
	})

	describe('transactionCreateSchema', () => {
		it('有効なトランザクションデータを受け入れる', () => {
			const data = {
				amount: 1000,
				type: 'expense',
				categoryId: 1,
				description: 'テスト',
				date: '2024-01-01',
			}
			const result = transactionCreateSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('必須フィールドがない場合エラーになる', () => {
			const data = {
				amount: 1000,
				type: 'expense',
			}
			const result = transactionCreateSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('カテゴリIDとdescriptionはオプショナル', () => {
			const data = {
				amount: 1000,
				type: 'expense',
				date: '2024-01-01',
			}
			const result = transactionCreateSchema.safeParse(data)
			expect(result.success).toBe(true)
		})
	})

	describe('subscriptionCreateSchema', () => {
		it('有効なサブスクリプションデータを受け入れる', () => {
			const data = {
				name: 'Netflix',
				amount: 1500,
				billingCycle: 'monthly',
				nextBillingDate: '2024-02-01',
				categoryId: 1,
				description: 'エンタメ',
			}
			const result = subscriptionCreateSchema.safeParse(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.isActive).toBe(true) // デフォルト値
			}
		})

		it('isActiveを指定できる', () => {
			const data = {
				name: 'Netflix',
				amount: 1500,
				billingCycle: 'monthly',
				nextBillingDate: '2024-02-01',
				categoryId: 1,
				isActive: false,
			}
			const result = subscriptionCreateSchema.safeParse(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.isActive).toBe(false)
			}
		})
	})

	describe('zodToValidationResult', () => {
		it('成功時のレスポンスを正しく変換する', () => {
			const zodResult = amountSchema.safeParse(100)
			const validationResult = zodToValidationResult(zodResult, 100)

			expect(validationResult.success).toBe(true)
			if (validationResult.success) {
				expect(validationResult.data).toBe(100)
			}
		})

		it('エラー時のレスポンスを正しく変換する', () => {
			const zodResult = transactionCreateSchema.safeParse({
				amount: -100,
				type: 'invalid',
			})
			console.log('Zod result:', zodResult)
			const validationResult = zodToValidationResult(zodResult, {})
			console.log('Validation result:', validationResult)

			expect(validationResult.success).toBe(false)
			if (!validationResult.success) {
				expect(validationResult.errors).toBeInstanceOf(Array)
				expect(validationResult.errors.length).toBeGreaterThan(0)
				if (validationResult.errors.length > 0) {
					expect(validationResult.errors[0]).toHaveProperty('field')
					expect(validationResult.errors[0]).toHaveProperty('message')
				}
			}
		})
	})

	describe('エラーメッセージの日本語化', () => {
		it('必須フィールドのエラーメッセージが日本語になる', () => {
			const result = transactionCreateSchema.safeParse({})
			expect(result.success).toBe(false)

			if (!result.success) {
				console.log('Error:', result.error)
				if (result.error?.errors) {
					const errors = result.error.errors
					const amountError = errors.find((e: any) => e.path && e.path[0] === 'amount')
					expect(amountError?.message).toContain('必須')
				} else {
					throw new Error('Expected error to have errors property')
				}
			}
		})

		it('範囲エラーのメッセージが日本語になる', () => {
			const result = amountSchema.safeParse(10_000_001)
			expect(result.success).toBe(false)

			if (!result.success) {
				console.log('Range Error:', result.error)
				if (result.error?.errors && result.error.errors.length > 0) {
					expect(result.error.errors[0].message).toContain('10000000円以下である必要があります')
				} else {
					throw new Error('Expected error to have errors array')
				}
			}
		})

		it('enum型のエラーメッセージが日本語になる', () => {
			const result = billingCycleSchema.safeParse('invalid')
			expect(result.success).toBe(false)

			if (!result.success) {
				console.log('Enum Error:', result.error)
				if (result.error?.errors && result.error.errors.length > 0) {
					expect(result.error.errors[0].message).toContain('のいずれかである必要があります')
				} else {
					throw new Error('Expected error to have errors array')
				}
			}
		})
	})
})
