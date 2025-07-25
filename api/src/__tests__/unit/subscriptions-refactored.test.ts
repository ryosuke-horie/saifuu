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
		message: string
		path?: string
		type?: string
	}>
}

// logWithContextのモック
vi.mock('../../middleware/logging', () => ({
	logWithContext: vi.fn(),
}))

describe('Subscriptions API with CRUD Factory - Unit Tests', () => {
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

	describe('リファクタリング後も動作が変わらないことを確認', () => {
		it('should create a new subscription using CRUD factory', async () => {
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

		it('should get all subscriptions with category info', async () => {
			// まずサブスクリプションを作成
			const subscriptionData = {
				name: 'Spotify',
				amount: 980,
				billingCycle: 'monthly',
				nextBillingDate: '2024-02-01',
				categoryId: 1,
			}

			await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subscriptionData),
			})

			// 一覧取得
			const response = await app.request('/api/subscriptions', {
				method: 'GET',
			})

			expect(response.status).toBe(200)
			const result = (await response.json()) as any[]
			expect(result.length).toBeGreaterThan(0)

			// カテゴリ情報が含まれることを確認
			const subscription = result[0]
			if (subscription.category) {
				expect(subscription.category).toHaveProperty('id')
				expect(subscription.category).toHaveProperty('name')
				expect(subscription.category).toHaveProperty('type')
				expect(subscription.category).toHaveProperty('color')
			}
		})

		it('should get subscription by id', async () => {
			// まずサブスクリプションを作成
			const createResponse = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Disney+',
					amount: 990,
					billingCycle: 'monthly',
					nextBillingDate: '2024-02-01',
					categoryId: 1,
				}),
			})

			const created = (await createResponse.json()) as SubscriptionResponse

			// ID指定で取得
			const response = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'GET',
			})

			expect(response.status).toBe(200)
			const result = (await response.json()) as any
			expect(result.id).toBe(created.id)
			expect(result.name).toBe('Disney+')
		})

		it('should update subscription', async () => {
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

		it('should delete subscription', async () => {
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

			// 削除
			const response = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'DELETE',
			})

			expect(response.status).toBe(200)
			const result = (await response.json()) as any
			expect(result.message).toBe('Subscription deleted successfully')

			// 削除されていることを確認
			const getResponse = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'GET',
			})
			expect(getResponse.status).toBe(404)
		})

		it('should handle validation errors correctly', async () => {
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

			// エラーフォーマットがCRUDファクトリの形式に合致することを確認
			const errors = result.details!
			expect(errors.some((e) => e.message.includes('必須'))).toBe(true)
			expect(errors.some((e) => e.message.includes('1円以上'))).toBe(true)
		})

		it('should handle not found errors correctly', async () => {
			const response = await app.request('/api/subscriptions/99999', {
				method: 'GET',
			})

			expect(response.status).toBe(404)
			const result = (await response.json()) as ErrorResponse
			expect(result.error).toBe('Subscription not found')
		})

		it('should handle invalid ID format', async () => {
			const response = await app.request('/api/subscriptions/abc', {
				method: 'GET',
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			expect(result.error).toBeDefined()
			expect(result.details).toBeDefined()
		})
	})

	describe('CRUD Factory特有の動作確認', () => {
		it('should use consistent error format from factory', async () => {
			// 存在しないIDでの更新
			const response = await app.request('/api/subscriptions/99999', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: 1000 }),
			})

			expect(response.status).toBe(404)
			const result = (await response.json()) as ErrorResponse
			expect(result.error).toBe('Subscription not found')
		})

		it('should use consistent logging from factory', async () => {
			// logWithContextが適切に呼ばれることを確認
			const { logWithContext } = await import('../../middleware/logging')

			await app.request('/api/subscriptions', {
				method: 'GET',
			})

			// 一覧取得開始のログが正しい構造で呼ばれることを確認
			expect(logWithContext).toHaveBeenCalledWith(
				expect.any(Object),
				'info',
				'subscription一覧取得を開始',
				expect.objectContaining({
					operationType: 'read',
					resource: 'subscription',
				})
			)

			// 一覧取得完了のログも確認
			expect(logWithContext).toHaveBeenCalledWith(
				expect.any(Object),
				'info',
				'subscription一覧取得が完了',
				expect.objectContaining({
					subscriptionCount: expect.any(Number),
					resource: 'subscription',
				})
			)
		})

		it('should log errors with proper structure', async () => {
			// エラー時のログも含めてより包括的なテスト
			const { logWithContext } = await import('../../middleware/logging')

			// 存在しないIDでの取得を試みる
			await app.request('/api/subscriptions/99999', {
				method: 'GET',
			})

			// 警告ログが正しい構造で呼ばれることを確認
			expect(logWithContext).toHaveBeenCalledWith(
				expect.any(Object),
				'warn',
				'subscription詳細取得: 対象subscriptionが見つからない',
				expect.objectContaining({
					subscriptionId: 99999,
					resource: 'subscription',
				})
			)
		})
	})
})
