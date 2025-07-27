import { describe, expect, it } from 'vitest'
import {
	validateIdWithZod,
	validateIncomeCreateWithZod,
	validateIncomeUpdateWithZod,
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

		it('収入データを受け入れる（typeに基づいて収入バリデーションを使用）', () => {
			const data = {
				amount: 50000,
				type: 'income' as const,
				categoryId: 103,
				description: '給与',
				date: '2024-01-01',
			}
			const result = validateTransactionCreateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(data)
			}
		})

		it('収入データで無効なカテゴリIDの場合エラーを返す', () => {
			const data = {
				amount: 50000,
				type: 'income' as const,
				categoryId: 1, // 支出用カテゴリID
				description: '給与',
				date: '2024-01-01',
			}
			const result = validateTransactionCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const categoryError = result.errors.find((e) => e.field === 'categoryId')
				expect(categoryError).toBeDefined()
				expect(categoryError?.message).toContain('収入カテゴリは101-105の範囲で指定してください')
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

		// レビューコメント#2対応：typeフィールドの動作テスト
		it('typeがundefinedの場合は支出バリデーションを使用する', () => {
			const data = {
				amount: 2000,
				categoryId: 1, // 支出カテゴリ
			}
			const result = validateTransactionUpdateWithZod(data)
			expect(result.success).toBe(true)
		})

		it('typeがincomeの場合は収入バリデーションを使用する', () => {
			const data = {
				type: 'income' as const,
				amount: 5000,
				categoryId: 103, // 収入カテゴリ
			}
			const result = validateTransactionUpdateWithZod(data)
			expect(result.success).toBe(true)
		})

		it('typeがincomeで支出カテゴリIDの場合エラーを返す', () => {
			const data = {
				type: 'income' as const,
				categoryId: 1, // 支出カテゴリ
			}
			const result = validateTransactionUpdateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const categoryError = result.errors.find((e) => e.field === 'categoryId')
				expect(categoryError).toBeDefined()
				expect(categoryError?.message).toContain('収入カテゴリは101-105の範囲で指定してください')
			}
		})

		it('typeがexpenseの場合は支出バリデーションを使用する', () => {
			const data = {
				type: 'expense' as const,
				amount: 3000,
				categoryId: 1, // 支出カテゴリ
			}
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

	describe('validateIncomeCreateWithZod', () => {
		it('有効な収入データを受け入れる', () => {
			const data = {
				amount: 300000,
				type: 'income' as const,
				categoryId: 103,
				description: '給与',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(data)
			}
		})

		it('負の金額でエラーを返す', () => {
			const data = {
				amount: -1000,
				type: 'income' as const,
				categoryId: 103,
				description: '返金',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const amountError = result.errors.find((e) => e.field === 'amount')
				expect(amountError).toBeDefined()
				// positive()によるエラーメッセージ
				expect(amountError?.message).toBe('収入金額は0より大きい必要があります')
			}
		})

		it('支出カテゴリIDでエラーを返す', () => {
			const data = {
				amount: 5000,
				type: 'income' as const,
				categoryId: 1, // 支出用カテゴリ
				description: 'テスト',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const categoryError = result.errors.find((e) => e.field === 'categoryId')
				expect(categoryError).toBeDefined()
				expect(categoryError?.message).toContain('収入カテゴリは101-105の範囲で指定してください')
			}
		})

		it('type=expenseでエラーを返す', () => {
			const data = {
				amount: 5000,
				type: 'expense' as const,
				categoryId: 103,
				description: 'テスト',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const typeError = result.errors.find((e) => e.field === 'type')
				expect(typeError).toBeDefined()
				expect(typeError?.message).toBe('収入の取引種別はincomeである必要があります')
			}
		})

		it('全ての有効な収入カテゴリIDを受け入れる', () => {
			const validCategoryIds = [101, 102, 103, 104, 105]
			validCategoryIds.forEach((categoryId) => {
				const data = {
					amount: 10000,
					type: 'income' as const,
					categoryId,
					description: `カテゴリ${categoryId}のテスト`,
					date: '2024-01-01',
				}
				const result = validateIncomeCreateWithZod(data)
				expect(result.success).toBe(true)
			})
		})

		it('境界値のカテゴリIDでエラーを返す', () => {
			const invalidCategoryIds = [100, 106]
			invalidCategoryIds.forEach((categoryId) => {
				const data = {
					amount: 10000,
					type: 'income' as const,
					categoryId,
					description: 'テスト',
					date: '2024-01-01',
				}
				const result = validateIncomeCreateWithZod(data)
				expect(result.success).toBe(false)
				if (!result.success) {
					const categoryError = result.errors.find((e) => e.field === 'categoryId')
					expect(categoryError).toBeDefined()
					expect(categoryError?.message).toContain('収入カテゴリは101-105の範囲で指定してください')
				}
			})
		})

		// エッジケーステスト追加（レビューコメント#7対応）
		it('金額0円でエラーを返す', () => {
			const data = {
				amount: 0,
				type: 'income' as const,
				categoryId: 103,
				description: 'ゼロ円テスト',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const amountError = result.errors.find((e) => e.field === 'amount')
				expect(amountError).toBeDefined()
				// positive()によるエラーメッセージ
				expect(amountError?.message).toBe('収入金額は0より大きい必要があります')
			}
		})

		it('金額の極小値（1円）を受け入れる', () => {
			const data = {
				amount: 1,
				type: 'income' as const,
				categoryId: 103,
				description: '極小値テスト',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.amount).toBe(1)
			}
		})

		it('金額の0.99円を受け入れる', () => {
			const data = {
				amount: 0.99,
				type: 'income' as const,
				categoryId: 103,
				description: '小数点テスト',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.amount).toBe(0.99)
			}
		})

		it('金額の極大値（1000万円）を受け入れる', () => {
			const data = {
				amount: 10_000_000,
				type: 'income' as const,
				categoryId: 103,
				description: '極大値テスト',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.amount).toBe(10_000_000)
			}
		})

		it('金額の上限超過（1000万1円）でエラーを返す', () => {
			const data = {
				amount: 10_000_001,
				type: 'income' as const,
				categoryId: 103,
				description: '上限超過テスト',
				date: '2024-01-01',
			}
			const result = validateIncomeCreateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const amountError = result.errors.find((e) => e.field === 'amount')
				expect(amountError).toBeDefined()
				expect(amountError?.message).toBe('収入金額は10000000円以下である必要があります')
			}
		})
	})

	describe('validateIncomeUpdateWithZod', () => {
		it('部分的な更新データを受け入れる', () => {
			const data = {
				amount: 350000,
				categoryId: 104,
			}
			const result = validateIncomeUpdateWithZod(data)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(data)
			}
		})

		it('空のオブジェクトを受け入れる', () => {
			const data = {}
			const result = validateIncomeUpdateWithZod(data)
			expect(result.success).toBe(true)
		})

		it('無効なカテゴリIDでエラーを返す', () => {
			const data = {
				categoryId: 50,
			}
			const result = validateIncomeUpdateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const categoryError = result.errors.find((e) => e.field === 'categoryId')
				expect(categoryError).toBeDefined()
				expect(categoryError?.message).toContain('収入カテゴリは101-105の範囲で指定してください')
			}
		})

		it('負の金額でエラーを返す', () => {
			const data = {
				amount: -5000,
			}
			const result = validateIncomeUpdateWithZod(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const amountError = result.errors.find((e) => e.field === 'amount')
				expect(amountError).toBeDefined()
				// positive()によるエラーメッセージ
				expect(amountError?.message).toBe('収入金額は0より大きい必要があります')
			}
		})
	})
})
