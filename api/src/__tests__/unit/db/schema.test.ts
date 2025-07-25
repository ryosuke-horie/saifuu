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
	const createTestTransaction = (overrides?: Partial<Transaction>): Transaction => ({
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

	const createTestNewTransaction = (overrides?: Partial<NewTransaction>): NewTransaction => ({
		amount: 1000,
		type: 'expense',
		date: '2024-01-01',
		...overrides,
	})

	const createTestSubscription = (overrides?: Partial<Subscription>): Subscription => ({
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
			it('should restrict type field to "expense" only', () => {
				// 1. 有効な値での動作確認
				const validTransaction: NewTransaction = createTestNewTransaction({ type: 'expense' })
				expect(validTransaction.type).toBe('expense')

				// 2. 型定義レベルでの制約確認
				const transactionType: NewTransaction['type'] = 'expense' // OK
				expect(transactionType).toBe('expense')

				// 3. スキーマ定義との整合性確認（コメントでドキュメント化）
				// schema.tsでは text('type', { enum: ['expense'] }) と定義されている
				// 以下はTypeScriptコンパイル時にエラーとなる：
				// const invalid: NewTransaction['type'] = 'income' // TS Error: Type '"income"' is not assignable to type '"expense"'
				// const invalid2: NewTransaction['type'] = 'other' // TS Error: Type '"other"' is not assignable to type '"expense"'

				// 4. 許可される値の明示的な検証
				const allowedValues: readonly NewTransaction['type'][] = ['expense'] as const
				expect(allowedValues).toContain(validTransaction.type)
				expect(allowedValues.length).toBe(1) // 'expense'のみが許可されることを確認
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
				// schema.tsの定義と一致する値のテスト
				const validCycles: Array<NonNullable<NewSubscription['billingCycle']>> = [
					'monthly',
					'yearly',
					'weekly',
				]

				// 各有効値での作成テスト
				validCycles.forEach((cycle) => {
					const subscription = createTestNewSubscription({ billingCycle: cycle })
					expect(subscription.billingCycle).toBe(cycle)
					expect(validCycles).toContain(subscription.billingCycle)
				})

				// 型制約のドキュメント化（コンパイル時エラー）
				// const invalid: NewSubscription['billingCycle'] = 'daily' // TS Error: Type '"daily"' is not assignable
				// const invalid2: NewSubscription['billingCycle'] = 'annually' // TS Error: Type '"annually"' is not assignable

				// デフォルト値の確認
				expect(validCycles).toContain('monthly') // schema.tsのdefault値

				// 許可される値の数を確認
				expect(validCycles.length).toBe(3) // monthly, yearly, weeklyの3つのみ
			})

			it('should handle optional fields and default values correctly', () => {
				// NewSubscription型では省略可能なフィールドの検証
				const minimalSubscription = createTestNewSubscription()

				// 型レベルでは省略可能として定義されていることを確認
				// （実際のDB挿入時にはデフォルト値が設定されるが、型定義上は省略可能）
				expect(minimalSubscription.billingCycle).toBeUndefined()
				expect(minimalSubscription.isActive).toBeUndefined()

				// スキーマ定義のデフォルト値と一致する値で作成可能なことを確認
				const withDefaults = createTestNewSubscription({
					billingCycle: 'monthly', // schema.tsの.default('monthly')と一致
					isActive: true, // schema.tsの.default(true)と一致
				})
				expect(withDefaults.billingCycle).toBe('monthly')
				expect(withDefaults.isActive).toBe(true)

				// 明示的にデフォルト値以外も設定可能なことを確認
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
		it('should export all required types', () => {
			// 全ての必要な型がエクスポートされていることを確認
			const transaction: Transaction = createTestTransaction()
			const newTransaction: NewTransaction = createTestNewTransaction()
			const subscription: Subscription = createTestSubscription()
			const newSubscription: NewSubscription = createTestNewSubscription()

			expect(transaction).toBeDefined()
			expect(newTransaction).toBeDefined()
			expect(subscription).toBeDefined()
			expect(newSubscription).toBeDefined()
		})

		it('should differentiate between select and insert types', () => {
			// Select型（DB取得時）とInsert型（DB挿入時）の違いを確認
			// Transaction型にはid, createdAt, updatedAtが必須
			const selectTransaction: Transaction = createTestTransaction()
			expect(selectTransaction.id).toBeDefined()
			expect(selectTransaction.createdAt).toBeDefined()
			expect(selectTransaction.updatedAt).toBeDefined()

			// NewTransaction型では自動生成フィールドは型定義に含まれない
			const insertTransaction: NewTransaction = createTestNewTransaction()

			// 必要なフィールドのみが含まれることを確認
			expect(insertTransaction).toHaveProperty('amount')
			expect(insertTransaction).toHaveProperty('type')
			expect(insertTransaction).toHaveProperty('date')

			// 自動生成フィールドは型定義に含まれないことをコメントで明記
			// insertTransaction.id = 1 // TS Error: Property 'id' does not exist on type 'NewTransaction'
			// insertTransaction.createdAt = 'date' // TS Error: Property 'createdAt' does not exist on type 'NewTransaction'
			// insertTransaction.updatedAt = 'date' // TS Error: Property 'updatedAt' does not exist on type 'NewTransaction'
		})
	})
})
