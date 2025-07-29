import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { type Context, Hono, type Next } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnyDatabase, Env } from '../../db'
import { testLogger } from '../../logger/factory'
import type { LoggingVariables } from '../../middleware/logging'
import { createSubscriptionsApp } from '../../routes/subscriptions'
import type { Subscription } from '../../types'

// APIレスポンスの型定義はSubscription型を使用（types/subscription/index.tsで定義）

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

		// テスト用データベースを注入してアプリケーションを作成
		const subscriptionsApp = createSubscriptionsApp({ testDatabase: db as unknown as AnyDatabase })

		// 親アプリケーションを作成し、ミドルウェアを設定
		app = new Hono<{
			Bindings: Env
			Variables: { db: AnyDatabase } & LoggingVariables
		}>()

		// ミドルウェアの設定
		app.use('*', async (c: Context, next: Next) => {
			c.set('db', db as unknown as AnyDatabase)
			c.set('logger', testLogger)
			c.set('requestId', 'test-request-id')
			await next()
		})

		// サブスクリプションアプリケーションをマウント
		app.route('/api/subscriptions', subscriptionsApp)

		// モックをリセット
		vi.clearAllMocks()
	})

	describe('サブスクリプション固有機能のテスト', () => {
		it('should include category information in subscription response', async () => {
			// サブスクリプションを作成
			const subscriptionData = {
				name: 'Netflix',
				amount: 1500,
				billingCycle: 'monthly',
				nextBillingDate: '2024-02-01',
				categoryId: 18, // 娯楽カテゴリ
				description: 'エンタメサブスク',
				isActive: true,
			}

			const createResponse = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subscriptionData),
			})

			expect(createResponse.status).toBe(201)
			const created = (await createResponse.json()) as Subscription

			// 一覧取得でカテゴリ情報が付加されることを確認
			const listResponse = await app.request('/api/subscriptions', {
				method: 'GET',
			})

			expect(listResponse.status).toBe(200)
			const list = (await listResponse.json()) as Subscription[]
			const subscription = list.find((s) => s.id === String(created.id))

			expect(subscription).toBeDefined()
			expect(subscription!.category).toEqual({
				id: 18,
				name: '娯楽',
				type: 'expense',
				color: '#E67E22',
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
			})
		})

		it('should handle null category when categoryId is invalid', async () => {
			// 存在しないカテゴリIDでサブスクリプションを作成
			const subscriptionData = {
				name: 'Unknown Service',
				amount: 1000,
				billingCycle: 'monthly',
				nextBillingDate: '2024-02-01',
				categoryId: 9999, // 存在しないカテゴリID
			}

			const createResponse = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subscriptionData),
			})

			expect(createResponse.status).toBe(201)
			const created = (await createResponse.json()) as Subscription

			// 詳細取得でカテゴリがnullになることを確認
			const getResponse = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'GET',
			})

			expect(getResponse.status).toBe(200)
			const result = (await getResponse.json()) as Subscription
			expect(result.category).toBeNull()
		})

		it('should use the same timestamp for all categories in a single request', async () => {
			// 複数のサブスクリプションを作成
			const subscriptions = [
				{
					name: 'Service1',
					amount: 1000,
					billingCycle: 'monthly',
					nextBillingDate: '2024-02-01',
					categoryId: 1,
				},
				{
					name: 'Service2',
					amount: 2000,
					billingCycle: 'monthly',
					nextBillingDate: '2024-02-01',
					categoryId: 2,
				},
			]

			for (const sub of subscriptions) {
				await app.request('/api/subscriptions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(sub),
				})
			}

			// 一覧取得
			const response = await app.request('/api/subscriptions', {
				method: 'GET',
			})

			const result = (await response.json()) as Subscription[]
			const categoriesWithTimestamps = result
				.filter((s) => s.category !== null)
				.map((s) => s.category)

			// 同一リクエスト内のカテゴリは全て同じタイムスタンプを持つ
			if (categoriesWithTimestamps.length > 1) {
				const firstTimestamp = categoriesWithTimestamps[0]!.createdAt
				expect(categoriesWithTimestamps.every((c) => c!.createdAt === firstTimestamp)).toBe(true)
				expect(categoriesWithTimestamps.every((c) => c!.updatedAt === firstTimestamp)).toBe(true)
			}
		})
	})

	describe('基本的なCRUD操作の検証', () => {
		it('should handle basic CRUD operations', async () => {
			// Create
			const createResponse = await app.request('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Test Service',
					amount: 1000,
					billingCycle: 'monthly',
					nextBillingDate: '2024-02-01',
					categoryId: 1,
				}),
			})
			expect(createResponse.status).toBe(201)
			const created = (await createResponse.json()) as Subscription

			// Read
			const getResponse = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'GET',
			})
			expect(getResponse.status).toBe(200)

			// Update
			const updateResponse = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: 2000 }),
			})
			expect(updateResponse.status).toBe(200)

			// Delete
			const deleteResponse = await app.request(`/api/subscriptions/${created.id}`, {
				method: 'DELETE',
			})
			expect(deleteResponse.status).toBe(200)
		})

		it('should validate subscription data correctly', async () => {
			const invalidData = {
				name: '', // 空の名前
				amount: -100, // 負の金額
				billingCycle: 'invalid', // 無効な請求サイクル
				nextBillingDate: '1999-01-01', // 過去の日付
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
			expect(result.details!.length).toBeGreaterThan(0)
		})
	})
})
