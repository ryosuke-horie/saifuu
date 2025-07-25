import { describe, expect, it } from 'vitest'
import {
	formatCurrency,
	formatDate,
	formatDateToISO,
	formatDateToYYYYMMDD,
	formatPercentage,
	normalizeDate,
	parseAmount,
	sanitizeText,
	transformApiDateToFrontend,
	transformFrontendDateToApi,
} from '../transformers'

describe('Currency Formatting', () => {
	describe('formatCurrency', () => {
		it('金額を日本円形式でフォーマットする', () => {
			expect(formatCurrency(1000)).toBe('¥1,000')
			expect(formatCurrency(1234567)).toBe('¥1,234,567')
			expect(formatCurrency(0)).toBe('¥0')
		})

		it('負の金額を正しくフォーマットする', () => {
			expect(formatCurrency(-1000)).toBe('-¥1,000')
			expect(formatCurrency(1000, true)).toBe('-¥1,000')
		})

		it('小数点以下を正しく処理する', () => {
			expect(formatCurrency(1000.5)).toBe('¥1,001')
			expect(formatCurrency(1234.99)).toBe('¥1,235')
		})
	})

	describe('parseAmount', () => {
		it('文字列の金額を数値に変換する', () => {
			expect(parseAmount('1,000')).toBe(1000)
			expect(parseAmount('¥1,234,567')).toBe(1234567)
			expect(parseAmount('1234.56')).toBe(1234.56)
		})

		it('不正な入力に対してNaNを返す', () => {
			expect(parseAmount('abc')).toBeNaN()
			expect(parseAmount('')).toBeNaN()
		})
	})
})

describe('Date Formatting', () => {
	describe('formatDate', () => {
		it('ISO日付文字列を日本語形式（YYYY/MM/DD）に変換する', () => {
			expect(formatDate('2024-01-01T00:00:00.000Z')).toBe('2024/01/01')
			expect(formatDate('2024-12-31T23:59:59.999Z')).toBe('2025/01/01') // UTCからJSTへの変換
		})

		it('YYYY-MM-DD形式も正しく処理する', () => {
			expect(formatDate('2024-01-01')).toBe('2024/01/01')
		})
	})

	describe('formatDateToISO', () => {
		it('YYYY-MM-DD形式をISO 8601形式に変換する', () => {
			const result = formatDateToISO('2024-01-01')
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
			expect(new Date(result).toISOString().split('T')[0]).toBe('2024-01-01')
		})

		it('不正な日付形式でエラーをスローする', () => {
			expect(() => formatDateToISO('invalid-date')).toThrow()
			expect(() => formatDateToISO('2024-13-01')).toThrow()
		})
	})

	describe('formatDateToYYYYMMDD', () => {
		it('ISO日付文字列をYYYY-MM-DD形式に変換する', () => {
			expect(formatDateToYYYYMMDD('2024-01-01T00:00:00.000Z')).toBe(
				'2024-01-01',
			)
			expect(formatDateToYYYYMMDD('2024-12-31T23:59:59.999Z')).toBe(
				'2024-12-31',
			)
		})

		it('不正な日付形式でエラーをスローする', () => {
			expect(() => formatDateToYYYYMMDD('invalid-date')).toThrow()
		})
	})

	describe('normalizeDate', () => {
		it('様々な日付形式を標準化する', () => {
			const expected = '2024-01-01'
			expect(normalizeDate('2024-01-01')).toBe(expected)
			expect(normalizeDate('2024/01/01')).toBe(expected)
			expect(normalizeDate('2024.01.01')).toBe(expected)
			expect(normalizeDate('2024-1-1')).toBe(expected)
		})
	})

	describe('API日付変換', () => {
		it('API日付をフロントエンド形式に変換する', () => {
			expect(transformApiDateToFrontend('2024-01-01T00:00:00.000Z')).toBe(
				'2024-01-01',
			)
		})

		it('フロントエンド日付をAPI形式に変換する', () => {
			const result = transformFrontendDateToApi('2024-01-01')
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
		})
	})
})

describe('Percentage Formatting', () => {
	describe('formatPercentage', () => {
		it('パーセンテージを正しくフォーマットする', () => {
			expect(formatPercentage(10)).toBe('+10.0%')
			expect(formatPercentage(-5.5)).toBe('-5.5%')
			expect(formatPercentage(0)).toBe('+0.0%')
		})

		it('小数点以下の桁数を指定できる', () => {
			expect(formatPercentage(10.456, 2)).toBe('+10.46%')
			expect(formatPercentage(10.456, 0)).toBe('+10%')
		})
	})
})

describe('Text Sanitization', () => {
	describe('sanitizeText', () => {
		it('テキストから不要な空白を削除する', () => {
			expect(sanitizeText('  hello  world  ')).toBe('hello world')
			expect(sanitizeText('hello\\nworld')).toBe('hello world')
			expect(sanitizeText('\\t\\ttab\\t\\t')).toBe('tab')
		})

		it('空文字やnullを適切に処理する', () => {
			expect(sanitizeText('')).toBe('')
			expect(sanitizeText(null)).toBe('')
			expect(sanitizeText(undefined)).toBe('')
		})

		it('最大長を指定できる', () => {
			expect(sanitizeText('hello world', 5)).toBe('hello')
			expect(sanitizeText('short', 10)).toBe('short')
		})
	})
})
