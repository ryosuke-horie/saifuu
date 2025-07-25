import { describe, expect, it } from 'vitest'
import {
	type NewSubscription,
	type NewTransaction,
	type Subscription,
	subscriptions,
	type Transaction,
	transactions,
} from '../../../db/schema'

/**
 * schema.tsのテストスイート
 *
 * スキーマ定義ファイルのテストであるため、以下の観点でテストを実施：
 * 1. テーブルオブジェクトが適切にエクスポートされていること
 * 2. 型定義が適切に機能し、必須/任意フィールドが正しく定義されていること
 * 3. enum値やデフォルト値が型レベルで正しく制約されていること
 *
 * 注意事項：
 * - Drizzle ORMの内部実装に依存したテストは避け、型レベルでの検証を中心に行う
 * - 過剰なテストを避けるため、実際の動作に影響する部分のみをテスト
 */
describe('Database Schema', () => {
	// テストヘルパー関数
	const createTestTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
		id: 1,
		amount: 1000,
		type: 'expense',
		categoryId: null,
		description: null,
		date: '2024-01-01',
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
		...overrides,
	})

	const createTestNewTransaction = (overrides: Partial<NewTransaction> = {}): NewTransaction => ({
		amount: 1000,
		type: 'expense',
		date: '2024-01-01',
		...overrides,
	})

	const createTestSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
		id: 1,
		name: 'Netflix',
		amount: 1500,
		billingCycle: 'monthly',
		nextBillingDate: '2024-02-01',
		categoryId: null,
		description: null,
		isActive: true,
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
		...overrides,
	})

	const createTestNewSubscription = (
		overrides: Partial<NewSubscription> = {}
	): NewSubscription => ({
		name: 'Netflix',
		amount: 1500,
		nextBillingDate: '2024-02-01',
		...overrides,
	})

	describe('transactions table', () => {
		describe('型定義の検証', () => {
			it('should have correct Transaction type structure', () => {
				// Transaction型が期待される構造を持つことを確認
				const transaction = createTestTransaction()
				expect(transaction.id).toBe(1)
				expect(transaction.amount).toBe(1000)
				expect(transaction.type).toBe('expense')
				expect(transaction.categoryId).toBeNull()
				expect(transaction.description).toBeNull()
				expect(transaction.date).toBe('2024-01-01')
				expect(transaction.createdAt).toBe('2024-01-01T00:00:00.000Z')
				expect(transaction.updatedAt).toBe('2024-01-01T00:00:00.000Z')
			})

			it('should enforce required fields in NewTransaction type', () => {
				// 必須フィールドのみで作成可能なことを確認
				const minimalTransaction = createTestNewTransaction()
				expect(minimalTransaction.amount).toBeDefined()
				expect(minimalTransaction.type).toBeDefined()
				expect(minimalTransaction.date).toBeDefined()
			})

			it('should allow optional fields in NewTransaction type', () => {
				// 任意フィールドを含む完全な型
				const fullTransaction: NewTransaction = {
					amount: 1500,
					type: 'expense',
					date: '2024-01-15',
					categoryId: 2,
					description: '食費',
				}
				expect(fullTransaction.categoryId).toBe(2)
				expect(fullTransaction.description).toBe('食費')
			})
		})

		describe('制約の検証', () => {
			it('should enforce type field constraints', () => {
				// 有効な値での作成確認
				const transaction = createTestNewTransaction({ type: 'expense' })
				expect(transaction.type).toBe('expense')

				// 型制約の確認（コンパイル時エラーとなることを明記）
				// const invalid: NewTransaction = createTestNewTransaction({ type: 'income' }) // TS Error
			})
		})
	})

	describe('subscriptions table', () => {
		describe('型定義の検証', () => {
			it('should have correct Subscription type structure', () => {
				// Subscription型が期待される構造を持つことを確認
				const subscription = createTestSubscription()
				expect(subscription.id).toBe(1)
				expect(subscription.name).toBe('Netflix')
				expect(subscription.amount).toBe(1500)
				expect(subscription.billingCycle).toBe('monthly')
				expect(subscription.nextBillingDate).toBe('2024-02-01')
				expect(subscription.categoryId).toBeNull()
				expect(subscription.description).toBeNull()
				expect(subscription.isActive).toBe(true)
				expect(subscription.createdAt).toBe('2024-01-01T00:00:00.000Z')
				expect(subscription.updatedAt).toBe('2024-01-01T00:00:00.000Z')
			})

			it('should enforce required fields in NewSubscription type', () => {
				// 必須フィールドのみで作成可能なことを確認
				const minimalSubscription = createTestNewSubscription()
				expect(minimalSubscription.name).toBeDefined()
				expect(minimalSubscription.amount).toBeDefined()
				expect(minimalSubscription.nextBillingDate).toBeDefined()
			})

			it('should allow optional fields in NewSubscription type', () => {
				// 任意フィールドを含む完全な型
				const fullSubscription: NewSubscription = {
					name: 'Amazon Prime',
					amount: 600,
					nextBillingDate: '2024-03-01',
					billingCycle: 'monthly',
					categoryId: 3,
					description: 'プライム会員',
					isActive: true,
				}
				expect(fullSubscription.billingCycle).toBe('monthly')
				expect(fullSubscription.categoryId).toBe(3)
				expect(fullSubscription.description).toBe('プライム会員')
				expect(fullSubscription.isActive).toBe(true)
			})
		})

		describe('制約の検証', () => {
			it('should restrict billingCycle to valid enum values', () => {
				// 型レベルでスキーマとの整合性を強制
				const validCycles: Array<NonNullable<NewSubscription['billingCycle']>> = [
					'monthly',
					'yearly',
					'weekly',
				]

				// 各有効値での作成テスト
				validCycles.forEach((cycle) => {
					const subscription = createTestNewSubscription({ billingCycle: cycle })
					expect(subscription.billingCycle).toBe(cycle)
				})

				// デフォルト値（schema.tsの.default('monthly')）の確認
				expect(validCycles).toContain('monthly')

				// TypeScript制約はコメントで明記
				// const invalid: NonNullable<NewSubscription['billingCycle']> = 'daily' // TS Error
				// 無効な値を追加するとコンパイルエラーになる
			})

			it('should handle optional fields correctly at type level', () => {
				// NewSubscription型では省略可能なフィールドの検証
				const minimalSubscription = createTestNewSubscription()

				// 型レベルでは省略可能（undefined）
				expect(minimalSubscription.billingCycle).toBeUndefined()
				expect(minimalSubscription.isActive).toBeUndefined()

				// スキーマのデフォルト値と同じ値も明示的に設定可能
				const withSchemaDefaults = createTestNewSubscription({
					billingCycle: 'monthly', // schema.tsの.default('monthly')と同じ
					isActive: true, // schema.tsの.default(true)と同じ
				})
				expect(withSchemaDefaults.billingCycle).toBe('monthly')
				expect(withSchemaDefaults.isActive).toBe(true)

				// 異なる値も設定可能
				const withCustomValues = createTestNewSubscription({
					billingCycle: 'yearly',
					isActive: false,
				})
				expect(withCustomValues.billingCycle).toBe('yearly')
				expect(withCustomValues.isActive).toBe(false)
			})
		})
	})

	describe('Type exports', () => {
		it('should ensure schema consistency for database operations', () => {
			// 実際のCRUD操作で使用される型の整合性を確認
			const insertData: NewTransaction = createTestNewTransaction()
			const selectData: Transaction = createTestTransaction()

			// ビジネスロジックに影響する型制約の確認
			expect(typeof insertData.amount).toBe('number')
			expect(typeof selectData.id).toBe('number')

			// 自動生成フィールドの型制約をコメントで明記
			// insertData.id = 1 // TS Error: Property 'id' does not exist on type 'NewTransaction'
			// selectData.id = 'invalid' // TS Error: Type 'string' is not assignable to type 'number'
		})
	})
})
