import { describe, expect, it } from 'vitest'
import {
  validateTransactionCreate,
  validateTransactionUpdate,
  validateSubscriptionCreate,
  validateSubscriptionUpdate,
  validateId,
  transactionCreateSchema,
  transactionUpdateSchema,
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  VALIDATION_LIMITS,
} from '../zod-schemas'

describe('Zod Validation Schemas', () => {
  describe('Transaction Create Validation', () => {
    it('should validate valid transaction creation data', () => {
      const validData = {
        amount: 1500,
        type: 'expense' as const,
        categoryId: 1,
        description: 'Test transaction',
        date: '2024-01-15T10:00:00.000Z',
      }

      const result = validateTransactionCreate(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.amount).toBe(1500)
        expect(result.data.type).toBe('expense')
        expect(result.data.categoryId).toBe(1)
      }
    })

    it('should reject transaction with invalid amount', () => {
      const invalidData = {
        amount: -100, // 負の値
        type: 'expense' as const,
        date: '2024-01-15T10:00:00.000Z',
      }

      const result = validateTransactionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('amount'))).toBe(true)
      }
    })

    it('should reject transaction with amount exceeding limit', () => {
      const invalidData = {
        amount: VALIDATION_LIMITS.MAX_AMOUNT + 1,
        type: 'expense' as const,
        date: '2024-01-15T10:00:00.000Z',
      }

      const result = validateTransactionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('amount'))).toBe(true)
      }
    })

    it('should reject transaction with invalid type', () => {
      const invalidData = {
        amount: 1500,
        type: 'invalid_type' as any,
        date: '2024-01-15T10:00:00.000Z',
      }

      const result = validateTransactionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('type'))).toBe(true)
      }
    })

    it('should handle categoryId string to number conversion', () => {
      const dataWithStringCategoryId = {
        amount: 1500,
        type: 'expense' as const,
        categoryId: '3', // 文字列
        date: '2024-01-15T10:00:00.000Z',
      }

      const result = validateTransactionCreate(dataWithStringCategoryId)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.categoryId).toBe(3) // 数値に変換される
      }
    })

    it('should reject invalid categoryId', () => {
      const invalidData = {
        amount: 1500,
        type: 'expense' as const,
        categoryId: 'invalid_number',
        date: '2024-01-15T10:00:00.000Z',
      }

      const result = validateTransactionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('categoryId'))).toBe(true)
      }
    })

    it('should validate description length', () => {
      const longDescription = 'a'.repeat(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH + 1)
      const invalidData = {
        amount: 1500,
        type: 'expense' as const,
        description: longDescription,
        date: '2024-01-15T10:00:00.000Z',
      }

      const result = validateTransactionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('description'))).toBe(true)
      }
    })

    it('should validate date format', () => {
      const invalidData = {
        amount: 1500,
        type: 'expense' as const,
        date: 'invalid-date',
      }

      const result = validateTransactionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('date'))).toBe(true)
      }
    })

    it('should reject dates before minimum date', () => {
      const invalidData = {
        amount: 1500,
        type: 'expense' as const,
        date: '1999-12-31',
      }

      const result = validateTransactionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('date'))).toBe(true)
      }
    })
  })

  describe('Transaction Update Validation', () => {
    it('should validate partial update data', () => {
      const validData = {
        amount: 2000,
        description: 'Updated description',
      }

      const result = validateTransactionUpdate(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.amount).toBe(2000)
        expect(result.data.description).toBe('Updated description')
      }
    })

    it('should validate empty update data', () => {
      const emptyData = {}

      const result = validateTransactionUpdate(emptyData)
      expect(result.success).toBe(true)
    })
  })

  describe('Subscription Create Validation', () => {
    it('should validate valid subscription creation data', () => {
      const validData = {
        name: 'Netflix',
        amount: 1980,
        billingCycle: 'monthly' as const,
        nextBillingDate: '2024-02-15T00:00:00.000Z',
        categoryId: 2,
        description: 'Streaming service',
        isActive: true,
      }

      const result = validateSubscriptionCreate(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Netflix')
        expect(result.data.amount).toBe(1980)
        expect(result.data.billingCycle).toBe('monthly')
        expect(result.data.isActive).toBe(true)
      }
    })

    it('should set default isActive to true', () => {
      const dataWithoutIsActive = {
        name: 'Spotify',
        amount: 980,
        billingCycle: 'monthly' as const,
        nextBillingDate: '2024-02-15T00:00:00.000Z',
        categoryId: 2,
      }

      const result = validateSubscriptionCreate(dataWithoutIsActive)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isActive).toBe(true) // デフォルト値
      }
    })

    it('should reject invalid billing cycle', () => {
      const invalidData = {
        name: 'Service',
        amount: 1000,
        billingCycle: 'invalid_cycle' as any,
        nextBillingDate: '2024-02-15T00:00:00.000Z',
      }

      const result = validateSubscriptionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('billingCycle'))).toBe(true)
      }
    })

    it('should validate name length', () => {
      const longName = 'a'.repeat(VALIDATION_LIMITS.MAX_NAME_LENGTH + 1)
      const invalidData = {
        name: longName,
        amount: 1000,
        billingCycle: 'monthly' as const,
        nextBillingDate: '2024-02-15T00:00:00.000Z',
      }

      const result = validateSubscriptionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field.includes('name'))).toBe(true)
      }
    })
  })

  describe('Subscription Update Validation', () => {
    it('should validate partial subscription update', () => {
      const validData = {
        name: 'Updated Service Name',
        amount: 1200,
        isActive: false,
      }

      const result = validateSubscriptionUpdate(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Service Name')
        expect(result.data.amount).toBe(1200)
        expect(result.data.isActive).toBe(false)
      }
    })
  })

  describe('ID Validation', () => {
    it('should validate numeric ID', () => {
      const result = validateId(123)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(123)
      }
    })

    it('should convert string ID to number', () => {
      const result = validateId('456')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(456)
      }
    })

    it('should reject invalid string ID', () => {
      const result = validateId('invalid_id')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.message.includes('数値'))).toBe(true)
      }
    })

    it('should reject negative ID', () => {
      const result = validateId(-1)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.message.includes('正の整数'))).toBe(true)
      }
    })

    it('should reject zero ID', () => {
      const result = validateId(0)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.message.includes('正の整数'))).toBe(true)
      }
    })
  })

  describe('Direct Schema Validation', () => {
    it('should validate transaction create schema directly', () => {
      const validData = {
        amount: 1500,
        type: 'expense' as const,
        categoryId: 1,
        description: 'Direct schema test',
        date: '2024-01-15T10:00:00.000Z',
      }

      expect(() => transactionCreateSchema.parse(validData)).not.toThrow()
      const result = transactionCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid data with direct schema', () => {
      const invalidData = {
        amount: 'invalid_amount',
        type: 'expense' as const,
        date: '2024-01-15T10:00:00.000Z',
      }

      expect(() => transactionCreateSchema.parse(invalidData)).toThrow()
      const result = transactionCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Error Messages in Japanese', () => {
    it('should return Japanese error messages', () => {
      const invalidData = {
        amount: -100,
        type: 'expense' as const,
        date: 'invalid_date',
      }

      const result = validateTransactionCreate(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        // 日本語メッセージが含まれているかチェック
        const hasJapaneseMessage = result.errors.some(error => 
          /[ひらがなカタカナ漢字]/.test(error.message)
        )
        expect(hasJapaneseMessage).toBe(true)
      }
    })
  })
})