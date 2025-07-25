import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { type Context, Hono, type Next } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnyDatabase, Env } from '../../db'
import { testLogger } from '../../logger/factory'
import type { LoggingVariables } from '../../middleware/logging'
import { createSubscriptionsApp } from '../../routes/subscriptions'

// APIレスポンスの型定義
interface SubscriptionResponse {
	id: number
	name: string
	amount: number
	billingCycle: string
	nextBillingDate: string
	categoryId: number
	description?: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

interface ErrorResponse {
	error: string
	details?: Array<{
		field: string
		message: string
		code?: string
	}>
}

// logWithContextのモック
vi.mock('../../middleware/logging', () => ({
	logWithContext: vi.fn(),
}))

describe('Subscriptions API with Zod - Unit Tests', () => {
	let db: ReturnType<typeof drizzle>
	let sqlite: Database.Database
	let app: Hono<{
		Bindings: Env
		Variables: { db: AnyDatabase } & LoggingVariables
	}>

	beforeEach(() => {
		// In-memory SQLiteデータベースを作成
		sqlite = new Database(':memory:')
		db = drizzle(sqlite)

		// マイグレーションを実行
		migrate(db, { migrationsFolder: './drizzle/migrations' })

		// テスト用のアプリケーションインスタンスを作成
		const subscriptionsApp = createSubscriptionsApp({ testDatabase: db as unknown as AnyDatabase })
		app = new Hono<{
			Bindings: Env
			Variables: { db: AnyDatabase } & LoggingVariables
		}>()

		// ミドルウェアのモック（テストでは必要最小限）
		app.use(
			'*',
			async (
				c: Context<{
					Bindings: Env
					Variables: { db: AnyDatabase } & LoggingVariables
				}>,
				next: Next
			) => {
				c.set('requestId', 'test-request-id')
				c.set('logger', testLogger)
				c.set('db', db as unknown as AnyDatabase)
				await next()
			}
		)

		app.route('/api/subscriptions', subscriptionsApp)
	})

	describe('POST /subscriptions', () => {
		it('should create a new subscription', async () => {
			const subscriptionData = {
				name: 'Netflix',
				amount: 1500,
				billingCycle: 'monthly',
				nextBillingDate: '2024-02-01',
				categoryId: 1,
				description: 'エンタメサブスク',
			}

			const response = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subscriptionData),
			})

			expect(response.status).toBe(201)
			const result = (await response.json()) as SubscriptionResponse
			expect(result).toMatchObject({
				name: 'Netflix',
				amount: 1500,
				billingCycle: 'monthly',
				nextBillingDate: '2024-02-01',
				categoryId: 1,
				description: 'エンタメサブスク',
				isActive: true,
			})
			expect(result.id).toBeDefined()
		})

		it('should reject with Japanese error messages for validation failures', async () => {
			const invalidData = {
				name: '',
				amount: -100,
				billingCycle: 'invalid',
				nextBillingDate: '1999-01-01',
			}

			const response = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(invalidData),
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			expect(result.error).toBeDefined()
			expect(result.details).toBeDefined()

			// エラーメッセージが日本語であることを確認
			const errors = result.details!
			expect(errors.some((e) => e.field === 'name' && e.message.includes('必須'))).toBe(true)
			expect(errors.some((e) => e.field === 'amount' && e.message.includes('1円以上'))).toBe(true)
			expect(errors.some((e) => e.field === 'billingCycle' && e.message.includes('いずれか'))).toBe(
				true
			)
			expect(
				errors.some((e) => e.field === 'nextBillingDate' && e.message.includes('2000-01-01'))
			).toBe(true)
		})

		it('should handle missing required fields', async () => {
			const incompleteData = {
				name: 'Spotify',
				amount: 980,
				// billingCycleとnextBillingDateが欠落
			}

			const response = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(incompleteData),
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			expect(result.details).toBeDefined()
			expect(result.details!.length).toBeGreaterThan(0)
			// billingCycleは必須フィールドのエラーメッセージを確認
			expect(
				result.details!.some(
					(e) =>
						e.field === 'billingCycle' &&
						(e.message.includes('必須') || e.message.includes('monthly、yearly、weekly'))
				)
			).toBe(true)
			expect(
				result.details!.some((e) => e.field === 'nextBillingDate' && e.message.includes('必須'))
			).toBe(true)
		})
	})

	describe('PUT /subscriptions/:id', () => {
		it('should update a subscription', async () => {
			// まずサブスクリプションを作成
			const createResponse = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Hulu',
					amount: 1000,
					billingCycle: 'monthly',
					nextBillingDate: '2024-02-01',
					categoryId: 1,
					description: '初期データ',
				}),
			})

			const created = (await createResponse.json()) as SubscriptionResponse

			// 更新
			const updateData = {
				amount: 1200,
				description: '更新後のデータ',
			}

			const response = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData),
			})

			expect(response.status).toBe(200)
			const result = (await response.json()) as SubscriptionResponse
			expect(result.amount).toBe(1200)
			expect(result.description).toBe('更新後のデータ')
		})

		it('should validate update data with Zod', async () => {
			const invalidUpdate = {
				amount: 10_000_001, // 上限を超える
				billingCycle: 'invalid',
			}

			const response = await app.request('/api/subscriptions/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(invalidUpdate),
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			expect(
				result.details!.some((e) => e.field === 'amount' && e.message.includes('10000000円以下'))
			).toBe(true)
			expect(
				result.details!.some((e) => e.field === 'billingCycle' && e.message.includes('いずれか'))
			).toBe(true)
		})
	})

	describe('ID validation', () => {
		it('should reject invalid ID formats', async () => {
			const response = await app.request('/api/subscriptions/abc', {
				method: 'GET',
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			expect(result.error).toBeDefined()
			expect(result.details).toBeDefined()
			expect(result.details!.length).toBeGreaterThan(0)
		})

		it('should accept string IDs that can be converted to numbers', async () => {
			// まずサブスクリプションを作成
			const createResponse = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Amazon Prime',
					amount: 500,
					billingCycle: 'monthly',
					nextBillingDate: '2024-02-01',
					categoryId: 1,
				}),
			})

			const created = (await createResponse.json()) as SubscriptionResponse

			// 文字列IDでアクセス
			const response = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'GET',
			})

			expect(response.status).toBe(200)
		})
	})
})
