import { describe, expect, it } from 'vitest'
import { VALIDATION_LIMITS } from '../../../../shared/src/validation'
import {
	validateId,
	validateSubscriptionCreate,
	validateSubscriptionUpdate,
	validateTransactionCreate,
	validateTransactionUpdate,
} from '../schemas'

describe('Validation Schemas', () => {
	describe('validateId', () => {
		it('should validate valid numeric ID', () => {
			const result = validateId(1)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(1)
			}
		})

		it('should validate string ID and convert to number', () => {
			const result = validateId('123')
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(123)
			}
		})

		it('should reject non-positive IDs', () => {
			const result = validateId(0)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.errors[0].code).toBe('POSITIVE_NUMBER')
			}
		})

		it('should reject invalid string IDs', () => {
			const result = validateId('abc')
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.errors[0].code).toBe('INVALID_ID')
			}
		})
	})

	describe('Transaction Validation', () => {
		describe('validateTransactionCreate', () => {
			const validTransaction = {
				amount: 1000,
				type: 'expense' as const,
				date: '2024-01-01',
				categoryId: 1,
				description: 'テスト取引',
			}

			it('should validate valid transaction', () => {
				const result = validateTransactionCreate(validTransaction)
				expect(result.success).toBe(true)
			})

			it('should require amount', () => {
				const result = validateTransactionCreate({ ...validTransaction, amount: undefined })
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('amount')
					expect(result.errors[0].code).toBe('REQUIRED')
				}
			})

			it('should reject negative amount', () => {
				const result = validateTransactionCreate({ ...validTransaction, amount: -100 })
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('amount')
					expect(result.errors[0].code).toBe('POSITIVE_NUMBER')
				}
			})

			it('should reject amount exceeding limit', () => {
				const result = validateTransactionCreate({
					...validTransaction,
					amount: VALIDATION_LIMITS.MAX_AMOUNT + 1,
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('amount')
					expect(result.errors[0].code).toBe('MAX_VALUE')
				}
			})

			it('should only allow expense type', () => {
				const result = validateTransactionCreate({
					...validTransaction,
					type: 'income' as unknown as 'expense',
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('type')
					expect(result.errors[0].code).toBe('INVALID_ENUM')
				}
			})

			it('should validate date format', () => {
				const result = validateTransactionCreate({
					...validTransaction,
					date: '2024/01/01', // 不正な形式
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('date')
					expect(result.errors[0].code).toBe('INVALID_DATE_FORMAT')
				}
			})

			it('should accept ISO 8601 datetime format', () => {
				const result = validateTransactionCreate({
					...validTransaction,
					date: '2024-01-01T12:00:00.000Z',
				})
				expect(result.success).toBe(true)
			})

			it('should allow null categoryId', () => {
				const result = validateTransactionCreate({
					...validTransaction,
					categoryId: null,
				})
				expect(result.success).toBe(true)
			})

			it('should validate description length', () => {
				const longDescription = 'a'.repeat(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH + 1)
				const result = validateTransactionCreate({
					...validTransaction,
					description: longDescription,
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('description')
					expect(result.errors[0].code).toBe('MAX_LENGTH')
				}
			})
		})

		describe('validateTransactionUpdate', () => {
			it('should allow partial updates', () => {
				const result = validateTransactionUpdate({ amount: 2000 })
				expect(result.success).toBe(true)
			})

			it('should validate updated fields', () => {
				const result = validateTransactionUpdate({ amount: -100 })
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('amount')
					expect(result.errors[0].code).toBe('POSITIVE_NUMBER')
				}
			})

			it('should allow empty update', () => {
				const result = validateTransactionUpdate({})
				expect(result.success).toBe(true)
			})
		})
	})

	describe('Subscription Validation', () => {
		describe('validateSubscriptionCreate', () => {
			const validSubscription = {
				name: 'Netflix',
				amount: 1500,
				billingCycle: 'monthly' as const,
				nextBillingDate: '2024-02-01',
				categoryId: 1,
				description: '動画配信サービス',
				isActive: true,
			}

			it('should validate valid subscription', () => {
				const result = validateSubscriptionCreate(validSubscription)
				expect(result.success).toBe(true)
			})

			it('should require name', () => {
				const result = validateSubscriptionCreate({
					...validSubscription,
					name: undefined,
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('name')
					expect(result.errors[0].code).toBe('REQUIRED')
				}
			})

			it('should validate name length', () => {
				const longName = 'a'.repeat(VALIDATION_LIMITS.MAX_NAME_LENGTH + 1)
				const result = validateSubscriptionCreate({
					...validSubscription,
					name: longName,
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('name')
					expect(result.errors[0].code).toBe('MAX_LENGTH')
				}
			})

			it('should validate billing cycle enum', () => {
				const result = validateSubscriptionCreate({
					...validSubscription,
					billingCycle: 'daily' as unknown as 'monthly',
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('billingCycle')
					expect(result.errors[0].code).toBe('INVALID_ENUM')
				}
			})

			it('should accept all valid billing cycles', () => {
				const cycles = ['monthly', 'yearly', 'weekly'] as const
				for (const cycle of cycles) {
					const result = validateSubscriptionCreate({
						...validSubscription,
						billingCycle: cycle,
					})
					expect(result.success).toBe(true)
				}
			})

			it('should validate boolean isActive', () => {
				const result = validateSubscriptionCreate({
					...validSubscription,
					isActive: 'true' as unknown as boolean,
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('isActive')
					expect(result.errors[0].code).toBe('INVALID_BOOLEAN')
				}
			})

			it('should allow undefined isActive (defaults to true)', () => {
				// biome-ignore lint/correctness/noUnusedVariables: isActive is explicitly removed for testing
				const { isActive, ...subscriptionWithoutIsActive } = validSubscription
				const result = validateSubscriptionCreate(subscriptionWithoutIsActive)
				expect(result.success).toBe(true)
			})
		})

		describe('validateSubscriptionUpdate', () => {
			it('should allow partial updates', () => {
				const result = validateSubscriptionUpdate({
					name: 'Netflix Premium',
					amount: 1800,
				})
				expect(result.success).toBe(true)
			})

			it('should validate updated fields', () => {
				const result = validateSubscriptionUpdate({
					billingCycle: 'hourly' as unknown as 'monthly',
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.errors[0].field).toBe('billingCycle')
					expect(result.errors[0].code).toBe('INVALID_ENUM')
				}
			})

			it('should allow empty update', () => {
				const result = validateSubscriptionUpdate({})
				expect(result.success).toBe(true)
			})

			it('should allow updating isActive', () => {
				const result = validateSubscriptionUpdate({ isActive: false })
				expect(result.success).toBe(true)
			})
		})
	})
})
