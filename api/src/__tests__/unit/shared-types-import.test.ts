import type {
	BillingCycle,
	Category,
	CategoryType,
	CreateTransactionRequest,
	Subscription,
	Transaction,
	TransactionType,
	UpdateTransactionRequest,
} from '@shared/types'
import { assertCategoryType, assertTransactionType, isTransaction } from '@shared/types'
import { describe, expect, it } from 'vitest'

describe('API Shared Types Import', () => {
	it('should be able to import and use shared types', () => {
		// 型が正しくインポートできることを確認
		const transaction: Transaction = {
			id: '1',
			amount: 1000,
			type: 'expense',
			description: 'Test transaction',
			date: '2024-01-01',
			categoryId: 'cat1',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		}

		const category: Category = {
			id: '1',
			name: 'Food',
			type: 'expense',
			description: 'Food expenses',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		}

		const subscription: Subscription = {
			id: '1',
			name: 'Netflix',
			amount: 1500,
			billingCycle: 'monthly',
			startDate: '2024-01-01',
			endDate: null,
			categoryId: 'cat1',
			description: 'Streaming service',
			isActive: true,
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		}

		expect(transaction.type).toBe('expense')
		expect(category.type).toBe('expense')
		expect(subscription.billingCycle).toBe('monthly')
	})

	it('should be able to use type guards', () => {
		const validTransaction = {
			id: '1',
			amount: 1000,
			type: 'income',
			date: '2024-01-01',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		}

		const invalidTransaction = {
			id: '1',
			amount: 'not a number',
			type: 'income',
		}

		expect(isTransaction(validTransaction)).toBe(true)
		expect(isTransaction(invalidTransaction)).toBe(false)
	})

	it('should be able to use assertion functions', () => {
		expect(() => assertTransactionType('income')).not.toThrow()
		expect(() => assertTransactionType('expense')).not.toThrow()
		expect(() => assertTransactionType('invalid')).toThrow()

		expect(() => assertCategoryType('expense')).not.toThrow()
		expect(() => assertCategoryType('income')).not.toThrow()
		expect(() => assertCategoryType('invalid')).toThrow()
	})

	it('should be able to handle request types', () => {
		const createRequest: CreateTransactionRequest = {
			amount: 1000,
			type: 'expense',
			description: 'Office supplies',
			date: '2024-01-01',
			categoryId: 'cat1',
		}

		const updateRequest: UpdateTransactionRequest = {
			amount: 1500,
			description: 'Updated office supplies',
		}

		expect(createRequest.type).toBe('expense')
		expect(updateRequest.amount).toBe(1500)
	})

	it('should maintain type safety with literal types', () => {
		const transactionTypes: TransactionType[] = ['income', 'expense']
		const categoryTypes: CategoryType[] = ['expense', 'income']
		const billingCycles: BillingCycle[] = ['monthly', 'yearly', 'weekly']

		transactionTypes.forEach((type) => {
			expect(['income', 'expense']).toContain(type)
		})

		categoryTypes.forEach((type) => {
			expect(['expense', 'income']).toContain(type)
		})

		billingCycles.forEach((cycle) => {
			expect(['monthly', 'yearly', 'weekly']).toContain(cycle)
		})
	})
})
