import { describe, it, expect } from 'vitest'
import {
  INCOME_CATEGORIES,
  CategoryType,
  getCategoriesByType,
  getCategoryById,
  ALL_CATEGORIES,
  validateCategoryConfig,
} from '../categories'

describe('収入カテゴリマスタ', () => {
  describe('INCOME_CATEGORIES', () => {
    it('5つの収入カテゴリが定義されている', () => {
      expect(INCOME_CATEGORIES).toHaveLength(5)
    })

    it('給与カテゴリが正しく定義されている', () => {
      const salary = INCOME_CATEGORIES.find(c => c.id === 'salary')
      expect(salary).toBeDefined()
      expect(salary).toMatchObject({
        id: 'salary',
        name: '給与',
        type: 'income',
        color: '#10b981',
        numericId: 101,
      })
    })

    it('ボーナスカテゴリが正しく定義されている', () => {
      const bonus = INCOME_CATEGORIES.find(c => c.id === 'bonus')
      expect(bonus).toBeDefined()
      expect(bonus).toMatchObject({
        id: 'bonus',
        name: 'ボーナス',
        type: 'income',
        color: '#059669',
        numericId: 102,
      })
    })

    it('副業カテゴリが正しく定義されている', () => {
      const sideBusiness = INCOME_CATEGORIES.find(c => c.id === 'side_business')
      expect(sideBusiness).toBeDefined()
      expect(sideBusiness).toMatchObject({
        id: 'side_business',
        name: '副業',
        type: 'income',
        color: '#34d399',
        numericId: 103,
      })
    })

    it('投資収益カテゴリが正しく定義されている', () => {
      const investment = INCOME_CATEGORIES.find(c => c.id === 'investment')
      expect(investment).toBeDefined()
      expect(investment).toMatchObject({
        id: 'investment',
        name: '投資収益',
        type: 'income',
        color: '#6ee7b7',
        numericId: 104,
      })
    })

    it('その他カテゴリが正しく定義されている', () => {
      const other = INCOME_CATEGORIES.find(c => c.id === 'other_income')
      expect(other).toBeDefined()
      expect(other).toMatchObject({
        id: 'other_income',
        name: 'その他',
        type: 'income',
        color: '#a7f3d0',
        numericId: 105,
      })
    })

    it('すべての収入カテゴリが緑系統の色を持つ', () => {
      const greenColors = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0']
      INCOME_CATEGORIES.forEach(category => {
        expect(greenColors).toContain(category.color)
      })
    })

    it('収入カテゴリのnumericIdが101-105の範囲内である', () => {
      INCOME_CATEGORIES.forEach(category => {
        expect(category.numericId).toBeGreaterThanOrEqual(101)
        expect(category.numericId).toBeLessThanOrEqual(105)
      })
    })
  })

  describe('CategoryType型', () => {
    it('incomeを含む', () => {
      const categoryType: CategoryType = 'income'
      expect(categoryType).toBe('income')
    })
  })

  describe('getCategoriesByType関数', () => {
    it('income typeで収入カテゴリを返す', () => {
      const incomeCategories = getCategoriesByType('income')
      expect(incomeCategories).toEqual(INCOME_CATEGORIES)
      expect(incomeCategories).toHaveLength(5)
    })
  })

  describe('getCategoryById関数', () => {
    it('収入カテゴリをIDで検索できる', () => {
      const salary = getCategoryById('salary')
      expect(salary).toBeDefined()
      expect(salary?.name).toBe('給与')
      expect(salary?.type).toBe('income')
    })
  })

  describe('ALL_CATEGORIES', () => {
    it('支出カテゴリと収入カテゴリの両方を含む', () => {
      const expenseCount = ALL_CATEGORIES.filter(c => c.type === 'expense').length
      const incomeCount = ALL_CATEGORIES.filter(c => c.type === 'income').length
      
      expect(expenseCount).toBeGreaterThan(0)
      expect(incomeCount).toBe(5)
    })
  })

  describe('validateCategoryConfig関数', () => {
    it('収入カテゴリを含んだ設定が有効である', () => {
      const isValid = validateCategoryConfig()
      expect(isValid).toBe(true)
    })

    it('すべてのカテゴリのnumericIdが一意である', () => {
      const allNumericIds = ALL_CATEGORIES.map(c => c.numericId)
      const uniqueNumericIds = [...new Set(allNumericIds)]
      expect(allNumericIds.length).toBe(uniqueNumericIds.length)
    })

    it('収入カテゴリと支出カテゴリのnumericIdに重複がない', () => {
      const expenseIds = ALL_CATEGORIES.filter(c => c.type === 'expense').map(c => c.numericId)
      const incomeIds = INCOME_CATEGORIES.map(c => c.numericId)
      
      const intersection = expenseIds.filter(id => incomeIds.includes(id))
      expect(intersection).toHaveLength(0)
    })
  })
})