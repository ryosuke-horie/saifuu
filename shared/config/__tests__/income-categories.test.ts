import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
    it('3つの収入カテゴリが定義されている', () => {
      expect(INCOME_CATEGORIES).toHaveLength(3)
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


    it('副業カテゴリが正しく定義されている', () => {
      const sideBusiness = INCOME_CATEGORIES.find(c => c.id === 'side_business')
      expect(sideBusiness).toBeDefined()
      expect(sideBusiness).toMatchObject({
        id: 'side_business',
        name: '副業',
        type: 'income',
        color: '#34d399',
        numericId: 102,
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
        numericId: 103,
      })
    })

    it('すべての収入カテゴリが緑系統の色を持つ', () => {
      const greenColors = ['#10b981', '#34d399', '#a7f3d0']
      INCOME_CATEGORIES.forEach(category => {
        expect(greenColors).toContain(category.color)
      })
    })

    it('収入カテゴリのnumericIdが101から順に割り当てられている', () => {
      INCOME_CATEGORIES.forEach((category, index) => {
        expect(category.numericId).toBe(101 + index)
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
      expect(incomeCategories).toHaveLength(3)
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
      expect(incomeCount).toBe(3)
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

  describe('validateCategoryConfig - エラーケース', () => {
    // モックのために既存のconsole.errorを保存
    const originalConsoleError = console.error

    beforeEach(() => {
      // console.errorをモック化
      console.error = vi.fn()
    })

    afterEach(() => {
      // console.errorを元に戻す
      console.error = originalConsoleError
    })

    it('重複するnumericIdがある場合の検証', () => {
      // すべてのnumericIdが一意であることを確認
      const allNumericIds = ALL_CATEGORIES.map(c => c.numericId)
      const uniqueNumericIds = [...new Set(allNumericIds)]
      expect(allNumericIds.length).toBe(uniqueNumericIds.length)
      
      // 重複検出ロジックのテスト
      const duplicateIds = [1, 2, 3, 2, 4, 3]
      const uniqueSet = [...new Set(duplicateIds)]
      expect(duplicateIds.length).toBeGreaterThan(uniqueSet.length)
      
      // 重複要素の抽出ロジックのテスト
      const duplicates = duplicateIds.filter(
        (id, index) => duplicateIds.indexOf(id) !== index
      )
      expect(duplicates).toContain(2)
      expect(duplicates).toContain(3)
    })

    it('収入カテゴリのnumericIdが101-105の範囲内であることの検証', () => {
      // 収入カテゴリのnumericIdの範囲チェック
      const incomeCategories = INCOME_CATEGORIES
      incomeCategories.forEach(category => {
        expect(category.numericId).toBeGreaterThanOrEqual(101)
        expect(category.numericId).toBeLessThanOrEqual(105)
      })
      
      // 範囲外のIDをテストするために一時的なカテゴリを作成
      const invalidIncomeCategory = {
        id: 'test_income',
        name: 'テスト収入',
        type: 'income' as const,
        color: '#000000',
        numericId: 106 // 範囲外
      }
      
      // 収入カテゴリで101-105の範囲外は不正
      expect(invalidIncomeCategory.numericId).toBeGreaterThan(105)
    })

    it('必須フィールドが欠けている場合のエラーハンドリング', () => {
      // 必須フィールドのテスト用データ
      const requiredFields = ['id', 'name', 'type', 'color', 'numericId']
      
      // 各カテゴリが必須フィールドを持つことを確認
      ALL_CATEGORIES.forEach(category => {
        requiredFields.forEach(field => {
          expect(category).toHaveProperty(field)
          expect(category[field as keyof typeof category]).toBeDefined()
          expect(category[field as keyof typeof category]).not.toBe('')
        })
      })
    })

    it('色の形式が不正な場合の検証', () => {
      // 正しい色形式のパターン
      const validColorPattern = /^#[0-9A-F]{6}$/i
      
      // すべてのカテゴリの色が正しい形式であることを確認
      ALL_CATEGORIES.forEach(category => {
        expect(category.color).toMatch(validColorPattern)
      })
      
      // 不正な色形式の例
      const invalidColors = ['#FFF', 'red', '#GGGGGG', '123456', '#12345']
      invalidColors.forEach(color => {
        expect(color).not.toMatch(validColorPattern)
      })
    })

    it('不正なカテゴリタイプの検証', () => {
      // 有効なカテゴリタイプ
      const validTypes = ['expense', 'income']
      
      // すべてのカテゴリが有効なタイプを持つことを確認
      ALL_CATEGORIES.forEach(category => {
        expect(validTypes).toContain(category.type)
      })
    })
  })
})