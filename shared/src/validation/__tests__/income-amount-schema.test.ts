import { describe, expect, it } from 'vitest'
import { VALIDATION_LIMITS, incomeAmountSchema } from '../zod-schemas'

describe('incomeAmountSchema', () => {
	describe('正常系', () => {
		it('有効な収入金額を受け入れる', () => {
			expect(incomeAmountSchema.parse(1)).toBe(1)
			expect(incomeAmountSchema.parse(100)).toBe(100)
			expect(incomeAmountSchema.parse(1000)).toBe(1000)
			expect(incomeAmountSchema.parse(VALIDATION_LIMITS.MAX_AMOUNT)).toBe(VALIDATION_LIMITS.MAX_AMOUNT)
		})

		it('小数点を含む金額を受け入れる', () => {
			expect(incomeAmountSchema.parse(0.01)).toBe(0.01)
			expect(incomeAmountSchema.parse(99.99)).toBe(99.99)
			expect(incomeAmountSchema.parse(1234.56)).toBe(1234.56)
		})
	})

	describe('異常系', () => {
		it('0を拒否する', () => {
			expect(() => incomeAmountSchema.parse(0)).toThrow('収入金額は0より大きい必要があります')
		})

		it('負の数を拒否する', () => {
			expect(() => incomeAmountSchema.parse(-1)).toThrow('収入金額は0より大きい必要があります')
			expect(() => incomeAmountSchema.parse(-100)).toThrow('収入金額は0より大きい必要があります')
			expect(() => incomeAmountSchema.parse(-0.01)).toThrow('収入金額は0より大きい必要があります')
		})

		it('最大値を超える金額を拒否する', () => {
			expect(() => incomeAmountSchema.parse(VALIDATION_LIMITS.MAX_AMOUNT + 1))
				.toThrow(`収入金額は${VALIDATION_LIMITS.MAX_AMOUNT}円以下である必要があります`)
			expect(() => incomeAmountSchema.parse(VALIDATION_LIMITS.MAX_AMOUNT + 0.01))
				.toThrow(`収入金額は${VALIDATION_LIMITS.MAX_AMOUNT}円以下である必要があります`)
		})

		it('数値以外の型を拒否する', () => {
			expect(() => incomeAmountSchema.parse('100')).toThrow()
			expect(() => incomeAmountSchema.parse(null)).toThrow()
			expect(() => incomeAmountSchema.parse(undefined)).toThrow()
			expect(() => incomeAmountSchema.parse({})).toThrow()
			expect(() => incomeAmountSchema.parse([])).toThrow()
		})

		it('NaN、Infinity、-Infinityを拒否する', () => {
			expect(() => incomeAmountSchema.parse(NaN)).toThrow()
			expect(() => incomeAmountSchema.parse(Infinity)).toThrow()
			expect(() => incomeAmountSchema.parse(-Infinity)).toThrow()
		})
	})

	describe('境界値テスト', () => {
		it('最小の有効値（0.01）を受け入れる', () => {
			expect(incomeAmountSchema.parse(0.01)).toBe(0.01)
		})

		it('最大の有効値を受け入れる', () => {
			expect(incomeAmountSchema.parse(VALIDATION_LIMITS.MAX_AMOUNT)).toBe(VALIDATION_LIMITS.MAX_AMOUNT)
		})

		it('0に近い正の値を受け入れる', () => {
			expect(incomeAmountSchema.parse(0.001)).toBe(0.001)
			expect(incomeAmountSchema.parse(0.0001)).toBe(0.0001)
		})
	})

	describe('型安全性の確保', () => {
		it('positive()による保護が機能する', () => {
			// positive()は0以下の値を拒否する
			const testCases = [0, -0, -0.0001, -1, -999999]
			
			for (const value of testCases) {
				expect(() => incomeAmountSchema.parse(value))
					.toThrow('収入金額は0より大きい必要があります')
			}
		})

		it('将来の設定変更に対する保護', () => {
			// 現在のVALIDATION_LIMITS.MAX_AMOUNTの値を確認
			expect(VALIDATION_LIMITS.MAX_AMOUNT).toBe(10_000_000)
			
			// 最大値のバリデーションが機能することを確認
			expect(() => incomeAmountSchema.parse(10_000_001))
				.toThrow('収入金額は10000000円以下である必要があります')
		})
	})
})