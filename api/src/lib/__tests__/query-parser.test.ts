import { describe, expect, it } from 'vitest'
import {
	parseIntParam,
	parseNumberParam,
	parsePositiveIntParam,
	parseTransactionType,
} from '../query-parser'

describe('Query Parser', () => {
	describe('parseNumberParam', () => {
		it('should parse valid numbers', () => {
			expect(parseNumberParam('123')).toBe(123)
			expect(parseNumberParam('123.45')).toBe(123.45)
			expect(parseNumberParam('-123')).toBe(-123)
			expect(parseNumberParam('0')).toBe(0)
		})

		it('should return undefined for invalid inputs', () => {
			expect(parseNumberParam(undefined)).toBeUndefined()
			expect(parseNumberParam('')).toBeUndefined()
			expect(parseNumberParam('  ')).toBeUndefined()
			expect(parseNumberParam('abc')).toBeUndefined()
			expect(parseNumberParam('NaN')).toBeUndefined()
			expect(parseNumberParam('Infinity')).toBeUndefined()
			expect(parseNumberParam('-Infinity')).toBeUndefined()
			expect(parseNumberParam('null')).toBeUndefined()
			expect(parseNumberParam('undefined')).toBeUndefined()
		})
	})

	describe('parseIntParam', () => {
		it('should parse valid integers', () => {
			expect(parseIntParam('123')).toBe(123)
			expect(parseIntParam('-123')).toBe(-123)
			expect(parseIntParam('0')).toBe(0)
		})

		it('should return undefined for non-integers', () => {
			expect(parseIntParam('123.45')).toBeUndefined()
			expect(parseIntParam('123.0')).toBe(123) // 整数値として扱える
		})

		it('should return undefined for invalid inputs', () => {
			expect(parseIntParam(undefined)).toBeUndefined()
			expect(parseIntParam('')).toBeUndefined()
			expect(parseIntParam('abc')).toBeUndefined()
		})
	})

	describe('parsePositiveIntParam', () => {
		it('should parse positive integers', () => {
			expect(parsePositiveIntParam('1')).toBe(1)
			expect(parsePositiveIntParam('123')).toBe(123)
		})

		it('should return undefined for non-positive numbers', () => {
			expect(parsePositiveIntParam('0')).toBeUndefined()
			expect(parsePositiveIntParam('-1')).toBeUndefined()
			expect(parsePositiveIntParam('-123')).toBeUndefined()
		})

		it('should return undefined for non-integers', () => {
			expect(parsePositiveIntParam('1.5')).toBeUndefined()
		})

		it('should return undefined for invalid inputs', () => {
			expect(parsePositiveIntParam(undefined)).toBeUndefined()
			expect(parsePositiveIntParam('')).toBeUndefined()
			expect(parsePositiveIntParam('abc')).toBeUndefined()
		})
	})

	describe('parseTransactionType', () => {
		it('should parse valid transaction types', () => {
			expect(parseTransactionType('income')).toBe('income')
			expect(parseTransactionType('expense')).toBe('expense')
		})

		it('should return undefined for invalid types', () => {
			expect(parseTransactionType(undefined)).toBeUndefined()
			expect(parseTransactionType('')).toBeUndefined()
			expect(parseTransactionType('invalid')).toBeUndefined()
			expect(parseTransactionType('INCOME')).toBeUndefined() // 大文字小文字を区別
			expect(parseTransactionType('Income')).toBeUndefined()
		})
	})
})