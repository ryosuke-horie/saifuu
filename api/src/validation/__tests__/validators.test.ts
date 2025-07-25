import { describe, expect, it } from 'vitest'
import {
	validateIdWithZod,
	validateSubscriptionCreateWithZod,
	validateSubscriptionUpdateWithZod,
	validateTransactionCreateWithZod,
	validateTransactionUpdateWithZod,
} from '../zod-validators'

describe('Zodバリデーターのテスト', () => {
	describe('validateTransactionCreateWithZod', () => {
		it('有効なトランザクションデータを受け入れる', () => {
			const data = {
				amount: 1000,
				type: 'expense' as const,
				categoryId: 1,
				description: 'テスト',
				date: '2024-01-01',
			}
			const result = validateTransactionCreateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(data)
			}
		})

		it('必須フィールドがない場合エラーを返す', () => {
			const data = {
				amount: 1000,
				type: 'expense' as const,
			}
			const result = validateTransactionCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const dateError = result.errors.find((e) => e.field === 'date')
				expect(dateError).toBeDefined()
				expect(dateError?.message).toContain('必須')
			}
		})

		it('無効な金額でエラーを返す', () => {
			const data = {
				amount: -100,
				type: 'expense' as const,
				date: '2024-01-01',
			}
			const result = validateTransactionCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const amountError = result.errors.find((e) => e.field === 'amount')
				expect(amountError).toBeDefined()
				expect(amountError?.message).toContain('正の数値')
			}
		})
	})

	describe('validateTransactionUpdateWithZod', () => {
		it('部分的な更新データを受け入れる', () => {
			const data = {
				amount: 2000,
			}
			const result = validateTransactionUpdateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(data)
			}
		})

		it('空のオブジェクトを受け入れる', () => {
			const data = {}
			const result = validateTransactionUpdateWithZod(data)
			expect(result.success).toBe(true)
		})
	})

	describe('validateSubscriptionCreateWithZod', () => {
		it('有効なサブスクリプションデータを受け入れる', () => {
			const data = {
				name: 'Netflix',
				amount: 1500,
				billingCycle: 'monthly' as const,
				nextBillingDate: '2024-02-01',
				categoryId: 1,
				description: 'エンタメ',
			}
			const result = validateSubscriptionCreateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.isActive).toBe(true) // デフォルト値
			}
		})

		it('必須フィールドがない場合エラーを返す', () => {
			const data = {
				name: 'Netflix',
				amount: 1500,
			}
			const result = validateSubscriptionCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.errors.length).toBeGreaterThan(0)
				const billingCycleError = result.errors.find((e) => e.field === 'billingCycle')
				expect(billingCycleError).toBeDefined()
			}
		})
	})

	describe('validateSubscriptionUpdateWithZod', () => {
		it('部分的な更新データを受け入れる', () => {
			const data = {
				amount: 2000,
				isActive: false,
			}
			const result = validateSubscriptionUpdateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(data)
			}
		})
	})

	describe('validateIdWithZod', () => {
		it('有効な数値IDを受け入れる', () => {
			const result = validateIdWithZod(123)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(123)
			}
		})

		it('文字列IDを数値に変換する', () => {
			const result = validateIdWithZod('456')
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(456)
			}
		})

		it('無効なIDでエラーを返す', () => {
			const result = validateIdWithZod('abc')
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.errors[0].message).toContain('数値')
			}
		})

		it('負の数でエラーを返す', () => {
			const result = validateIdWithZod(-1)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.errors[0].message).toContain('正の整数')
			}
		})
	})
})
